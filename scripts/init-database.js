const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Конфигурация подключения к PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || '1234',
  port: process.env.DB_PORT || 5432,
});

async function initDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Подключение к PostgreSQL...');
    
    // Проверяем, существует ли база данных construction_store
    const checkDbQuery = "SELECT 1 FROM pg_database WHERE datname = 'construction_store'";
    const dbExists = await client.query(checkDbQuery);
    
    if (dbExists.rows.length === 0) {
      console.log('📦 Создание базы данных construction_store...');
      await client.query('CREATE DATABASE construction_store');
      console.log('✅ База данных создана');
    } else {
      console.log('✅ База данных уже существует');
    }
    
    // Подключаемся к новой базе данных
    await client.end();
    
    const newPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: 'construction_store',
      password: process.env.DB_PASSWORD || '1234',
      port: process.env.DB_PORT || 5432,
    });
    
    const newClient = await newPool.connect();
    
    try {
      console.log('🔄 Выполнение SQL скрипта...');
      
      // Читаем SQL файл
      const sqlPath = path.join(__dirname, '..', 'database', 'init.sql');
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      
      // Выполняем SQL скрипт
      await newClient.query(sqlContent);
      
      console.log('✅ База данных инициализирована успешно');
      console.log('🎉 Готово! Теперь можно запускать сервер с npm start');
      
    } catch (error) {
      console.error('❌ Ошибка выполнения SQL скрипта:', error.message);
      throw error;
    } finally {
      newClient.release();
      await newPool.end();
    }
    
  } catch (error) {
    console.error('❌ Ошибка инициализации базы данных:', error.message);
    console.log('\n📋 Инструкция по установке PostgreSQL:');
    console.log('1. Скачайте PostgreSQL с https://www.postgresql.org/download/');
    console.log('2. Установите с настройками по умолчанию');
    console.log('3. Запомните пароль для пользователя postgres');
    console.log('4. Создайте файл .env с настройками базы данных:');
    console.log('   DB_HOST=localhost');
    console.log('   DB_PORT=5432');
    console.log('   DB_NAME=construction_store');
    console.log('   DB_USER=postgres');
    console.log('   DB_PASSWORD=ваш_пароль');
    console.log('5. Запустите этот скрипт снова: node scripts/init-database.js');
    process.exit(1);
  }
}

// Запускаем инициализацию
initDatabase();

