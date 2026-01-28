const { pool } = require('../config/database');

// Отримати всі показники з фільтрацією
export const getAllMeters = async (req, res, next) => {
  try {
    const { property_id, type, start_date, end_date } = req.query;
    
    let query = `
      SELECT m.*, p.address
      FROM meters m
      LEFT JOIN properties p ON m.property_id = p.id
    `;
    
    const whereConditions = [];
    const queryParams = [];
    
    if (property_id) {
      whereConditions.push(`m.property_id = $${queryParams.length + 1}`);
      queryParams.push(property_id);
    }
    
    if (type) {
      whereConditions.push(`m.type = $${queryParams.length + 1}`);
      queryParams.push(type);
    }
    
    if (start_date) {
      whereConditions.push(`m.reading_date >= $${queryParams.length + 1}`);
      queryParams.push(start_date);
    }
    
    if (end_date) {
      whereConditions.push(`m.reading_date <= $${queryParams.length + 1}`);
      queryParams.push(end_date);
    }
    
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    query += ` ORDER BY m.reading_date DESC, m.id DESC`;
    
    const { rows } = await pool.query(query, queryParams);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

// Створити показник лічильника
export const createMeterReading = async (req, res, next) => {
  const { property_id, type, value, reading_date } = req.body;
  
  if (!property_id || !type || value === undefined || !reading_date) {
    return res.status(400).json({ message: 'Всі поля обов’язкові' });
  }

  // Отримуємо клієнта з пулу для транзакції
  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Початок транзакції

    // 1. Отримуємо попередній показник з блокуванням рядка (FOR SHARE), 
    // щоб уникнути змін іншими процесами під час розрахунку
    const previousQuery = `
      SELECT value FROM meters 
      WHERE property_id = $1 AND type = $2 AND reading_date <= $3
      ORDER BY reading_date DESC, id DESC 
      LIMIT 1
      FOR SHARE
    `;
    const previousResult = await client.query(previousQuery, [property_id, type, reading_date]);
    const previous_reading = previousResult.rows[0]?.value || 0;

    if (value < previous_reading) {
      throw new Error(`Новий показник не може бути меншим за попередній (${previous_reading})`);
    }
    
    const consumption = value - previous_reading;

    const insertQuery = `
      INSERT INTO meters (property_id, type, value, reading_date, previous_reading, consumption)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const { rows } = await client.query(insertQuery, [property_id, type, value, reading_date, previous_reading, consumption]);
    
    await client.query('COMMIT'); // Фіксація змін
    res.status(201).json(rows[0]);
  } catch (error) {
    await client.query('ROLLBACK'); // Скасування змін у разі помилки
    
    if (error.message.includes('не може бути меншим')) {
        return res.status(400).json({ message: error.message });
    }
    if (error.code === '23503') {
        return res.status(404).json({ message: 'Об’єкт нерухомості не знайдено' });
    }
    next(error);
  } finally {
    client.release(); // Обов'язково повертаємо клієнта в пул
  }
};