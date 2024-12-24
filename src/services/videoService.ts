import { getDocuments, createDocument, updateDocument } from './firestoreService';
import { uploadFile } from './storageService';
import type { Video } from '@/types/firestore';
import { VideoError } from '@/lib/errors';

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

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export async function uploadVideo(file: File, userId: string, weekId: string) {
  try {
    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      throw new VideoError(
        'File size exceeds 100MB limit',
        'FILE_TOO_LARGE',
        { size: file.size, maxSize: MAX_FILE_SIZE }
      );
    }

    if (!file.type.startsWith('video/')) {
      throw new VideoError(
        'Invalid file type. Please upload a video file.',
        'INVALID_FILE_TYPE',
        { type: file.type }
      );
    }

    // Upload to Firebase Storage
    const path = `videos/${userId}/${weekId}/${Date.now()}-${file.name}`;
    const url = await uploadFile(file, path);

    // Create Firestore document
    const video: Omit<Video, 'id'> = {
      title: file.name,
      url,
      thumbnailUrl: '', // TODO: Generate thumbnail
      weekId,
      userId,
      status: 'processing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const videoId = await createDocument('videos', video);
    return { videoId, url };
  } catch (error) {
    console.error('Upload error:', error);
    if (error instanceof VideoError) {
      throw error;
    }
    throw new VideoError(
      'Failed to upload video. Please try again.',
      'UPLOAD_FAILED'
    );
  }
}

export async function updateVideoStatus(
  videoId: string,
  status: Video['status']
): Promise<void> {
  await updateDocument<Video>('videos', videoId, { status });
} 