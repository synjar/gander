import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CityProvider } from './city/CityContext'
import { AuthProvider } from './auth/AuthContext'
import { StoreProvider } from './store/StoreContext'
import { initNative } from './lib/native'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CityProvider>
      <AuthProvider>
        <StoreProvider>
          <App />
        </StoreProvider>
      </AuthProvider>
    </CityProvider>
  </StrictMode>,
)

// Initialise native (Capacitor) integrations — no-op on the web build.
void initNative()
