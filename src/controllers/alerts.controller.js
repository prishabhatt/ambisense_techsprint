// import { getFirestoreDB } from '../firebase/admin.js';
// In ALL controller files (gemini.controller.js, medical.controller.js, etc.)
import { getFirestoreDB, getFirebaseAuth } from '../firebase/admin.js';

// Helper function that gets Firebase instances when needed
function getFirebase() {
    return {
        db: getFirestoreDB(),
        auth: getFirebaseAuth()
    };
}

// Then use it in each method:
async function someMethod(req, res) {
    try {
        const { db } = getFirebase(); // Get DB instance here, not at top level
        // ... rest of your code
    } catch (error) {
        // Handle error
    }
}


const ALERTS_COLLECTION = 'alerts';
const POSTURE_COLLECTION = 'posture_status';

// Add helper function to ensure Firebase is initialized
function ensureFirebase() {
    return getFirestoreDB(); // This will throw if not initialized
}

/**
 * Alerts and Posture Controller
 * Handles alerts and posture monitoring data
 */
export const alertsController = {
    /**
     * Get all alerts for the authenticated user
     * GET /api/alerts
     */
    async getAlerts(req, res) {
        try {
            const db = ensureFirebase(); // Get DB instance
            const userId = req.user.uid;
            
            const alertsSnapshot = await db.collection(ALERTS_COLLECTION)
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();
            
            const alerts = [];
            alertsSnapshot.forEach(doc => {
                alerts.push({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate().toISOString() || null
                });
            });
            
            res.json({
                success: true,
                data: alerts,
                count: alerts.length
            });
        } catch (error) {
            console.error('Get alerts error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve alerts'
            });
        }
    },

    // ... rest of your code ...
};
