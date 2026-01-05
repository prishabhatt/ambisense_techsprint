// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
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
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);