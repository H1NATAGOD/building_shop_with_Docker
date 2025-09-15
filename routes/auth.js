const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-construction-store-2024';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

// Регистрация
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phoneNumber } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать email, пароль, имя и фамилию'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Пароль должен содержать минимум 6 символов'
      });
    }

    // Проверяем, существует ли пользователь
    const existingUserQuery = 'SELECT id FROM "user" WHERE email = $1';
    const existingUser = await query(existingUserQuery, [email]);

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Пользователь с таким email уже существует'
      });
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Создаем пользователя
    const createUserQuery = 'INSERT INTO "user" (email, password) VALUES ($1, $2) RETURNING id';
    const userResult = await query(createUserQuery, [email, hashedPassword]);
    const userId = userResult.rows[0].id;

    // Создаем клиента
    const createClientQuery = `
      INSERT INTO client (user_id, first_name, last_name, phone_number, email)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const clientResult = await query(createClientQuery, [
      userId,
      firstName,
      lastName,
      phoneNumber || null,
      email
    ]);

    // Создаем JWT токен
    const token = jwt.sign(
      { 
        userId: userId,
        clientId: clientResult.rows[0].id,
        email: email 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Регистрация прошла успешно',
      token,
      user: {
        id: userId,
        email: email,
        firstName: firstName,
        lastName: lastName,
        phoneNumber: phoneNumber
      }
    });

  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка регистрации'
    });
  }
});

// Вход в систему
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать email и пароль'
      });
    }

    // Находим пользователя
    const userQuery = `
      SELECT u.id, u.email, u.password, c.id as client_id, c.first_name, c.last_name, c.phone_number
      FROM "user" u
      LEFT JOIN client c ON u.id = c.user_id
      WHERE u.email = $1
    `;
    const userResult = await query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль'
      });
    }

    const user = userResult.rows[0];

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Неверный email или пароль'
      });
    }

    // Создаем JWT токен
    const token = jwt.sign(
      { 
        userId: user.id,
        clientId: user.client_id,
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Вход выполнен успешно',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phoneNumber: user.phone_number
      }
    });

  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка входа в систему'
    });
  }
});

// Получение информации о текущем пользователе
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Токен не предоставлен'
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Получаем информацию о пользователе
      const userQuery = `
        SELECT u.id, u.email, c.id as client_id, c.first_name, c.last_name, c.phone_number
        FROM "user" u
        LEFT JOIN client c ON u.id = c.user_id
        WHERE u.id = $1
      `;
      const userResult = await query(userQuery, [decoded.userId]);

      if (userResult.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Пользователь не найден'
        });
      }

      const user = userResult.rows[0];

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phoneNumber: user.phone_number
        }
      });

    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'Недействительный токен'
      });
    }

  } catch (error) {
    console.error('Ошибка получения информации о пользователе:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения информации о пользователе'
    });
  }
});

// Выход из системы (на клиенте просто удаляется токен)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Выход выполнен успешно'
  });
});

module.exports = router;