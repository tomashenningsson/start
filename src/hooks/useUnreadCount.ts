'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Chat } from '@/types';

export function useUnreadCount() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      // Get all chats the user is part of
      const { data: chats } = await supabase
        .from('chats')
        .select('id')
        .contains('participants', [user.id]);

      const typedChats = chats as Pick<Chat, 'id'>[] | null;

      if (!typedChats || typedChats.length === 0) {
        setUnreadCount(0);
        return;
      }

      const chatIds = typedChats.map((c) => c.id);

      // Count messages in those chats that user hasn't read
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('chat_id', chatIds)
        .not('read_by', 'cs', `{${user.id}}`);

      setUnreadCount(count ?? 0);
    };

    fetchUnreadCount();

    // Subscribe to new messages
    const channel = supabase
      .channel('unread-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          // Refetch count on any message change
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return unreadCount;
}
