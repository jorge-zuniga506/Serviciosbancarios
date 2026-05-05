const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/Usuario');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, usuarioController.create);
router.get('/', authMiddleware, requireAdmin, usuarioController.getAll);
router.get('/:id', authMiddleware, usuarioController.getById);
router.put('/:id', authMiddleware, usuarioController.update);
router.delete('/:id', authMiddleware, usuarioController.delete);

module.exports = router;
