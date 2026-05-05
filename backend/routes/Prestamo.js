const express = require('express');
const router = express.Router();
const prestamoController = require('../controllers/Prestamo');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

// Solicitar préstamo (cualquier usuario autenticado)
router.post('/', authMiddleware, prestamoController.create);

// Listar préstamos (admin ve todos, user ve los suyos)
router.get('/', authMiddleware, prestamoController.getAll);

// Aprobar/Rechazar (solo admin)
router.put('/:id/estado', authMiddleware, requireAdmin, prestamoController.updateStatus);

module.exports = router;
