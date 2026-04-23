import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

const isDev = process.env.CAPACITOR_DEV === 'true';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'App Template',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    // In dev mode, point to local dev server for hot reload
    ...(isDev && {
      url: process.env.DEV_SERVER_URL || 'http://localhost:3000',
      cleartext: true,
    }),
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#000000',
      showSpinner: false,
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#000000',
    },
    Keyboard: {
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
