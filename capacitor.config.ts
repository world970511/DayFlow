import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dayflow.app',
  appName: 'DayFlow',
  webDir: 'dist',  // Vite 빌드 출력 폴더
  server: {
    androidScheme: 'https'
  }
};

export default config;