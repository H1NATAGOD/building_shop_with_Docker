-- Миграция для добавления полей доставки в таблицу order

-- Добавляем поля для доставки
ALTER TABLE "order" 
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS delivery_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS delivery_date DATE,
ADD COLUMN IF NOT EXISTS delivery_time VARCHAR(20),
ADD COLUMN IF NOT EXISTS comment TEXT;

-- Добавляем индексы для новых полей
CREATE INDEX IF NOT EXISTS idx_order_delivery_date ON "order"(delivery_date);
CREATE INDEX IF NOT EXISTS idx_order_delivery_phone ON "order"(delivery_phone);

-- Add role column to user and set admin role
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- Set admin role for seeded admin user
UPDATE "user" SET role = 'admin' WHERE email = 'admin@store.com';