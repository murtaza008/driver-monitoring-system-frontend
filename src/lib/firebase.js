import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase's Web SDK config — not a traditional secret (Google's own docs: it
// identifies the project, it doesn't gate access to it; that's what Firestore
// Security Rules + Firebase Auth do). Still pulled from env vars rather than
// hardcoded so it's not sitting as a literal string in new commits. Real access
// control for this key is an HTTP-referrer restriction set in Google Cloud
// Console, not something achievable from this file.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
