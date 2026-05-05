const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/Auth');

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
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

module.exports = router;
