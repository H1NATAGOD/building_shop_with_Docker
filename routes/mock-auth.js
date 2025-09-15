const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mockData = require('./mock-data');

const router = express.Router();

// Регистрация нового пользователя
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phoneNumber } = req.body;

    // Проверяем, существует ли пользователь с таким email
    const existingUser = mockData.users.find(user => user.email === email);
    if (existingUser) {
      return res.status(409).json({
        error: 'Пользователь уже существует',
        message: 'Пользователь с таким email уже зарегистрирован'
      });
    }

    // Хешируем пароль
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Создаем пользователя
    const newUser = {
      id: mockData.users.length + 1,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phoneNumber,
      role: 'user'
    };

    mockData.users.push(newUser);

    // Генерируем JWT токен
    const token = jwt.sign(
      { userId: newUser.id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      token,
      user: {
        id: newUser.id,
        email,
        firstName,
        lastName
      }
    });

  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось зарегистрировать пользователя'
    });
  }
});

// Вход в систему
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Находим пользователя по email
    const user = mockData.users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({
        error: 'Неверные учетные данные',
        message: 'Пользователь с таким email не найден'
      });
    }

    // Проверяем пароль
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Неверные учетные данные',
        message: 'Неверный пароль'
      });
    }

    // Генерируем JWT токен
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Успешный вход в систему',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось войти в систему'
    });
  }
});

// Получение информации о текущем пользователе
router.get('/me', async (req, res) => {
  try {
    // Для мок-версии просто возвращаем тестового пользователя
    const user = mockData.users[1]; // user@example.com
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось получить информацию о пользователе'
    });
  }
});

// Обновление пароля
router.put('/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Неверные данные',
        message: 'Требуются текущий и новый пароли'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Неверные данные',
        message: 'Новый пароль должен содержать минимум 6 символов'
      });
    }

    // Для мок-версии просто возвращаем успех
    res.json({
      message: 'Пароль успешно обновлен'
    });

  } catch (error) {
    console.error('Ошибка обновления пароля:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось обновить пароль'
    });
  }
});

module.exports = router;

