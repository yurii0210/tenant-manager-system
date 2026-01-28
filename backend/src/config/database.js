const { Pool } = require('pg');
const path = require('path');

// Шлях до .env файлу, який знаходиться в корені бекенду (на два рівні вище від цього файлу)
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    // Пріоритет на 'postgres', оскільки саме там ми створили таблиці в DBeaver
    database: process.env.DB_NAME || 'postgres', 
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
    console.error('⚠️ Помилка пулу PostgreSQL:', err.message);
});

// Функція діагностики підключення
const verifyConnection = async () => {
    let client;
    try {
        client = await pool.connect();
        console.log(`✅ БАЗА ПІДКЛЮЧЕНА: ${client.database}`);
        console.log(`📍 ХОСТ: ${client.host}:${client.port}`);
    } catch (err) {
        console.error('❌ ПОМИЛКА КОНФІГУРАЦІЇ БАЗИ ДАНИХ:', err.message);
        // Виводимо підказку, щоб ви бачили, що саме не зчиталося
        console.log('Спроба підключення з параметрами:', {
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'postgres'
        });
    } finally {
        if (client) client.release();
    }
};

verifyConnection();

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool 
};