import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireFamilyOrCaregiver } from '../middleware/role.js';

const router = express.Router();

// All Gemini routes require authentication
router.use(authenticate);

// Lazy load the controller
let geminiController;

async function getGeminiController() {
    if (!geminiController) {
        const module = await import('../controllers/gemini.controller.js');
        geminiController = module.geminiController;
    }
    return geminiController;
}

// Routes
router.post('/research', requireFamilyOrCaregiver, async (req, res) => {
    const controller = await getGeminiController();
    return controller.research(req, res);
});

router.post('/summarize', requireFamilyOrCaregiver, async (req, res) => {
    const controller = await getGeminiController();
    return controller.summarize(req, res);
});

router.post('/tts', requireFamilyOrCaregiver, async (req, res) => {
    const controller = await getGeminiController();
    return controller.textToSpeech(req, res);
});

export default router;
