import { 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile } from './userService';
import { AuthError } from '@/lib/errors';

export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await createUserProfile(result.user);
    return result.user;
  } catch (error: any) {
    console.error('Google sign in error:', error);
    throw new AuthError(
      error.message || 'Failed to sign in with Google',
      error.code || 'GOOGLE_SIGN_IN_FAILED'
    );
  }
}

export async function signOut() {
  return firebaseSignOut(auth);
}
