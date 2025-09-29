import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lumiroom',
  appName: 'lumiroom',
  webDir: 'out',
  server: {
    androidScheme: 'https',
  }
};

export default config;
