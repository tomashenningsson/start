# Cross-Platform Starter Template - Product Spec

## Overview

Create a minimal, clean starter repository with core architecture for building cross-platform (web + iOS + Android) applications from a single React/Next.js codebase.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Language** | TypeScript 5.x (strict mode) |
| **Frontend** | React 18 + Next.js 14 (App Router) |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Icons** | Lucide React |
| **Database/Auth** | Supabase (PostgreSQL + Auth) |
| **Hosting** | Vercel |
| **Cross-Platform** | Capacitor 6.x (iOS + Android) |
| **State** | Zustand + React Context |

---

## Core Features to Include

### 1. Authentication System
- Email/password signup & signin (Supabase Auth)
- Session management with auto-refresh
- Email verification flow
- Protected routes pattern
- Sign out functionality

### 2. User Profiles
- Auto-create profile on signup
- Basic fields: id, email, first_name, last_name, avatar_url, theme_preference
- Profile editing page
- Settings page (email display, theme toggle, sign out)

### 3. Friend Connections
- Connection request flow (send, accept, reject)
- Connections table: sender_id, recipient_id, status (pending/accepted)
- Connections list with pending requests
- Hide request functionality

### 4. Real-Time Messaging
- 1-on-1 chat creation
- Messages with real-time Supabase subscriptions
- Read receipts (read_by array)
- Message likes/reactions (liked_by array)
- Chat list with unread counts
- Date dividers in chat

### 5. Theme System
- Dark/light mode toggle
- Persisted to user profile
- MUI ThemeProvider integration (for shadcn compatibility)
- Mobile status bar color sync

### 6. Mobile/Capacitor Integration
- Platform detection utilities
- Keyboard handling hook (useKeyboard)
- Swipe gesture hook (useSwipeGesture)
- Haptic feedback utility
- Status bar theming
- Capacitor plugins: SplashScreen, StatusBar, Keyboard, Haptics

### 7. Layout & Navigation
- Responsive sidebar navigation (swipeable on mobile)
- AppBar with theme toggle
- Provider nesting pattern (Auth → Theme → App)
- Mobile-first responsive design

---

## Project Structure

```
/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root layout (metadata)
│   │   ├── client-layout.tsx     # Client providers wrapper
│   │   ├── page.tsx              # Home page
│   │   ├── profile/
│   │   │   └── page.tsx          # User profile (protected)
│   │   ├── settings/
│   │   │   └── page.tsx          # Settings (protected)
│   │   ├── people/
│   │   │   ├── page.tsx          # Connections list
│   │   │   └── [id]/page.tsx     # View other profile
│   │   └── chat/
│   │       ├── page.tsx          # Chat list
│   │       └── [id]/page.tsx     # Chat room
│   │
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── AuthDialog.tsx        # Login/signup modal
│   │   ├── AppBar.tsx            # Top navigation
│   │   ├── SidebarMenu.tsx       # Side navigation
│   │   ├── ProfileView.tsx       # Profile display/edit
│   │   └── chat/
│   │       ├── MessageItem.tsx
│   │       └── MessageInput.tsx
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx       # Auth + profile state
│   │   └── ThemeContext.tsx      # Dark/light mode
│   │
│   ├── stores/
│   │   └── connectionsStore.ts   # Zustand: connections
│   │
│   ├── hooks/
│   │   ├── useKeyboard.ts        # Mobile keyboard
│   │   ├── useSwipeGesture.ts    # Touch gestures
│   │   └── useUnreadCount.ts     # Chat unread count
│   │
│   ├── lib/
│   │   └── supabase.ts           # Supabase client
│   │
│   ├── types/
│   │   ├── user.ts               # UserProfile type
│   │   └── chat.ts               # Message, Chat types
│   │
│   └── utils/
│       ├── haptics.ts            # Haptic feedback
│       ├── auth-errors.ts        # Error messages
│       └── debounce.ts           # Generic debounce
│
├── ios/                          # Capacitor iOS project
├── android/                      # Capacitor Android project
│
├── capacitor.config.ts           # Capacitor configuration
├── next.config.mjs               # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript (strict)
├── components.json               # shadcn/ui config
└── package.json
```

---

## Database Schema (Supabase)

### Tables

```sql
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

-- Indexes
CREATE INDEX idx_connections_users ON connections(sender_id, recipient_id);
CREATE INDEX idx_messages_chat ON messages(chat_id, created_at);
CREATE INDEX idx_chats_participants ON chats USING GIN(participants);
```

### Row Level Security (RLS)

```sql
-- Users can only read/update their own profile
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Connections: users can see their own connections
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections" ON connections
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can insert connections" ON connections
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own connections" ON connections
  FOR UPDATE USING (auth.uid() = recipient_id);

-- Chats: participants only
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view chats" ON chats
  FOR SELECT USING (auth.uid() = ANY(participants));

CREATE POLICY "Participants can create chats" ON chats
  FOR INSERT WITH CHECK (auth.uid() = ANY(participants));

-- Messages: chat participants only
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

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
```

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...  # Server-side only
```

---

## Build Commands

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "build:mobile": "MOBILE_BUILD=true next build && npx cap sync",
    "dev:ios": "npx cap run ios",
    "dev:android": "npx cap run android"
  }
}
```

---

## Key Patterns to Extract from Current Codebase

| Pattern | Source File | Purpose |
|---------|-------------|---------|
| Auth session management | `src/contexts/AuthContext.tsx` | Throttled refresh, visibility change handling |
| Theme with persistence | `src/contexts/ThemeContext.tsx` | Dark/light + MUI + Supabase sync |
| Real-time subscriptions | `src/app/chat/[id]/page.tsx` | Supabase postgres_changes pattern |
| Zustand store | `src/stores/connectionsStore.ts` | Simple data caching pattern |
| Keyboard hook | `src/hooks/useKeyboard.ts` | Capacitor keyboard handling |
| Swipe gesture | `src/hooks/useSwipeGesture.ts` | Touch gesture detection |
| Haptics utility | `src/utils/haptics.ts` | Platform-aware haptic feedback |
| Sidebar navigation | `src/components/SidebarMenu.tsx` | Responsive drawer pattern |
| Capacitor config | `capacitor.config.ts` | Mobile build configuration |

---

## Implementation Steps

1. **Initialize Project**
   - Create Next.js 14 app with TypeScript
   - Configure strict TypeScript
   - Set up Tailwind CSS
   - Initialize shadcn/ui
   - Add Lucide React icons

2. **Configure Supabase**
   - Create Supabase project
   - Set up database schema (tables + RLS)
   - Configure auth settings
   - Add environment variables

3. **Build Core Infrastructure**
   - Create Supabase client (`lib/supabase.ts`)
   - Build AuthContext with profile management
   - Build ThemeContext with persistence
   - Set up provider nesting in client-layout

4. **Implement Auth Flow**
   - Create AuthDialog component
   - Implement signup/signin
   - Add protected route pattern
   - Build settings page with sign out

5. **Build Profile System**
   - Create minimal UserProfile type
   - Build ProfileView component
   - Implement profile editing
   - Add avatar support

6. **Implement Connections**
   - Create connectionsStore (Zustand)
   - Build people/connections page
   - Implement request/accept/reject flow
   - Add pending requests UI

7. **Build Messaging**
   - Create chat types
   - Build chat list page
   - Implement chat room with real-time
   - Add MessageItem and MessageInput
   - Implement read receipts and likes

8. **Add Mobile Support**
   - Initialize Capacitor
   - Configure capacitor.config.ts
   - Add useKeyboard hook
   - Add useSwipeGesture hook
   - Add haptics utility
   - Configure status bar theming

9. **Build Navigation**
   - Create AppBar component
   - Create SidebarMenu component
   - Implement swipe-to-open sidebar
   - Add responsive breakpoints

10. **Configure Deployment**
    - Set up Vercel project
    - Configure environment variables
    - Test web deployment
    - Build and test iOS/Android

---

## Verification

1. **Auth Flow**: Sign up → verify email → sign in → sign out
2. **Profile**: Edit name → save → refresh → verify persistence
3. **Theme**: Toggle dark/light → refresh → verify persistence
4. **Connections**: Send request → accept → verify in list
5. **Messaging**: Create chat → send message → verify real-time delivery
6. **Mobile**: Build iOS/Android → test keyboard, gestures, haptics
7. **Deployment**: Push to Vercel → verify auto-deploy works

---

## Notes

- This is a **starter template**, not a complete app
- All features are minimal but functional
- Easy to extend with additional features
- Clean separation of concerns for maintainability
- Mobile-first responsive design throughout
