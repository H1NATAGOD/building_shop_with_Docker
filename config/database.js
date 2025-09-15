const { Pool } = require('pg');

// Конфигурация подключения к PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'construction_store',
  password: process.env.DB_PASSWORD || '1234',
  port: process.env.DB_PORT || 5432,
  max: 20, // максимальное количество соединений в пуле
  idleTimeoutMillis: 30000, // время ожидания перед закрытием неактивного соединения
  connectionTimeoutMillis: 2000, // время ожидания подключения
});

// Обработка ошибок подключения
pool.on('error', (err) => {
  console.error('Неожиданная ошибка в пуле соединений PostgreSQL:', err);
  process.exit(-1);
});

// Функция для выполнения запросов
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Выполнен запрос', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Ошибка выполнения запроса:', error);
    throw error;
  }
};

// Функция для получения клиента из пула
const getClient = async () => {
  return await pool.connect();
};

// Функция для транзакций
const transaction = async (callback) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  query,
  getClient,
  transaction,
  pool
};
