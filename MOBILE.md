# Gander — iOS & Android apps (Capacitor)

The native apps are the **same React/Vite web app** wrapped in a native shell by
[Capacitor](https://capacitorjs.com). There is no separate codebase: every
screen, the Supabase backend, Stripe checkout, Leaflet maps and the QR scanner
all run inside a native WebView. Build the web app, copy it into the native
projects, open in Xcode / Android Studio, ship.

```
src/ ──build──▶ dist/ ──cap sync──▶ android/  (Android Studio → Google Play)
                              └────▶ ios/      (Xcode → App Store)
```

- **App name:** Gander
- **App ID (bundle / package):** `social.gander.app`
- **Native projects:** `android/` and `ios/` (committed; build outputs are git-ignored)

---

## ⚠️ Platform constraint: iOS requires a Mac

Android can be built, signed and submitted **entirely from Windows**. Apple does
**not** allow building or submitting iOS apps from Windows — you need macOS +
Xcode. Options when you're ready for the App Store:

1. A Mac (even a cheap Mac mini / borrowed machine).
2. A cloud Mac: [MacinCloud](https://www.macincloud.com), [Codemagic](https://codemagic.io), or GitHub Actions `macos-latest` runners.

Everything in this repo is already configured for both platforms, so no iOS
setup is wasted — it's ready the moment you have Mac access.

---

## Prerequisites

| Target | Install |
| ------ | ------- |
| Both | Node 20+, the repo's `npm install` |
| Android | [Android Studio](https://developer.android.com/studio) (bundles the SDK + emulator) |
| iOS | macOS + [Xcode](https://developer.apple.com/xcode/) 15+ |

Capacitor 8 uses **Swift Package Manager** for iOS (no CocoaPods needed).

---

## Day-to-day workflow

After **any** change to the web app you must rebuild and sync:

```bash
npm run cap:sync        # build web + copy into android & ios
```

Then open the native IDE:

```bash
npm run cap:android     # build + sync + open Android Studio
npm run cap:ios         # build + sync + open Xcode   (Mac only)
```

Press **Run** in the IDE to launch on an emulator/simulator or a connected
device. For fast UI iteration you can still use `npm run dev` in the browser —
the native shell is only needed to test native behaviour (camera, geolocation
prompts, deep links, safe areas).

---

## Releasing to Google Play (Android)

1. `npm run cap:android` to open Android Studio.
2. **Build → Generate Signed App Bundle / APK → Android App Bundle (`.aab`)**.
3. Create an upload keystore the first time and **back it up safely** — losing it
   means you can never update the app under the same listing.
4. Bump the version in `android/app/build.gradle` (`versionCode` +1,
   `versionName`) for every release.
5. Upload the `.aab` at [play.google.com/console](https://play.google.com/console)
   (one-time $25 developer fee).

## Releasing to the App Store (iOS, Mac only)

1. `npm run cap:ios` to open Xcode.
2. Select the **App** target → **Signing & Capabilities** → pick your Apple
   Developer team (Apple Developer Program, $99/yr).
3. Set the version + build number under **General**.
4. **Product → Archive**, then **Distribute App → App Store Connect**.
5. Finish the listing at [appstoreconnect.apple.com](https://appstoreconnect.apple.com).

---

## 💳 Payments & Apple's In-App-Purchase rule (read before submitting)

Gander sells **vouchers redeemed for real-world food, drink and services**.
Apple's guidelines (§3.1.3 / §3.1.5) require In-App Purchase **only for digital
goods consumed inside the app**. Physical goods and real-world services are
explicitly **exempt** and may use external payment — which is exactly why apps
like OpenTable, Groupon and food-delivery apps charge cards directly.

So our Stripe card checkout is allowed, **but**:

- Keep the language about **real-world redemption** ("show this voucher at the
  venue") visible — it's what makes us exempt.
- Do **not** add any purely-digital, in-app-only paid feature without routing it
  through IAP, or review will reject it.
- Apple/Google still take **0%** of these real-world transactions; your revenue
  remains the 15% merchant commission via Stripe.

This is a policy interpretation, not legal advice — re-check the current
guidelines before launch.

---

## Environment variables

`VITE_*` env vars are **baked into `dist/` at build time**, so the values present
when you run `npm run build` / `npm run cap:sync` are what ship in the native app.
Before a store build, make sure your shell (or `.env`) has the **production**
values:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY` (publishable only — never the secret key)
- `VITE_APP_URL` = `https://gander.social` (used for QR/deep-link URLs)

The Stripe **secret** key stays server-side (Vercel env) and never enters the
app bundle.

---

## Permissions (already configured)

| Capability | Android (`AndroidManifest.xml`) | iOS (`Info.plist`) |
| ---------- | ------------------------------- | ------------------ |
| "Near me" location | `ACCESS_FINE/COARSE_LOCATION` | `NSLocationWhenInUseUsageDescription` |
| QR scanner camera | `CAMERA` | `NSCameraUsageDescription` |

The OS shows the permission prompt the first time the feature is used.

---

## Deep links (referrals & voucher redemption) — follow-up

The native bootstrap (`src/lib/native.ts`) already **handles** incoming links
(captures `?ref=` codes and routes the SPA to paths like `/redeem/:code`). To
make `https://gander.social/...` links actually open the app you still need to
register the domain association on each platform:

- **iOS — Universal Links:** add the *Associated Domains* capability
  (`applinks:gander.social`) in Xcode and host
  `/.well-known/apple-app-site-association` on gander.social.
- **Android — App Links:** add an `intent-filter` with `autoVerify="true"` for
  `gander.social` in `AndroidManifest.xml` and host
  `/.well-known/assetlinks.json`.

Until then, referral links keep working in the **web** app exactly as before;
this only affects whether tapping a link opens the installed native app.

---

## Regenerating app icons / splash screens

Source art lives in `assets/` (`icon-only.svg`, `icon-foreground.svg`,
`icon-background.svg`, `splash.svg`, `splash-dark.svg`). To regenerate every
platform size after editing them:

```bash
npx @capacitor/assets generate \
  --iconBackgroundColor '#f96a16' --iconBackgroundColorDark '#1c1917' \
  --splashBackgroundColor '#f96a16' --splashBackgroundColorDark '#1c1917'
```
