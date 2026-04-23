# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/claude-code) when working with code in this repository.

## Project Overview

Cross-platform starter template for building web + iOS + Android applications from a single React/Next.js codebase. Uses Capacitor for native mobile deployment.

## Tech Stack

- **Language**: TypeScript 5.x (strict mode)
- **Frontend**: React 18 + Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React
- **Database/Auth**: Supabase (PostgreSQL + Auth)
- **Hosting**: Vercel
- **Cross-Platform**: Capacitor 8.x (iOS + Android)
- **State**: Zustand + React Context

## Common Commands

```bash
# Web Development
npm run dev              # Start Next.js dev server (http://localhost:3000)
npm run build            # Production build
npm run lint             # Run ESLint

# Mobile - Development Mode (hot reload via dev server)
npm run ios:dev          # Sync + open Xcode, pointing to dev server (auto-detects local IP)
npm run android:dev      # Sync + open Android Studio, pointing to dev server
# NOTE: Run `npm run dev` first, then run these in a separate terminal

# Mobile - Production Mode (bundled build)
npm run ios              # Build + sync + open in Xcode (standalone app)
npm run android          # Build + sync + open in Android Studio (standalone app)
npm run build:mobile     # Build + sync for mobile without opening IDE
```

## Development Workflow

### Web Only
```bash
npm run dev
# Open http://localhost:3000
```

### Web + Mobile Simultaneously (Recommended)
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Open mobile app pointing to dev server
npm run ios:dev   # or android:dev
```
The mobile app will hot reload when you make changes. The dev scripts auto-detect your Mac's local IP so physical devices can connect.

### Production Mobile Build
```bash
npm run ios       # or npm run android
```
Creates a standalone build with bundled assets. Use this for App Store/Play Store builds.

### Script Configuration

Scripts are defined in `package.json`. Key environment variables:
- `MOBILE_BUILD=true` - Enables static export in `next.config.mjs`
- `CAPACITOR_DEV=true` - Points app to dev server instead of bundled assets
- `DEV_SERVER_URL` - Auto-set by dev scripts to your Mac's local IP (e.g., `http://192.168.1.x:3000`)

The Capacitor configuration in `capacitor.config.ts` reads these variables to configure the app.

## Project Structure

- `src/app/` - Next.js App Router pages
- `src/components/` - React components (including `ui/` for shadcn components)
- `src/contexts/` - React contexts (AuthContext, ThemeContext)
- `src/stores/` - Zustand stores
- `src/hooks/` - Custom hooks (useKeyboard, useSwipeGesture, useUnreadCount, usePendingRequestsCount, useProtectedPage)
- `src/lib/` - Utilities (Supabase client)
- `src/types/` - TypeScript type definitions
- `src/utils/` - Helper functions (haptics, auth-errors, debounce, userProfile, dateTime)
- `ios/` - Capacitor iOS project
- `android/` - Capacitor Android project

## Architecture Patterns

### Shared Utilities

Always use shared utilities instead of duplicating code:

```typescript
// User display utilities - src/utils/userProfile.ts
import { getInitials, getDisplayName } from '@/utils';
getInitials(profile);      // Returns "JD" for John Doe
getDisplayName(profile);   // Returns "John Doe" or email

// Date/time formatting - src/utils/dateTime.ts
import { formatMessageTime, formatChatListTime, formatMessageGroupDate } from '@/utils';
formatMessageTime(date);      // "2:30 PM"
formatChatListTime(date);     // "Yesterday", "Mon", "Jan 15"
formatMessageGroupDate(date); // "Monday, Jan 15"
```

### Protected Pages

Use the `useProtectedPage` hook for authenticated routes:

```typescript
import { useProtectedPage } from '@/hooks';

export default function MyProtectedPage() {
  const { user, profile, loading, isReady } = useProtectedPage();

  if (!isReady) return null;

  // Page content...
}
```

### Provider Nesting
Providers must be nested in order: Auth → Theme → App components

### Authentication
- Uses Supabase Auth with email/password
- AuthContext manages session with throttled refresh
- Protected routes use `useProtectedPage` hook
- Profile auto-created on signup via database trigger

### State Management
- **React Context**: Auth state, theme state
- **Zustand**: Data caching (connections, etc.)
- **Supabase Real-time**: Live updates for messages

### Real-time Subscriptions
Use Supabase `postgres_changes` for real-time features:
```typescript
supabase.channel('channel-name')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, handler)
  .subscribe()
```

### Notification Badges
When adding features that warrant user attention, implement real-time notification badges:

1. **Create a count hook** in `src/hooks/` (e.g., `usePendingRequestsCount.ts`):
   - Query the relevant count on mount
   - Subscribe to real-time changes on the relevant table
   - Return the count for use in navigation

2. **Add to sidebar** in `SidebarMenu.tsx`:
   - Import the hook
   - Add `badgeType` to the nav item
   - Render badge conditionally when count > 0

Example pattern:
```typescript
// Hook
export function usePendingRequestsCount() {
  const [count, setCount] = useState(0);
  // Subscribe to changes, return count
}

// SidebarMenu nav items
{ href: '/people', label: 'People', icon: Users, badgeType: 'requests' as const }
```

Current badge types: `'messages'` (unread messages), `'requests'` (pending connection requests)

### Mobile/Capacitor
- Platform detection via Capacitor's `Capacitor.isNativePlatform()`
- Keyboard handling with `useKeyboard` hook
- Swipe gestures with `useSwipeGesture` hook
- Haptic feedback via `utils/haptics.ts`
- Status bar theming synced with app theme

### Routing
- Static export mode for Capacitor compatibility
- Dynamic routes use query params: `/chat/room?id=xxx` instead of `/chat/[id]`

## Database Schema

### Tables
- `user_profiles` - User data (extends auth.users)
- `connections` - Friend connections (sender_id, recipient_id, status)
- `chats` - Conversations (participants array)
- `messages` - Chat messages (read_by, liked_by arrays)

### Row Level Security
All tables have RLS enabled. Users can only access their own data and data they're participants in.

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...  # Server-side only
```

## Code Style

- Use TypeScript strict mode
- Prefer shadcn/ui components from `@/components/ui`
- Use Lucide React for icons
- Mobile-first responsive design with Tailwind
- Keep components minimal and focused
- **Always use shared utilities** from `@/utils` and `@/hooks` - never duplicate helper functions

## UI/UX Best Practices

Follow these principles for all UI implementation:

### Design Philosophy
- **Minimalist**: Clean, uncluttered interfaces inspired by Apple and OpenAI design
- **Mobile-first**: Design for touch screens first, enhance for desktop
- **Consistent**: Use existing component patterns and spacing throughout

### Interaction Patterns
- Show loading states for all async operations (use `Loader2` spinner)
- Provide immediate feedback for user actions (haptics on mobile, visual feedback)
- Use optimistic updates where appropriate
- Debounce search inputs (300-500ms) to avoid excessive API calls
- Show empty states with helpful guidance

### Component Patterns
- Use shadcn/ui `Card` for content containers
- Use `Avatar` with `AvatarFallback` (initials) for all user displays
- Use `Badge` for counts and status indicators
- Use `Tabs` for switching between related views
- Use `Button` variants consistently: `default` for primary, `outline` for secondary, `ghost` for tertiary

### Form & Input Patterns
- Use `Input` with clear placeholder text
- Show validation feedback inline
- Disable submit buttons during loading
- Clear forms after successful submission

### Accessibility
- All interactive elements must be keyboard accessible
- Use semantic HTML elements
- Include proper aria labels where needed

## Coding Rules

- NEVER commit and/or push changes unless the user has asked you at that exact moment and has given you explicit permission
- ALWAYS build and run the application when it's ready for testing by the user
- ALWAYS use shared utilities (getInitials, getDisplayName, formatMessageTime, etc.) instead of defining them inline
- ALWAYS use useProtectedPage hook for authenticated pages instead of manual redirect logic
- ALWAYS follow the UI/UX best practices above when implementing new features
- ALWAYS provide loading states and empty states for data-driven components
