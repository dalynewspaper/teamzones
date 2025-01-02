'use client'

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { auth, db } from '@/lib/firebase'
import { User } from 'firebase/auth'
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { MicrosoftAuthProvider } from '@/lib/microsoft-auth'
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, setDoc } from 'firebase/firestore'
import { createDefaultTeam, getGeneralTeam } from '@/services/teamService'

interface ExtendedUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  organizationId: string | null
  teams: string[]
  defaultTeam?: string
}

interface AuthContextType {
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

  const updateUserState = useCallback(async (firebaseUser: User | null) => {
    try {
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
      } else {
        // Ensure user is in General team
        const generalTeam = await getGeneralTeam(userData.organizationId)
        if (generalTeam && !generalTeam.members.some(m => m.userId === firebaseUser.uid)) {
          await updateDoc(doc(db, `teams/${generalTeam.id}`), {
            members: [...generalTeam.members, {
              userId: firebaseUser.uid,
              role: 'member',
              joinedAt: new Date().toISOString()
            }]
          })
        }
      }

      // Set user state once with all data
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        organizationId: userData?.organizationId || null,
        teams: userData?.teams || [],
        defaultTeam: userData?.defaultTeam
      })
    } catch (error) {
      console.error('Error updating user state:', error)
      setUser(null)
    }
  }, [])

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    const initializeAuth = async () => {
      try {
        unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
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
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [updateUserState])

  const handleUserWorkspace = async (user: User, organizationDetails?: { name: string; domain: string }) => {
    if (!user.email) return

    const domain = organizationDetails?.domain || user.email.split('@')[1]
    const companyName = organizationDetails?.name || domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1)
    
    try {
      // Create or get user document first
      const userRef = doc(db, 'users', user.uid)
      
      // Check if workspace exists for domain
      const workspacesRef = collection(db, 'organizations')
      const q = query(workspacesRef, where('domain', '==', domain))
      const workspaceSnapshot = await getDocs(q)

      let organizationId: string
      let defaultTeamId: string

      if (workspaceSnapshot.empty) {
        // Create new workspace with provided or default name
        const workspaceDoc = await addDoc(workspacesRef, {
          name: `${companyName}`,
          domain,
          ownerId: user.uid,
          createdAt: new Date().toISOString(),
          members: [user.uid]
        })
        organizationId = workspaceDoc.id

        // Create General team
        const generalTeam = await createDefaultTeam(organizationId, user.uid)
        defaultTeamId = generalTeam.id
      } else {
        // Join existing workspace
        const workspace = workspaceSnapshot.docs[0]
        organizationId = workspace.id

        // Add user to workspace members
        const members = workspace.data().members || []
        if (!members.includes(user.uid)) {
          await updateDoc(workspace.ref, {
            members: [...members, user.uid]
          })
        }

        // Get or create General team
        const generalTeam = await getGeneralTeam(organizationId)
        if (!generalTeam) {
          // Create General team if it doesn't exist
          const newGeneralTeam = await createDefaultTeam(organizationId, user.uid)
          defaultTeamId = newGeneralTeam.id
        } else {
          defaultTeamId = generalTeam.id
          
          // Add user to General team if not already a member
          if (!generalTeam.members.some(m => m.userId === user.uid)) {
            await updateDoc(doc(db, `organizations/${organizationId}/teams/${generalTeam.id}`), {
              members: [...generalTeam.members, {
                userId: user.uid,
                role: 'member',
                joinedAt: new Date().toISOString()
              }]
            })
          }
        }
      }

      // Create or update user document with workspace and team info
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        organizationId,
        teams: [defaultTeamId],
        defaultTeam: defaultTeamId,
        createdAt: new Date().toISOString()
      }, { merge: true })

      return { organizationId, defaultTeamId }
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
        await signOut(auth)
      } catch (error) {
        console.error('Sign out error:', error)
      }
    }
  }), [user, loading])

  return (
    <AuthContext.Provider value={contextValue}>
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