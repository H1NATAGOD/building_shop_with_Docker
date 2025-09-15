const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware для проверки JWT токена
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Токен доступа не предоставлен',
      message: 'Необходима авторизация для доступа к этому ресурсу'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Получаем информацию о пользователе из базы данных
    const userResult = await db.query(
      'SELECT u.id, u.email, u.role, c.id as client_id, c.first_name, c.last_name FROM "user" u LEFT JOIN client c ON u.id = c.user_id WHERE u.id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Недействительный токен',
        message: 'Пользователь не найден'
      });
    }

    req.user = userResult.rows[0];
    next();
  } catch (error) {
    console.error('Ошибка проверки токена:', error);
    return res.status(403).json({ 
      error: 'Недействительный токен',
      message: 'Токен истек или поврежден'
    });
  }
};

// Middleware для проверки роли администратора
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Доступ запрещен',
      message: 'Требуются права администратора'
    });
  }
  next();
};

// Middleware для проверки роли сотрудника
const requireEmployee = (req, res, next) => {
  if (!req.user || !['admin', 'manager', 'warehouse'].includes(req.user.role)) {
    return res.status(403).json({
      error: 'Доступ запрещен',
      message: 'Требуются права сотрудника'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireEmployee
};
