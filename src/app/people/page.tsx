'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useConnectionsStore } from '@/stores/connectionsStore';
import { MainLayout } from '@/components';
import { useProtectedPage } from '@/hooks';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Check, X, MessageCircle, Loader2, Search, UserPlus, UserMinus } from 'lucide-react';
import { hapticNotification, getInitials, getDisplayName } from '@/utils';
import { supabase } from '@/lib/supabase';
import type { Chat, UserProfile } from '@/types';

export default function PeoplePage() {
  const { user, loading: authLoading } = useProtectedPage();
  const router = useRouter();
  const {
    connections,
    pendingReceived,
    pendingSent,
    searchResults,
    loading: connectionsLoading,
    searchLoading,
    fetchConnections,
    searchUsers,
    clearSearchResults,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeConnection,
  } = useConnectionsStore();

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [connectionToRemove, setConnectionToRemove] = useState<{
    id: string;
    profile: UserProfile;
  } | null>(null);

  useEffect(() => {
    if (user) {
      fetchConnections(user.id);
    }
  }, [user, fetchConnections]);

  const handleAccept = async (connectionId: string) => {
    setActionLoading(connectionId);
    const { error } = await acceptRequest(connectionId);
    if (!error && user) {
      await hapticNotification('success');
      await fetchConnections(user.id);
    }
    setActionLoading(null);
  };

  const handleReject = async (connectionId: string) => {
    setActionLoading(connectionId);
    const { error } = await rejectRequest(connectionId);
    if (!error && user) {
      await fetchConnections(user.id);
    }
    setActionLoading(null);
  };

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (user) {
        searchUsers(query, user.id);
      }
    },
    [user, searchUsers]
  );

  const handleConnect = async (recipientId: string) => {
    if (!user) return;
    setActionLoading(recipientId);
    const { error } = await sendRequest(user.id, recipientId);
    if (!error) {
      await hapticNotification('success');
      // Clear the connected user from search results
      clearSearchResults();
      setSearchQuery('');
    }
    setActionLoading(null);
  };

  const handleStartChat = async (otherUserId: string) => {
    if (!user) return;

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

    if (!error && newChat) {
      router.push(`/chat/room?id=${(newChat as Chat).id}`);
    }
  };

  const handleRemoveConnection = async () => {
    if (!user || !connectionToRemove) return;
    setActionLoading(connectionToRemove.id);
    const { error } = await removeConnection(user.id, connectionToRemove.id);
    if (!error) {
      await hapticNotification('success');
    }
    setActionLoading(null);
    setRemoveDialogOpen(false);
    setConnectionToRemove(null);
  };

  if (authLoading || !user) {
    return null;
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">People</h1>

        <Tabs defaultValue="connections" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="connections" className="flex-1">
              Connections
              {connections.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {connections.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex-1">
              Requests
              {pendingReceived.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingReceived.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="find" className="flex-1">
              Find
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connections" className="mt-4">
            {connectionsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : connections.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">No connections yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {connections.map((connection) => (
                  <Card key={connection.id}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <Avatar className="h-12 w-12">
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
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStartChat(connection.profile.id)}
                        >
                          <MessageCircle className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setConnectionToRemove({
                              id: connection.id,
                              profile: connection.profile,
                            });
                            setRemoveDialogOpen(true);
                          }}
                        >
                          <UserMinus className="h-5 w-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="mt-4 space-y-4">
            {/* Received requests */}
            {pendingReceived.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Received
                </h3>
                <div className="space-y-2">
                  {pendingReceived.map((connection) => (
                    <Card key={connection.id}>
                      <CardContent className="flex items-center gap-4 p-4">
                        <Avatar className="h-12 w-12">
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
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReject(connection.id)}
                            disabled={actionLoading === connection.id}
                          >
                            <X className="h-5 w-5" />
                          </Button>
                          <Button
                            size="icon"
                            onClick={() => handleAccept(connection.id)}
                            disabled={actionLoading === connection.id}
                          >
                            {actionLoading === connection.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Sent requests */}
            {pendingSent.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Sent
                </h3>
                <div className="space-y-2">
                  {pendingSent.map((connection) => (
                    <Card key={connection.id}>
                      <CardContent className="flex items-center gap-4 p-4">
                        <Avatar className="h-12 w-12">
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
                        <Badge variant="secondary">Pending</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {pendingReceived.length === 0 && pendingSent.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">No pending requests</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="find" className="mt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 h-11"
              />
            </div>

            {searchLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : searchQuery && searchResults.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-muted-foreground">No users found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try a different search term
                  </p>
                </CardContent>
              </Card>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((profile) => (
                  <Card key={profile.id}>
                    <CardContent className="flex items-center gap-4 p-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile.avatar_url ?? undefined} />
                        <AvatarFallback className="text-sm font-medium bg-secondary">
                          {getInitials(profile)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {getDisplayName(profile)}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {profile.email}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleConnect(profile.id)}
                        disabled={actionLoading === profile.id}
                        className="gap-2"
                      >
                        {actionLoading === profile.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserPlus className="h-4 w-4" />
                        )}
                        Connect
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Search className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Find people to connect with</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Search by name or email address
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Connection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              <span className="font-medium text-foreground">
                {connectionToRemove ? getDisplayName(connectionToRemove.profile) : ''}
              </span>{' '}
              from your connections? You can always reconnect later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConnection}
              disabled={actionLoading === connectionToRemove?.id}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading === connectionToRemove?.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
