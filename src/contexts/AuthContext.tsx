'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { User, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { getUserProfile, createUserProfile } from '@/services/userService'

interface AuthContextType {
  user: (User & { organizationId?: string }) | null
  loading: boolean
  refreshUser: () => Promise<void>
  authenticateWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<(User & { organizationId?: string }) | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    if (!auth.currentUser) return
    const profile = await getUserProfile(auth.currentUser.uid)
    if (profile) {
      setUser(currentUser => ({
        ...currentUser!,
        organizationId: profile.organizationId
      }))
    }
  }

  const authenticateWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    await createUserProfile(result.user)
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid)
        setUser({
          ...firebaseUser,
          organizationId: profile?.organizationId
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      refreshUser,
      authenticateWithGoogle
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
} 