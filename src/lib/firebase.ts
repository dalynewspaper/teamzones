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
let app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
let auth = getAuth(app)
let db = getFirestore(app)
let storage = getStorage(app)

// Connect to emulators in development
if (process.env.NODE_ENV === 'development') {
  try {
    // Connect to Auth emulator first
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
    
    // Then connect to Firestore emulator
    connectFirestoreEmulator(db, 'localhost', 8089)
    
    // Finally connect to Storage emulator
    connectStorageEmulator(storage, 'localhost', 9199)
    
    // Reinitialize Firebase with emulator settings
    app = getApps()[0]
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)
    
    console.log('Successfully connected to Firebase emulators')
  } catch (error) {
    console.error('Error connecting to emulators:', error)
  }
}

// Skip persistence in development/emulator mode
if (process.env.NODE_ENV !== 'development') {
  // Configure Firestore for offline persistence
  const initializeFirestore = async () => {
    try {
      // Try enabling multi-tab persistence first
      await enableMultiTabIndexedDbPersistence(db)
      console.log('Multi-tab persistence enabled')
    } catch (err: any) {
      if (err.code === 'failed-precondition') {
        // If multi-tab is not supported, fall back to single-tab persistence
        try {
          await enableIndexedDbPersistence(db)
          console.log('Single-tab persistence enabled')
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
}

export { app, auth, db, storage }