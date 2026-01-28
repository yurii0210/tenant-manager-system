const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Повертаємо порожній список, щоб прибрати помилку 404
router.get('/', async (req, res) => {
    try {
        // Якщо таблиці notifications ще немає, просто повертаємо []
        res.json([]); 
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;