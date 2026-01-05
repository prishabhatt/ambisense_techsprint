import { getFirebaseAuth } from '../firebase/admin.js';

/**
 * Firebase Authentication Middleware
 * Verifies ID token from Authorization header
 * Attaches decoded user info to req.user
 */
export async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Unauthorized: No token provided'
            });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const auth = getFirebaseAuth();
        
        // Verify the Firebase ID token
        const decodedToken = await auth.verifyIdToken(idToken);
        
        // Get custom claims for role
        const userRecord = await auth.getUser(decodedToken.uid);
        const role = userRecord.customClaims?.role || 'family';
        
        // Attach user info to request
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            role: role,
            ...(userRecord.customClaims || {})
        };
        
        next();
    } catch (error) {
        console.error('Authentication error:', error.message);
        
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({
                success: false,
                error: 'Token expired. Please log in again.'
            });
        }
        
        if (error.code === 'auth/id-token-revoked') {
            return res.status(401).json({
                success: false,
                error: 'Token revoked. Please log in again.'
            });
        }
        
        return res.status(401).json({
            success: false,
            error: 'Unauthorized: Invalid authentication token'
        });
    }
}
