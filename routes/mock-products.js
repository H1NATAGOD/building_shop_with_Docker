const express = require('express');
const mockData = require('./mock-data');

const router = express.Router();

// Получение всех товаров с фильтрацией и пагинацией
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      manufacturer,
      search,
      minPrice,
      maxPrice,
      inStock = false
    } = req.query;

    let filteredProducts = [...mockData.products];

    // Поиск по названию
    if (search) {
      filteredProducts = filteredProducts.filter(product =>
        product.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Фильтр по категории
    if (category) {
      filteredProducts = filteredProducts.filter(product =>
        product.category_id == category
      );
    }

    // Фильтр по производителю
    if (manufacturer) {
      filteredProducts = filteredProducts.filter(product =>
        product.manufacturer_id == manufacturer
      );
    }

    // Фильтр по цене
    if (minPrice) {
      filteredProducts = filteredProducts.filter(product =>
        product.price >= parseFloat(minPrice)
      );
    }

    if (maxPrice) {
      filteredProducts = filteredProducts.filter(product =>
        product.price <= parseFloat(maxPrice)
      );
    }

    // Фильтр по наличию на складе
    if (inStock === 'true') {
      filteredProducts = filteredProducts.filter(product =>
        product.quantity > 0
      );
    }

    // Пагинация
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / limit);

    res.json({
      products: paginatedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Ошибка получения товаров:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось получить список товаров'
    });
  }
});

// Получение товара по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = mockData.products.find(p => p.id == id);

    if (!product) {
      return res.status(404).json({
        error: 'Товар не найден',
        message: 'Товар с указанным ID не существует'
      });
    }

    res.json({ product });

  } catch (error) {
    console.error('Ошибка получения товара:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось получить информацию о товаре'
    });
  }
});

// Создание нового товара
router.post('/', async (req, res) => {
  try {
    const { name, price, quantity, categoryId, manufacturerId } = req.body;

    const newProduct = {
      id: mockData.products.length + 1,
      name,
      price: parseFloat(price),
      quantity: parseInt(quantity),
      category_id: categoryId ? parseInt(categoryId) : null,
      category_name: categoryId ? mockData.categories.find(c => c.id == categoryId)?.name : null,
      manufacturer_id: manufacturerId ? parseInt(manufacturerId) : null,
      manufacturer_name: manufacturerId ? mockData.manufacturers.find(m => m.id == manufacturerId)?.name : null
    };

    mockData.products.push(newProduct);

    res.status(201).json({
      message: 'Товар успешно создан',
      product: newProduct
    });

  } catch (error) {
    console.error('Ошибка создания товара:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось создать товар'
    });
  }
});

// Обновление товара
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, quantity, categoryId, manufacturerId } = req.body;

    const productIndex = mockData.products.findIndex(p => p.id == id);
    if (productIndex === -1) {
      return res.status(404).json({
        error: 'Товар не найден',
        message: 'Товар с указанным ID не существует'
      });
    }

    const updatedProduct = {
      ...mockData.products[productIndex],
      name,
      price: parseFloat(price),
      quantity: parseInt(quantity),
      category_id: categoryId ? parseInt(categoryId) : null,
      category_name: categoryId ? mockData.categories.find(c => c.id == categoryId)?.name : null,
      manufacturer_id: manufacturerId ? parseInt(manufacturerId) : null,
      manufacturer_name: manufacturerId ? mockData.manufacturers.find(m => m.id == manufacturerId)?.name : null
    };

    mockData.products[productIndex] = updatedProduct;

    res.json({
      message: 'Товар успешно обновлен',
      product: updatedProduct
    });

  } catch (error) {
    console.error('Ошибка обновления товара:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось обновить товар'
    });
  }
});

// Удаление товара
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const productIndex = mockData.products.findIndex(p => p.id == id);

    if (productIndex === -1) {
      return res.status(404).json({
        error: 'Товар не найден',
        message: 'Товар с указанным ID не существует'
      });
    }

    mockData.products.splice(productIndex, 1);

    res.json({
      message: 'Товар успешно удален'
    });

  } catch (error) {
    console.error('Ошибка удаления товара:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось удалить товар'
    });
  }
});

// Получение всех категорий
router.get('/categories/all', async (req, res) => {
  try {
    res.json({ categories: mockData.categories });
  } catch (error) {
    console.error('Ошибка получения категорий:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось получить список категорий'
    });
  }
});

// Получение всех производителей
router.get('/manufacturers/all', async (req, res) => {
  try {
    res.json({ manufacturers: mockData.manufacturers });
  } catch (error) {
    console.error('Ошибка получения производителей:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось получить список производителей'
    });
  }
});

// Создание новой категории
router.post('/categories', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        error: 'Неверные данные',
        message: 'Название категории не может быть пустым'
      });
    }

    const newCategory = {
      id: mockData.categories.length + 1,
      name: name.trim()
    };

    mockData.categories.push(newCategory);

    res.status(201).json({
      message: 'Категория успешно создана',
      category: newCategory
    });

  } catch (error) {
    console.error('Ошибка создания категории:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось создать категорию'
    });
  }
});

// Создание нового производителя
router.post('/manufacturers', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        error: 'Неверные данные',
        message: 'Название производителя не может быть пустым'
      });
    }

    const newManufacturer = {
      id: mockData.manufacturers.length + 1,
      name: name.trim()
    };

    mockData.manufacturers.push(newManufacturer);

    res.status(201).json({
      message: 'Производитель успешно создан',
      manufacturer: newManufacturer
    });

  } catch (error) {
    console.error('Ошибка создания производителя:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось создать производителя'
    });
  }
});

// Удаление категории
router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const categoryIndex = mockData.categories.findIndex(c => c.id == id);

    if (categoryIndex === -1) {
      return res.status(404).json({
        error: 'Категория не найдена',
        message: 'Категория с указанным ID не существует'
      });
    }

    mockData.categories.splice(categoryIndex, 1);

    res.json({
      message: 'Категория успешно удалена'
    });

  } catch (error) {
    console.error('Ошибка удаления категории:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось удалить категорию'
    });
  }
});

// Удаление производителя
router.delete('/manufacturers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const manufacturerIndex = mockData.manufacturers.findIndex(m => m.id == id);

    if (manufacturerIndex === -1) {
      return res.status(404).json({
        error: 'Производитель не найден',
        message: 'Производитель с указанным ID не существует'
      });
    }

    mockData.manufacturers.splice(manufacturerIndex, 1);

    res.json({
      message: 'Производитель успешно удален'
    });

  } catch (error) {
    console.error('Ошибка удаления производителя:', error);
    res.status(500).json({
      error: 'Ошибка сервера',
      message: 'Не удалось удалить производителя'
    });
  }
});

module.exports = router;

