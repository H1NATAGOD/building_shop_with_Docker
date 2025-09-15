// Мок-данные для тестирования приложения без базы данных
const mockData = {
  categories: [
    { id: 1, name: 'Цемент и бетон' },
    { id: 2, name: 'Кирпич и блоки' },
    { id: 3, name: 'Кровельные материалы' },
    { id: 4, name: 'Изоляционные материалы' },
    { id: 5, name: 'Отделочные материалы' },
    { id: 6, name: 'Инструменты' },
    { id: 7, name: 'Электрооборудование' }
  ],
  
  manufacturers: [
    { id: 1, name: 'Лафарж' },
    { id: 2, name: 'Кнауф' },
    { id: 3, name: 'ТехноНИКОЛЬ' },
    { id: 4, name: 'Роквул' },
    { id: 5, name: 'Пеноплэкс' },
    { id: 6, name: 'Керамин' },
    { id: 7, name: 'Белорусский кирпич' },
    { id: 8, name: 'Метрострой' },
    { id: 9, name: 'Стройматериалы' },
    { id: 10, name: 'Строитель' }
  ],
  
  products: [
    {
      id: 1,
      name: 'Цемент М400 50кг',
      price: 350,
      quantity: 200,
      category_id: 1,
      category_name: 'Цемент и бетон',
      manufacturer_id: 1,
      manufacturer_name: 'Лафарж'
    },
    {
      id: 2,
      name: 'Цемент М500 50кг',
      price: 420,
      quantity: 150,
      category_id: 1,
      category_name: 'Цемент и бетон',
      manufacturer_id: 1,
      manufacturer_name: 'Лафарж'
    },
    {
      id: 3,
      name: 'Кирпич керамический одинарный',
      price: 12,
      quantity: 10000,
      category_id: 2,
      category_name: 'Кирпич и блоки',
      manufacturer_id: 6,
      manufacturer_name: 'Керамин'
    },
    {
      id: 4,
      name: 'Кирпич силикатный полуторный',
      price: 15,
      quantity: 8000,
      category_id: 2,
      category_name: 'Кирпич и блоки',
      manufacturer_id: 7,
      manufacturer_name: 'Белорусский кирпич'
    },
    {
      id: 5,
      name: 'Газобетонный блок 600x300x200',
      price: 180,
      quantity: 500,
      category_id: 2,
      category_name: 'Кирпич и блоки',
      manufacturer_id: 8,
      manufacturer_name: 'Метрострой'
    },
    {
      id: 6,
      name: 'Профнастил С8 0.5мм',
      price: 450,
      quantity: 100,
      category_id: 3,
      category_name: 'Кровельные материалы',
      manufacturer_id: 3,
      manufacturer_name: 'ТехноНИКОЛЬ'
    },
    {
      id: 7,
      name: 'Металлочерепица Монтеррей',
      price: 650,
      quantity: 80,
      category_id: 3,
      category_name: 'Кровельные материалы',
      manufacturer_id: 3,
      manufacturer_name: 'ТехноНИКОЛЬ'
    },
    {
      id: 8,
      name: 'Минеральная вата 100мм',
      price: 1200,
      quantity: 60,
      category_id: 4,
      category_name: 'Изоляционные материалы',
      manufacturer_id: 4,
      manufacturer_name: 'Роквул'
    },
    {
      id: 9,
      name: 'Пенополистирол 50мм',
      price: 800,
      quantity: 100,
      category_id: 4,
      category_name: 'Изоляционные материалы',
      manufacturer_id: 5,
      manufacturer_name: 'Пеноплэкс'
    },
    {
      id: 10,
      name: 'Гипсокартон 12.5мм',
      price: 320,
      quantity: 200,
      category_id: 5,
      category_name: 'Отделочные материалы',
      manufacturer_id: 2,
      manufacturer_name: 'Кнауф'
    },
    {
      id: 11,
      name: 'Керамическая плитка 30x30',
      price: 850,
      quantity: 150,
      category_id: 5,
      category_name: 'Отделочные материалы',
      manufacturer_id: 6,
      manufacturer_name: 'Керамин'
    },
    {
      id: 12,
      name: 'Ламинат 8мм',
      price: 1200,
      quantity: 80,
      category_id: 5,
      category_name: 'Отделочные материалы',
      manufacturer_id: 9,
      manufacturer_name: 'Стройматериалы'
    },
    {
      id: 13,
      name: 'Перфоратор Bosch',
      price: 15000,
      quantity: 15,
      category_id: 6,
      category_name: 'Инструменты',
      manufacturer_id: 10,
      manufacturer_name: 'Строитель'
    },
    {
      id: 14,
      name: 'Дрель-шуруповерт',
      price: 8500,
      quantity: 25,
      category_id: 6,
      category_name: 'Инструменты',
      manufacturer_id: 10,
      manufacturer_name: 'Строитель'
    },
    {
      id: 15,
      name: 'Провод ВВГ 3x2.5',
      price: 85,
      quantity: 1000,
      category_id: 7,
      category_name: 'Электрооборудование',
      manufacturer_id: 9,
      manufacturer_name: 'Стройматериалы'
    },
    {
      id: 16,
      name: 'Розетка с заземлением',
      price: 150,
      quantity: 500,
      category_id: 7,
      category_name: 'Электрооборудование',
      manufacturer_id: 9,
      manufacturer_name: 'Стройматериалы'
    },
    {
      id: 17,
      name: 'Песок речной 1т',
      price: 800,
      quantity: 50,
      category_id: 1,
      category_name: 'Цемент и бетон',
      manufacturer_id: 8,
      manufacturer_name: 'Метрострой'
    },
    {
      id: 18,
      name: 'Щебень фракция 20-40',
      price: 1200,
      quantity: 40,
      category_id: 1,
      category_name: 'Цемент и бетон',
      manufacturer_id: 8,
      manufacturer_name: 'Метрострой'
    },
    {
      id: 19,
      name: 'Рубероид РКК-350',
      price: 180,
      quantity: 200,
      category_id: 3,
      category_name: 'Кровельные материалы',
      manufacturer_id: 3,
      manufacturer_name: 'ТехноНИКОЛЬ'
    },
    {
      id: 20,
      name: 'Утеплитель базальтовый 100мм',
      price: 1400,
      quantity: 80,
      category_id: 4,
      category_name: 'Изоляционные материалы',
      manufacturer_id: 4,
      manufacturer_name: 'Роквул'
    }
  ],
  
  users: [
    {
      id: 1,
      email: 'admin@example.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Qz8K2O', // password: admin123
      firstName: 'Администратор',
      lastName: 'Системы',
      role: 'admin'
    },
    {
      id: 2,
      email: 'user@example.com',
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Qz8K2O', // password: admin123
      firstName: 'Пользователь',
      lastName: 'Тестовый',
      role: 'user'
    }
  ],
  
  orders: [
    {
      id: 1,
      client_id: 2,
      first_name: 'Пользователь',
      last_name: 'Тестовый',
      all_price: 4300,
      rowstatus: 'новый',
      created_at: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      client_id: 2,
      first_name: 'Пользователь',
      last_name: 'Тестовый',
      all_price: 1800,
      rowstatus: 'обрабатывается',
      created_at: '2024-01-14T14:20:00Z'
    }
  ],
  
  clients: [
    {
      id: 1,
      first_name: 'Администратор',
      last_name: 'Системы',
      email: 'admin@example.com',
      phone_number: '+7 (999) 123-45-67',
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      first_name: 'Пользователь',
      last_name: 'Тестовый',
      email: 'user@example.com',
      phone_number: '+7 (999) 987-65-43',
      created_at: '2024-01-10T12:00:00Z'
    }
  ]
};

module.exports = mockData;
