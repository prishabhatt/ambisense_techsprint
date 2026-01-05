import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireFamilyOrCaregiver, requireCaregiver } from '../middleware/role.js';

const router = express.Router();

// All alerts routes require authentication
router.use(authenticate);

// Lazy load the controller
let alertsController;

async function getAlertsController() {
    if (!alertsController) {
        const module = await import('../controllers/alerts.controller.js');
        alertsController = module.alertsController;
    }
    return alertsController;
}

// Routes
router.get('/', requireFamilyOrCaregiver, async (req, res) => {
    const controller = await getAlertsController();
    return controller.getAlerts(req, res);
});

router.post('/', requireCaregiver, async (req, res) => {
    const controller = await getAlertsController();
    return controller.createAlert(req, res);
});

router.get('/posture/current', requireFamilyOrCaregiver, async (req, res) => {
    const controller = await getAlertsController();
    return controller.getCurrentPosture(req, res);
});

router.put('/:id/acknowledge', requireCaregiver, async (req, res) => {
    const controller = await getAlertsController();
    return controller.acknowledgeAlert(req, res);
});

export default router;
