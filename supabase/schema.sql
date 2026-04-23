-- Cross-Platform Starter Template - Supabase Schema
-- Run this in your Supabase SQL Editor (Database → SQL Editor)

-- ============================================
-- TABLES
-- ============================================

-- User profiles (extends auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  theme_preference TEXT DEFAULT 'dark' CHECK (theme_preference IN ('light', 'dark')),
  hidden_connection_requests UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friend connections
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, recipient_id)
);

-- Chat conversations
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participants UUID[] NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_by UUID[] DEFAULT '{}',
  liked_by UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_connections_users ON connections(sender_id, recipient_id);
CREATE INDEX idx_messages_chat ON messages(chat_id, created_at);
CREATE INDEX idx_chats_participants ON chats USING GIN(participants);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view all profiles" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Connections policies
CREATE POLICY "Users can view own connections" ON connections
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can insert connections" ON connections
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own connections" ON connections
  FOR UPDATE USING (auth.uid() = recipient_id);

-- Chats policies
CREATE POLICY "Participants can view chats" ON chats
  FOR SELECT USING (auth.uid() = ANY(participants));

CREATE POLICY "Participants can create chats" ON chats
  FOR INSERT WITH CHECK (auth.uid() = ANY(participants));

CREATE POLICY "Participants can update chats" ON chats
  FOR UPDATE USING (auth.uid() = ANY(participants));

-- Messages policies
CREATE POLICY "Chat participants can view messages" ON messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM chats WHERE id = chat_id AND auth.uid() = ANY(participants))
  );

CREATE POLICY "Chat participants can insert messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (SELECT 1 FROM chats WHERE id = chat_id AND auth.uid() = ANY(participants))
  );

CREATE POLICY "Chat participants can update messages" ON messages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM chats WHERE id = chat_id AND auth.uid() = ANY(participants))
  );

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- REALTIME
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chats;
ALTER PUBLICATION supabase_realtime ADD TABLE connections;
