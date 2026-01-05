/**
 * Role-based Access Control Middleware
 * Enforces permissions based on user role
 * 
 * caregiver: Full CRUD access
 * family: Read-only access
 */
export function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const userRole = req.user.role;
        
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                error: `Forbidden: ${userRole} role cannot perform this action`
            });
        }
        
        next();
    };
}

// Convenience middleware for common role checks
export const requireCaregiver = requireRole(['caregiver']);
export const requireFamilyOrCaregiver = requireRole(['family', 'caregiver']);
