const { pool } = require('../config/database');

// Отримати всі показники
exports.getAllMeters = async (req, res, next) => {
  try {
    const { property_id, type } = req.query;
    let query = `
      SELECT m.*, p.address 
      FROM meters m 
      LEFT JOIN properties p ON m.property_id = p.id
    `;
    const params = [];

    if (property_id) {
      params.push(property_id);
      query += ` WHERE m.property_id = $${params.length}`;
    }

    query += ` ORDER BY m.reading_date DESC`;
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

// Створити новий показник (з розрахунком споживання)
exports.createMeterReading = async (req, res, next) => {
  const { property_id, type, value, reading_date } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Отримуємо попередній показник
    const prevRes = await client.query(
      'SELECT value FROM meters WHERE property_id = $1 AND type = $2 ORDER BY reading_date DESC LIMIT 1',
      [property_id, type]
    );
    const previous_reading = prevRes.rows[0]?.value || 0;

    const query = `
      INSERT INTO meters (property_id, type, value, reading_date, previous_reading)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const { rows } = await client.query(query, [property_id, type, value, reading_date, previous_reading]);
    
    await client.query('COMMIT');
    res.status(201).json(rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

// Отримати показник за ID
exports.getMeterById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM meters WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Запис не знайдено' });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

// Видалити показник
exports.deleteMeterReading = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM meters WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ message: 'Запис не знайдено' });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};