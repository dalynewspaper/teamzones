import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  type DocumentData,
  type QueryDocumentSnapshot,
  type WhereFilterOp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BaseDocument } from '@/types/firestore';

export class FirestoreError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'FirestoreError';
  }
}

// Helper function to convert Firestore document to typed object
function convertDoc<T extends BaseDocument>(doc: QueryDocumentSnapshot<DocumentData>): T {
  return {
    id: doc.id,
    ...doc.data()
  } as T;
}

interface QueryFilter {
  field: string;
  operator: WhereFilterOp;
  value: any;
}

interface QueryOptions {
  filters?: QueryFilter[];
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
}

export async function getDocuments<T extends BaseDocument>(
  collectionName: string,
  options: QueryOptions = {}
): Promise<T[]> {
  try {
    const collectionRef = collection(db, collectionName);
    let q = query(collectionRef);

    // Apply filters
    if (options.filters) {
      options.filters.forEach(filter => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });
    }

    // Apply ordering
    if (options.orderByField) {
      q = query(q, orderBy(options.orderByField, options.orderDirection || 'desc'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => convertDoc<T>(doc));
  } catch (error: any) {
    console.error('Firestore error:', error);
    throw new FirestoreError(
      error.message || 'Failed to fetch documents',
      error.code || 'FETCH_ERROR'
    );
  }
}

export async function getDocument<T extends BaseDocument>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as T;
    }
    
    return null;
  } catch (error: any) {
    console.error('Firestore error:', error);
    throw new FirestoreError(
      error.message || 'Failed to fetch document',
      error.code || 'FETCH_ERROR'
    );
  }
}

export async function createDocument<T extends Omit<BaseDocument, 'id'>>(
  collectionName: string,
  data: T
): Promise<string> {
  try {
    const docRef = doc(collection(db, collectionName));
    const timestamp = new Date().toISOString();
    
    await setDoc(docRef, {
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    
    return docRef.id;
  } catch (error: any) {
    console.error('Firestore error:', error);
    throw new FirestoreError(
      error.message || 'Failed to create document',
      error.code || 'CREATE_ERROR'
    );
  }
}

// Add this type to handle document updates
export type UpdateData<T> = {
  [P in keyof T]?: T[P] extends object ? Partial<T[P]> : T[P];
};

// Update the updateDocument function to handle generic types
export async function updateDocument<T extends BaseDocument>(
  collectionName: string,
  docId: string,
  data: UpdateData<T>
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Firestore error:', error);
    throw new FirestoreError(
      error.message || 'Failed to update document',
      error.code || 'UPDATE_ERROR'
    );
  }
}

export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (error: any) {
    console.error('Firestore error:', error);
    throw new FirestoreError(
      error.message || 'Failed to delete document',
      error.code || 'DELETE_ERROR'
    );
  }
} 