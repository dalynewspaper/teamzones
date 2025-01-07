import { initializeApp, getApps } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { 
  getFirestore, 
  connectFirestoreEmulator,
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
  try {
    // Connect to Auth emulator
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
    console.log('✓ Auth emulator connected')
    
    // Connect to Firestore emulator
    connectFirestoreEmulator(db, '127.0.0.1', 8080)
    console.log('✓ Firestore emulator connected')
    
    // Connect to Storage emulator
    connectStorageEmulator(storage, '127.0.0.1', 9199)
    console.log('✓ Storage emulator connected')
    
    // Enable offline persistence for Firestore
    enableIndexedDbPersistence(db)
      .then(() => {
        console.log('✓ Firestore persistence enabled')
      })
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.')
        } else if (err.code === 'unimplemented') {
          console.warn('The current browser does not support persistence.')
        }
      })

    console.log('✓ All Firebase emulators connected successfully')
  } catch (error) {
    console.error('Error connecting to emulators:', error)
    console.log('Please ensure the Firebase emulators are running:')
    console.log('1. Run: firebase emulators:start')
    console.log('2. Verify emulators are running on:')
    console.log('   - Auth: 127.0.0.1:9099')
    console.log('   - Firestore: 127.0.0.1:8080')
    console.log('   - Storage: 127.0.0.1:9199')
  }
}

export { app, auth, db, storage }