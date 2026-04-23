'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook for protected pages that require authentication.
 * Redirects to home page if user is not authenticated.
 */
export function useProtectedPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  return {
    user,
    profile,
    loading,
    isReady: !loading && !!user,
  };
}
