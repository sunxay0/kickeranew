// firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, inMemoryPersistence } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCsj7PlvlrYoh6h1GqCR3xaxJHH8k5_a9o",
  authDomain: "sunball-dd7a9.firebaseapp.com",
  projectId: "sunball-dd7a9",
  storageBucket: "sunball-dd7a9.firebasestorage.app",
  messagingSenderId: "537915168873",
  appId: "1:537915168873:web:243fcb0e3dec37c6d86af8",
  measurementId: "G-W4LYZBLHRN"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Firestore settings applied during initialization to enable long polling and in-memory caching
// for sandboxed environments. This prevents the client from incorrectly going offline.
export const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    localCache: memoryLocalCache({}),
    useFetchStreams: false, // Disable fetch streams for maximum compatibility
});

export const storage = getStorage(app);

// Set persistence to 'NONE' (inMemoryPersistence for v9) to support sandboxed environments.
setPersistence(auth, inMemoryPersistence)
    .catch((error) => {
        console.error("Firebase Auth persistence error:", error);
    });
