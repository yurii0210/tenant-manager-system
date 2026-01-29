const pool = require('../config/database');

const NotificationsController = {
  // Отримати всі сповіщення (з можливістю фільтрувати за типом)
  async getAll(req, res) {
    try {
      const { type } = req.query;
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
      console.error('Помилка отримання сповіщень:', err);
      res.status(500).json({ error: 'Помилка отримання сповіщень' });
    }
  },

  // Створити нове сповіщення
  async create(req, res) {
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
      console.error('Помилка створення сповіщення:', err);
      res.status(500).json({ error: 'Помилка створення сповіщення' });
    }
  },

  // Позначити сповіщення як прочитане
  async markAsRead(req, res) {
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
      console.error('Помилка оновлення сповіщення:', err);
      res.status(500).json({ error: 'Помилка оновлення сповіщення' });
    }
  },

  // Позначити всі сповіщення як прочитані
  async markAllAsRead(req, res) {
    try {
      const result = await pool.query(
        `UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE RETURNING *`
      );

      res.json({ message: `Позначено ${result.rows.length} сповіщень як прочитані` });
    } catch (err) {
      console.error('Помилка оновлення сповіщень:', err);
      res.status(500).json({ error: 'Помилка оновлення сповіщень' });
    }
  },

  // Видалити сповіщення
  async delete(req, res) {
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
      console.error('Помилка видалення сповіщення:', err);
      res.status(500).json({ error: 'Помилка видалення сповіщення' });
    }
  }
};

module.exports = NotificationsController;
