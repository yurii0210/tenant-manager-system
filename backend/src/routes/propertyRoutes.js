const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');

// Logger (опційно)
router.use((req, res, next) => {
  console.log(`[Property Router] ${req.method} ${req.url}`);
  next();
});

// -------------------------------
// Спеціалізовані маршрути (зверху!)
// -------------------------------
router.get('/dashboard/stats', propertyController.getDashboardStats);
router.get('/:id/transactions', propertyController.getPropertyTransactions);
router.get('/:id/meters', propertyController.getPropertyMeters);
router.get('/:id/history', propertyController.getPropertyHistory);

// -------------------------------
// CRUD маршрути
// -------------------------------
router.route('/')
  .get(propertyController.getAllProperties)
  .post(propertyController.createProperty);

router.route('/:id')
  .get(propertyController.getPropertyById)
  .put(propertyController.updateProperty)
  .delete(propertyController.deleteProperty);

module.exports = router;
