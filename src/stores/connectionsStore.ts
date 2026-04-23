import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { Connection, UserProfile, Database } from '@/types';

interface ConnectionWithProfile extends Connection {
  profile: UserProfile;
}

interface ConnectionsState {
  connections: ConnectionWithProfile[];
  pendingReceived: ConnectionWithProfile[];
  pendingSent: ConnectionWithProfile[];
  searchResults: UserProfile[];
  loading: boolean;
  searchLoading: boolean;
  error: string | null;
  fetchConnections: (userId: string) => Promise<void>;
  searchUsers: (query: string, currentUserId: string) => Promise<void>;
  clearSearchResults: () => void;
  sendRequest: (senderId: string, recipientId: string) => Promise<{ error: Error | null }>;
  acceptRequest: (connectionId: string) => Promise<{ error: Error | null }>;
  rejectRequest: (connectionId: string) => Promise<{ error: Error | null }>;
  removeConnection: (userId: string, connectionId: string) => Promise<{ error: Error | null }>;
  hideRequest: (userId: string, connectionId: string) => Promise<{ error: Error | null }>;
}

export const useConnectionsStore = create<ConnectionsState>((set, get) => ({
  connections: [],
  pendingReceived: [],
  pendingSent: [],
  searchResults: [],
  loading: false,
  searchLoading: false,
  error: null,

  fetchConnections: async (userId: string) => {
    set({ loading: true, error: null });

    try {
      // Fetch all connections where user is sender or recipient
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('connections')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);

      if (connectionsError) throw connectionsError;

      const typedConnections = connectionsData as Connection[] | null;

      if (!typedConnections || typedConnections.length === 0) {
        set({
          connections: [],
          pendingReceived: [],
          pendingSent: [],
          loading: false,
        });
        return;
      }

      // Get all unique user IDs to fetch profiles
      const userIds = new Set<string>();
      typedConnections.forEach((conn) => {
        userIds.add(conn.sender_id);
        userIds.add(conn.recipient_id);
      });
      userIds.delete(userId); // Remove current user

      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .in('id', Array.from(userIds));

      if (profilesError) throw profilesError;

      const typedProfiles = profiles as UserProfile[] | null;
      const profileMap = new Map(typedProfiles?.map((p) => [p.id, p]) ?? []);

      // Categorize connections
      const accepted: ConnectionWithProfile[] = [];
      const pendingReceived: ConnectionWithProfile[] = [];
      const pendingSent: ConnectionWithProfile[] = [];

      typedConnections.forEach((conn) => {
        const otherUserId =
          conn.sender_id === userId ? conn.recipient_id : conn.sender_id;
        const profile = profileMap.get(otherUserId);

        if (!profile) return;

        const connectionWithProfile: ConnectionWithProfile = { ...conn, profile };

        if (conn.status === 'accepted') {
          accepted.push(connectionWithProfile);
        } else if (conn.recipient_id === userId) {
          pendingReceived.push(connectionWithProfile);
        } else {
          pendingSent.push(connectionWithProfile);
        }
      });

      set({
        connections: accepted,
        pendingReceived,
        pendingSent,
        loading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch connections',
        loading: false,
      });
    }
  },

  searchUsers: async (query: string, currentUserId: string) => {
    if (!query.trim()) {
      set({ searchResults: [], searchLoading: false });
      return;
    }

    set({ searchLoading: true, error: null });

    try {
      const searchTerm = query.toLowerCase().trim();

      // Search by name or email using ilike for case-insensitive matching
      const { data: users, error: searchError } = await supabase
        .from('user_profiles')
        .select('*')
        .neq('id', currentUserId)
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(20);

      if (searchError) throw searchError;

      const typedUsers = users as UserProfile[] | null;

      // Filter out users who are already connected or have pending requests
      const { connections, pendingReceived, pendingSent } = get();
      const existingUserIds = new Set([
        ...connections.map((c) => c.profile.id),
        ...pendingReceived.map((c) => c.profile.id),
        ...pendingSent.map((c) => c.profile.id),
      ]);

      const filteredUsers = (typedUsers ?? []).filter(
        (user) => !existingUserIds.has(user.id)
      );

      set({ searchResults: filteredUsers, searchLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to search users',
        searchLoading: false,
        searchResults: [],
      });
    }
  },

  clearSearchResults: () => {
    set({ searchResults: [], searchLoading: false });
  },

  sendRequest: async (senderId: string, recipientId: string) => {
    const insertData: Database['public']['Tables']['connections']['Insert'] = {
      sender_id: senderId,
      recipient_id: recipientId,
      status: 'pending',
    };
    const { error } = await supabase.from('connections').insert(insertData);

    if (error) {
      return { error: new Error(error.message) };
    }

    // Refresh connections
    await get().fetchConnections(senderId);
    return { error: null };
  },

  acceptRequest: async (connectionId: string) => {
    const updateData: Database['public']['Tables']['connections']['Update'] = {
      status: 'accepted',
    };
    const { error } = await supabase
      .from('connections')
      .update(updateData)
      .eq('id', connectionId);

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  },

  rejectRequest: async (connectionId: string) => {
    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', connectionId);

    if (error) {
      return { error: new Error(error.message) };
    }

    return { error: null };
  },

  removeConnection: async (userId: string, connectionId: string) => {
    const { error } = await supabase
      .from('connections')
      .delete()
      .eq('id', connectionId);

    if (error) {
      return { error: new Error(error.message) };
    }

    // Refresh connections
    await get().fetchConnections(userId);
    return { error: null };
  },

  hideRequest: async (userId: string, connectionId: string) => {
    // Get current hidden requests
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('hidden_connection_requests')
      .eq('id', userId)
      .single();

    const typedProfile = profile as { hidden_connection_requests: string[] } | null;
    const currentHidden = typedProfile?.hidden_connection_requests ?? [];

    const updateData: Database['public']['Tables']['user_profiles']['Update'] = {
      hidden_connection_requests: [...currentHidden, connectionId],
    };
    const { error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      return { error: new Error(error.message) };
    }

    // Refresh connections
    await get().fetchConnections(userId);
    return { error: null };
  },
}));
