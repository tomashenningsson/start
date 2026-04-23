'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components';
import { useProtectedPage } from '@/hooks';
import { useConnectionsStore } from '@/stores/connectionsStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Plus, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getInitials, getDisplayName, formatChatListTime } from '@/utils';
import { useRouter } from 'next/navigation';
import type { Chat, Message, UserProfile } from '@/types';

interface ChatWithDetails extends Chat {
  otherUser: UserProfile;
  lastMessage?: Message;
  unreadCount: number;
}

export default function ChatListPage() {
  const { user, loading: authLoading } = useProtectedPage();
  const router = useRouter();
  const { connections, fetchConnections } = useConnectionsStore();
  const [chats, setChats] = useState<ChatWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [startingChat, setStartingChat] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchConnections(user.id);
    }
  }, [user, fetchConnections]);

  useEffect(() => {
    if (!user) return;

    const fetchChats = async () => {
      // Get all chats the user is part of
      const { data: chatsData } = await supabase
        .from('chats')
        .select('*')
        .contains('participants', [user.id])
        .order('updated_at', { ascending: false });

      if (!chatsData || chatsData.length === 0) {
        setChats([]);
        setLoading(false);
        return;
      }

      const typedChats = chatsData as Chat[];

      // Get all other user IDs
      const otherUserIds = typedChats.map((chat) =>
        chat.participants.find((id) => id !== user.id)
      ).filter(Boolean) as string[];

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('*')
        .in('id', otherUserIds);

      const profileMap = new Map(
        (profiles as UserProfile[] | null)?.map((p) => [p.id, p]) ?? []
      );

      // Get last messages and unread counts for each chat
      const chatsWithDetails: ChatWithDetails[] = await Promise.all(
        typedChats.map(async (chat) => {
          const otherUserId = chat.participants.find((id) => id !== user.id);
          const otherUser = profileMap.get(otherUserId ?? '') ?? ({
            id: otherUserId ?? '',
            email: 'Unknown',
            first_name: null,
            last_name: null,
            avatar_url: null,
            theme_preference: 'dark',
            hidden_connection_requests: [],
            created_at: '',
            updated_at: '',
          } as UserProfile);

          // Get last message
          const { data: messages } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1);

          const lastMessage = (messages as Message[] | null)?.[0];

          // Get unread count
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', chat.id)
            .not('read_by', 'cs', `{${user.id}}`);

          return {
            ...chat,
            otherUser,
            lastMessage,
            unreadCount: count ?? 0,
          };
        })
      );

      setChats(chatsWithDetails);
      setLoading(false);
    };

    fetchChats();

    // Subscribe to changes
    const channel = supabase
      .channel('chat-list')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          fetchChats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
        },
        () => {
          fetchChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleStartNewChat = async (otherUserId: string) => {
    if (!user) return;
    setStartingChat(otherUserId);

    // Check if chat already exists
    const { data: existingChats } = await supabase
      .from('chats')
      .select('*')
      .contains('participants', [user.id, otherUserId]);

    const existingChat = (existingChats as Chat[] | null)?.find(
      (chat) =>
        chat.participants.length === 2 &&
        chat.participants.includes(user.id) &&
        chat.participants.includes(otherUserId)
    );

    if (existingChat) {
      setNewMessageOpen(false);
      setStartingChat(null);
      router.push(`/chat/room?id=${existingChat.id}`);
      return;
    }

    // Create new chat
    const { data: newChat, error } = await supabase
      .from('chats')
      .insert({
        participants: [user.id, otherUserId],
      })
      .select()
      .single();

    setStartingChat(null);

    if (!error && newChat) {
      setNewMessageOpen(false);
      router.push(`/chat/room?id=${(newChat as Chat).id}`);
    }
  };

  // Filter connections that don't have an existing chat
  const connectionsWithoutChat = connections.filter(
    (conn) => !chats.some((chat) => chat.otherUser.id === conn.profile.id)
  );

  if (authLoading || !user) {
    return null;
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
          {connections.length > 0 && (
            <Button
              size="sm"
              onClick={() => setNewMessageOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : chats.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No conversations yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Connect with people to start chatting
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {chats.map((chat) => (
              <Card
                key={chat.id}
                className="cursor-pointer hover:bg-secondary/50 transition-colors"
                onClick={() => router.push(`/chat/room?id=${chat.id}`)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={chat.otherUser.avatar_url ?? undefined} />
                    <AvatarFallback className="text-sm font-medium bg-secondary">
                      {getInitials(chat.otherUser)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">
                        {getDisplayName(chat.otherUser)}
                      </p>
                      {chat.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {formatChatListTime(chat.lastMessage.created_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-sm text-muted-foreground truncate">
                        {chat.lastMessage?.content ?? 'No messages yet'}
                      </p>
                      {chat.unreadCount > 0 && (
                        <Badge className="ml-2 min-w-[20px] h-5 px-1.5 text-xs">
                          {chat.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {connectionsWithoutChat.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <MessageCircle className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-center">
                  You already have conversations with all your connections
                </p>
              </div>
            ) : (
              connectionsWithoutChat.map((connection) => (
                <Card
                  key={connection.id}
                  className="cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => handleStartNewChat(connection.profile.id)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={connection.profile.avatar_url ?? undefined} />
                      <AvatarFallback className="text-sm font-medium bg-secondary">
                        {getInitials(connection.profile)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {getDisplayName(connection.profile)}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {connection.profile.email}
                      </p>
                    </div>
                    {startingChat === connection.profile.id && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
