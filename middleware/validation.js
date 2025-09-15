const { body, validationResult } = require('express-validator');

// Middleware для обработки ошибок валидации
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Ошибка валидации',
      message: 'Проверьте правильность введенных данных',
      details: errors.array()
    });
  }
  next();
};

// Валидация регистрации пользователя
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Введите корректный email адрес'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Пароль должен содержать минимум 6 символов'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Имя должно содержать от 2 до 100 символов'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Фамилия должна содержать от 2 до 100 символов'),
  body('phoneNumber')
    .optional()
    .isMobilePhone('ru-RU')
    .withMessage('Введите корректный номер телефона'),
  handleValidationErrors
];

// Валидация входа в систему
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Введите корректный email адрес'),
  body('password')
    .notEmpty()
    .withMessage('Введите пароль'),
  handleValidationErrors
];

// Валидация товара
const validateProduct = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Название товара должно содержать от 2 до 255 символов'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Цена должна быть положительным числом'),
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Количество должно быть неотрицательным целым числом'),
  body('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID категории должен быть положительным целым числом'),
  body('manufacturerId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID производителя должен быть положительным целым числом'),
  handleValidationErrors
];

// Валидация заказа
const validateOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Заказ должен содержать хотя бы один товар'),
  body('items.*.productId')
    .isInt({ min: 1 })
    .withMessage('ID товара должен быть положительным целым числом'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Количество товара должно быть положительным целым числом'),
  handleValidationErrors
];

// Валидация обновления профиля клиента
const validateClientUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Имя должно содержать от 2 до 100 символов'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Фамилия должна содержать от 2 до 100 символов'),
  body('phoneNumber')
    .optional()
    .isMobilePhone('ru-RU')
    .withMessage('Введите корректный номер телефона'),
  body('deliveryAddress')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Адрес доставки не должен превышать 500 символов'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validateProduct,
  validateOrder,
  validateClientUpdate
};
