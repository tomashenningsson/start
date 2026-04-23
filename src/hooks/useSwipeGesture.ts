'use client';

import { useRef, useCallback, type RefObject } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
}

export function useSwipeGesture<T extends HTMLElement>(
  config: SwipeConfig
): {
  ref: RefObject<T | null>;
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchEnd: (e: React.TouchEvent) => void;
  };
} {
  const ref = useRef<T | null>(null);
  const touchState = useRef<TouchState | null>(null);
  const { threshold = 50, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown } = config;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
    };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchState.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchState.current.startX;
      const deltaY = touch.clientY - touchState.current.startY;
      const deltaTime = Date.now() - touchState.current.startTime;

      // Only trigger if swipe was fast enough (under 300ms)
      if (deltaTime > 300) {
        touchState.current = null;
        return;
      }

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Horizontal swipe
      if (absX > absY && absX > threshold) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }

      // Vertical swipe
      if (absY > absX && absY > threshold) {
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }

      touchState.current = null;
    },
    [threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]
  );

  return {
    ref,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
    },
  };
}
