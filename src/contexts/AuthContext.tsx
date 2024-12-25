'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '@/lib/firebase'
import { signInWithPopup, GoogleAuthProvider, User, signOut as firebaseSignOut } from 'firebase/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  authenticateWithGoogle: () => Promise<User | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const authenticateWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    return result.user
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      authenticateWithGoogle,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 