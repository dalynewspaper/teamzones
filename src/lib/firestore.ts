import { db } from './firebase'
import { 
  collection, 
  addDoc, 
  Timestamp,
  query,
  where,
  orderBy,
  getDocs
} from 'firebase/firestore'
import type { Video, Week } from '@/types/firestore'

export async function addVideoToFirestore(video: Omit<Video, 'id'>) {
  try {
    const videosRef = collection(db, 'videos')
    const docData = {
      ...video,
      createdAt: Timestamp.fromDate(new Date(video.createdAt)),
      updatedAt: Timestamp.now()
    }
    
    const docRef = await addDoc(videosRef, docData)
    return docRef.id
  } catch (error) {
    console.error('Firestore error:', error)
    throw error
  }
}

export async function getWeekVideos(weekId: string, userId: string) {
  try {
    const videosRef = collection(db, 'videos')
    const q = query(
      videosRef,
      where('weekId', '==', weekId),
      where(
        'isPublic', 
        '==', 
        true
      ),
      orderBy('createdAt', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Video[]
  } catch (error) {
    console.error('Error fetching videos:', error)
    throw error
  }
}

export async function getWeekData(weekId: string) {
  try {
    const weeksRef = collection(db, 'weeks')
    const q = query(weeksRef, where('id', '==', weekId))
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      return null
    }
    
    return {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data()
    } as Week
  } catch (error) {
    console.error('Error fetching week:', error)
    throw error
  }
}