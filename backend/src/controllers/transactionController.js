const { pool } = require('../config/database');

// 1. Отримати всі транзакції з пагінацією та фільтрами
exports.getAllTransactions = async (req, res, next) => {
  try {
    const { limit = 100, offset = 0, sort = '-date', type, category } = req.query;
    
    const allowedSortFields = ['date', 'amount', 'category', 'type'];
    const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
    const finalSortField = allowedSortFields.includes(sortField) ? sortField : 'date';
    const sortDirection = sort.startsWith('-') ? 'DESC' : 'ASC';

    let query = `
      SELECT t.*, p.address as property_address, p.name as property_name
      FROM public.transactions t
      LEFT JOIN public.properties p ON t.property_id = p.id
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
    
    query += ` ORDER BY t.${finalSortField} ${sortDirection} LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(parseInt(limit), parseInt(offset));
    
    const { rows } = await pool.query(query, queryParams);
    res.json(rows);
  } catch (error) {
    console.error("getAllTransactions error:", error.message);
    res.status(500).json({ error: "Помилка завантаження транзакцій" });
  }
};

// 2. Створити транзакцію (Дохід або Витрата)
exports.createTransaction = async (req, res, next) => {
  const { property_id, type, category, amount, date, description } = req.body;
  try {
    const query = `
      INSERT INTO public.transactions 
        (property_id, type, category, amount, date, description)
      VALUES (
        $1::int, 
        $2::varchar, 
        $3::varchar, 
        $4::numeric, 
        $5::date, 
        $6::text
      )
      RETURNING *
    `;
    
    const values = [
      property_id, 
      type, 
      category, 
      parseFloat(amount) || 0, 
      date || new Date(), 
      description || null
    ];

    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("createTransaction error:", error.message);
    res.status(500).json({ error: "Не вдалося зберегти транзакцію: " + error.message });
  }
};

// 3. Статистика (Доходи та витрати за місяць)
exports.getTransactionSummary = async (req, res, next) => {
  try {
    const monthQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::numeric as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::numeric as total_expenses
      FROM public.transactions
      WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
    `;
    const { rows } = await pool.query(monthQuery);
    
    const summary = rows[0];
    res.json({
      total_income: parseFloat(summary.total_income),
      total_expenses: parseFloat(summary.total_expenses),
      balance: parseFloat(summary.total_income) - parseFloat(summary.total_expenses)
    });
  } catch (error) {
    console.error("getTransactionSummary error:", error.message);
    res.status(500).json({ error: "Помилка розрахунку статистики" });
  }
};

// 4. Отримати за ID
exports.getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM public.transactions WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Транзакцію не знайдено' });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

// 5. Оновити
exports.updateTransaction = async (req, res, next) => {
  const { id } = req.params;
  const { property_id, type, category, amount, date, description } = req.body;
  try {
    const query = `
      UPDATE public.transactions 
      SET property_id = $1::int, type = $2::varchar, category = $3::varchar, 
          amount = $4::numeric, date = $5::date, description = $6::text
      WHERE id = $7 RETURNING *
    `;
    const { rows } = await pool.query(query, [property_id, type, category, amount, date, description, id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Транзакцію не знайдено' });
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

// 6. Видалити
exports.deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM public.transactions WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ message: 'Транзакцію не знайдено' });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};