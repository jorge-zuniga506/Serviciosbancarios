const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/Auth');
const { authMiddleware } = require('../middleware/authMiddleware');

const loginValidation = [
  body('cedula').notEmpty().isNumeric(),
  body('password').notEmpty()
];

const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('cedula').notEmpty().isNumeric(),
  body('nombre').notEmpty().trim()
];

router.post('/login', loginValidation, authController.login);
router.post('/register', registerValidation, authController.register);
router.get('/cedula/:cedula', authController.getCedula);

// Perfil actual del usuario con rol REAL desde la BD
router.get('/me', authMiddleware, authController.me);
router.get('/logout', authController.logout);

module.exports = router;
