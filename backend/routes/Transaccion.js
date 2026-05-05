const express = require('express');
const router = express.Router();
const transaccionController = require('../controllers/Transaccion');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validarTransaccion } = require('../middleware/validators');

// Crear transacción: auth + validación de inputs
router.post('/', authMiddleware, validarTransaccion, transaccionController.create);

// Historial
router.get('/', authMiddleware, transaccionController.getAll);

// Por cuenta
router.get('/cuenta/:cuentaId', authMiddleware, transaccionController.getByCuenta);

module.exports = router;
