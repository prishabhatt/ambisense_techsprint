import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireFamilyOrCaregiver, requireCaregiver } from '../middleware/role.js';

const router = express.Router();

// All medical routes require authentication
router.use(authenticate);

// Lazy load the controller
let medicalController;

async function getMedicalController() {
    if (!medicalController) {
        const module = await import('../controllers/medical.controller.js');
        medicalController = module.medicalController;
    }
    return medicalController;
}

// Routes
router.get('/', requireFamilyOrCaregiver, async (req, res) => {
    const controller = await getMedicalController();
    return controller.getAllLogs(req, res);
});

router.post('/', requireCaregiver, async (req, res) => {
    const controller = await getMedicalController();
    return controller.createLog(req, res);
});

router.put('/:id', requireCaregiver, async (req, res) => {
    const controller = await getMedicalController();
    return controller.updateLog(req, res);
});

router.delete('/:id', requireCaregiver, async (req, res) => {
    const controller = await getMedicalController();
    return controller.deleteLog(req, res);
});

export default router;
