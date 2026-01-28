exports.errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // PostgreSQL помилки
  if (err.code === '23505') {
    return res.status(409).json({
      error: 'Конфлікт даних',
      message: 'Запис з такими даними вже існує'
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      error: 'Помилка зовнішнього ключа',
      message: 'Пов\'язаний запис не існує'
    });
  }

  if (err.code === '22P02') {
    return res.status(400).json({
      error: 'Помилка формату даних',
      message: 'Невірний формат даних'
    });
  }

  // Валідація помилок
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Помилка валідації',
      message: err.message
    });
  }

  // За замовчуванням
  res.status(500).json({
    error: 'Внутрішня помилка сервера',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Щось пішло не так'
  });
};