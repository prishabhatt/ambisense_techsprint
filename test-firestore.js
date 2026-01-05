// test-firestore.js
import 'dotenv/config';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize with your credentials
const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
const app = initializeApp({
    credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
    }),
});

const db = getFirestore(app);

async function checkFirestoreData() {
    console.log('🔍 Checking Firestore data...\n');
    
    try {
        // Check all collections
        const collections = await db.listCollections();
        console.log(`📚 Found ${collections.length} collections:`);
        
        for (const collection of collections) {
            console.log(`\n=== Collection: ${collection.id} ===`);
            
            const snapshot = await collection.get();
            console.log(`   Documents: ${snapshot.size}`);
            
            snapshot.forEach(doc => {
                const data = doc.data();
                console.log(`   📄 ${doc.id}:`);
                console.log(`      Created: ${data.createdAt?.toDate?.() || 'No date'}`);
                if (data.note) console.log(`      Note: ${data.note.substring(0, 50)}...`);
                if (data.userId) console.log(`      User: ${data.userId}`);
            });
        }
        
        // Count total documents
        let totalDocs = 0;
        for (const collection of collections) {
            const snapshot = await collection.get();
            totalDocs += snapshot.size;
        }
        
        console.log(`\n📊 Total documents across all collections: ${totalDocs}`);
        
        if (totalDocs === 0) {
            console.log('\n⚠️  No data found! Create some test data:');
            console.log('   curl -X POST http://localhost:3001/api/medical \\');
            console.log('     -H "Content-Type: application/json" \\');
            console.log('     -d \'{"note":"Test data"}\'');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkFirestoreData();
