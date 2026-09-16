import appletConfig from '../../firebase-applet-config.json';

const getEnvVar = (key: string): string | undefined => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta && import.meta.env) {
      return (import.meta.env as any)[key];
    }
  } catch {
    // ignore
  }
  return undefined;
};

// Support both Netlify / Vite environment variables and the local applet configuration
export const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY') || appletConfig.apiKey || '',
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN') || appletConfig.authDomain || '',
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID') || appletConfig.projectId || '',
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET') || appletConfig.storageBucket || '',
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID') || appletConfig.messagingSenderId || '',
  appId: getEnvVar('VITE_FIREBASE_APP_ID') || appletConfig.appId || '',
  firestoreDatabaseId: getEnvVar('VITE_FIREBASE_FIRESTORE_DATABASE_ID') || appletConfig.firestoreDatabaseId || '(default)'
};

export default firebaseConfig;
