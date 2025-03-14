import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let firebase_app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize services
export const auth = getAuth(firebase_app);
export const db = getFirestore(firebase_app);
export const storage = getStorage(firebase_app);

// Initialize Analytics conditionally (only in browser)
export const initializeAnalytics = async () => {
  if (typeof window !== 'undefined') {
    const isAnalyticsSupported = await isSupported();
    if (isAnalyticsSupported) {
      return getAnalytics(firebase_app);
    }
  }
  return null;
};

export default firebase_app;
