const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/Pago');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, pagoController.create);
router.get('/', authMiddleware, pagoController.getAll);
router.get('/prestamo/:prestamoId', authMiddleware, pagoController.getByPrestamo);

module.exports = router;
