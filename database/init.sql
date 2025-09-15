-- Создание базы данных (выполняется отдельно)
-- CREATE DATABASE construction_store;

-- Подключение к базе данных
-- \c construction_store;

-- Создание таблицы пользователей
CREATE TABLE IF NOT EXISTS "user" (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы клиентов
CREATE TABLE IF NOT EXISTS client (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    second_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    email VARCHAR(255) UNIQUE,
    delivery_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

-- Индекс для внешнего ключа
CREATE INDEX IF NOT EXISTS idx_client_user_id ON client(user_id);

-- Создание таблицы заказов
CREATE TABLE IF NOT EXISTS "order" (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL,
    all_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    rowstatus VARCHAR(50) NOT NULL DEFAULT 'новый',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES client(id) ON DELETE CASCADE
);

-- Индекс для внешнего ключа
CREATE INDEX IF NOT EXISTS idx_order_client_id ON "order"(client_id);

-- Создание таблицы категорий
CREATE TABLE IF NOT EXISTS category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы производителей
CREATE TABLE IF NOT EXISTS manufacturer (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы продуктов
CREATE TABLE IF NOT EXISTS product (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    category_id INT,
    manufacturer_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE SET NULL,
    FOREIGN KEY (manufacturer_id) REFERENCES manufacturer(id) ON DELETE SET NULL
);

-- Индексы для внешних ключей
CREATE INDEX IF NOT EXISTS idx_product_category_id ON product(category_id);
CREATE INDEX IF NOT EXISTS idx_product_manufacturer_id ON product(manufacturer_id);

-- Таблица связи заказов и продуктов (многие-ко-многим)
CREATE TABLE IF NOT EXISTS orders_products (
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    PRIMARY KEY (order_id, product_id),
    FOREIGN KEY (order_id) REFERENCES "order"(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
);

-- Индексы для связи многие-ко-многим
CREATE INDEX IF NOT EXISTS idx_orders_products_order_id ON orders_products(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_products_product_id ON orders_products(product_id);

-- Функция для пересчета суммы заказа
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
BEGIN
    -- Обновляем сумму заказа
    UPDATE "order"
    SET all_price = (
        SELECT COALESCE(SUM(p.price * op.quantity), 0)
        FROM orders_products op
        JOIN product p ON p.id = op.product_id
        WHERE op.order_id = COALESCE(NEW.order_id, OLD.order_id)
    )
    WHERE id = COALESCE(NEW.order_id, OLD.order_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Триггер на добавление строки в orders_products
DROP TRIGGER IF EXISTS trg_update_order_total_insert ON orders_products;
CREATE TRIGGER trg_update_order_total_insert
AFTER INSERT ON orders_products
FOR EACH ROW
EXECUTE FUNCTION update_order_total();

-- Триггер на удаление строки из orders_products
DROP TRIGGER IF EXISTS trg_update_order_total_delete ON orders_products;
CREATE TRIGGER trg_update_order_total_delete
AFTER DELETE ON orders_products
FOR EACH ROW
EXECUTE FUNCTION update_order_total();

-- Триггер на обновление product_id или quantity
DROP TRIGGER IF EXISTS trg_update_order_total_update ON orders_products;
CREATE TRIGGER trg_update_order_total_update
AFTER UPDATE OF product_id, quantity ON orders_products
FOR EACH ROW
EXECUTE FUNCTION update_order_total();

-- Вставка тестовых данных

-- Категории
INSERT INTO category (name) VALUES 
('Краски и лаки'),
('Инструменты'),
('Сухие смеси'),
('Крепежные изделия'),
('Электротовары'),
('Сантехника'),
('Изоляционные материалы')
ON CONFLICT (name) DO NOTHING;

-- Производители
INSERT INTO manufacturer (name) VALUES 
('Tikkurila'),
('Knauf'),
('Bosch'),
('Makita'),
('DeWalt'),
('Ceresit'),
('Кнауф'),
('Ротбанд'),
('Волма'),
('Гипсополимер')
ON CONFLICT (name) DO NOTHING;

-- Товары
INSERT INTO product (name, price, quantity, category_id, manufacturer_id) VALUES 
('Краска акриловая белая 10л', 2500.00, 50, 1, 1),
('Краска водоэмульсионная 5л', 1200.00, 30, 1, 1),
('Дрель-шуруповерт Bosch GSR 12V', 8500.00, 15, 2, 3),
('Перфоратор Makita HR2470', 12000.00, 8, 2, 4),
('Штукатурка гипсовая 30кг', 450.00, 100, 3, 2),
('Шпаклевка финишная 25кг', 380.00, 80, 3, 6),
('Саморезы по дереву 4x50мм 100шт', 120.00, 200, 4, 7),
('Дюбели 6x40мм 100шт', 80.00, 150, 4, 7),
('Провод ВВГ 3x2.5мм² 100м', 2500.00, 20, 5, 8),
('Розетка внутренняя 220В', 150.00, 50, 5, 8),
('Смеситель для кухни', 3500.00, 12, 6, 9),
('Унитаз подвесной', 8500.00, 5, 6, 9),
('Утеплитель минеральная вата 50мм', 800.00, 40, 7, 10),
('Пенопласт 50мм 1м²', 200.00, 60, 7, 10)
ON CONFLICT DO NOTHING;

-- Создание тестового пользователя (пароль: password123)
INSERT INTO "user" (email, password) VALUES 
('admin@store.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QzKz2K'),
('client@test.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8QzKz2K')
ON CONFLICT (email) DO NOTHING;

-- Создание тестового клиента
INSERT INTO client (user_id, first_name, last_name, phone_number, email, delivery_address) VALUES 
(1, 'Администратор', 'Системы', '+7-999-123-45-67', 'admin@store.com', 'г. Москва, ул. Тестовая, д. 1'),
(2, 'Иван', 'Петров', '+7-999-987-65-43', 'client@test.com', 'г. Москва, ул. Примерная, д. 10')
ON CONFLICT (email) DO NOTHING;

-- Создание индексов для оптимизации поиска
CREATE INDEX IF NOT EXISTS idx_product_name ON product USING gin(to_tsvector('russian', name));
CREATE INDEX IF NOT EXISTS idx_order_status ON "order"(rowstatus);
CREATE INDEX IF NOT EXISTS idx_order_created_at ON "order"(created_at);
CREATE INDEX IF NOT EXISTS idx_client_email ON client(email);

-- Создание представления для аналитики продаж
CREATE OR REPLACE VIEW sales_analytics AS
SELECT 
    DATE(o.created_at) as sale_date,
    COUNT(o.id) as orders_count,
    SUM(o.all_price) as total_revenue,
    AVG(o.all_price) as avg_order_value,
    COUNT(DISTINCT o.client_id) as unique_clients
FROM "order" o
WHERE o.rowstatus != 'отменён'
GROUP BY DATE(o.created_at)
ORDER BY sale_date DESC;

-- Создание представления для популярных товаров
CREATE OR REPLACE VIEW popular_products AS
SELECT 
    p.id,
    p.name,
    p.price,
    SUM(op.quantity) as total_sold,
    COUNT(DISTINCT op.order_id) as orders_count,
    SUM(op.quantity * p.price) as total_revenue
FROM product p
JOIN orders_products op ON p.id = op.product_id
JOIN "order" o ON op.order_id = o.id
WHERE o.rowstatus != 'отменён'
GROUP BY p.id, p.name, p.price
ORDER BY total_sold DESC;

-- Создание функции для получения статистики склада
CREATE OR REPLACE FUNCTION get_warehouse_stats()
RETURNS TABLE (
    total_products BIGINT,
    total_quantity BIGINT,
    total_value NUMERIC,
    low_stock_products BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_products,
        SUM(quantity) as total_quantity,
        SUM(price * quantity) as total_value,
        COUNT(*) FILTER (WHERE quantity < 10) as low_stock_products
    FROM product;
END;
$$ LANGUAGE plpgsql;
