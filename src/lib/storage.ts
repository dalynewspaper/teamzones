import { storage } from './firebase'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'

export async function uploadVideo(
  file: Blob,
  path: string,
  onProgress: (progress: number) => void
): Promise<string> {
  const storageRef = ref(storage, path)
  const uploadTask = uploadBytesResumable(storageRef, file)

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        onProgress(progress)
      },
      (error) => {
        reject(error)
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
        resolve(downloadURL)
      }
    )
  })
} 