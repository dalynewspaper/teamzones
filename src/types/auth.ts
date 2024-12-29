import { User as FirebaseUser } from 'firebase/auth'

export interface ExtendedUser extends FirebaseUser {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  organizationId?: string
  organizationOwnerId?: string
} 