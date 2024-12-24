import { getDocuments, createDocument, updateDocument, addVideoToWeek } from './firestoreService';
import { uploadFile } from './storageService';
import type { Video, VideoUpdate } from '@/types/firestore';
import { VideoError } from '@/lib/errors';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getOrCreateWeek } from './weekService';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export async function getWeekVideos(weekId: string): Promise<Video[]> {
  return getDocuments<Video>('videos', {
    filters: [{
      field: 'weekId',
      operator: '==',
      value: weekId
    }],
    orderByField: 'createdAt',
    orderDirection: 'desc'
  });
}

export async function getUserVideos(userId: string): Promise<Video[]> {
  return getDocuments<Video>('videos', {
    filters: [{
      field: 'userId',
      operator: '==',
      value: userId
    }],
    orderByField: 'createdAt',
    orderDirection: 'desc'
  });
}

interface UploadProgressCallback {
  (progress: number): void
}

export async function uploadVideo(
  blob: Blob,
  weekId: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  try {
    // First ensure the week exists
    const week = await getOrCreateWeek(weekId);

    // Upload the video file
    const fileName = `${Date.now()}.webm`;
    const path = `videos/${weekId}/${fileName}`;
    const url = await uploadFile(blob, path, onProgress);

    // Create the video document
    const video: VideoUpdate = {
      id: fileName,
      url,
      createdAt: new Date().toISOString(),
      status: 'processing',
      weekId,
      duration: 0
    };

    // Add to week
    await addVideoToWeek(weekId, video);
  } catch (error) {
    console.error('Failed to upload video:', error);
    throw new VideoError(
      'Failed to upload video',
      'UPLOAD_FAILED',
      { originalError: error }
    );
  }
}

export async function updateVideoStatus(
  videoId: string,
  status: Video['status']
): Promise<void> {
  await updateDocument<Video>('videos', videoId, { status });
} 