import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { VideoError } from '@/lib/errors';

export async function uploadFile(file: File, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error: any) {
    console.error('Storage error:', error);
    throw new VideoError(
      'Failed to upload file to storage',
      'UPLOAD_FAILED',
      { originalError: error }
    );
  }
} 