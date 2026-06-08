import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import Layout from './components/Layout'
import Home from './pages/Home'
import Search from './pages/Search'
import BusinessDetail from './pages/BusinessDetail'
import Deals from './pages/Deals'
import DealDetail from './pages/DealDetail'
import Feed from './pages/Feed'
import Profile from './pages/Profile'
import BusinessLanding from './pages/BusinessLanding'
import MerchantDashboard from './pages/MerchantDashboard'
import BusinessOnboarding from './pages/BusinessOnboarding'
import Redeem from './pages/Redeem'
import StaffScanner from './pages/StaffScanner'
import StripeConnectCallback from './pages/StripeConnectCallback'
import Admin from './pages/Admin'
import NotFound from './pages/NotFound'

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'search', element: <Search /> },
      { path: 'b/:slug', element: <BusinessDetail /> },
      { path: 'deals', element: <Deals /> },
      { path: 'deals/:id', element: <DealDetail /> },
      { path: 'feed', element: <Feed /> },
      { path: 'me', element: <Profile /> },
      { path: 'business', element: <BusinessLanding /> },
      { path: 'business/join', element: <BusinessOnboarding /> },
      { path: 'redeem/:code', element: <Redeem /> },
      { path: 'staff/scan', element: <StaffScanner /> },
      { path: 'business/stripe-connect', element: <StripeConnectCallback /> },
      { path: 'business/dashboard', element: <MerchantDashboard /> },
      { path: 'admin', element: <Admin /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

export default function App() {
  return (
    <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>
  )
}
