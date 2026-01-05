import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireFamilyOrCaregiver, requireCaregiver } from '../middleware/role.js';

const router = express.Router();

// All profile routes require authentication
router.use(authenticate);

// Lazy load the controller
let profileController;

async function getProfileController() {
    if (!profileController) {
        const module = await import('../controllers/profile.controller.js');
        profileController = module.profileController;
    }
    return profileController;
}

// Routes
router.get('/', requireFamilyOrCaregiver, async (req, res) => {
    const controller = await getProfileController();
    return controller.getProfile(req, res);
});

router.put('/settings', requireCaregiver, async (req, res) => {
    const controller = await getProfileController();
    return controller.updateSettings(req, res);
});

router.get('/system-status', requireFamilyOrCaregiver, async (req, res) => {
    const controller = await getProfileController();
    return controller.getSystemStatus(req, res);
});

router.post('/sos', requireFamilyOrCaregiver, async (req, res) => {
    const controller = await getProfileController();
    return controller.triggerSOS(req, res);
});

export default router;
