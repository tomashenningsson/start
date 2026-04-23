'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadCount, usePendingRequestsCount } from '@/hooks';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, User, Users, MessageCircle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInitials, getDisplayName } from '@/utils';

interface SidebarMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/people', label: 'People', icon: Users, badgeType: 'requests' as const },
  { href: '/chat', label: 'Messages', icon: MessageCircle, badgeType: 'messages' as const },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function SidebarMenu({ open, onOpenChange }: SidebarMenuProps) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const unreadCount = useUnreadCount();
  const pendingRequestsCount = usePendingRequestsCount();

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Profile section */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="text-sm font-medium bg-secondary">
              {getInitials(profile)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {getDisplayName(profile)}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {profile?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex-1">{item.label}</span>
                  {item.badgeType === 'messages' && unreadCount > 0 && (
                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium bg-foreground text-background rounded-full">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                  {item.badgeType === 'requests' && pendingRequestsCount > 0 && (
                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium bg-foreground text-background rounded-full">
                      {pendingRequestsCount > 99 ? '99+' : pendingRequestsCount}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar (Sheet) */}
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-72 p-0">
          <NavContent />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar (always visible) */}
      <aside className="hidden md:flex md:flex-col md:fixed md:left-0 md:top-14 md:bottom-0 md:w-64 md:border-r md:border-border md:bg-background">
        <NavContent />
      </aside>
    </>
  );
}
