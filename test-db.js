const { query } = require('./config/database');

async function testConnection() {
  try {
    console.log('🔄 Тестируем подключение к базе данных...');
    
    const result = await query('SELECT NOW() as current_time');
    console.log('✅ Подключение успешно! Время сервера:', result.rows[0].current_time);
    
    // Тестируем таблицу товаров
    const productsResult = await query('SELECT COUNT(*) as count FROM product');
    console.log('📦 Количество товаров в базе:', productsResult.rows[0].count);
    
    // Тестируем получение товаров
    const products = await query('SELECT id, name, price FROM product LIMIT 3');
    console.log('🛍️ Первые 3 товара:');
    products.rows.forEach(product => {
      console.log(`  - ${product.name}: ${product.price} ₽`);
    });
    
  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:', error.message);
    console.error('Детали ошибки:', error);
  }
}

testConnection();

