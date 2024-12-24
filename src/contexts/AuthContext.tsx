'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { createUserProfile } from '@/services/userService'
import { signInWithGoogle, signOut } from '@/services/authService'
import { getApps } from 'firebase/app'
import { LoadingPage } from '@/components/ui/loading-page'

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: typeof signInWithGoogle
  signOut: typeof signOut
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle,
  signOut
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const app = getApps()[0]
    if (!app) {
      setLoading(false)
      throw new Error('Firebase is not initialized')
    }
    setInitialized(true)

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await createUserProfile(user)
      }
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (!initialized) {
    return <LoadingPage />
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading,
      signInWithGoogle,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext) 