import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.echospace',
  appName: 'echospace',
  webDir: 'out',
  server: {
    androidScheme: 'http',
  }
};

export default config;
