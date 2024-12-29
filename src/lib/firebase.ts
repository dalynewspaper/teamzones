import { initializeApp, getApps } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  enableMultiTabIndexedDbPersistence,
  enableIndexedDbPersistence
} from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
  connectAuthEmulator(auth, 'http://localhost:9099')
  connectFirestoreEmulator(db, 'localhost', 8080)
  connectStorageEmulator(storage, 'localhost', 9199)
}

// Configure Firestore for offline persistence
const initializeFirestore = async () => {
  try {
    // Try enabling multi-tab persistence first
    await enableMultiTabIndexedDbPersistence(db)
  } catch (err: any) {
    if (err.code === 'failed-precondition') {
      // If multi-tab is not supported, fall back to single-tab persistence
      try {
        await enableIndexedDbPersistence(db)
      } catch (singleTabErr: any) {
        console.warn('Error enabling single-tab persistence:', singleTabErr)
      }
    } else if (err.code === 'unimplemented') {
      console.warn('Browser does not support persistence')
    } else {
      console.error('Error initializing Firestore persistence:', err)
    }
  }
}

// Initialize persistence
initializeFirestore()

export { app, auth, db, storage }