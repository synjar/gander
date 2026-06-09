import { Suspense } from 'react'
import { Outlet, ScrollRestoration } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import Header from './Header'
import Footer from './Footer'
import BottomNav from './BottomNav'
import Toaster from './Toaster'
import ReviewNudgeBanner from './ReviewNudgeBanner'

function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 size={28} className="animate-spin text-brand-400" />
    </div>
  )
}

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <ReviewNudgeBanner />
      <main className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <BottomNav />
      <Toaster />
      <ScrollRestoration />
    </div>
  )
}
