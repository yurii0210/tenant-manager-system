const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Отримати список усіх орендарів
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tenants ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Помилка при отриманні орендарів:', err);
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

// Додати нового орендаря
router.post('/', async (req, res) => {
    const { name, email, phone, property_id, rent_amount } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO tenants (name, email, phone, property_id, rent_amount) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, email, phone, property_id, rent_amount]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Помилка при створенні орендаря:', err);
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

module.exports = router;