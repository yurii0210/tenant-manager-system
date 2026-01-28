const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Маршрути для /api/transactions
router.route('/')
  .get(transactionController.getAllTransactions)
  .post(transactionController.createTransaction);

// Маршрут для статистики (важливо ставити ПЕРЕД :id)
router.route('/summary')
  .get(transactionController.getTransactionSummary);

// Маршрути для /api/transactions/:id
router.route('/:id')
  .get(transactionController.getTransactionById)
  .put(transactionController.updateTransaction)
  .delete(transactionController.deleteTransaction);

module.exports = router;