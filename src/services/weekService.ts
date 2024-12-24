import { db } from '@/lib/firebase'
import { collection, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import type { Week, VideoUpdate } from '@/types/firestore'
import { getWeekDates } from '@/lib/date'

export async function getOrCreateWeek(weekId: string): Promise<Week> {
  const weekRef = doc(db, 'weeks', weekId);
  const weekDoc = await getDoc(weekRef);

  if (!weekDoc.exists()) {
    const { start, end } = getWeekDates(weekId);
    const newWeek: Week = {
      id: weekId,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      status: 'active',
      videos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(weekRef, newWeek);
    return newWeek;
  }

  return {
    ...weekDoc.data(),
    id: weekDoc.id
  } as Week;
}

export async function addVideoToWeek(weekId: string, video: VideoUpdate): Promise<void> {
  try {
    const weekRef = doc(db, 'weeks', weekId);
    const weekDoc = await getDoc(weekRef);
    
    if (!weekDoc.exists()) {
      // Create the week if it doesn't exist
      const { start, end } = getWeekDates(weekId);
      const newWeek: Week = {
        id: weekId,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        status: 'active',
        videos: [video],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(weekRef, newWeek);
    } else {
      // Update existing week
      const week = weekDoc.data() as Week;
      const videos = [...(week.videos || []), video];
      
      await updateDoc(weekRef, {
        videos,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error adding video to week:', error);
    throw error;
  }
}

export async function updateVideoInWeek(
  weekId: string, 
  videoId: string, 
  updates: Partial<VideoUpdate>
): Promise<void> {
  const weekRef = doc(db, 'weeks', weekId)
  const weekDoc = await getDoc(weekRef)

  if (!weekDoc.exists()) {
    throw new Error('Week not found')
  }

  const week = weekDoc.data() as Week
  const videos = week.videos.map(v => 
    v.id === videoId ? { ...v, ...updates } : v
  )

  await updateDoc(weekRef, {
    videos,
    updatedAt: new Date().toISOString()
  })
} 