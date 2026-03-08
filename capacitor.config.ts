import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.5f34c2a982c64933b7a29c5cd8006ee1',
  appName: 'STYLE Beauty',
  webDir: 'dist',
  server: {
    url: 'https://5f34c2a9-82c6-4933-b7a2-9c5cd8006ee1.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0a0a',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a0a',
    },
  },
};

export default config;
