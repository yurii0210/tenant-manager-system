const { pool } = require('../config/database');

// Отримати всі транзакції
export const getAllTransactions = async (req, res, next) => {
  try {
    const { limit = 100, offset = 0, sort = '-date', type, category } = req.query;
    
    // Білий список полів для сортування (захист від SQL Injection)
    const allowedSortFields = ['date', 'amount', 'category', 'type'];
    const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
    const finalSortField = allowedSortFields.includes(sortField) ? sortField : 'date';
    const sortDirection = sort.startsWith('-') ? 'DESC' : 'ASC';

    let query = `
      SELECT t.*, p.address
      FROM transactions t
      LEFT JOIN properties p ON t.property_id = p.id
    `;
    
    const whereConditions = [];
    const queryParams = [];
    
    if (type) {
      whereConditions.push(`t.type = $${queryParams.length + 1}`);
      queryParams.push(type);
    }
    
    if (category) {
      whereConditions.push(`t.category = $${queryParams.length + 1}`);
      queryParams.push(category);
    }
    
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    // Вставляємо перевірені значення сортування
    query += ` ORDER BY t.${finalSortField} ${sortDirection}`;
    
    // Пагінація
    query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(Math.max(1, parseInt(limit)), Math.max(0, parseInt(offset)));
    
    const { rows } = await pool.query(query, queryParams);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

// Створити транзакцію
export const createTransaction = async (req, res, next) => {
  const { property_id, type, category, amount, date, description } = req.body;
  
  // Валідація
  if (!type || !amount || !date || amount <= 0) {
    return res.status(400).json({ message: 'Некоректні дані транзакції' });
  }
  
  try {
    const query = `
      INSERT INTO transactions (property_id, type, category, amount, date, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [property_id, type, category, amount, date, description];
    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
};

// Отримати статистику по транзакціям
export const getTransactionSummary = async (req, res, next) => {
  try {
    const monthQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
        (
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) - 
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)
        ) as net_profit
      FROM transactions
      WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
    `;
    
    const { rows } = await pool.query(monthQuery);
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};