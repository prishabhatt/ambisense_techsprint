// // import express from 'express';
// // import cors from 'cors';
// // import helmet from 'helmet';
// // import morgan from 'morgan';
// // import rateLimit from 'express-rate-limit';
// // import 'dotenv/config';


// // // 🔥 IMPORTANT: Initialize Firebase FIRST before importing controllers
// // import { initializeFirebaseAdmin } from './firebase/admin.js';
// // initializeFirebaseAdmin();

// // // Import routes (AFTER Firebase initialization)
// // import geminiRoutes from './routes/gemini.routes.js';
// // import medicalRoutes from './routes/medical.routes.js';
// // import alertsRoutes from './routes/alerts.routes.js';
// // import profileRoutes from './routes/profile.routes.js';

// // const app = express();
// import express from 'express';
// import cors from 'cors';
// import helmet from 'helmet';
// import morgan from 'morgan';
// import rateLimit from 'express-rate-limit';
// import 'dotenv/config';

// console.log('🔧 Step 1: Loading environment variables...');

// // 🔥 IMPORTANT: Initialize Firebase FIRST before importing controllers
// import { initializeFirebaseAdmin } from './firebase/admin.js';
// console.log('🔧 Step 2: Initializing Firebase Admin SDK...');
// initializeFirebaseAdmin();

// console.log('🔧 Step 3: Importing routes...');
// // Import routes (AFTER Firebase initialization)
// import geminiRoutes from './routes/gemini.routes.js';
// import medicalRoutes from './routes/medical.routes.js';
// import alertsRoutes from './routes/alerts.routes.js';
// import profileRoutes from './routes/profile.routes.js';

// console.log('🔧 Step 4: Creating Express app...');
// const app = express();

// // ... rest of your app.js code remains the same ...

// // Security middleware
// app.use(helmet({
//     contentSecurityPolicy: {
//         directives: {
//             defaultSrc: ["'self'"],
//             styleSrc: ["'self'", "'unsafe-inline'"],
//             scriptSrc: ["'self'"],
//             imgSrc: ["'self'", "data:", "https:"],
//             connectSrc: ["'self'", process.env.CORS_ORIGIN]
//         }
//     },
//     crossOriginEmbedderPolicy: false
// }));

// // CORS configuration
// app.use(cors({
//     origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization']
// }));

// // Rate limiting
// const limiter = rateLimit({
//     windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
//     max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
//     message: {
//         success: false,
//         error: 'Too many requests from this IP, please try again later.'
//     },
//     standardHeaders: true,
//     legacyHeaders: false
// });

// app.use(limiter);

// // Body parsing middleware
// app.use(express.json({ limit: '10mb' }));
// app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// // Request logging
// app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// // Health check endpoint
// app.get('/health', (req, res) => {
//     res.json({
//         success: true,
//         message: 'ElderGuard Backend is running',
//         timestamp: new Date().toISOString(),
//         environment: process.env.NODE_ENV,
//         version: '1.0.0',
//         firebase: 'initialized'
//     });
// });

// // API routes
// app.use('/api/gemini', geminiRoutes);
// app.use('/api/medical', medicalRoutes);
// app.use('/api/alerts', alertsRoutes);
// app.use('/api/profile', profileRoutes);

// // 404 handler
// app.use('*', (req, res) => {
//     res.status(404).json({
//         success: false,
//         error: `Route ${req.originalUrl} not found`
//     });
// });

// // Global error handler
// app.use((err, req, res, next) => {
//     console.error('Unhandled error:', err);
    
//     const statusCode = err.statusCode || 500;
//     const message = process.env.NODE_ENV === 'production' 
//         ? 'Internal server error' 
//         : err.message || 'Internal server error';
    
//     res.status(statusCode).json({
//         success: false,
//         error: message
//     });
// });

// export default app;



import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';

console.log('🔧 Initializing Firebase Admin SDK...');

// 🔥 IMPORTANT: Initialize Firebase FIRST before importing anything else
import { initializeFirebaseAdmin } from './firebase/admin.js';
initializeFirebaseAdmin();

console.log('✅ Firebase initialized. Setting up Express app...');

const app = express();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", process.env.CORS_ORIGIN]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'ElderGuard Backend is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: '1.0.0',
        firebase: 'initialized'
    });
});

// Import and use routes (they use lazy loading)
console.log('🔧 Setting up API routes...');
import geminiRoutes from './routes/gemini.routes.js';
import medicalRoutes from './routes/medical.routes.js';
import alertsRoutes from './routes/alerts.routes.js';
import profileRoutes from './routes/profile.routes.js';

app.use('/api/gemini', geminiRoutes);
app.use('/api/medical', medicalRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/profile', profileRoutes);

console.log('✅ Routes configured');

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: `Route ${req.originalUrl} not found`
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message || 'Internal server error';
    
    res.status(statusCode).json({
        success: false,
        error: message
    });
});

export default app;
