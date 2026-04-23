import type { AuthError } from '@supabase/supabase-js';

export function getAuthErrorMessage(error: AuthError): string {
  const errorMessages: Record<string, string> = {
    'Invalid login credentials': 'Invalid email or password',
    'Email not confirmed': 'Please verify your email before signing in',
    'User already registered': 'An account with this email already exists',
    'Password should be at least 6 characters':
      'Password must be at least 6 characters',
    'Unable to validate email address: invalid format':
      'Please enter a valid email address',
    'Email rate limit exceeded':
      'Too many attempts. Please try again later',
    'For security purposes, you can only request this once every 60 seconds':
      'Please wait before requesting again',
  };

  return errorMessages[error.message] || error.message;
}
