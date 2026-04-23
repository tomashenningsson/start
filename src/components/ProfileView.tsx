'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check } from 'lucide-react';
import { getInitials, getDisplayName } from '@/utils';
import type { UserProfile } from '@/types';

interface ProfileViewProps {
  profile?: UserProfile | null;
  editable?: boolean;
  showEmail?: boolean;
}

export function ProfileView({
  profile: externalProfile,
  editable = false,
  showEmail = true,
}: ProfileViewProps) {
  const { profile: authProfile, updateProfile } = useAuth();
  const profile = externalProfile ?? authProfile;

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [lastName, setLastName] = useState(profile?.last_name ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      first_name: firstName || null,
      last_name: lastName || null,
    });

    if (!error) {
      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setFirstName(profile?.first_name ?? '');
    setLastName(profile?.last_name ?? '');
    setIsEditing(false);
  };

  if (!profile) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No profile found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar */}
        <div className="flex justify-center">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-2xl font-medium bg-secondary">
              {getInitials(profile)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Profile info */}
        <div className="space-y-4">
          {editable && isEditing ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  First name
                </label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Last name
                </label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1 h-11 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 h-11 rounded-xl"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <h2 className="text-xl font-semibold">
                  {profile.first_name && profile.last_name
                    ? getDisplayName(profile)
                    : 'No name set'}
                </h2>
                {showEmail && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {profile.email}
                  </p>
                )}
              </div>

              {editable && (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="w-full h-11 rounded-xl"
                >
                  {saved ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Saved
                    </>
                  ) : (
                    'Edit profile'
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
