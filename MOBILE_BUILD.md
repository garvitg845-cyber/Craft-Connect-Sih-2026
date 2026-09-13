# Craft Connect Mobile App

Craft Connect is now Capacitor-ready. The same React/Vite codebase can be packaged as Android and iOS apps, with native camera support through `@capacitor/camera`.

## Install

```bash
npm install
```

## Android

```bash
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

Then build/run the Android project from Android Studio.

## iOS (macOS + Xcode required)

```bash
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

The app uses the native Capacitor Camera plugin when running inside Android/iOS. In the browser/PWA it uses the browser camera with a phone-camera fallback.

## App ID

`com.craftconnect.marketplace`

Change this before publishing if you need a different package/bundle identifier.
