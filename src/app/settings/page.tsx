'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components';
import { useProtectedPage } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sun, Moon, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const { profile, loading, isReady } = useProtectedPage();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading || !isReady) {
    return null;
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

        {/* Account */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">
                  {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="icon"
                  className="h-9 w-9 rounded-lg"
                  onClick={() => setTheme('light')}
                >
                  <Sun className="h-4 w-4" />
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="icon"
                  className="h-9 w-9 rounded-lg"
                  onClick={() => setTheme('dark')}
                >
                  <Moon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sign out */}
        <Card>
          <CardContent className="pt-6">
            <Button
              variant="destructive"
              onClick={handleSignOut}
              className="w-full h-11 rounded-xl"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
