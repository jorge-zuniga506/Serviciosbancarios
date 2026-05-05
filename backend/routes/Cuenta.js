const express = require('express');
const router = express.Router();
const cuentaController = require('../controllers/Cuenta');
const { authMiddleware, requireAdmin } = require('../middleware/authMiddleware');

router.post('/', authMiddleware, cuentaController.create);
router.get('/', authMiddleware, cuentaController.getAll);
router.get('/:id', authMiddleware, cuentaController.getById);

module.exports = router;
