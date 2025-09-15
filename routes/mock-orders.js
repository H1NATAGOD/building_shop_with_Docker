const express = require('express');
const mockData = require('./mock-data');

const router = express.Router();

// Получение всех заказов
router.get('/', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const orders = mockData.orders.slice(0, parseInt(limit));

    res.json({ orders });
  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось получить список заказов'
    });
  }
});

// Получение заказа по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = mockData.orders.find(o => o.id == id);

    if (!order) {
      return res.status(404).json({
        error: 'Заказ не найден',
        message: 'Заказ с указанным ID не существует'
      });
    }

    res.json({ order });
  } catch (error) {
    console.error('Ошибка получения заказа:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось получить информацию о заказе'
    });
  }
});

// Создание нового заказа
router.post('/', async (req, res) => {
  try {
    const { clientId, products, totalPrice } = req.body;

    const newOrder = {
      id: mockData.orders.length + 1,
      client_id: clientId,
      all_price: totalPrice,
      rowstatus: 'новый',
      created_at: new Date().toISOString()
    };

    mockData.orders.push(newOrder);

    res.status(201).json({
      message: 'Заказ успешно создан',
      order: newOrder
    });
  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось создать заказ'
    });
  }
});

// Обновление статуса заказа
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const orderIndex = mockData.orders.findIndex(o => o.id == id);
    if (orderIndex === -1) {
      return res.status(404).json({
        error: 'Заказ не найден',
        message: 'Заказ с указанным ID не существует'
      });
    }

    mockData.orders[orderIndex].rowstatus = status;

    res.json({
      message: 'Статус заказа обновлен',
      order: mockData.orders[orderIndex]
    });
  } catch (error) {
    console.error('Ошибка обновления заказа:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось обновить заказ'
    });
  }
});

module.exports = router;

