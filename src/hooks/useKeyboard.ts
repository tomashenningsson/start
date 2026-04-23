'use client';

import { useEffect, useState, useCallback } from 'react';

interface KeyboardInfo {
  isVisible: boolean;
  keyboardHeight: number;
}

export function useKeyboard() {
  const [keyboardInfo, setKeyboardInfo] = useState<KeyboardInfo>({
    isVisible: false,
    keyboardHeight: 0,
  });

  const handleKeyboardShow = useCallback((height: number) => {
    setKeyboardInfo({
      isVisible: true,
      keyboardHeight: height,
    });
  }, []);

  const handleKeyboardHide = useCallback(() => {
    setKeyboardInfo({
      isVisible: false,
      keyboardHeight: 0,
    });
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const setupKeyboardListeners = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        const { Keyboard } = await import('@capacitor/keyboard');

        const showListener = await Keyboard.addListener(
          'keyboardWillShow',
          (info) => {
            handleKeyboardShow(info.keyboardHeight);
          }
        );

        const hideListener = await Keyboard.addListener(
          'keyboardWillHide',
          () => {
            handleKeyboardHide();
          }
        );

        cleanup = () => {
          showListener.remove();
          hideListener.remove();
        };
      } catch {
        // Capacitor not available or not on native platform
      }
    };

    setupKeyboardListeners();

    return () => {
      cleanup?.();
    };
  }, [handleKeyboardShow, handleKeyboardHide]);

  return keyboardInfo;
}
