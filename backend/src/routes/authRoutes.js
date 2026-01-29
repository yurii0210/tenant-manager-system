// app.js або routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";      // для порівняння паролів
import jwt from "jsonwebtoken";      // для генерації токена
import User from "./models/User.js"; // Модель користувача (MongoDB / Mongoose)
const router = express.Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Перевіряємо, що дані прийшли
    if (!email || !password) {
      return res.status(400).json({ error: "Недостатньо даних", message: "Email і пароль обов'язкові" });
    }

    // Шукаємо користувача у базі
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Невірні дані", message: "Користувача не знайдено" });
    }

    // Перевіряємо пароль
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Невірні дані", message: "Пароль неправильний" });
    }

    // Генеруємо JWT токен
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1h" }
    );

    // Відправляємо успішну відповідь
    res.json({
      message: "Логін успішний",
      token,
      user: { id: user._id, email: user.email }
    });

  } catch (err) {
    // Логування реальної помилки
    console.error("Помилка логіну:", err);

    // Відправка клієнту
    res.status(500).json({
      error: "Внутрішня помилка сервера",
      message: err.message
    });
  }
});

export default router;
