const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here-construction-store-2024';

// Middleware для проверки авторизации
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Токен не предоставлен'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Недействительный токен'
    });
  }
};

// Получение корзины пользователя
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.user;

    // Получаем активный заказ (корзину) пользователя
    const cartQuery = `
      SELECT 
        o.id as order_id,
        o.all_price as total_price,
        p.id as product_id,
        p.name,
        p.price,
        op.quantity,
        (p.price * op.quantity) as item_total
      FROM "order" o
      JOIN orders_products op ON o.id = op.order_id
      JOIN product p ON op.product_id = p.id
      WHERE o.client_id = $1 AND o.rowstatus = 'корзина'
      ORDER BY op.product_id
    `;

    const result = await query(cartQuery, [clientId]);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        items: [],
        totalItems: 0,
        totalPrice: 0
      });
    }

    const items = result.rows;
    const totalItems = items.reduce((sum, item) => sum + parseInt(item.quantity), 0);
    const totalPrice = items.reduce((sum, item) => sum + parseFloat(item.item_total), 0);

    res.json({
      success: true,
      items,
      totalItems,
      totalPrice
    });

  } catch (error) {
    console.error('Ошибка получения корзины:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения корзины'
    });
  }
});

// Добавление товара в корзину
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.user;
    const { productId, quantity = 1 } = req.body;

    if (!productId || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать корректный ID товара и количество'
      });
    }

    // Проверяем, существует ли товар
    const productQuery = 'SELECT id, name, price, quantity FROM product WHERE id = $1';
    const productResult = await query(productQuery, [productId]);

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Товар не найден'
      });
    }

    const product = productResult.rows[0];

    if (product.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Недостаточно товара на складе'
      });
    }

    // Получаем или создаем корзину (заказ со статусом "корзина")
    let cartQuery = 'SELECT id FROM "order" WHERE client_id = $1 AND rowstatus = $2';
    let cartResult = await query(cartQuery, [clientId, 'корзина']);

    let orderId;
    if (cartResult.rows.length === 0) {
      // Создаем новую корзину
      const createOrderQuery = 'INSERT INTO "order" (client_id, rowstatus) VALUES ($1, $2) RETURNING id';
      const newOrderResult = await query(createOrderQuery, [clientId, 'корзина']);
      orderId = newOrderResult.rows[0].id;
    } else {
      orderId = cartResult.rows[0].id;
    }

    // Проверяем, есть ли уже этот товар в корзине
    const existingItemQuery = 'SELECT quantity FROM orders_products WHERE order_id = $1 AND product_id = $2';
    const existingItemResult = await query(existingItemQuery, [orderId, productId]);

    if (existingItemResult.rows.length > 0) {
      // Обновляем количество
      const newQuantity = existingItemResult.rows[0].quantity + quantity;
      const updateQuery = 'UPDATE orders_products SET quantity = $1 WHERE order_id = $2 AND product_id = $3';
      await query(updateQuery, [newQuantity, orderId, productId]);
    } else {
      // Добавляем новый товар
      const insertQuery = 'INSERT INTO orders_products (order_id, product_id, quantity) VALUES ($1, $2, $3)';
      await query(insertQuery, [orderId, productId, quantity]);
    }

    res.json({
      success: true,
      message: 'Товар добавлен в корзину'
    });

  } catch (error) {
    console.error('Ошибка добавления в корзину:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка добавления в корзину'
    });
  }
});

// Удаление товара из корзины
router.delete('/remove', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.user;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать ID товара'
      });
    }

    // Получаем корзину пользователя
    const cartQuery = 'SELECT id FROM "order" WHERE client_id = $1 AND rowstatus = $2';
    const cartResult = await query(cartQuery, [clientId, 'корзина']);

    if (cartResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Корзина не найдена'
      });
    }

    const orderId = cartResult.rows[0].id;

    // Удаляем товар из корзины
    const deleteQuery = 'DELETE FROM orders_products WHERE order_id = $1 AND product_id = $2';
    const result = await query(deleteQuery, [orderId, productId]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Товар не найден в корзине'
      });
    }

    res.json({
      success: true,
      message: 'Товар удален из корзины'
    });

  } catch (error) {
    console.error('Ошибка удаления из корзины:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления из корзины'
    });
  }
});

// Очистка корзины
router.delete('/clear', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.user;

    // Получаем корзину пользователя
    const cartQuery = 'SELECT id FROM "order" WHERE client_id = $1 AND rowstatus = $2';
    const cartResult = await query(cartQuery, [clientId, 'корзина']);

    if (cartResult.rows.length === 0) {
      return res.json({
        success: true,
        message: 'Корзина уже пуста'
      });
    }

    const orderId = cartResult.rows[0].id;

    // Удаляем все товары из корзины
    const deleteQuery = 'DELETE FROM orders_products WHERE order_id = $1';
    await query(deleteQuery, [orderId]);

    res.json({
      success: true,
      message: 'Корзина очищена'
    });

  } catch (error) {
    console.error('Ошибка очистки корзины:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка очистки корзины'
    });
  }
});

// Оформление заказа
router.post('/checkout', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.user;

    // Получаем корзину пользователя
    const cartQuery = 'SELECT id FROM "order" WHERE client_id = $1 AND rowstatus = $2';
    const cartResult = await query(cartQuery, [clientId, 'корзина']);

    if (cartResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Корзина пуста'
      });
    }

    const orderId = cartResult.rows[0].id;

    // Проверяем, есть ли товары в корзине
    const itemsQuery = 'SELECT COUNT(*) as count FROM orders_products WHERE order_id = $1';
    const itemsResult = await query(itemsQuery, [orderId]);

    if (parseInt(itemsResult.rows[0].count) === 0) {
      return res.status(400).json({
        success: false,
        message: 'Корзина пуста'
      });
    }

    // Меняем статус заказа на "новый"
    const updateQuery = 'UPDATE "order" SET rowstatus = $1 WHERE id = $2';
    await query(updateQuery, ['новый', orderId]);

    res.json({
      success: true,
      message: 'Заказ успешно оформлен',
      orderId: orderId
    });

  } catch (error) {
    console.error('Ошибка оформления заказа:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка оформления заказа'
    });
  }
});

module.exports = router;