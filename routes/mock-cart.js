const express = require('express');
const mockData = require('./mock-data');

const router = express.Router();

// Получение корзины клиента
router.get('/', async (req, res) => {
  try {
    // Для мок-версии возвращаем пустую корзину
    res.json({
      items: [],
      totalPrice: 0,
      totalItems: 0
    });
  } catch (error) {
    console.error('Ошибка получения корзины:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось получить корзину'
    });
  }
});

// Добавление товара в корзину
router.post('/add', async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId || quantity < 1) {
      return res.status(400).json({
        error: 'Неверные данные',
        message: 'Укажите корректный ID товара и количество'
      });
    }

    // Находим товар
    const product = mockData.products.find(p => p.id == productId);
    if (!product) {
      return res.status(404).json({
        error: 'Товар не найден',
        message: 'Товар с указанным ID не существует'
      });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({
        error: 'Недостаточно товара',
        message: `На складе доступно только ${product.quantity} единиц товара`
      });
    }

    res.json({
      message: 'Товар добавлен в корзину',
      item: {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        totalPrice: product.price * quantity
      }
    });

  } catch (error) {
    console.error('Ошибка добавления в корзину:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось добавить товар в корзину'
    });
  }
});

// Обновление количества товара в корзине
router.put('/update', async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity < 0) {
      return res.status(400).json({
        error: 'Неверные данные',
        message: 'Укажите корректный ID товара и количество'
      });
    }

    if (quantity === 0) {
      return res.json({
        message: 'Товар удален из корзины'
      });
    }

    // Находим товар
    const product = mockData.products.find(p => p.id == productId);
    if (!product) {
      return res.status(404).json({
        error: 'Товар не найден',
        message: 'Товар с указанным ID не существует'
      });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({
        error: 'Недостаточно товара',
        message: `На складе доступно только ${product.quantity} единиц товара`
      });
    }

    res.json({
      message: 'Количество товара обновлено',
      item: {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        totalPrice: product.price * quantity
      }
    });

  } catch (error) {
    console.error('Ошибка обновления корзины:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось обновить корзину'
    });
  }
});

// Удаление товара из корзины
router.delete('/remove', async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        error: 'Неверные данные',
        message: 'Укажите ID товара для удаления'
      });
    }

    res.json({
      message: 'Товар удален из корзины'
    });

  } catch (error) {
    console.error('Ошибка удаления из корзины:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось удалить товар из корзины'
    });
  }
});

// Очистка корзины
router.delete('/clear', async (req, res) => {
  try {
    res.json({
      message: 'Корзина очищена'
    });
  } catch (error) {
    console.error('Ошибка очистки корзины:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось очистить корзину'
    });
  }
});

module.exports = router;

