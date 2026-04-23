'use client';

import { MainLayout, ProfileView } from '@/components';
import { useProtectedPage } from '@/hooks';

export default function ProfilePage() {
  const { loading, isReady } = useProtectedPage();

  if (loading || !isReady) {
    return null;
  }

  return (
    <MainLayout>
      <div className="p-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-semibold tracking-tight mb-6">Profile</h1>
        <ProfileView editable showEmail />
      </div>
    </MainLayout>
  );
}
