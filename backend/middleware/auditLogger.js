/**
 * Servicio de Auditoría - Registra todas las acciones importantes del sistema
 * Diseñado para trazabilidad completa tipo sistema financiero.
 */
const { Auditoria } = require('../models');

/**
 * Obtiene la IP real del cliente, manejando proxies
 */
function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
}

/**
 * Registra un evento de auditoría en la base de datos.
 * No lanza errores: la auditoría nunca debe bloquear operaciones financieras.
 */
async function registrarAuditoria({ tabla, registro_id, accion, detalle, datos_anteriores, datos_nuevos, usuario_id, ip_address }) {
  try {
    await Auditoria.create({
      tabla,
      registro_id: registro_id || null,
      accion,
      detalle: typeof detalle === 'object' ? JSON.stringify(detalle) : detalle,
      datos_anteriores: datos_anteriores ? JSON.stringify(datos_anteriores) : null,
      datos_nuevos: datos_nuevos ? JSON.stringify(datos_nuevos) : null,
      usuario_id: usuario_id || null,
      ip_address: ip_address || null,
      fecha: new Date()
    });
  } catch (error) {
    // Auditoría NUNCA debe impedir una operación financiera.
    // Se loguea a consola como fallback.
    console.error('[AUDIT_FAILURE]', { tabla, accion, detalle, error: error.message });
  }
}

module.exports = { registrarAuditoria, getClientIP };
