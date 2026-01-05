// test-fix.js
import 'dotenv/config';
import express from 'express';

const app = express();
app.use(express.json());

// Test the lazy import pattern
app.get('/test-lazy-import', async (req, res) => {
    try {
        // Dynamically import a controller
        const module = await import('./src/controllers/medical.controller.js');
        const controller = module.medicalController;
        
        res.json({
            success: true,
            controllerType: typeof controller,
            hasGetAllLogs: typeof controller.getAllLogs,
            hasCreateLog: typeof controller.createLog,
            message: 'Lazy import works!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

app.listen(3003, () => {
    console.log('Test server on http://localhost:3003');
    console.log('Test endpoint: http://localhost:3003/test-lazy-import');
});
