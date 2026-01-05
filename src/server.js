import app from './app.js';
import 'dotenv/config';

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

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
