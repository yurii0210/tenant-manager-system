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
const meterRoutes = require('./routes/meterRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Ініціалізація ENV
dotenv.config();

// Імпорт локальних модулів
const pool = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');

// Перевірка конфігурації
if (!process.env.DB_HOST && !process.env.DATABASE_URL) {
    console.error('❌ КРИТИЧНА ПОМИЛКА: Дані бази даних не знайдені в .env');
    process.exit(1);
}

const app = express();

/**
 * ==========================================
 * MIDDLEWARE (Захист та Обробка)
 * ==========================================
 */

// 1. Безпека заголовків
app.use(helmet());

// 2. Налаштування CORS (дозволяємо фронтенду звертатися до API)
const allowedOrigins = [
    'http://localhost:5173', // Порт для Vite (ваш поточний)
    'http://localhost:3000', // Порт для Create React App
    process.env.CLIENT_URL   // Порт з вашого .env (якщо є)
].filter(Boolean); // Видаляє порожні значення, якщо .env не задано

app.use(cors({
    origin: function (origin, callback) {
        // Дозволяємо запити без origin (наприклад, Postman або мобільні додатки)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Помилка CORS: Цей Origin не дозволений'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Логування запитів у консоль
app.use(morgan('dev'));

// 4. Парсинг JSON та URL-encoded даних
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. Обмеження кількості запитів (захист від DDOS/Bruteforce)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 хвилин
    max: 100, // ліміт 100 запитів з однієї IP
    message: { error: 'Забагато запитів, спробуйте пізніше.' }
});
app.use('/api', limiter);

/**
 * ==========================================
 * ROUTES (Маршрутизація)
 * ==========================================
 */

// Головна сторінка API
app.get('/', (req, res) => {
    res.json({ message: 'Realty Management API is running', version: '1.0.2' });
});

// Підключення модульних маршрутів
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/properties', require('./routes/propertyRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/tenants', require('./routes/tenantRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/notifications', notificationRoutes);
app.use('/api/meters', meterRoutes);

/**
 * ==========================================
 * HEALTH & ERROR HANDLING
 * ==========================================
 */

// Перевірка стану системи та БД
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.status(200).json({ status: 'ok', database: 'connected' });
    } catch (error) {
        res.status(503).json({ status: 'error', database: 'disconnected' });
    }
});

// Обробка неіснуючих маршрутів (404)
app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не знайдено' });
});

// Глобальний обробник помилок (має бути останнім)
app.use(errorHandler);

/**
 * ==========================================
 * SERVER LAUNCH & SHUTDOWN
 * ==========================================
 */

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`
    🚀 ============================================
    📡 Сервер: http://localhost:${PORT}
    🛡️ Безпека: Helmet & RateLimit активовані
    📦 БД: ${process.env.DB_NAME || 'PostgreSQL'}
    ================================================
    `);
});

// Коректне завершення роботи (Graceful Shutdown)
const gracefulShutdown = (signal) => {
    console.log(`\n🛑 Отримано ${signal}. Закриття сервера...`);
    server.close(async () => {
        try {
            await pool.end();
            console.log('✅ Пул з\'єднань з БД закрито.');
            process.exit(0);
        } catch (err) {
            console.error('❌ Помилка при закритті БД:', err);
            process.exit(1);
        }
    });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (err) => {
    console.error('❌ НЕОБРОБЛЕНА ПОМИЛКА:', err);
    gracefulShutdown('unhandledRejection');
});