const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Используем реальные маршруты с базой данных
console.log('🗄️ Подключение к базе данных PostgreSQL');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const clientRoutes = require('./routes/mock-clients'); // Пока оставляем мок для клиентов
const orderRoutes = require('./routes/mock-orders'); // Пока оставляем мок для заказов
const cartRoutes = require('./routes/cart');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware безопасности с разрешением inline скриптов для разработки
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// CORS настройки
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100 // максимум 100 запросов с одного IP за 15 минут
});
app.use(limiter);

// Парсинг JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Статические файлы
app.use(express.static('public'));

// Маршруты API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);

// Главная страница
app.get('/', (req, res) => {
  res.json({
    message: 'Интернет-магазин строительных материалов API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      clients: '/api/clients',
      orders: '/api/orders',
      cart: '/api/cart'
    }
  });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Что-то пошло не так!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Внутренняя ошибка сервера'
  });
});

// 404 обработчик
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Маршрут не найден',
    message: `Маршрут ${req.originalUrl} не существует`
  });
});

// Запуск сервера с проверкой порта
const server = app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log(`API доступно по адресу: http://localhost:${PORT}`);
  console.log(`Веб-интерфейс доступен по адресу: http://localhost:${PORT}/index.html`);
});

// Обработка ошибки занятого порта
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Порт ${PORT} занят. Попробуйте запустить на другом порту:`);
    console.log(`PORT=3001 npm start`);
    process.exit(1);
  }
});

module.exports = app;
