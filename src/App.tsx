import { lazy, useEffect } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import Layout from './components/Layout'
import Home from './pages/Home' // eager: the landing route should paint immediately

// Everything else is code-split so a first-time visitor doesn't download the
// merchant dashboard, admin panel, maps, charts, etc. they may never open.
const Search = lazy(() => import('./pages/Search'))
const MapPage = lazy(() => import('./pages/MapPage'))
const BusinessDetail = lazy(() => import('./pages/BusinessDetail'))
const Deals = lazy(() => import('./pages/Deals'))
const DealDetail = lazy(() => import('./pages/DealDetail'))
const Feed = lazy(() => import('./pages/Feed'))
const Profile = lazy(() => import('./pages/Profile'))
const BusinessLanding = lazy(() => import('./pages/BusinessLanding'))
const MerchantDashboard = lazy(() => import('./pages/MerchantDashboard'))
const BusinessOnboarding = lazy(() => import('./pages/BusinessOnboarding'))
const BusinessFlyer = lazy(() => import('./pages/BusinessFlyer'))
const Redeem = lazy(() => import('./pages/Redeem'))
const StaffScanner = lazy(() => import('./pages/StaffScanner'))
const StripeConnectCallback = lazy(() => import('./pages/StripeConnectCallback'))
const UserProfile = lazy(() => import('./pages/UserProfile'))
const Admin = lazy(() => import('./pages/Admin'))
const NotFound = lazy(() => import('./pages/NotFound'))

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'search', element: <Search /> },
      { path: 'map', element: <MapPage /> },
      { path: 'b/:slug', element: <BusinessDetail /> },
      { path: 'deals', element: <Deals /> },
      { path: 'deals/:id', element: <DealDetail /> },
      { path: 'feed', element: <Feed /> },
      { path: 'me', element: <Profile /> },
      { path: 'business', element: <BusinessLanding /> },
      { path: 'business/join', element: <BusinessOnboarding /> },
      { path: 'business/flyer', element: <BusinessFlyer /> },
      { path: 'redeem/:code', element: <Redeem /> },
      { path: 'staff/scan', element: <StaffScanner /> },
      { path: 'business/stripe-connect', element: <StripeConnectCallback /> },
      { path: 'business/dashboard', element: <MerchantDashboard /> },
      { path: 'u/:userId', element: <UserProfile /> },
      { path: 'admin', element: <Admin /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

export default function App() {
  // Capture referral code from URL and persist it — processed after sign-in
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (ref && ref.length === 8) {
      localStorage.setItem('gander.ref', ref.toUpperCase())
    }
  }, [])

  return (
    <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>
  )
}
