'use client'

import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { auth, db } from '@/lib/firebase'
import { User } from 'firebase/auth'
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { MicrosoftAuthProvider } from '@/lib/microsoft-auth'
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { createDefaultTeam, getGeneralTeam } from '@/services/teamService'

export interface ExtendedUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  organizationId: string | null
  teams: string[]
  defaultTeam?: string
}

export interface AuthContextType {
  user: ExtendedUser | null
  loading: boolean
  authenticateWithGoogle: (organizationDetails?: { name: string; domain: string }) => Promise<User | null>
  authenticateWithMicrosoft: (organizationDetails?: { name: string; domain: string }) => Promise<User | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null)
  const [loading, setLoading] = useState(true)
  const unsubscribersRef = useRef<(() => void)[]>([])

  const cleanupListeners = useCallback(() => {
    unsubscribersRef.current.forEach(unsubscribe => unsubscribe())
    unsubscribersRef.current = []
  }, [])

  const updateUserState = useCallback(async (firebaseUser: User | null) => {
    try {
      // Clean up existing listeners when user state changes
      cleanupListeners()

      if (!firebaseUser) {
        setUser(null)
        return
      }

      // Get user document
      const userRef = doc(db, 'users', firebaseUser.uid)
      const userSnap = await getDoc(userRef)
      let userData = userSnap.exists() ? userSnap.data() : null

      if (!userData?.organizationId) {
        // New user or no organization - set up workspace
        await handleUserWorkspace(firebaseUser)
        // Fetch updated user data
        const updatedUserSnap = await getDoc(userRef)
        userData = updatedUserSnap.exists() ? updatedUserSnap.data() : null
      }

      // Set initial user state
      const initialUserState = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        organizationId: userData?.organizationId || null,
        teams: userData?.teams || [],
        defaultTeam: userData?.defaultTeam
      }
      setUser(initialUserState)

      // Set up real-time listener for user document
      const userUnsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data()
          setUser(prev => {
            if (!prev) return initialUserState
            return {
              ...prev,
              organizationId: data.organizationId || null,
              teams: data.teams || [],
              defaultTeam: data.defaultTeam
            }
          })
        }
      }, (error) => {
        console.error('Error in user listener:', error)
      })

      unsubscribersRef.current.push(userUnsubscribe)
    } catch (error) {
      console.error('Error updating user state:', error)
      setUser(null)
    }
  }, [cleanupListeners])

  useEffect(() => {
    let authUnsubscribe: (() => void) | undefined

    const initializeAuth = async () => {
      try {
        authUnsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
          try {
            await updateUserState(firebaseUser)
          } catch (error) {
            console.error('Error in auth state change:', error)
            setUser(null)
          } finally {
            setLoading(false)
          }
        })
      } catch (error) {
        console.error('Error initializing auth:', error)
        setLoading(false)
      }
    }

    initializeAuth()

    return () => {
      if (authUnsubscribe) {
        authUnsubscribe()
      }
      cleanupListeners()
    }
  }, [updateUserState, cleanupListeners])

  const handleUserWorkspace = async (user: User, organizationDetails?: { name: string; domain: string }) => {
    if (!user.email) return

    const domain = organizationDetails?.domain || user.email.split('@')[1]
    
    try {
      // Create or get user document first
      const userRef = doc(db, 'users', user.uid)
      
      // Check if workspace exists for domain
      const workspacesRef = collection(db, 'organizations')
      const q = query(workspacesRef, where('domain', '==', domain))
      const workspaceSnapshot = await getDocs(q)

      let organizationId: string

      if (workspaceSnapshot.empty) {
        // Create new workspace with provided name
        const workspaceDoc = await addDoc(workspacesRef, {
          name: organizationDetails?.name || 'My Workspace',
          domain,
          ownerId: user.uid,
          createdAt: new Date().toISOString(),
          members: [user.uid]
        })
        organizationId = workspaceDoc.id

        // Create General team
        const generalTeam = await createDefaultTeam(organizationId, user.uid)

        // Create or update user document with workspace info
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          organizationId,
          teams: [generalTeam.id],
          defaultTeam: generalTeam.id,
          createdAt: new Date().toISOString()
        }, { merge: true })
      } else {
        // Join existing workspace
        const workspace = workspaceSnapshot.docs[0]
        organizationId = workspace.id

        // Get the general team first
        const generalTeam = await getGeneralTeam(organizationId)
        if (!generalTeam) {
          throw new Error('General team not found')
        }

        // Create or update user document with workspace and team info first
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          organizationId,
          teams: [generalTeam.id],
          defaultTeam: generalTeam.id,
          createdAt: new Date().toISOString()
        }, { merge: true })

        // Then add user to workspace members
        const members = workspace.data().members || []
        if (!members.includes(user.uid)) {
          await updateDoc(workspace.ref, {
            members: [...members, user.uid]
          })
        }
      }

      return { organizationId }
    } catch (error) {
      console.error('Error handling workspace:', error)
      throw error
    }
  }

  const contextValue = useMemo(() => ({
    user,
    loading,
    authenticateWithGoogle: async (organizationDetails?: { name: string; domain: string }) => {
      try {
        const provider = new GoogleAuthProvider()
        const result = await signInWithPopup(auth, provider)
        if (result.user) {
          await handleUserWorkspace(result.user, organizationDetails)
        }
        return result.user
      } catch (error) {
        console.error('Error signing in with Google:', error)
        return null
      }
    },
    authenticateWithMicrosoft: async (organizationDetails?: { name: string; domain: string }) => {
      try {
        const provider = new MicrosoftAuthProvider()
        const result = await signInWithPopup(auth, provider)
        if (result.user) {
          await handleUserWorkspace(result.user, organizationDetails)
        }
        return result.user
      } catch (error) {
        console.error('Error signing in with Microsoft:', error)
        return null
      }
    },
    signOut: async () => {
      try {
        // Clean up listeners before signing out
        cleanupListeners()
        // Set user to null before signing out to prevent permission errors
        setUser(null)
        // Then sign out
        await signOut(auth)
      } catch (error) {
        console.error('Sign out error:', error)
      }
    }
  }), [user, loading, cleanupListeners])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 