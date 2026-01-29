const express = require('express');
const router = express.Router();
const pool = require('../config/database'); // твій pool з PostgreSQL

// GET /api/notifications?type=finance
router.get('/', async (req, res) => {
    try {
        const { type } = req.query; // можна фільтрувати за типом
        let query = 'SELECT * FROM notifications';
        const params = [];

        if (type) {
            query += ' WHERE type = $1';
            params.push(type);
        }

        query += ' ORDER BY created_at DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Помилка отримання сповіщень' });
    }
});

// POST /api/notifications — створення нового сповіщення вручну
router.post('/', async (req, res) => {
    try {
        const { user_id, type, title, message } = req.body;

        if (!user_id || !title || !message) {
            return res.status(400).json({ error: 'user_id, title та message обовʼязкові' });
        }

        const result = await pool.query(
            `INSERT INTO notifications (user_id, type, title, message)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [user_id, type || 'general', title, message]
        );

        res.status(201).json({ message: 'Notification created', notification: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Помилка створення сповіщення' });
    }
});

// PUT /api/notifications/:id/read — позначити як прочитане
router.put('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Сповіщення не знайдено' });
        }

        res.json({ message: 'Notification marked as read', notification: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Помилка оновлення сповіщення' });
    }
});

// PUT /api/notifications/read-all — позначити всі як прочитані
router.put('/read-all', async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE RETURNING *`
        );

        res.json({ message: `Позначено ${result.rows.length} сповіщень як прочитані` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Помилка оновлення сповіщень' });
    }
});

// DELETE /api/notifications/:id — видалити сповіщення
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `DELETE FROM notifications WHERE id = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Сповіщення не знайдено' });
        }

        res.json({ message: 'Notification deleted', notification: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Помилка видалення сповіщення' });
    }
});

module.exports = router;
