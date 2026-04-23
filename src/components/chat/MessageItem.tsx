'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getInitials, formatMessageTime } from '@/utils';
import type { Message, UserProfile } from '@/types';

interface MessageItemProps {
  message: Message;
  sender?: UserProfile | null;
  onLike?: (messageId: string) => void;
}

export function MessageItem({ message, sender, onLike }: MessageItemProps) {
  const { user } = useAuth();
  const isOwn = user?.id === message.sender_id;
  const isLiked = user ? message.liked_by.includes(user.id) : false;

  return (
    <div
      className={cn(
        'flex gap-3 group',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {!isOwn && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={sender?.avatar_url ?? undefined} />
          <AvatarFallback className="text-xs font-medium bg-secondary">
            {getInitials(sender)}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          'flex flex-col gap-1 max-w-[75%]',
          isOwn ? 'items-end' : 'items-start'
        )}
      >
        <div
          className={cn(
            'px-4 py-2.5 rounded-2xl text-sm',
            isOwn
              ? 'bg-foreground text-background rounded-br-md'
              : 'bg-secondary rounded-bl-md'
          )}
        >
          {message.content}
        </div>

        <div className="flex items-center gap-2 px-1">
          <span className="text-xs text-muted-foreground">
            {formatMessageTime(message.created_at)}
          </span>

          {onLike && (
            <button
              onClick={() => onLike(message.id)}
              className={cn(
                'opacity-0 group-hover:opacity-100 transition-opacity p-1 -m-1 rounded-full hover:bg-secondary',
                isLiked && 'opacity-100'
              )}
            >
              <Heart
                className={cn(
                  'h-3.5 w-3.5',
                  isLiked
                    ? 'fill-red-500 text-red-500'
                    : 'text-muted-foreground'
                )}
              />
            </button>
          )}

          {message.liked_by.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {message.liked_by.length}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
