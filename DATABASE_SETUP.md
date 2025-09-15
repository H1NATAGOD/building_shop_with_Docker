# Настройка базы данных PostgreSQL

## Установка PostgreSQL

### Windows
1. Скачайте PostgreSQL с официального сайта: https://www.postgresql.org/download/windows/
2. Запустите установщик и следуйте инструкциям
3. Запомните пароль для пользователя `postgres`
4. Убедитесь, что PostgreSQL запущен как служба

### Альтернатива: Docker
Если у вас установлен Docker, можно использовать контейнер:
```bash
docker run --name postgres-construction -e POSTGRES_PASSWORD=1234 -e POSTGRES_DB=construction_store -p 5432:5432 -d postgres:13
```

## Настройка проекта

1. Создайте файл `.env` в корне проекта:
```env
# Настройки базы данных
DB_HOST=localhost
DB_PORT=5432
DB_NAME=construction_store
DB_USER=postgres
DB_PASSWORD=ваш_пароль_от_postgres

# Настройки сервера
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# JWT секретный ключ
JWT_SECRET=your-super-secret-jwt-key-here-construction-store-2024

# Настройки безопасности
BCRYPT_ROUNDS=12
```

2. Инициализируйте базу данных:
```bash
node scripts/init-database.js
```

3. Запустите сервер:
```bash
npm start
```

## Проверка подключения

После настройки откройте в браузере:
- http://localhost:3000/api/products - список товаров
- http://localhost:3000/index.html - веб-интерфейс

## Структура базы данных

- `user` - пользователи системы
- `client` - клиенты магазина
- `product` - товары
- `category` - категории товаров
- `manufacturer` - производители
- `order` - заказы
- `orders_products` - связь заказов и товаров

## Тестовые данные

В базе данных уже созданы тестовые данные:
- 2 пользователя (admin@store.com, client@test.com)
- Пароль для обоих: `password123`
- 14 товаров различных категорий
- 7 категорий товаров
- 10 производителей

