// import { getFirestoreDB, getFirebaseAuth } from '../firebase/admin.js';

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

const USERS_COLLECTION = 'users';

// Add helper function to ensure Firebase is initialized
function ensureFirebase() {
    const db = getFirestoreDB();
    const auth = getFirebaseAuth();
    return { db, auth };
}

/**
 * Profile and Settings Controller
 * Handles user profile and system settings
 */
export const profileController = {
    /**
     * Get user profile
     * GET /api/profile
     */
    async getProfile(req, res) {
        try {
            const { db } = ensureFirebase(); // Get DB instance
            const userId = req.user.uid;
            
            const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();
            
            if (!userDoc.exists) {
                // Create default profile if doesn't exist
                const defaultProfile = {
                    uid: userId,
                    email: req.user.email,
                    role: req.user.role,
                    postureTracking: true,
                    alertDispatch: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                
                await db.collection(USERS_COLLECTION).doc(userId).set(defaultProfile);
                
                return res.json({
                    success: true,
                    data: {
                        ...defaultProfile,
                        createdAt: defaultProfile.createdAt.toISOString(),
                        updatedAt: defaultProfile.updatedAt.toISOString()
                    }
                });
            }
            
            const userData = userDoc.data();
            
            res.json({
                success: true,
                data: {
                    ...userData,
                    createdAt: userData.createdAt?.toDate().toISOString() || null,
                    updatedAt: userData.updatedAt?.toDate().toISOString() || null
                }
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve profile'
            });
        }
    },

    // ... rest of your code ...
};
