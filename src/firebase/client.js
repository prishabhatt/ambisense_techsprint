import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';

// ⚠️ REPLACE THIS WITH YOUR ACTUAL FIREBASE CONFIG FROM CONSOLE
// Get it from: Firebase Console → Project Settings → Your apps → Web app
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA0HcgodzQf8kviyF-4N2wKWr1OV2fc_Go",
  authDomain: "elderguard-project.firebaseapp.com",
  projectId: "elderguard-project",
  storageBucket: "elderguard-project.firebasestorage.app",
  messagingSenderId: "1057017882458",
  appId: "1:1057017882458:web:e0937d0012843200a37563",
  measurementId: "G-ZT9MLRGKMJ"
};

// Initialize Firebase
let app;
let auth;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  
  // Fallback for development
  app = { name: 'firebase-app' };
  auth = { 
    currentUser: null,
    signInWithEmailAndPassword: async () => { 
      throw new Error('Firebase not configured'); 
    },
    signOut: async () => {},
    onAuthStateChanged: () => () => {}
  };
}

export { 
  auth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
};
