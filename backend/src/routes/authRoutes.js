const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Маршрут для реєстрації: POST /api/auth/register
router.post('/register', authController.register);

// Маршрут для входу: POST /api/auth/login
router.post('/login', authController.login);

module.exports = router;