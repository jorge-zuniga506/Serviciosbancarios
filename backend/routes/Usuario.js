const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/Usuario');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

// Crear usuario — Solo admin
router.post('/', authMiddleware, requireAdmin, usuarioController.create);

// Listar todos — Solo admin
router.get('/', authMiddleware, requireAdmin, usuarioController.getAll);

// Ver perfil por ID — Admin ve cualquiera, user solo el suyo (validado en controller)
router.get('/:id', authMiddleware, usuarioController.getById);

// Editar perfil — Admin edita cualquiera, user solo el suyo (validado en controller)
router.put('/:id', authMiddleware, usuarioController.update);

// Eliminar — Solo admin
router.delete('/:id', authMiddleware, requireAdmin, usuarioController.delete);

module.exports = router;
