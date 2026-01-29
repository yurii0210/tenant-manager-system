/**
 * REALTYSYSTEM API SERVER
 * Tech Stack: Node.js, Express, PostgreSQL
 */

const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// ENV
dotenv.config();

// Local imports
const pool = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const meterRoutes = require('./routes/meterRoutes');

// ENV check
if (!process.env.DB_HOST && !process.env.DATABASE_URL) {
    console.error('❌ КРИТИЧНА ПОМИЛКА: Немає даних для підключення до БД');
    process.exit(1);
}

const app = express();

/**
 * ==========================================
 * SECURITY & CORE MIDDLEWARE
 * ==========================================
 */

// Helmet
app.use(helmet());

// Allowed origins
const allowedOrigins = [
    'https://tenant-manager-system.vercel.app',
    'https://tenant-manager-system-git-main-yurii0210s-projects.vercel.app',
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.CLIENT_URL
].filter(Boolean);

// CORS
app.use(cors({
    origin: (origin, callback) => {
        // дозволяємо запити без origin (Postman, mobile apps)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('CORS error'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Preflight
app.options('*', cors());

// Logger
app.use(morgan('dev'));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Забагато запитів. Спробуйте пізніше.' }
});
app.use('/api', apiLimiter);

/**
 * ==========================================
 * ROUTES
 * ==========================================
 */

app.get('/', (req, res) => {
    res.json({ message: 'Realty Management API is running', version: '1.0.3' });
});

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/meters', meterRoutes);

/**
 * ==========================================
 * HEALTH CHECK
 * ==========================================
 */

app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.status(200).json({ status: 'ok', database: 'connected' });
    } catch (err) {
        res.status(503).json({ status: 'error', database: 'disconnected' });
    }
});

/**
 * ==========================================
 * ERROR HANDLING
 * ==========================================
 */

// 404
app.use((req, res) => res.status(404).json({ error: 'Маршрут не знайдено' }));

// Global error handler
app.use(errorHandler);

/**
 * ==========================================
 * SERVER START & SHUTDOWN
 * ==========================================
 */

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`
🚀 ============================================
📡 API: http://localhost:${PORT}
🛡️ Security: Helmet + RateLimit
🌍 Allowed origins:
${allowedOrigins.map(o => `   - ${o}`).join('\n')}
============================================`);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 ${signal} — shutting down server...`);
    server.close(async () => {
        try {
            await pool.end();
            console.log('✅ DB pool closed');
            process.exit(0);
        } catch (err) {
            console.error('❌ Error closing DB:', err);
            process.exit(1);
        }
    });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('unhandledRejection', (err) => {
    console.error('❌ UNHANDLED REJECTION:', err);
    gracefulShutdown('unhandledRejection');
});
