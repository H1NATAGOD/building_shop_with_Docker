const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// Простое получение всех товаров
router.get('/', async (req, res) => {
  try {
    console.log('🔄 Получение товаров...');
    
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
      ORDER BY p.created_at DESC
    `;

    const result = await query(productsQuery);
    
    console.log('✅ Товары получены:', result.rows.length);
    
    res.json({
      success: true,
      products: result.rows,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: result.rows.length,
        hasNextPage: false,
        hasPrevPage: false,
        limit: result.rows.length
      }
    });

  } catch (error) {
    console.error('❌ Ошибка получения товаров:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка получения товаров: ' + error.message
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

module.exports = router;

