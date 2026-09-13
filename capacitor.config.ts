import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.craftconnect.marketplace',
  appName: 'Craft Connect',
  webDir: 'dist',
  plugins: {
    Camera: {
      promptLabelHeader: 'Craft Connect Camera',
      promptLabelPhoto: 'Choose from photos',
      promptLabelPicture: 'Take product photo'
    }
  },
  server: {
    androidScheme: 'https'
  }
}

export default config
