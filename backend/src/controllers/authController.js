const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// РЕЄСТРАЦІЯ
exports.register = async (req, res, next) => {
    const { name, email, password } = req.body;

    try {
        // 1. Перевіряємо, чи такий email вже існує
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'Користувач з таким email вже існує' });
        }

        // 2. Хешуємо пароль (не можна зберігати в чистому вигляді!)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Зберігаємо в базу
        const newUser = await pool.query(
            'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
            [name, email, hashedPassword]
        );

        // 4. Створюємо JWT токен
        const token = jwt.sign(
            { id: newUser.rows[0].id }, 
            process.env.JWT_SECRET || 'secret_key_123', 
            { expiresIn: '24h' }
        );

        res.status(201).json({
            token,
            user: newUser.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

// ВХІД
exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Невірний email або пароль' });
        }

        const isMatch = await bcrypt.compare(password, rows[0].password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Невірний email або пароль' });
        }

        const token = jwt.sign(
            { id: rows[0].id }, 
            process.env.JWT_SECRET || 'secret_key_123', 
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: { id: rows[0].id, name: rows[0].name, email: rows[0].email }
        });
    } catch (error) {
        next(error);
    }
};