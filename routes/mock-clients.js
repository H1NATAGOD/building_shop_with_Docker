const express = require('express');
const mockData = require('./mock-data');

const router = express.Router();

// Получение всех клиентов
router.get('/', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const clients = mockData.clients.slice(0, parseInt(limit));

    res.json({ clients });
  } catch (error) {
    console.error('Ошибка получения клиентов:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось получить список клиентов'
    });
  }
});

// Получение клиента по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const client = mockData.clients.find(c => c.id == id);

    if (!client) {
      return res.status(404).json({
        error: 'Клиент не найден',
        message: 'Клиент с указанным ID не существует'
      });
    }

    res.json({ client });
  } catch (error) {
    console.error('Ошибка получения клиента:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось получить информацию о клиенте'
    });
  }
});

// Создание нового клиента
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber } = req.body;

    const newClient = {
      id: mockData.clients.length + 1,
      first_name: firstName,
      last_name: lastName,
      email,
      phone_number: phoneNumber,
      created_at: new Date().toISOString()
    };

    mockData.clients.push(newClient);

    res.status(201).json({
      message: 'Клиент успешно создан',
      client: newClient
    });
  } catch (error) {
    console.error('Ошибка создания клиента:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось создать клиента'
    });
  }
});

// Обновление клиента
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phoneNumber } = req.body;

    const clientIndex = mockData.clients.findIndex(c => c.id == id);
    if (clientIndex === -1) {
      return res.status(404).json({
        error: 'Клиент не найден',
        message: 'Клиент с указанным ID не существует'
      });
    }

    const updatedClient = {
      ...mockData.clients[clientIndex],
      first_name: firstName,
      last_name: lastName,
      email,
      phone_number: phoneNumber
    };

    mockData.clients[clientIndex] = updatedClient;

    res.json({
      message: 'Клиент успешно обновлен',
      client: updatedClient
    });
  } catch (error) {
    console.error('Ошибка обновления клиента:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось обновить клиента'
    });
  }
});

// Удаление клиента
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const clientIndex = mockData.clients.findIndex(c => c.id == id);

    if (clientIndex === -1) {
      return res.status(404).json({
        error: 'Клиент не найден',
        message: 'Клиент с указанным ID не существует'
      });
    }

    mockData.clients.splice(clientIndex, 1);

    res.json({
      message: 'Клиент успешно удален'
    });
  } catch (error) {
    console.error('Ошибка удаления клиента:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось удалить клиента'
    });
  }
});

module.exports = router;

