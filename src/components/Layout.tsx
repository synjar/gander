import { Outlet, ScrollRestoration } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import BottomNav from './BottomNav'
import Toaster from './Toaster'
import ReviewNudgeBanner from './ReviewNudgeBanner'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <ReviewNudgeBanner />
      <main className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <BottomNav />
      <Toaster />
      <ScrollRestoration />
    </div>
  )
}
