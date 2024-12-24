import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

// Add this at the top of your error handling
if (!db) {
  throw new Error('Firestore is not initialized. Make sure your Firebase config is correct.');
}

// Helper function to convert Firestore document to typed object
export const convertDoc = <T>(doc: QueryDocumentSnapshot<DocumentData>): T => {
  return {
    id: doc.id,
    ...doc.data()
  } as T;
};

// Generic CRUD operations
export const createDocument = async <T extends Record<string, any>>(
  collectionName: string,
  data: T
): Promise<string> => {
  const docRef = doc(collection(db, collectionName));
  
  await setDoc(docRef, {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  return docRef.id;
};

export const getDocuments = async <T>(
  collectionName: string,
  whereClause?: { field: string; operator: any; value: any }
) => {
  const collectionRef = collection(db, collectionName);
  const q = whereClause 
    ? query(collectionRef, where(whereClause.field, whereClause.operator, whereClause.value))
    : collectionRef;
    
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => convertDoc<T>(doc));
};

export const deleteDocument = async (collectionName: string, docId: string) => {
  await deleteDoc(doc(db, collectionName, docId));
};