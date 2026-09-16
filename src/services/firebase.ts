import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, setLogLevel } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './firebaseConfig';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Suppress excessive backend retry logs in the browser console
try {
  setLogLevel('error');
} catch {
  // ignore
}

// Use initializeFirestore with experimentalForceLongPolling to maintain uninterrupted connectivity in iframes and reverse proxies
let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      experimentalForceLongPolling: true
    },
    firebaseConfig.firestoreDatabaseId || '(default)'
  );
} catch {
  // In case Firestore was already initialized
  firestoreInstance = (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)')
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
}

export const db = firestoreInstance;
export const storage = getStorage(app);

export default app;
