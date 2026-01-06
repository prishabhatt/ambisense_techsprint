import app from './app.js';
import 'dotenv/config';
import axios from 'axios'; // Tool to talk to bridge.py

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// NEW BRIDGE ROUTE: Connects your 1000+ line App.jsx to Python
app.get('/api/check-fall', async (req, res) => {
    try {
        const response = await axios.get('http://127.0.0.1:5000/predict', { timeout: 2000 });
        res.json({ success: true, alert: response.data.fall_detected });
    } catch (error) {
        // Safe fallback if bridge.py is offline
        res.json({ success: false, alert: false, error: "ML_OFFLINE" });
    }
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`
    🚀 ElderGuard Backend Server Started!
    =====================================
    🌐 Environment: ${NODE_ENV}
    🔗 Base URL: http://localhost:${PORT}
    🩺 Health Check: http://localhost:${PORT}/health
    📚 API Documentation:
        - Gemini API: POST /api/gemini/*
        - Medical: CRUD /api/medical
        - Alerts: GET/POST /api/alerts
        - Profile: GET/PUT /api/profile
    =====================================
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});