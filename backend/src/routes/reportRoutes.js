const express = require('express');
const router = express.Router();
const pool = require('../config/database'); // Ваше підключення до БД

router.get('/', async (req, res) => {
    const { period } = req.query; // 'monthly' або 'yearly'
    
    // Визначаємо часовий інтервал для SQL
    const interval = period === 'yearly' ? "1 year" : "1 month";

    try {
        // 1. Отримуємо загальні підсумки
        const totalsQuery = `
            SELECT 
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_revenue,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses
            FROM transactions
            WHERE date >= NOW() - INTERVAL '${interval}'
        `;

        // 2. Отримуємо дані в розрізі об'єктів
        const propertiesQuery = `
            SELECT 
                p.id, 
                p.name,
                COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as expenses
            FROM properties p
            LEFT JOIN transactions t ON p.id = t.property_id AND t.date >= NOW() - INTERVAL '${interval}'
            GROUP BY p.id, p.name
        `;

        const [totalsRes, propsRes] = await Promise.all([
            pool.query(totalsQuery),
            pool.query(propertiesQuery)
        ]);

        const totals = totalsRes.rows[0];
        const properties = propsRes.rows.map(row => ({
            id: row.id,
            name: row.name,
            income: parseFloat(row.income),
            expenses: parseFloat(row.expenses),
            profit: parseFloat(row.income) - parseFloat(row.expenses)
        }));

        res.json({
            totalRevenue: parseFloat(totals.total_revenue || 0),
            totalExpenses: parseFloat(totals.total_expenses || 0),
            netProfit: parseFloat(totals.total_revenue || 0) - parseFloat(totals.total_expenses || 0),
            properties: properties
        });

    } catch (error) {
        console.error('SQL Error in Reports:', error);
        res.status(500).json({ error: 'Помилка при формуванні звіту з бази даних' });
    }
});

module.exports = router;