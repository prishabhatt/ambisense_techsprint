// test-firebase.js
import 'dotenv/config';
import { initializeFirebaseAdmin, getFirestoreDB, getFirebaseAuth } from './src/firebase/admin.js';

async function testFirebase() {
    console.log('🧪 Testing Firebase Admin SDK initialization...');
    
    // Check environment variables
    console.log('📋 Environment variables check:');
    console.log('  FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing');
    console.log('  FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing');
    console.log('  FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY ? '✅ Set (length: ' + process.env.FIREBASE_PRIVATE_KEY.length + ')' : '❌ Missing');
    
    try {
        // Initialize Firebase
        const { auth, db } = initializeFirebaseAdmin();
        
        console.log('\n✅ Firebase Admin SDK initialized successfully!');
        console.log('  🔥 Auth instance:', auth ? 'Available' : 'Missing');
        console.log('  📁 Firestore instance:', db ? 'Available' : 'Missing');
        
        // Test Firestore connection
        console.log('\n🧪 Testing Firestore connection...');
        const collections = await db.listCollections();
        console.log(`  📚 Collections count: ${collections.length}`);
        
        // Test Auth connection
        console.log('\n🧪 Testing Auth connection...');
        console.log('  👤 Auth app name:', auth.app.name);
        
        console.log('\n🎉 All Firebase tests passed!');
        
    } catch (error) {
        console.error('\n❌ Firebase test failed:', error.message);
        console.error('Stack:', error.stack);
        
        // Check for specific errors
        if (error.message.includes('private key')) {
            console.error('\n💡 TIP: Check that FIREBASE_PRIVATE_KEY in .env has proper \\n newline characters.');
        }
    }
}

testFirebase();
