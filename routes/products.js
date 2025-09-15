const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const bcrypt = require('bcrypt');

// Получение всех товаров с пагинацией и фильтрацией
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      manufacturer,
      minPrice,
      maxPrice,
      inStock
    } = req.query;

    // Преобразуем параметры в правильные типы
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;

    const offset = (pageNum - 1) * limitNum;
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Поиск по названию товара
    if (search) {
      whereConditions.push(`p.name ILIKE $${paramIndex}`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Фильтр по категории
    if (category) {
      whereConditions.push(`p.category_id = $${paramIndex}`);
      queryParams.push(parseInt(category));
      paramIndex++;
    }

    // Фильтр по производителю
    if (manufacturer) {
      whereConditions.push(`p.manufacturer_id = $${paramIndex}`);
      queryParams.push(parseInt(manufacturer));
      paramIndex++;
    }

    // Фильтр по минимальной цене
    if (minPrice) {
      whereConditions.push(`p.price >= $${paramIndex}`);
      queryParams.push(parseFloat(minPrice));
      paramIndex++;
    }

    // Фильтр по максимальной цене
    if (maxPrice) {
      whereConditions.push(`p.price <= $${paramIndex}`);
      queryParams.push(parseFloat(maxPrice));
      paramIndex++;
    }

    // Фильтр по наличию
    if (inStock === 'true') {
      whereConditions.push(`p.quantity > 0`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Запрос для получения товаров
    const productsQuery = `
      SELECT 
        p.id,
        p.name,
        p.price,
        p.quantity,
        p.category_id,
        c.name as category_name,
        p.manufacturer_id,
        m.name as manufacturer_name,
        p.created_at
      FROM product p
      LEFT JOIN category c ON p.category_id = c.id
      LEFT JOIN manufacturer m ON p.manufacturer_id = m.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limitNum, offset);

    const products = await query(productsQuery, queryParams);

    // Запрос для подсчета общего количества товаров
    const countQuery = `
      SELECT COUNT(*) as total
      FROM product p
      LEFT JOIN category c ON p.category_id = c.id
      LEFT JOIN manufacturer m ON p.manufacturer_id = m.id
      ${whereClause}
    `;

    const countResult = await query(countQuery, queryParams.slice(0, -2));
    const totalItems = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalItems / limitNum);

    res.json({
      success: true,
      products: products.rows,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        limit: limitNum
      }
    });

  } catch (error) {
    console.error('Ошибка получения товаров:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения товаров'
    });
  }
});

// Получение товара по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const productQuery = `
      SELECT 
        p.id,
        p.name,
        p.price,
        p.quantity,
        p.category_id,
        c.name as category_name,
        p.manufacturer_id,
        m.name as manufacturer_name,
        p.created_at
      FROM product p
      LEFT JOIN category c ON p.category_id = c.id
      LEFT JOIN manufacturer m ON p.manufacturer_id = m.id
      WHERE p.id = $1
    `;

    const result = await query(productQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Товар не найден'
      });
    }

    res.json({
      success: true,
      product: result.rows[0]
    });

  } catch (error) {
    console.error('Ошибка получения товара:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения товара'
    });
  }
});

// Получение всех категорий
router.get('/categories/all', async (req, res) => {
  try {
    const categoriesQuery = 'SELECT id, name FROM category ORDER BY name';
    const result = await query(categoriesQuery);

    res.json({
      success: true,
      categories: result.rows
    });

  } catch (error) {
    console.error('Ошибка получения категорий:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения категорий'
    });
  }
});

// Получение всех производителей
router.get('/manufacturers/all', async (req, res) => {
  try {
    const manufacturersQuery = 'SELECT id, name FROM manufacturer ORDER BY name';
    const result = await query(manufacturersQuery);

    res.json({
      success: true,
      manufacturers: result.rows
    });

  } catch (error) {
    console.error('Ошибка получения производителей:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения производителей'
    });
  }
});

// Создание товара (только для админов)
router.post('/', async (req, res) => {
  try {
    const { name, price, quantity, categoryId, manufacturerId } = req.body;

    if (!name || !price || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать название, цену и количество'
      });
    }

    const insertQuery = `
      INSERT INTO product (name, price, quantity, category_id, manufacturer_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await query(insertQuery, [
      name,
      price,
      quantity,
      categoryId || null,
      manufacturerId || null
    ]);

    res.status(201).json({
      success: true,
      product: result.rows[0],
      message: 'Товар успешно создан'
    });

  } catch (error) {
    console.error('Ошибка создания товара:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка создания товара'
    });
  }
});

// Обновление товара (только для админов)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, quantity, categoryId, manufacturerId } = req.body;

    const updateQuery = `
      UPDATE product 
      SET name = $1, price = $2, quantity = $3, category_id = $4, manufacturer_id = $5
      WHERE id = $6
      RETURNING *
    `;

    const result = await query(updateQuery, [
      name,
      price,
      quantity,
      categoryId || null,
      manufacturerId || null,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Товар не найден'
      });
    }

    res.json({
      success: true,
      product: result.rows[0],
      message: 'Товар успешно обновлен'
    });

  } catch (error) {
    console.error('Ошибка обновления товара:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обновления товара'
    });
  }
});

// Удаление товара (только для админов)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleteQuery = 'DELETE FROM product WHERE id = $1 RETURNING *';
    const result = await query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Товар не найден'
      });
    }

    res.json({
      success: true,
      message: 'Товар успешно удален'
    });

  } catch (error) {
    console.error('Ошибка удаления товара:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления товара'
    });
  }
});

// Создание категории (только для админов)
router.post('/categories', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать название категории'
      });
    }

    const insertQuery = 'INSERT INTO category (name) VALUES ($1) RETURNING *';
    const result = await query(insertQuery, [name]);

    res.status(201).json({
      success: true,
      category: result.rows[0],
      message: 'Категория успешно создана'
    });

  } catch (error) {
    if (error.code === '23505') { // Unique violation
      res.status(400).json({
        success: false,
        message: 'Категория с таким названием уже существует'
      });
    } else {
      console.error('Ошибка создания категории:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка создания категории'
      });
    }
  }
});

// Удаление категории (только для админов)
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleteQuery = 'DELETE FROM category WHERE id = $1 RETURNING *';
    const result = await query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Категория не найдена'
      });
    }

    res.json({
      success: true,
      message: 'Категория успешно удалена'
    });

  } catch (error) {
    console.error('Ошибка удаления категории:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления категории'
    });
  }
});

// Создание производителя (только для админов)
router.post('/manufacturers', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать название производителя'
      });
    }

    const insertQuery = 'INSERT INTO manufacturer (name) VALUES ($1) RETURNING *';
    const result = await query(insertQuery, [name]);

    res.status(201).json({
      success: true,
      manufacturer: result.rows[0],
      message: 'Производитель успешно создан'
    });

  } catch (error) {
    if (error.code === '23505') { // Unique violation
      res.status(400).json({
        success: false,
        message: 'Производитель с таким названием уже существует'
      });
    } else {
      console.error('Ошибка создания производителя:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка создания производителя'
      });
    }
  }
});

// Удаление производителя (только для админов)
router.delete('/manufacturers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleteQuery = 'DELETE FROM manufacturer WHERE id = $1 RETURNING *';
    const result = await query(deleteQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Производитель не найден'
      });
    }

    res.json({
      success: true,
      message: 'Производитель успешно удален'
    });

  } catch (error) {
    console.error('Ошибка удаления производителя:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка удаления производителя'
    });
  }
});

module.exports = router;