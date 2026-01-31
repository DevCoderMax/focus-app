# Capacitor Android setup (FOCUS)

## Prerequisites
- Node.js + npm
- Android Studio (includes Android SDK)
- Java 17+ (required by recent Android Gradle Plugin)

## One-time setup (already applied in this repo)
- Capacitor dependencies installed
- `capacitor.config.ts` configured with:
  - `appId`: `com.focus.app`
  - `appName`: `FOCUS`
  - `webDir`: `dist`
- Android project created in `android/`

## Build and sync web assets
```bash
npm run build
npx cap sync android
```

## Open Android project (Android Studio)
```bash
npx cap open android
```

## Generate APKs
Debug APK (testing):
```bash
cd android && ./gradlew assembleDebug
```

Release APK (manual signing required):
```bash
cd android && ./gradlew assembleRelease
```

Play Store (AAB):
```bash
cd android && ./gradlew bundleRelease
```

## Notes
- If you change web code, rerun `npm run build` and `npx cap sync android` before generating APKs.
- For signing release builds, configure signing configs in `android/app/build.gradle`.
