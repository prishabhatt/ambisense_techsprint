import { getFirestoreDB } from '../firebase/admin.js';
// In ALL controller files (gemini.controller.js, medical.controller.js, etc.)
// import { getFirestoreDB, getFirebaseAuth } from '../firebase/admin.js';

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


const MEDICAL_LOGS_COLLECTION = 'medical_logs';

// Add helper function to ensure Firebase is initialized
function ensureFirebase() {
    return getFirestoreDB();
}

/**
 * Medical Records Controller
 */
const medicalController = {
    async getAllLogs(req, res) {
        try {
            const db = ensureFirebase();
            const userId = req.user.uid;
            
            const logsSnapshot = await db.collection(MEDICAL_LOGS_COLLECTION)
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .get();
            
            const logs = [];
            logsSnapshot.forEach(doc => {
                logs.push({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate().toISOString() || null
                });
            });
            
            res.json({
                success: true,
                data: logs,
                count: logs.length
            });
        } catch (error) {
            console.error('Get medical logs error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve medical logs'
            });
        }
    },

    async createLog(req, res) {
        try {
            const db = ensureFirebase();
            const userId = req.user.uid;
            const { note } = req.body;
            
            if (!note || typeof note !== 'string' || note.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Note is required and cannot be empty'
                });
            }

            const medicalLog = {
                userId: userId,
                note: note.trim(),
                author: req.user.email,
                role: req.user.role,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const docRef = await db.collection(MEDICAL_LOGS_COLLECTION).add(medicalLog);
            
            res.status(201).json({
                success: true,
                data: {
                    id: docRef.id,
                    ...medicalLog,
                    createdAt: medicalLog.createdAt.toISOString(),
                    updatedAt: medicalLog.updatedAt.toISOString()
                },
                message: 'Medical log created successfully'
            });
        } catch (error) {
            console.error('Create medical log error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create medical log'
            });
        }
    },

    async updateLog(req, res) {
        try {
            const db = ensureFirebase();
            const userId = req.user.uid;
            const logId = req.params.id;
            const { note } = req.body;
            
            if (!note || typeof note !== 'string' || note.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Note is required and cannot be empty'
                });
            }

            const logRef = db.collection(MEDICAL_LOGS_COLLECTION).doc(logId);
            const logDoc = await logRef.get();
            
            if (!logDoc.exists) {
                return res.status(404).json({
                    success: false,
                    error: 'Medical log not found'
                });
            }
            
            const logData = logDoc.data();
            if (logData.userId !== userId) {
                return res.status(403).json({
                    success: false,
                    error: 'Not authorized to update this medical log'
                });
            }

            const updates = {
                note: note.trim(),
                updatedAt: new Date()
            };

            await logRef.update(updates);
            
            res.json({
                success: true,
                data: {
                    id: logId,
                    ...updates,
                    updatedAt: updates.updatedAt.toISOString()
                },
                message: 'Medical log updated successfully'
            });
        } catch (error) {
            console.error('Update medical log error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update medical log'
            });
        }
    },

    async deleteLog(req, res) {
        try {
            const db = ensureFirebase();
            const userId = req.user.uid;
            const logId = req.params.id;

            const logRef = db.collection(MEDICAL_LOGS_COLLECTION).doc(logId);
            const logDoc = await logRef.get();
            
            if (!logDoc.exists) {
                return res.status(404).json({
                    success: false,
                    error: 'Medical log not found'
                });
            }
            
            const logData = logDoc.data();
            if (logData.userId !== userId) {
                return res.status(403).json({
                    success: false,
                    error: 'Not authorized to delete this medical log'
                });
            }

            await logRef.delete();
            
            res.json({
                success: true,
                message: 'Medical log deleted successfully'
            });
        } catch (error) {
            console.error('Delete medical log error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete medical log'
            });
        }
    }
};

export { medicalController };
