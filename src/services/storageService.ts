import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { StorageError } from '@/lib/errors';

export async function uploadFile(
  blob: Blob,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, blob);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(progress);
        },
        (error) => reject(error),
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error: any) {
    console.error('Storage error:', error);
    throw new StorageError(
      'Failed to upload file',
      'UPLOAD_FAILED',
      { originalError: error }
    );
  }
}

export const getFileUrl = async (path: string): Promise<string> => {
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
}; 