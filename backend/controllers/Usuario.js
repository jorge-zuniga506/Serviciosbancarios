/**
 * Controlador de Usuarios — Blindado contra escalación de privilegios
 * 
 * Reglas:
 * 1. NUNCA se acepta el campo 'role' desde el body de una request.
 * 2. Solo el admin autorizado (120130740) puede crear/eliminar usuarios.
 * 3. Un usuario normal solo puede ver/editar su PROPIO perfil.
 * 4. Cambio de rol tiene endpoint dedicado con auditoría completa.
 */
const { Usuario } = require('../models');
const { registrarAuditoria, getClientIP } = require('../middleware/auditLogger');
const { ADMIN_CEDULA } = require('../middleware/authMiddleware');

// Campos que un usuario NUNCA puede modificar por API
const CAMPOS_PROHIBIDOS = ['role', 'role_id', 'role_signature', 'id', 'created_at', 'updated_at'];

// Campos permitidos para auto-edición
const CAMPOS_EDITABLES = ['nombre', 'apellido', 'email', 'telefono', 'direccion', 'fecha_nacimiento', 'password'];

function stripCamposProhibidos(body) {
  const limpio = { ...body };
  CAMPOS_PROHIBIDOS.forEach(campo => delete limpio[campo]);
  return limpio;
}

const usuarioController = {
  /**
   * Crear usuario — Solo admin.
   * El rol SIEMPRE se fuerza a 'user' para nuevos usuarios.
   */
  create: async (req, res) => {
    try {
      const { Role } = require('../models');
      const datosLimpios = stripCamposProhibidos(req.body);
      
      // Buscar el rol USER por defecto
      const roles = await Role.findAll();
      const userRole = roles.find(r => r.nombre === 'USER');
      
      datosLimpios.role_id = userRole ? userRole.id : null;

      const nuevoUsuario = await Usuario.create(datosLimpios);

      await registrarAuditoria({
        tabla: 'Usuarios',
        registro_id: nuevoUsuario.id,
        accion: 'CREATE',
        detalle: `Usuario creado por admin ${req.user.userId}`,
        usuario_id: req.user.userId,
        ip_address: getClientIP(req)
      });

      res.status(201).json(nuevoUsuario);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Obtener todos los usuarios — Solo admin (protegido en rutas).
   */
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

  /**
   * Obtener usuario por ID.
   * - Admin: puede ver cualquiera.
   * - User: solo puede ver su propio perfil.
   */
  getById: async (req, res) => {
    try {
      const targetId = parseInt(req.params.id);

      // Verificación de propiedad (a menos que sea admin verificado)
      if (!req.user.isVerifiedAdmin && req.user.userId !== targetId) {
        await registrarAuditoria({
          tabla: 'Usuarios',
          registro_id: targetId,
          accion: 'UNAUTHORIZED_ACCESS',
          detalle: `Usuario ${req.user.userId} intentó ver perfil de usuario ${targetId}`,
          usuario_id: req.user.userId,
          ip_address: getClientIP(req)
        });
        return res.status(403).json({ message: 'No tienes permisos para ver este perfil.' });
      }

      const usuario = await Usuario.findByPk(targetId, {
        include: ['cuentas', 'prestamos', 'beneficiarios', 'notificaciones']
      });
      if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
      res.json(usuario);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Actualizar usuario.
   * - User: solo puede editar SU PROPIO perfil, campos limitados.
   * - Admin: puede editar cualquiera, pero NUNCA el campo 'role' por aquí.
   */
  update: async (req, res) => {
    try {
      const targetId = parseInt(req.params.id);

      // Verificación de propiedad
      if (!req.user.isVerifiedAdmin && req.user.userId !== targetId) {
        await registrarAuditoria({
          tabla: 'Usuarios',
          registro_id: targetId,
          accion: 'UNAUTHORIZED_EDIT',
          detalle: `Usuario ${req.user.userId} intentó editar perfil de usuario ${targetId}`,
          usuario_id: req.user.userId,
          ip_address: getClientIP(req)
        });
        return res.status(403).json({ message: 'No tienes permisos para editar este perfil.' });
      }

      // ── DETECCIÓN DE ATAQUE: Intento de cambiar rol ──
      if (req.body.role !== undefined || req.body.role_id !== undefined || req.body.role_signature !== undefined) {
        console.error(`🚨 [SECURITY_ALERT] Usuario ${req.user.userId} intentó cambiar campos de rol via PUT /usuarios/${targetId}`);
        await registrarAuditoria({
          tabla: 'Usuarios',
          registro_id: targetId,
          accion: 'PRIVILEGE_ESCALATION_ATTEMPT',
          detalle: `🚨 Usuario ${req.user.userId} intentó asignar rol o firma a usuario ${targetId} via API. BLOQUEADO.`,
          usuario_id: req.user.userId,
          ip_address: getClientIP(req)
        });
        return res.status(403).json({ message: 'No está permitido modificar roles por esta vía. Intento registrado.' });
      }

      // Filtrar campos permitidos
      const datosLimpios = {};
      const camposPermitidos = req.user.isVerifiedAdmin ? [...CAMPOS_EDITABLES, 'cedula'] : CAMPOS_EDITABLES;
      for (const campo of camposPermitidos) {
        if (req.body[campo] !== undefined) {
          datosLimpios[campo] = req.body[campo];
        }
      }

      const [updated] = await Usuario.update(datosLimpios, {
        where: { id: targetId },
        individualHooks: true // para que se hashee el password si cambia
      });
      if (!updated) return res.status(404).json({ message: 'Usuario no encontrado' });

      const usuarioActualizado = await Usuario.findByPk(targetId);
      res.json(usuarioActualizado);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  /**
   * Eliminar usuario — Solo admin. No puede eliminarse a sí mismo.
   */
  delete: async (req, res) => {
    try {
      const targetId = parseInt(req.params.id);

      // Protección: admin no puede eliminarse a sí mismo
      if (req.user.userId === targetId) {
        return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta de administrador.' });
      }

      // Protección: no se puede eliminar al admin autorizado
      const target = await Usuario.findByPk(targetId);
      if (target && target.cedula === ADMIN_CEDULA) {
        return res.status(403).json({ message: 'No se puede eliminar la cuenta del administrador principal.' });
      }

      const deleted = await Usuario.destroy({ where: { id: targetId } });
      if (!deleted) return res.status(404).json({ message: 'Usuario no encontrado' });

      await registrarAuditoria({
        tabla: 'Usuarios',
        registro_id: targetId,
        accion: 'DELETE',
        detalle: `Usuario ${targetId} eliminado por admin ${req.user.userId}`,
        usuario_id: req.user.userId,
        ip_address: getClientIP(req)
      });

      res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = usuarioController;
