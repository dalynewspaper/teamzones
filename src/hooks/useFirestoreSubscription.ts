import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  QueryConstraint, 
  DocumentData,
  DocumentReference,
  CollectionReference
} from 'firebase/firestore';

export function useFirestoreSubscription<T>(
  path: string,
  queryConstraints?: QueryConstraint[],
  isCollection = true
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    
    try {
      const ref = isCollection 
        ? collection(db, path)
        : doc(db, path);
      
      const unsubscribe = isCollection
        ? onSnapshot(
            queryConstraints ? query(ref as CollectionReference<DocumentData>, ...queryConstraints) : ref as CollectionReference<DocumentData>,
            (snapshot) => {
              const items = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              setData(items as T);
              setLoading(false);
            },
            (err: Error) => {
              setError(err);
              setLoading(false);
            }
          )
        : onSnapshot(
            ref as DocumentReference<DocumentData>,
            (snapshot) => {
              if (snapshot.exists()) {
                setData({ id: snapshot.id, ...snapshot.data() } as T);
              } else {
                setData(null);
              }
              setLoading(false);
            },
            (err: Error) => {
              setError(err);
              setLoading(false);
            }
          );

      return () => {
        unsubscribe();
      };
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  }, [path, JSON.stringify(queryConstraints), isCollection]);

  return { data, loading, error };
} 