import type { UserProfile } from '@/types';

/**
 * Get initials from a user profile for avatar display
 */
export function getInitials(profile: UserProfile | null | undefined): string {
  if (profile?.first_name && profile?.last_name) {
    return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
  }
  if (profile?.email) {
    return profile.email[0].toUpperCase();
  }
  return '?';
}

/**
 * Get display name from a user profile
 */
export function getDisplayName(profile: UserProfile | null | undefined): string {
  if (profile?.first_name && profile?.last_name) {
    return `${profile.first_name} ${profile.last_name}`;
  }
  return profile?.email ?? 'Unknown';
}
