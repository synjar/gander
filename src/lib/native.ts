/**
 * Native (Capacitor) bootstrap.
 *
 * No-op on the web build — every branch is guarded by `isNativePlatform()`,
 * and the Capacitor plugins are dynamically imported so they never end up in
 * the web bundle. Call `initNative()` once, after React has mounted.
 */
import { Capacitor } from '@capacitor/core'

/** True when running inside the iOS/Android native shell (not a browser). */
export const isNative = Capacitor.isNativePlatform()

export async function initNative(): Promise<void> {
  if (!isNative) return

  const [{ App }, { Browser }, { StatusBar, Style }, { SplashScreen }] =
    await Promise.all([
      import('@capacitor/app'),
      import('@capacitor/browser'),
      import('@capacitor/status-bar'),
      import('@capacitor/splash-screen'),
    ])

  // --- Status bar: dark icons on our light background -----------------------
  try {
    await StatusBar.setStyle({ style: Style.Light })
    // Android: let the web content draw under the status bar so our safe-area
    // CSS can paint the inset area with the header colour.
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setOverlaysWebView({ overlay: true })
    }
  } catch {
    /* status bar not available — ignore */
  }

  // --- Deep links (Universal Links / App Links) -----------------------------
  // Fired when the app is opened via https://gander.social/... or a custom
  // scheme. We capture referral codes and route the SPA to the right path.
  App.addListener('appUrlOpen', ({ url }) => {
    try {
      const parsed = new URL(url)

      // Persist referral code so AuthContext can process it after sign-up.
      const ref = parsed.searchParams.get('ref')
      if (ref && ref.length === 8) {
        localStorage.setItem('gander.ref', ref.toUpperCase())
      }

      // Navigate the in-app router to the deep-linked path without a reload.
      const path = parsed.pathname + parsed.search + parsed.hash
      if (path && path !== '/') {
        window.history.pushState({}, '', path)
        window.dispatchEvent(new PopStateEvent('popstate'))
      }
    } catch {
      /* malformed URL — ignore */
    }
  })

  // --- Android hardware back button -----------------------------------------
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back()
    } else {
      void App.exitApp()
    }
  })

  // --- External links open in the system browser ----------------------------
  // Any <a target="_blank"> with an http(s) href (directions, public page,
  // staff scanner) is routed through the in-app system browser instead of
  // navigating the webview away from the app.
  document.addEventListener(
    'click',
    (e) => {
      const anchor = (e.target as HTMLElement | null)?.closest?.('a')
      if (!anchor) return
      const href = anchor.getAttribute('href') ?? ''
      const isExternal = /^https?:\/\//i.test(href) && anchor.target === '_blank'
      if (isExternal) {
        e.preventDefault()
        void Browser.open({ url: href })
      }
    },
    true,
  )

  // --- Hide the splash screen now that the UI is ready ----------------------
  try {
    await SplashScreen.hide()
  } catch {
    /* splash screen already hidden — ignore */
  }
}
