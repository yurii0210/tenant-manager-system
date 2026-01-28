const pool = require('../config/database');

// ================================
// 1. Отримати всі об'єкти з агрегацією
// ================================
exports.getAllProperties = async (req, res, next) => {
  try {
    const query = `
      SELECT p.*, 
             COUNT(DISTINCT t.id)::int as transaction_count,
             COUNT(DISTINCT m.id)::int as meter_count
      FROM public.properties p
      LEFT JOIN public.transactions t ON p.id = t.property_id
      LEFT JOIN public.meters m ON p.id = m.property_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error("getAllProperties error:", error.message);
    res.status(500).json({ error: "Внутрішня помилка сервера" });
  }
};

// ================================
// 2. Створити новий об'єкт
// ================================
exports.createProperty = async (req, res, next) => {
  const { name, address, type, status, tenant_name, rent_amount, contract_end } = req.body;

  if (!address) return res.status(400).json({ error: "Адреса є обов'язковим полем" });

  try {
    const query = `
      INSERT INTO public.properties 
        (name, address, type, status, tenant_name, rent_amount, contract_end, tenant_start_date)
      VALUES (
        $1::varchar, 
        $2::varchar, 
        $3::varchar, 
        $4::varchar, 
        $5::varchar, 
        $6::numeric, 
        $7::date, 
        CASE WHEN $5::varchar IS NOT NULL THEN CURRENT_TIMESTAMP ELSE NULL END
      )
      RETURNING *
    `;

    const values = [
      name || address,
      address,
      type || 'apartment',
      status || 'vacant',
      tenant_name || null,
      parseFloat(rent_amount) || 0,
      contract_end && contract_end !== "" ? contract_end : null
    ];

    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("createProperty error:", error.message);
    res.status(500).json({ error: "Внутрішня помилка сервера" });
  }
};

// ================================
// 3. Оновити об'єкт
// ================================
exports.updateProperty = async (req, res, next) => {
  const { id } = req.params;
  const { 
    name, address, type, status, 
    tenant_name, tenant_phone, tenant_email, 
    rent_amount, contract_end, next_payment_date 
  } = req.body;

  try {
    await pool.query('BEGIN');

    const currentRes = await pool.query('SELECT * FROM public.properties WHERE id = $1', [id]);
    if (currentRes.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: "Об'єкт не знайдено" });
    }
    const current = currentRes.rows[0];

    // --- ЛОГІКА АРХІВУВАННЯ ---
    let newStartDate = current.tenant_start_date;

    if (current.tenant_name && tenant_name !== current.tenant_name) {
      await pool.query(
        `INSERT INTO public.tenants_history 
          (property_id, tenant_name, tenant_phone, start_date, end_date, rent_amount)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)`,
        [id, current.tenant_name, current.tenant_phone, current.tenant_start_date, current.rent_amount]
      );
      newStartDate = tenant_name ? new Date() : null;
    } else if (!current.tenant_name && tenant_name) {
      newStartDate = new Date();
    }

    const cleanRent = isNaN(parseFloat(rent_amount)) ? 0 : parseFloat(rent_amount);

    const query = `
      UPDATE public.properties
      SET name = $1, address = $2, type = $3, status = $4,
          tenant_name = $5, tenant_phone = $6, tenant_email = $7,
          rent_amount = $8, contract_end = $9, next_payment_date = $10,
          tenant_start_date = $11,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
    `;

    const values = [
      name || current.name, address || current.address, type || current.type, status || current.status,
      tenant_name || null, tenant_phone || null, tenant_email || null,
      cleanRent, 
      (contract_end && contract_end.trim() !== "") ? contract_end : null,
      (next_payment_date && next_payment_date.trim() !== "") ? next_payment_date : null,
      newStartDate,
      id
    ];

    const { rows } = await pool.query(query, values);
    await pool.query('COMMIT');
    res.json(rows[0]);
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error("updateProperty error:", error.message);
    res.status(500).json({ error: "Помилка при оновленні об'єкта" });
  }
};

// ================================
// 4. Отримати історію орендарів
// ================================
exports.getPropertyHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM public.tenants_history WHERE property_id = $1 ORDER BY end_date DESC', 
      [id]
    );
    res.json(rows);
  } catch (error) {
    console.error("getPropertyHistory error:", error.message);
    res.status(500).json({ error: "Внутрішня помилка сервера" });
  }
};

// ================================
// 5. Статистика для дашборду
// ================================
exports.getDashboardStats = async (req, res, next) => {
  try {
    const statsQuery = `
      SELECT 
        (SELECT COALESCE(SUM(amount),0) FROM public.transactions WHERE type='income' AND date >= DATE_TRUNC('month', CURRENT_DATE)) as income,
        (SELECT COALESCE(SUM(amount),0) FROM public.transactions WHERE type='expense' AND date >= DATE_TRUNC('month', CURRENT_DATE)) as expense,
        (SELECT COUNT(*) FROM public.properties WHERE status='occupied') as active
    `;

    const chartQuery = `
      SELECT 
        to_char(date_trunc('month', date), 'Mon') as month,
        SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expenses
      FROM public.transactions
      WHERE date >= NOW() - INTERVAL '6 months'
      GROUP BY date_trunc('month', date)
      ORDER BY date_trunc('month', date)
    `;

    const [statsRes, chartRes] = await Promise.all([
      pool.query(statsQuery),
      pool.query(chartQuery)
    ]);

    const s = statsRes.rows[0];

    res.json({
      stats: {
        totalIncome: parseFloat(s.income),
        totalExpenses: parseFloat(s.expense),
        netProfit: parseFloat(s.income) - parseFloat(s.expense),
        activeProperties: parseInt(s.active)
      },
      chartData: chartRes.rows.map(r => ({
        month: r.month,
        income: parseFloat(r.income),
        expenses: parseFloat(r.expenses)
      }))
    });
  } catch (error) {
    console.error("getDashboardStats error:", error.message);
    res.status(500).json({ error: "Внутрішня помилка сервера" });
  }
};

// ================================
// 6. Стандартні CRUD операції
// ================================
exports.getPropertyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM public.properties WHERE id=$1', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error("getPropertyById error:", error.message);
    res.status(500).json({ error: "Внутрішня помилка сервера" });
  }
};

exports.deleteProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM public.properties WHERE id=$1', [id]);
    res.json({ message: "Об'єкт видалено" });
  } catch (error) {
    console.error("deleteProperty error:", error.message);
    res.status(500).json({ error: "Внутрішня помилка сервера" });
  }
};

exports.getPropertyTransactions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM public.transactions WHERE property_id=$1 ORDER BY date DESC',
      [id]
    );
    res.json(rows);
  } catch (error) {
    console.error("getPropertyTransactions error:", error.message);
    res.status(500).json({ error: "Внутрішня помилка сервера" });
  }
};

exports.getPropertyMeters = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM public.meters WHERE property_id=$1 ORDER BY reading_date DESC',
      [id]
    );
    res.json(rows);
  } catch (error) {
    console.error("getPropertyMeters error:", error.message);
    res.status(500).json({ error: "Внутрішня помилка сервера" });
  }
};
