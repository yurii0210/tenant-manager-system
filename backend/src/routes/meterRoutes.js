const express = require('express');
const router = express.Router();
const meterController = require('../controllers/meterController');

// Маршрути для /api/meters
router.route('/')
  .get(meterController.getAllMeters)
  .post(meterController.createMeterReading);

router.route('/:id')
  .get(meterController.getMeterById)
  .delete(meterController.deleteMeterReading);

module.exports = router;