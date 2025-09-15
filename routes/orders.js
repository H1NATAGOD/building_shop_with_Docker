const express = require('express');
const db = require('../config/database');
const { validateOrder } = require('../middleware/validation');
const { authenticateToken, requireEmployee } = require('../middleware/auth');

const router = express.Router();

// Создание нового заказа из корзины
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { deliveryAddress, deliveryPhone, deliveryDate, deliveryTime, comment } = req.body;

    // Валидация обязательных полей
    if (!deliveryAddress || !deliveryPhone || !deliveryDate || !deliveryTime) {
      return res.status(400).json({
        error: 'Неполные данные',
        message: 'Необходимо указать адрес доставки, телефон, дату и время доставки'
      });
    }

    // Получаем корзину пользователя
    const cartQuery = 'SELECT id FROM "order" WHERE client_id = $1 AND rowstatus = $2';
    const cartResult = await db.query(cartQuery, [req.user.client_id, 'корзина']);

    if (cartResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Корзина пуста',
        message: 'Корзина не найдена или пуста'
      });
    }

    const orderId = cartResult.rows[0].id;

    // Проверяем, есть ли товары в корзине
    const itemsQuery = `
      SELECT 
        op.product_id,
        op.quantity,
        p.name,
        p.price,
        p.quantity as available_quantity
      FROM orders_products op
      JOIN product p ON op.product_id = p.id
      WHERE op.order_id = $1
    `;
    const itemsResult = await db.query(itemsQuery, [orderId]);

    if (itemsResult.rows.length === 0) {
      return res.status(400).json({
        error: 'Корзина пуста',
        message: 'В корзине нет товаров'
      });
    }

    const items = itemsResult.rows;

    // Проверяем наличие товаров на складе
    for (const item of items) {
      if (item.available_quantity < item.quantity) {
        return res.status(400).json({
          error: 'Недостаточно товара',
          message: `Товар "${item.name}" доступен в количестве ${item.available_quantity} единиц`
        });
      }
    }

    // Вычисляем общую стоимость заказа
    const totalPrice = items.reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity)), 0);

    // Обновляем заказ в транзакции
    const result = await db.transaction(async (client) => {
      // Обновляем заказ с данными о доставке
      const updateOrderQuery = `
        UPDATE "order" 
        SET 
          rowstatus = 'новый',
          all_price = $1,
          delivery_address = $2,
          delivery_phone = $3,
          delivery_date = $4,
          delivery_time = $5,
          comment = $6
        WHERE id = $7
        RETURNING id, all_price, rowstatus, created_at
      `;
      
      const orderResult = await client.query(updateOrderQuery, [
        totalPrice,
        deliveryAddress,
        deliveryPhone,
        deliveryDate,
        deliveryTime,
        comment || null,
        orderId
      ]);

      // Резервируем товары на складе
      for (const item of items) {
        await client.query(`
          UPDATE product 
          SET quantity = quantity - $1
          WHERE id = $2
        `, [item.quantity, item.product_id]);
      }

      return orderResult.rows[0];
    });

    res.status(201).json({
      message: 'Заказ успешно создан',
      orderId: result.id,
      order: result
    });

  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось создать заказ'
    });
  }
});

// Получение заказов клиента
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE o.client_id = $1';
    let queryParams = [req.user.client_id];
    let paramCount = 1;

    if (status) {
      paramCount++;
      whereClause += ` AND o.rowstatus = $${paramCount}`;
      queryParams.push(status);
    }

    const ordersQuery = `
      SELECT 
        o.id,
        o.all_price,
        o.rowstatus,
        o.created_at,
        COUNT(op.product_id) as items_count
      FROM "order" o
      LEFT JOIN orders_products op ON o.id = op.order_id
      ${whereClause}
      GROUP BY o.id, o.all_price, o.rowstatus, o.created_at
      ORDER BY o.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limit, offset);

    const ordersResult = await db.query(ordersQuery, queryParams);

    // Получаем детали заказов
    for (let order of ordersResult.rows) {
      const itemsResult = await db.query(`
        SELECT 
          p.id,
          p.name,
          p.price,
          op.quantity
        FROM orders_products op
        JOIN product p ON op.product_id = p.id
        WHERE op.order_id = $1
      `, [order.id]);

      order.items = itemsResult.rows;
    }

    // Подсчет общего количества заказов
    const countQuery = `
      SELECT COUNT(*) as total
      FROM "order" o
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, queryParams.slice(0, -2));

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      orders: ordersResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось получить заказы'
    });
  }
});

// Получение детальной информации о заказе клиента
router.get('/my/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    const orderResult = await db.query(`
      SELECT 
        o.id,
        o.all_price,
        o.rowstatus,
        o.created_at
      FROM "order" o
      WHERE o.id = $1 AND o.client_id = $2
    `, [orderId, req.user.client_id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Заказ не найден',
        message: 'Заказ с указанным ID не найден или не принадлежит текущему клиенту'
      });
    }

    const order = orderResult.rows[0];

    // Получаем товары заказа
    const itemsResult = await db.query(`
      SELECT 
        p.id,
        p.name,
        p.price,
        op.quantity
      FROM orders_products op
      JOIN product p ON op.product_id = p.id
      WHERE op.order_id = $1
    `, [orderId]);

    order.items = itemsResult.rows;

    res.json({ order });

  } catch (error) {
    console.error('Ошибка получения заказа:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось получить информацию о заказе'
    });
  }
});

// Отмена заказа клиентом
router.put('/my/:orderId/cancel', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    // Проверяем, что заказ принадлежит клиенту и может быть отменен
    const orderResult = await db.query(`
      SELECT id, rowstatus FROM "order" 
      WHERE id = $1 AND client_id = $2
    `, [orderId, req.user.client_id]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Заказ не найден',
        message: 'Заказ с указанным ID не найден или не принадлежит текущему клиенту'
      });
    }

    const order = orderResult.rows[0];

    if (order.rowstatus !== 'новый') {
      return res.status(400).json({
        error: 'Заказ нельзя отменить',
        message: 'Можно отменить только заказы со статусом "новый"'
      });
    }

    // Отменяем заказ и возвращаем товары на склад
    await db.transaction(async (client) => {
      // Обновляем статус заказа
      await client.query(`
        UPDATE "order" 
        SET rowstatus = 'отменён'
        WHERE id = $1
      `, [orderId]);

      // Возвращаем товары на склад
      const itemsResult = await client.query(`
        SELECT product_id, quantity FROM orders_products WHERE order_id = $1
      `, [orderId]);

      for (const item of itemsResult.rows) {
        await client.query(`
          UPDATE product 
          SET quantity = quantity + $1
          WHERE id = $2
        `, [item.quantity, item.product_id]);
      }
    });

    res.json({
      message: 'Заказ успешно отменен'
    });

  } catch (error) {
    console.error('Ошибка отмены заказа:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось отменить заказ'
    });
  }
});

// Получение всех заказов (только для сотрудников)
router.get('/', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, clientId } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      whereConditions.push(`o.rowstatus = $${paramCount}`);
      queryParams.push(status);
    }

    if (clientId) {
      paramCount++;
      whereConditions.push(`o.client_id = $${paramCount}`);
      queryParams.push(clientId);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const ordersQuery = `
      SELECT 
        o.id,
        o.all_price,
        o.rowstatus,
        o.created_at,
        c.first_name,
        c.last_name,
        c.email,
        COUNT(op.product_id) as items_count
      FROM "order" o
      JOIN client c ON o.client_id = c.id
      LEFT JOIN orders_products op ON o.id = op.order_id
      ${whereClause}
      GROUP BY o.id, o.all_price, o.rowstatus, o.created_at, c.first_name, c.last_name, c.email
      ORDER BY o.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limit, offset);

    const ordersResult = await db.query(ordersQuery, queryParams);

    // Подсчет общего количества заказов
    const countQuery = `
      SELECT COUNT(*) as total
      FROM "order" o
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, queryParams.slice(0, -2));

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      orders: ordersResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось получить список заказов'
    });
  }
});

// Обновление статуса заказа (только для сотрудников)
router.put('/:orderId/status', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['новый', 'в обработке', 'выполнен', 'отменён'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Неверный статус',
        message: `Статус должен быть одним из: ${validStatuses.join(', ')}`
      });
    }

    const result = await db.query(`
      UPDATE "order" 
      SET rowstatus = $1
      WHERE id = $2
      RETURNING id, rowstatus
    `, [status, orderId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Заказ не найден',
        message: 'Заказ с указанным ID не существует'
      });
    }

    res.json({
      message: 'Статус заказа обновлен',
      order: result.rows[0]
    });

  } catch (error) {
    console.error('Ошибка обновления статуса заказа:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось обновить статус заказа'
    });
  }
});

// Получение детальной информации о заказе (для сотрудников)
router.get('/:orderId', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const { orderId } = req.params;

    const orderResult = await db.query(`
      SELECT 
        o.id,
        o.all_price,
        o.rowstatus,
        o.created_at,
        c.first_name,
        c.last_name,
        c.email,
        c.phone_number,
        c.delivery_address
      FROM "order" o
      JOIN client c ON o.client_id = c.id
      WHERE o.id = $1
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Заказ не найден',
        message: 'Заказ с указанным ID не существует'
      });
    }

    const order = orderResult.rows[0];

    // Получаем товары заказа
    const itemsResult = await db.query(`
      SELECT 
        p.id,
        p.name,
        p.price,
        op.quantity
      FROM orders_products op
      JOIN product p ON op.product_id = p.id
      WHERE op.order_id = $1
    `, [orderId]);

    order.items = itemsResult.rows;

    res.json({ order });

  } catch (error) {
    console.error('Ошибка получения заказа:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось получить информацию о заказе'
    });
  }
});

module.exports = router;
