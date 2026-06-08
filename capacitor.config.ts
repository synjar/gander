import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'social.gander.app',
  appName: 'Gander',
  webDir: 'dist',
  backgroundColor: '#fff5ed',
  // Serve the app from https://localhost so geolocation, camera (QR scanner)
  // and Stripe Elements all run in a secure context, same as the web build.
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      launchAutoHide: false, // we hide it manually once React has mounted
      backgroundColor: '#f96a16',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    Keyboard: {
      resizeOnFullScreen: true,
    },
  },
  ios: {
    contentInset: 'never',
    backgroundColor: '#fff5ed',
  },
  android: {
    backgroundColor: '#fff5ed',
  },
}

export default config
