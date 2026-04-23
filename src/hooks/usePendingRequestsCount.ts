'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function usePendingRequestsCount() {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setPendingCount(0);
      return;
    }

    const fetchPendingCount = async () => {
      // Count pending connection requests where user is the recipient
      const { count } = await supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .eq('status', 'pending');

      setPendingCount(count ?? 0);
    };

    fetchPendingCount();

    // Subscribe to connection changes
    const channel = supabase
      .channel('pending-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connections',
        },
        () => {
          // Refetch count on any connection change
          fetchPendingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return pendingCount;
}
