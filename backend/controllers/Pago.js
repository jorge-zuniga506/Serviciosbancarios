/**
 * Controlador de Pagos de Préstamos — Lógica Financiera Real
 * 
 * Flujo:
 * 1. Validar que el préstamo está aprobado
 * 2. Validar que la cuenta tiene saldo suficiente
 * 3. No permitir pagar más que el monto_restante
 * 4. Descontar de la cuenta, reducir deuda
 * 5. Registrar en el ledger como Pago_Prestamo
 * 6. Si deuda llega a 0, marcar préstamo como Pagado
 */
const { Pago, Prestamo, Cuenta, Transaccion, sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { registrarAuditoria, getClientIP } = require('../middleware/auditLogger');

const pagoController = {
  create: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { monto, prestamo_id, cuenta_id } = req.body;
      const ipAddress = getClientIP(req);
      const montoNum = parseFloat(monto);

      // Validar monto
      if (isNaN(montoNum) || montoNum <= 0) {
        await t.rollback();
        return res.status(400).json({ message: 'El monto del pago debe ser mayor a cero' });
      }

      // Buscar préstamo
      const prestamo = await Prestamo.findByPk(prestamo_id, { transaction: t });
      if (!prestamo) {
        await t.rollback();
        return res.status(404).json({ message: 'Préstamo no encontrado' });
      }

      if (prestamo.estado !== 'Aprobado') {
        await t.rollback();
        return res.status(400).json({ message: 'Solo se pueden realizar pagos a préstamos con estado "Aprobado"' });
      }

      // Validar ownership del préstamo
      if (req.user.role !== 'admin' && prestamo.usuario_id !== req.user.userId) {
        await t.rollback();
        return res.status(403).json({ message: 'No puedes realizar pagos a préstamos de otros usuarios' });
      }

      // No permitir pagar más que la deuda pendiente
      const montoRestante = parseFloat(prestamo.monto_restante);
      const montoReal = Math.min(montoNum, montoRestante);

      // Buscar y bloquear la cuenta
      const cuenta = await Cuenta.findByPk(cuenta_id, {
        lock: t.LOCK.UPDATE,
        transaction: t
      });
      if (!cuenta) {
        await t.rollback();
        return res.status(404).json({ message: 'Cuenta no encontrada' });
      }

      // Validar que la cuenta pertenece al usuario
      if (req.user.role !== 'admin' && cuenta.usuario_id !== req.user.userId) {
        await t.rollback();
        return res.status(403).json({ message: 'No puedes usar una cuenta que no te pertenece' });
      }

      if (cuenta.estado !== 'Activa') {
        await t.rollback();
        return res.status(403).json({ message: 'La cuenta no está activa' });
      }

      const saldoAnterior = parseFloat(cuenta.saldo);

      if (saldoAnterior < montoReal) {
        await t.rollback();
        return res.status(400).json({
          message: 'Saldo insuficiente para realizar el pago',
          saldo_disponible: saldoAnterior,
          monto_a_pagar: montoReal
        });
      }

      // Descontar de la cuenta
      cuenta.saldo = saldoAnterior - montoReal;
      await cuenta.save({ transaction: t });

      // Reducir deuda del préstamo
      prestamo.monto_restante = montoRestante - montoReal;
      if (parseFloat(prestamo.monto_restante) <= 0.005) { // tolerancia de centavos
        prestamo.monto_restante = 0;
        prestamo.estado = 'Pagado';
      }
      await prestamo.save({ transaction: t });

      // Registrar en el ledger
      const referencia = uuidv4();
      const transaccion = await Transaccion.create({
        referencia,
        monto: montoReal,
        tipo_transaccion: 'Pago_Prestamo',
        estado: 'Completada',
        descripcion: `Pago a préstamo #${prestamo_id} ($${montoReal.toFixed(2)})`,
        fecha: new Date(),
        cuenta_id: cuenta.id,
        ejecutado_por: req.user.userId,
        saldo_anterior_origen: saldoAnterior,
        saldo_posterior_origen: parseFloat(cuenta.saldo),
        ip_address: ipAddress
      }, { transaction: t });

      // Registrar el pago
      const nuevoPago = await Pago.create({
        monto: montoReal,
        prestamo_id,
        cuenta_id: cuenta.id,
        transaccion_id: transaccion.id,
        saldo_restante_despues: parseFloat(prestamo.monto_restante)
      }, { transaction: t });

      await t.commit();

      // Auditoría
      await registrarAuditoria({
        tabla: 'Pagos',
        registro_id: nuevoPago.id,
        accion: 'TRANSACCION',
        detalle: `Pago de $${montoReal.toFixed(2)} a préstamo #${prestamo_id}. Restante: $${parseFloat(prestamo.monto_restante).toFixed(2)}`,
        usuario_id: req.user.userId,
        ip_address: ipAddress
      });

      res.status(201).json({
        message: montoNum > montoRestante
          ? `Pago procesado. Se cobró $${montoReal.toFixed(2)} (ajustado al saldo restante del préstamo)`
          : 'Pago procesado exitosamente',
        pago: nuevoPago,
        prestamo_estado: prestamo.estado,
        deuda_restante: parseFloat(prestamo.monto_restante)
      });
    } catch (error) {
      try { await t.rollback(); } catch (e) { }
      console.error('[CREAR_PAGO]', error.message);
      res.status(500).json({ message: 'Error al procesar el pago. Ningún saldo fue modificado.' });
    }
  },

  getAll: async (req, res) => {
    try {
      let whereClause = {};
      if (req.user.role !== 'admin') {
        const prestamosUsuario = await Prestamo.findAll({ where: { usuario_id: req.user.userId } });
        const idsPrestamos = prestamosUsuario.map(p => p.id);
        const { Op } = require('sequelize');
        whereClause = { prestamo_id: { [Op.in]: idsPrestamos } };
      }
      const pagos = await Pago.findAll({
        where: whereClause,
        include: [
          { model: Prestamo, as: 'prestamo', attributes: ['id', 'monto', 'monto_restante', 'estado'] }
        ],
        order: [['created_at', 'DESC']]
      });
      res.json(pagos);
    } catch (error) {
      console.error('[GET_PAGOS]', error.message);
      res.status(500).json({ message: 'Error al obtener los pagos' });
    }
  },

  getByPrestamo: async (req, res) => {
    try {
      const pagos = await Pago.findAll({
        where: { prestamo_id: req.params.prestamoId },
        order: [['created_at', 'DESC']]
      });
      res.json(pagos);
    } catch (error) {
      console.error('[GET_PAGOS_BY_PRESTAMO]', error.message);
      res.status(500).json({ message: 'Error al obtener pagos del préstamo' });
    }
  }
};

module.exports = pagoController;
