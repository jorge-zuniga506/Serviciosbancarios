const { Usuario } = require('../models');

const usuarioController = {
  // Crear un nuevo usuario
  create: async (req, res) => {
    try {
      const nuevoUsuario = await Usuario.create(req.body);
      res.status(201).json(nuevoUsuario);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Obtener todos los usuarios
  getAll: async (req, res) => {
    try {
      const usuarios = await Usuario.findAll({
        include: ['cuentas', 'prestamos']
      });
      res.json(usuarios);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener un usuario por ID
  getById: async (req, res) => {
    try {
      const usuario = await Usuario.findByPk(req.params.id, {
        include: ['cuentas', 'prestamos', 'beneficiarios', 'notificaciones']
      });
      if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
      res.json(usuario);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Actualizar un usuario
  update: async (req, res) => {
    try {
      const [updated] = await Usuario.update(req.body, {
        where: { id: req.params.id }
      });
      if (!updated) return res.status(404).json({ message: 'Usuario no encontrado' });
      const usuarioActualizado = await Usuario.findByPk(req.params.id);
      res.json(usuarioActualizado);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  // Eliminar un usuario
  delete: async (req, res) => {
    try {
      const deleted = await Usuario.destroy({
        where: { id: req.params.id }
      });
      if (!deleted) return res.status(404).json({ message: 'Usuario no encontrado' });
      res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = usuarioController;
