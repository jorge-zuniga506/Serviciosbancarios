/**
 * Controlador de Cuentas — Lógica Financiera Real
 * 
 * Reglas:
 * 1. Un usuario solo puede crear cuentas para sí mismo
 * 2. El número de cuenta se genera automáticamente en el servidor (no confiar en el cliente)
 * 3. Saldo inicial solo permitido para admin (un usuario real debe depositar dinero)
 * 4. Se valida estado de cuenta en todas las operaciones
 */
const { Cuenta, Usuario } = require('../models');
const { registrarAuditoria, getClientIP } = require('../middleware/auditLogger');
const crypto = require('crypto');

/**
 * Genera un número de cuenta bancario seguro y único.
 * Formato: CTA-XXXXXXXXXX (10 dígitos aleatorios criptográficos)
 */
function generarNumeroCuenta() {
  const numeros = crypto.randomInt(1000000000, 9999999999);
  return `CTA-${numeros}`;
}

const cuentaController = {
  create: async (req, res) => {
    try {
      const { tipo_cuenta, moneda } = req.body;
      const ipAddress = getClientIP(req);

      // Validar tipo de cuenta
      const tiposValidos = ['Ahorros', 'Corriente'];
      if (!tiposValidos.includes(tipo_cuenta)) {
        return res.status(400).json({ message: `Tipo de cuenta inválido. Opciones: ${tiposValidos.join(', ')}` });
      }

      // Validar moneda
      const monedasValidas = ['USD', 'MXN', 'EUR'];
      const monedaFinal = monedasValidas.includes(moneda) ? moneda : 'USD';

      // SEGURIDAD: el usuario_id siempre viene del token, nunca del body
      const usuario_id = req.user.userId;

      // Verificar que el usuario existe
      const usuario = await Usuario.findByPk(usuario_id);
      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      // Limitar cantidad de cuentas por usuario (prevenir abuso)
      const cuentasExistentes = await Cuenta.count({ where: { usuario_id } });
      if (cuentasExistentes >= 5) {
        return res.status(400).json({ message: 'Has alcanzado el límite máximo de 5 cuentas bancarias' });
      }

      // Generar número de cuenta único en el servidor
      let numero_cuenta;
      let intentos = 0;
      do {
        numero_cuenta = generarNumeroCuenta();
        const existe = await Cuenta.findOne({ where: { numero_cuenta } });
        if (!existe) break;
        intentos++;
      } while (intentos < 10);

      if (intentos >= 10) {
        return res.status(500).json({ message: 'Error al generar número de cuenta. Intenta nuevamente.' });
      }

      // Saldo inicial = 0 siempre para usuarios normales
      // Solo admin puede asignar saldo inicial (ej: promociones)
      const saldoInicial = req.user.role === 'admin' ? (parseFloat(req.body.saldo) || 0) : 0;

      const nuevaCuenta = await Cuenta.create({
        numero_cuenta,
        tipo_cuenta,
        moneda: monedaFinal,
        saldo: saldoInicial,
        estado: 'Activa',
        usuario_id
      });

      // Auditoría
      await registrarAuditoria({
        tabla: 'Cuentas',
        registro_id: nuevaCuenta.id,
        accion: 'CREATE',
        detalle: `Nueva cuenta ${numero_cuenta} (${tipo_cuenta}, ${monedaFinal}) para usuario ${usuario_id}`,
        usuario_id: req.user.userId,
        ip_address: ipAddress
      });

      res.status(201).json({
        message: 'Cuenta creada exitosamente',
        cuenta: nuevaCuenta
      });
    } catch (error) {
      console.error('[CREAR_CUENTA]', error.message);
      res.status(400).json({ message: 'Error al crear la cuenta' });
    }
  },

  getAll: async (req, res) => {
    try {
      const whereClause = req.user.role === 'admin' ? {} : { usuario_id: req.user.userId };
      const cuentas = await Cuenta.findAll({
        where: whereClause,
        include: [
          { model: require('../models').Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido', 'email'] }
        ],
        order: [['created_at', 'DESC']]
      });
      res.json(cuentas);
    } catch (error) {
      console.error('[GET_CUENTAS]', error.message);
      res.status(500).json({ message: 'Error al obtener las cuentas' });
    }
  },

  getById: async (req, res) => {
    try {
      const cuenta = await Cuenta.findByPk(req.params.id, {
        include: ['usuario', 'tarjetas']
      });
      if (!cuenta) return res.status(404).json({ message: 'Cuenta no encontrada' });
      
      // Validar acceso
      if (req.user.role !== 'admin' && cuenta.usuario_id !== req.user.userId) {
        return res.status(403).json({ message: 'No tienes acceso a esta cuenta' });
      }

      res.json(cuenta);
    } catch (error) {
      console.error('[GET_CUENTA_BY_ID]', error.message);
      res.status(500).json({ message: 'Error al obtener la cuenta' });
    }
  }
};

module.exports = cuentaController;
