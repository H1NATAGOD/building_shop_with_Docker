const { query } = require('./config/database');

async function testProductsAPI() {
  try {
    console.log('🔄 Тестируем API товаров...');
    
    // Тестируем простой запрос товаров
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
      LIMIT 5
    `;

    const result = await query(productsQuery);
    
    console.log('✅ Запрос выполнен успешно!');
    console.log('📦 Найдено товаров:', result.rows.length);
    
    result.rows.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - ${product.price} ₽ (${product.category_name})`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка API товаров:', error.message);
    console.error('Детали:', error);
  }
}

testProductsAPI();

