// firebase.ts
// FIX: Use v8 compat imports
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCsj7PlvlrYoh6h1GqCR3xaxJHH8k5_a9o",
  authDomain: "sunball-dd7a9.firebaseapp.com",
  projectId: "sunball-dd7a9",
  storageBucket: "sunball-dd7a9.firebasestorage.app",
  messagingSenderId: "537915168873",
  appId: "1:537915168873:web:243fcb0e3dec37c6d86af8",
  measurementId: "G-W4LYZBLHRN"
};

// FIX: Use v8 compat initialization
const app = firebase.initializeApp(firebaseConfig);

export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();

// Set persistence to 'NONE' (inMemoryPersistence for v9) to support sandboxed environments.
// FIX: Use v8 compat syntax for persistence
auth.setPersistence(firebase.auth.Auth.Persistence.NONE)
    .catch((error) => {
        console.error("Firebase Auth persistence error:", error);
    });