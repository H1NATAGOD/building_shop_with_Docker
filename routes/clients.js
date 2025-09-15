const express = require('express');
const db = require('../config/database');
const { validateClientUpdate } = require('../middleware/validation');
const { authenticateToken, requireEmployee } = require('../middleware/auth');

const router = express.Router();

// Получение профиля текущего клиента
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        c.id,
        c.first_name,
        c.second_name,
        c.last_name,
        c.phone_number,
        c.email,
        c.delivery_address
      FROM client c
      WHERE c.user_id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Профиль не найден',
        message: 'Профиль клиента не найден'
      });
    }

    res.json({ client: result.rows[0] });

  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось получить профиль клиента'
    });
  }
});

// Обновление профиля клиента
router.put('/profile', authenticateToken, validateClientUpdate, async (req, res) => {
  try {
    const { firstName, secondName, lastName, phoneNumber, deliveryAddress } = req.body;

    const updateFields = [];
    const values = [];
    let paramCount = 0;

    if (firstName !== undefined) {
      paramCount++;
      updateFields.push(`first_name = $${paramCount}`);
      values.push(firstName);
    }

    if (secondName !== undefined) {
      paramCount++;
      updateFields.push(`second_name = $${paramCount}`);
      values.push(secondName);
    }

    if (lastName !== undefined) {
      paramCount++;
      updateFields.push(`last_name = $${paramCount}`);
      values.push(lastName);
    }

    if (phoneNumber !== undefined) {
      paramCount++;
      updateFields.push(`phone_number = $${paramCount}`);
      values.push(phoneNumber);
    }

    if (deliveryAddress !== undefined) {
      paramCount++;
      updateFields.push(`delivery_address = $${paramCount}`);
      values.push(deliveryAddress);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: 'Нет данных для обновления',
        message: 'Не указаны поля для обновления'
      });
    }

    paramCount++;
    values.push(req.user.client_id);

    const result = await db.query(`
      UPDATE client 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, first_name, second_name, last_name, phone_number, email, delivery_address
    `, values);

    res.json({
      message: 'Профиль успешно обновлен',
      client: result.rows[0]
    });

  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось обновить профиль'
    });
  }
});

// Получение истории заказов клиента
router.get('/orders', authenticateToken, async (req, res) => {
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
      message: 'Не удалось получить историю заказов'
    });
  }
});

// Получение детальной информации о заказе
router.get('/orders/:orderId', authenticateToken, async (req, res) => {
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

// Удаление аккаунта клиента
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: 'Неверные данные',
        message: 'Для удаления аккаунта необходимо подтвердить пароль'
      });
    }

    // Получаем пароль пользователя
    const userResult = await db.query('SELECT password FROM "user" WHERE id = $1', [req.user.id]);
    const user = userResult.rows[0];

    // Проверяем пароль
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Неверный пароль',
        message: 'Пароль указан неверно'
      });
    }

    // Удаляем пользователя (каскадное удаление удалит и клиента)
    await db.query('DELETE FROM "user" WHERE id = $1', [req.user.id]);

    res.json({
      message: 'Аккаунт успешно удален'
    });

  } catch (error) {
    console.error('Ошибка удаления аккаунта:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось удалить аккаунт'
    });
  }
});

// Получение всех клиентов (только для сотрудников)
router.get('/', authenticateToken, requireEmployee, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let queryParams = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause = `WHERE (c.first_name ILIKE $${paramCount} OR c.last_name ILIKE $${paramCount} OR c.email ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    const clientsQuery = `
      SELECT 
        c.id,
        c.first_name,
        c.second_name,
        c.last_name,
        c.phone_number,
        c.email,
        c.delivery_address,
        c.created_at
      FROM client c
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limit, offset);

    const clientsResult = await db.query(clientsQuery, queryParams);

    // Подсчет общего количества клиентов
    const countQuery = `
      SELECT COUNT(*) as total
      FROM client c
      ${whereClause}
    `;
    const countResult = await db.query(countQuery, queryParams.slice(0, -2));

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      clients: clientsResult.rows,
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
    console.error('Ошибка получения клиентов:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось получить список клиентов'
    });
  }
});

module.exports = router;
