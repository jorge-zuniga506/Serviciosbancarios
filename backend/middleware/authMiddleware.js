/**
 * Middleware de Autenticación y Autorización — Seguridad Bancaria
 * 
 * Principios:
 * 1. El JWT solo identifica al usuario (userId). El rol se verifica SIEMPRE en la BD.
 * 2. La cédula 120130740 es el ÚNICO admin autorizado del sistema.
 * 3. Cualquier intento de escalación de privilegios se detecta, bloquea y audita.
 */
const jwt = require('jsonwebtoken');
const { registrarAuditoria, getClientIP } = require('./auditLogger');

// ─── Admin autorizado por cédula (hardcoded, inmutable) ───
const ADMIN_CEDULA = '120130740';

const authMiddleware = (req, res, next) => {
  // Intentar obtener token de Authorization header o de cookies
  let token = req.cookies.token;
  
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({ message: 'No se proporcionó un token de acceso válido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // payload con userId y cedula
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'El token ha expirado. Por favor, inicia sesión nuevamente.' });
    }
    return res.status(403).json({ message: 'Token inválido.' });
  }
};

/**
 * requireAdmin — Verificación de admin en TIEMPO REAL contra la BD.
 * 
 * NO confía en el JWT para el rol. Consulta la BD para verificar:
 * 1. Que el usuario existe
 * 2. Que su cédula coincide con el admin autorizado (120130740)
 * 3. Que su campo role sigue siendo 'admin'
 * 
 * Si alguien manipuló la BD para darse admin pero no es la cédula autorizada → ALERTA.
 */
const requireAdmin = async (req, res, next) => {
  try {
    // Importación lazy para evitar dependencias circulares
    const { Usuario, Role } = require('../models');
    
    const usuario = await Usuario.findByPk(req.user.userId, {
      include: [{ model: Role, as: 'rol' }]
    });
    
    if (!usuario) {
      return res.status(403).json({ message: 'Usuario no encontrado. Sesión inválida.' });
    }

    // ── VERIFICACIÓN DE INTEGRIDAD DEL ROL ──
    // Esto previene que alguien cambie el role_id directamente en la base de datos
    if (!usuario.verifyRoleIntegrity()) {
       console.error(`🚨 [SECURITY_ALERT] Integridad de rol violada para Usuario ID:${usuario.id}. Posible manipulación de base de datos.`);
       await registrarAuditoria({
          tabla: 'Usuarios',
          registro_id: usuario.id,
          accion: 'ROLE_TAMPER_DETECTED',
          detalle: `Firma de rol inválida. El rol fue cambiado fuera de la aplicación.`,
          usuario_id: usuario.id,
          ip_address: getClientIP(req)
       });
       return res.status(403).json({ message: 'Error de seguridad: Integridad de cuenta comprometida.' });
    }

    // El nombre del rol se desencripta automáticamente gracias al getter en el modelo Role
    const nombreRol = usuario.rol ? usuario.rol.nombre : null;

    // ── Verificación primaria: ¿Es la cédula del admin autorizado? ──
    const esAdminAutorizado = usuario.cedula === ADMIN_CEDULA;
    
    if (!esAdminAutorizado) {
      // ── DETECCIÓN DE ATAQUE: Alguien tiene rol de admin pero no es la cédula autorizada ──
      if (nombreRol === 'ADMIN') {
        console.error(`🚨 [SECURITY_ALERT] Usuario ID:${usuario.id} (cédula:${usuario.cedula}) tiene rol ADMIN SIN autorización. Revirtiendo.`);
        
        // Buscar el rol USER (estamos asumiendo que el ID del rol USER existe, lo ideal es buscarlo por nombre)
        const userRole = await Role.findOne({ where: { nombre: 'USER' } }); // El getter manejará la comparación si usamos Sequelize hooks, pero findOne con where sobre campo encriptado es difícil.
        // Nota: Encriptamos 'ADMIN' y 'USER'. Para buscar por nombre encriptado necesitamos encriptar el término de búsqueda.
        // Pero como el getter/setter es automático, podemos intentar buscar. 
        // Sin embargo, Sequelize findOne(where) usa SQL raw, no pasa por el getter. 
        // Para simplificar, asumiremos IDs si son fijos, o buscaremos todos y filtraremos en JS.
        
        const roles = await Role.findAll();
        const userRoleObj = roles.find(r => r.nombre === 'USER');

        if (userRoleObj) {
           await usuario.update({ role_id: userRoleObj.id });
        }
        
        await registrarAuditoria({
          tabla: 'Usuarios',
          registro_id: usuario.id,
          accion: 'SECURITY_ALERT',
          detalle: `🚨 ESCALACIÓN DE PRIVILEGIOS DETECTADA Y REVERTIDA. Usuario ${usuario.cedula} tenía rol ADMIN sin autorización.`,
          usuario_id: usuario.id,
          ip_address: getClientIP(req)
        });
      }
      
      return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador.' });
    }

    // ── Verificación secundaria: Asegurar que el admin autorizado tenga el rol correcto ──
    if (nombreRol !== 'ADMIN') {
      console.warn(`⚠️ [SECURITY] Admin autorizado ${ADMIN_CEDULA} tenía rol ${nombreRol}. Restaurando a ADMIN.`);
      const roles = await Role.findAll();
      const adminRoleObj = roles.find(r => r.nombre === 'ADMIN');
      
      if (adminRoleObj) {
        await usuario.update({ role_id: adminRoleObj.id });
      }
      
      await registrarAuditoria({
        tabla: 'Usuarios',
        registro_id: usuario.id,
        accion: 'ROLE_RESTORED',
        detalle: `Rol de admin autorizado (${ADMIN_CEDULA}) fue restaurado automáticamente a ADMIN.`,
        usuario_id: usuario.id,
        ip_address: getClientIP(req)
      });
    }

    req.user.role = 'ADMIN';
    req.user.isVerifiedAdmin = true;
    next();
    
  } catch (error) {
    console.error('[REQUIRE_ADMIN_ERROR]', error.message);
    return res.status(500).json({ message: 'Error al verificar permisos.' });
  }
};

module.exports = { authMiddleware, requireAdmin, ADMIN_CEDULA };
