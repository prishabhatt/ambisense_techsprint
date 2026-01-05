import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Singleton instances
let auth = null;
let db = null;
let isInitialized = false;

/**
 * Initialize Firebase Admin SDK
 */
export function initializeFirebaseAdmin() {
    if (isInitialized) return { auth, db };
    
    if (getApps().length === 0) {
        try {
            // IMPORTANT: Private key needs proper newline handling
            const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
            
            if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PROJECT_ID) {
                throw new Error('Firebase environment variables are not properly set');
            }
            
            const app = initializeApp({
                credential: cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: privateKey,
                }),
            });
            
            auth = getAuth(app);
            db = getFirestore(app);
            isInitialized = true;
            
            console.log('✅ Firebase Admin SDK initialized successfully');
            console.log(`📁 Project: ${process.env.FIREBASE_PROJECT_ID}`);
            console.log(`📧 Service Account: ${process.env.FIREBASE_CLIENT_EMAIL}`);
            
            return { auth, db };
        } catch (error) {
            console.error('❌ Firebase Admin initialization failed:', error.message);
            console.error('Check your .env file for correct Firebase credentials');
            process.exit(1);
        }
    }
    
    return { auth, db };
}

/**
 * Get Firebase Auth instance
 */
export function getFirebaseAuth() {
    if (!isInitialized) {
        throw new Error('Firebase Admin not initialized. Call initializeFirebaseAdmin() first.');
    }
    return auth;
}

/**
 * Get Firestore DB instance
 */
export function getFirestoreDB() {
    if (!isInitialized) {
        throw new Error('Firebase Admin not initialized. Call initializeFirebaseAdmin() first.');
    }
    return db;
}

// Export initialization status
export function isFirebaseInitialized() {
    return isInitialized;
}