'use client'
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    return result.user
  } catch (error) {
    console.error('Google sign in error:', error)
    throw error
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth)
  } catch (error) {
    console.error('Sign out error:', error)
    throw error
  }
}
