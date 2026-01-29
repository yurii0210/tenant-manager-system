const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Визначаємо конфігурацію: якщо є DATABASE_URL (для хмари), використовуємо його.
// Якщо немає — використовуємо окремі параметри (для локальної розробки).
const poolConfig = process.env.DATABASE_URL 
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false // Обов'язково для Supabase на Render
        }
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'postgres', 
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
      };

const pool = new Pool({
    ...poolConfig,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
    console.error('⚠️ Помилка пулу PostgreSQL:', err.message);
});

const verifyConnection = async () => {
    let client;
    try {
        client = await pool.connect();
        console.log(`✅ БАЗА ПІДКЛЮЧЕНА`);
        // У хмарі хост буде прихований у рядку, тому виведемо просто успіх
    } catch (err) {
        console.error('❌ ПОМИЛКА КОНФІГУРАЦІЇ БАЗИ ДАНИХ:', err.message);
    } finally {
        if (client) client.release();
    }
};

verifyConnection();

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool 
};