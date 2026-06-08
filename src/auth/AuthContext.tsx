import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { currentUser, avatar } from '../data/users'
import { findUserByReferralCode, recordReferral } from '../lib/db'

export interface AuthUser {
  id: string
  name: string
  avatar?: string
  email?: string
  isGuest: boolean
}

interface AuthValue {
  user: AuthUser
  session: Session | null
  configured: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (name: string, email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const guest: AuthUser = {
  id: currentUser.id,
  name: currentUser.name,
  avatar: currentUser.avatar,
  isGuest: true,
}

const DEMO_NOTICE = 'Demo mode — connect Supabase (see README) to enable real accounts.'

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const user: AuthUser =
    isSupabaseConfigured && session
      ? {
          id: session.user.id,
          name:
            (session.user.user_metadata?.name as string) ||
            session.user.email?.split('@')[0] ||
            'You',
          avatar:
            (session.user.user_metadata?.avatar as string) ||
            avatar(session.user.email ?? 'You'),
          email: session.user.email,
          isGuest: false,
        }
      : guest

  const value: AuthValue = {
    user,
    session,
    configured: isSupabaseConfigured,
    loading,
    async signIn(email, password) {
      if (!isSupabaseConfigured || !supabase) return { error: DEMO_NOTICE }
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error?.message }
    },
    async signUp(name, email, password) {
      if (!isSupabaseConfigured || !supabase) return { error: DEMO_NOTICE }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, avatar: avatar(name) } },
      })
      if (error) return { error: error.message }
      // If the user arrived via a referral link, record it now.
      // The DB trigger on `referrals` will automatically create a 15%-off reward
      // for the referrer (expires in 90 days).
      const refCode = localStorage.getItem('gander.ref')
      if (refCode && data.user?.id) {
        const referrerId = await findUserByReferralCode(refCode)
        if (referrerId && referrerId !== data.user.id) {
          await recordReferral(referrerId, data.user.id)
          localStorage.removeItem('gander.ref')
        }
      }
      return {}
    },
    async signOut() {
      if (supabase) await supabase.auth.signOut()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
