/**
 * Middleware de validación de inputs financieros.
 * Previene inyección de datos, montos negativos y campos faltantes.
 */

/**
 * Valida que un monto sea un número positivo válido.
 */
function validarMonto(valor, campo = 'monto') {
  const monto = parseFloat(valor);
  if (isNaN(monto) || !isFinite(monto)) {
    return { valido: false, mensaje: `El campo '${campo}' debe ser un número válido` };
  }
  if (monto <= 0) {
    return { valido: false, mensaje: `El campo '${campo}' debe ser mayor a cero` };
  }
  if (monto > 999999999.99) {
    return { valido: false, mensaje: `El campo '${campo}' excede el límite permitido` };
  }
  // Máximo 2 decimales
  const partes = valor.toString().split('.');
  if (partes[1] && partes[1].length > 2) {
    return { valido: false, mensaje: `El campo '${campo}' permite máximo 2 decimales` };
  }
  return { valido: true, monto };
}

/**
 * Valida que un ID sea un entero positivo.
 */
function validarId(valor, campo = 'id') {
  const id = parseInt(valor, 10);
  if (isNaN(id) || id <= 0 || id.toString() !== valor.toString()) {
    return { valido: false, mensaje: `El campo '${campo}' debe ser un ID válido (entero positivo)` };
  }
  return { valido: true, id };
}

/**
 * Sanitiza un string: elimina HTML, scripts, y limita longitud.
 */
function sanitizarString(valor, maxLength = 255) {
  if (typeof valor !== 'string') return '';
  return valor
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/[<>'"`;]/g, '') // strip peligrosos
    .trim()
    .substring(0, maxLength);
}

/**
 * Middleware Express que valida body de transacciones.
 */
function validarTransaccion(req, res, next) {
  const { monto, tipo_transaccion, cuenta_id } = req.body;

  if (!monto || !tipo_transaccion || !cuenta_id) {
    return res.status(400).json({ message: 'Campos requeridos: monto, tipo_transaccion, cuenta_id' });
  }

  const validacionMonto = validarMonto(monto);
  if (!validacionMonto.valido) {
    return res.status(400).json({ message: validacionMonto.mensaje });
  }

  const tiposValidos = ['Transferencia', 'Deposito', 'Retiro'];
  if (!tiposValidos.includes(tipo_transaccion)) {
    return res.status(400).json({ message: `Tipo de transacción inválido. Opciones: ${tiposValidos.join(', ')}` });
  }

  const validacionCuenta = validarId(cuenta_id, 'cuenta_id');
  if (!validacionCuenta.valido) {
    return res.status(400).json({ message: validacionCuenta.mensaje });
  }

  if (tipo_transaccion === 'Transferencia') {
    const { cuenta_destino_id } = req.body;
    if (!cuenta_destino_id) {
      return res.status(400).json({ message: 'Se requiere cuenta_destino_id para transferencias' });
    }
    const validacionDestino = validarId(cuenta_destino_id, 'cuenta_destino_id');
    if (!validacionDestino.valido) {
      return res.status(400).json({ message: validacionDestino.mensaje });
    }
    if (parseInt(cuenta_id) === parseInt(cuenta_destino_id)) {
      return res.status(400).json({ message: 'La cuenta origen y destino no pueden ser la misma' });
    }
  }

  next();
}

/**
 * Middleware Express que valida body de pagos.
 */
function validarPago(req, res, next) {
  const { monto, prestamo_id, cuenta_id } = req.body;

  if (!monto || !prestamo_id || !cuenta_id) {
    return res.status(400).json({ message: 'Campos requeridos: monto, prestamo_id, cuenta_id' });
  }

  const validacionMonto = validarMonto(monto);
  if (!validacionMonto.valido) {
    return res.status(400).json({ message: validacionMonto.mensaje });
  }

  next();
}

module.exports = {
  validarMonto,
  validarId,
  sanitizarString,
  validarTransaccion,
  validarPago
};
