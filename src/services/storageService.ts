import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadCandidatePhoto(file: File, candidateName: string): Promise<string> {
  try {
    const timestamp = Date.now();
    const sanitizedName = candidateName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const storagePath = `candidates/${sanitizedName}_${timestamp}.${fileExtension}`;
    const storageRef = ref(storage, storagePath);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.warn('Firebase Storage upload failed or not enabled, falling back to local file reader:', error);
    // Fallback: Convert to Base64 data URI so user is not blocked if Storage bucket needs cors or permissions
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }
}
