'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MessageItem, MessageInput } from '@/components';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getInitials, getDisplayName, formatMessageGroupDate } from '@/utils';
import type { Chat, Message, UserProfile, Database } from '@/types';

function ChatRoomContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatId = searchParams.get('id');

  const [, setChat] = useState<Chat | null>(null);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !chatId) return;

    const fetchChatData = async () => {
      // Get chat
      const { data: chatData } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .single();

      if (!chatData) {
        router.push('/chat');
        return;
      }

      const typedChat = chatData as Chat;
      setChat(typedChat);

      // Get other user
      const otherUserId = typedChat.participants.find((id) => id !== user.id);
      if (otherUserId) {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', otherUserId)
          .single();

        setOtherUser(profileData as UserProfile | null);
      }

      // Get messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      setMessages((messagesData as Message[]) ?? []);
      setLoading(false);
    };

    fetchChatData();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, chatId, router]);

  // Mark messages as read
  useEffect(() => {
    if (!user || messages.length === 0) return;

    const unreadMessages = messages.filter(
      (m) => m.sender_id !== user.id && !m.read_by.includes(user.id)
    );

    if (unreadMessages.length === 0) return;

    const markAsRead = async () => {
      for (const message of unreadMessages) {
        await supabase
          .from('messages')
          .update({
            read_by: [...message.read_by, user.id],
          } as Database['public']['Tables']['messages']['Update'])
          .eq('id', message.id);
      }
    };

    markAsRead();
  }, [messages, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async (content: string) => {
    if (!user || !chatId) return;

    const insertData: Database['public']['Tables']['messages']['Insert'] = {
      chat_id: chatId,
      sender_id: user.id,
      content,
      read_by: [user.id],
    };

    await supabase.from('messages').insert(insertData);

    // Update chat's updated_at
    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() } as Database['public']['Tables']['chats']['Update'])
      .eq('id', chatId);
  };

  const handleLike = async (messageId: string) => {
    if (!user) return;

    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    const isLiked = message.liked_by.includes(user.id);
    const newLikedBy = isLiked
      ? message.liked_by.filter((id) => id !== user.id)
      : [...message.liked_by, user.id];

    await supabase
      .from('messages')
      .update({ liked_by: newLikedBy } as Database['public']['Tables']['messages']['Update'])
      .eq('id', messageId);
  };

  if (authLoading || !user) {
    return null;
  }

  if (!chatId) {
    router.push('/chat');
    return null;
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  messages.forEach((message) => {
    const date = new Date(message.created_at).toLocaleDateString();
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup.date === date) {
      lastGroup.messages.push(message);
    } else {
      groupedMessages.push({ date, messages: [message] });
    }
  });

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 h-14 border-b border-border bg-background safe-top">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/chat')}
          className="flex-shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-9 w-9">
          <AvatarImage src={otherUser?.avatar_url ?? undefined} />
          <AvatarFallback className="text-xs font-medium bg-secondary">
            {getInitials(otherUser)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{getDisplayName(otherUser)}</p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : groupedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-muted-foreground">No messages yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Send a message to start the conversation
            </p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date}>
              <div className="flex items-center justify-center mb-4">
                <span className="text-xs text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                  {formatMessageGroupDate(group.date)}
                </span>
              </div>
              <div className="space-y-4">
                {group.messages.map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    sender={
                      message.sender_id === user.id ? undefined : otherUser
                    }
                    onLike={handleLike}
                  />
                ))}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} />
    </div>
  );
}

export default function ChatRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ChatRoomContent />
    </Suspense>
  );
}
