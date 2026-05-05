/**
 * Controlador de Transacciones — Lógica Financiera Real
 * 
 * Principios implementados:
 * 1. Transacciones SQL con BEGIN/COMMIT/ROLLBACK
 * 2. Row-level locking (SELECT ... FOR UPDATE) para evitar race conditions
 * 3. Idempotencia via UUID de referencia (previene doble gasto)
 * 4. Validación de ownership (solo operar con tus propias cuentas)
 * 5. Snapshots de saldo antes/después para auditoría perfecta
 * 6. Registro en el ledger inmutable
 */
const { Transaccion, Cuenta, Usuario, sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { registrarAuditoria, getClientIP } = require('../middleware/auditLogger');

const transaccionController = {
  /**
   * Crear una transacción financiera real.
   * Flujo:
   *   1. Generar referencia UUID (idempotencia)
   *   2. Abrir transacción SQL
   *   3. Bloquear filas con FOR UPDATE (concurrencia)
   *   4. Validar saldo, ownership, estado de cuenta
   *   5. Actualizar saldos
   *   6. Registrar en el ledger con snapshots
   *   7. COMMIT o ROLLBACK
   */
  create: async (req, res) => {
    // Generar referencia única ANTES de abrir la transacción
    const referencia = req.body.referencia || uuidv4();
    const ipAddress = getClientIP(req);

    // -- Idempotencia: si ya existe esta referencia, devolver la transacción existente --
    const existente = await Transaccion.findOne({ where: { referencia } });
    if (existente) {
      return res.status(200).json({
        message: 'Transacción ya procesada (idempotencia)',
        transaccion: existente
      });
    }

    const t = await sequelize.transaction({ isolationLevel: 'SERIALIZABLE' });
    try {
      const { monto, tipo_transaccion, cuenta_id, cuenta_destino_id, descripcion } = req.body;
      const montoNum = parseFloat(monto);

      // --- 1. Obtener cuenta origen con ROW-LEVEL LOCK ---
      const cuentaOrigen = await Cuenta.findByPk(cuenta_id, {
        lock: t.LOCK.UPDATE,
        transaction: t
      });
      if (!cuentaOrigen) {
        await t.rollback();
        return res.status(404).json({ message: 'Cuenta origen no encontrada' });
      }

      // --- 2. Validar que la cuenta esté activa ---
      if (cuentaOrigen.estado !== 'Activa') {
        await t.rollback();
        return res.status(403).json({ message: 'La cuenta origen no está activa. No se pueden realizar operaciones.' });
      }

      // --- 3. Validar ownership (solo admin puede operar cuentas ajenas) ---
      if (req.user.role !== 'admin' && cuentaOrigen.usuario_id !== req.user.userId) {
        await t.rollback();
        // Registrar intento sospechoso
        await registrarAuditoria({
          tabla: 'Transacciones',
          accion: 'INTENTO_SOSPECHOSO',
          detalle: `Usuario ${req.user.userId} intentó operar cuenta ${cuenta_id} que pertenece a otro usuario`,
          usuario_id: req.user.userId,
          ip_address: ipAddress
        });
        return res.status(403).json({ message: 'No tienes permisos para operar esta cuenta' });
      }

      const saldoAnteriorOrigen = parseFloat(cuentaOrigen.saldo);

      // --- 4. Lógica por tipo de transacción ---
      let cuentaDestino = null;
      let saldoAnteriorDestino = null;

      if (tipo_transaccion === 'Retiro' || tipo_transaccion === 'Transferencia') {
        // Validar saldo suficiente
        if (saldoAnteriorOrigen < montoNum) {
          await t.rollback();
          return res.status(400).json({
            message: 'Saldo insuficiente',
            saldo_disponible: saldoAnteriorOrigen,
            monto_solicitado: montoNum
          });
        }
        // Restar de origen
        cuentaOrigen.saldo = saldoAnteriorOrigen - montoNum;
      } else if (tipo_transaccion === 'Deposito') {
        // Sumar a origen
        cuentaOrigen.saldo = saldoAnteriorOrigen + montoNum;
      }

      // --- 5. Para transferencias: bloquear y actualizar cuenta destino ---
      if (tipo_transaccion === 'Transferencia') {
        cuentaDestino = await Cuenta.findByPk(cuenta_destino_id, {
          lock: t.LOCK.UPDATE,
          transaction: t
        });
        if (!cuentaDestino) {
          await t.rollback();
          return res.status(404).json({ message: 'Cuenta destino no encontrada' });
        }
        if (cuentaDestino.estado !== 'Activa') {
          await t.rollback();
          return res.status(403).json({ message: 'La cuenta destino no está activa' });
        }
        // Validar que sean la misma moneda
        if (cuentaOrigen.moneda !== cuentaDestino.moneda) {
          await t.rollback();
          return res.status(400).json({ message: `No se puede transferir entre monedas diferentes (${cuentaOrigen.moneda} → ${cuentaDestino.moneda})` });
        }
        saldoAnteriorDestino = parseFloat(cuentaDestino.saldo);
        cuentaDestino.saldo = saldoAnteriorDestino + montoNum;
        await cuentaDestino.save({ transaction: t });
      }

      // --- 6. Guardar cuenta origen ---
      await cuentaOrigen.save({ transaction: t });

      // --- 7. Registrar en el ledger (inmutable) ---
      const nuevaTransaccion = await Transaccion.create({
        referencia,
        monto: montoNum,
        tipo_transaccion,
        estado: 'Completada',
        descripcion: descripcion || `${tipo_transaccion} por $${montoNum.toFixed(2)}`,
        fecha: new Date(),
        cuenta_id,
        cuenta_destino_id: cuenta_destino_id || null,
        ejecutado_por: req.user.userId,
        saldo_anterior_origen: saldoAnteriorOrigen,
        saldo_posterior_origen: parseFloat(cuentaOrigen.saldo),
        saldo_anterior_destino: saldoAnteriorDestino,
        saldo_posterior_destino: cuentaDestino ? parseFloat(cuentaDestino.saldo) : null,
        ip_address: ipAddress
      }, { transaction: t });

      // --- 8. COMMIT ---
      await t.commit();

      // Auditoría (después del commit, no bloquea)
      await registrarAuditoria({
        tabla: 'Transacciones',
        registro_id: nuevaTransaccion.id,
        accion: 'TRANSACCION',
        detalle: `${tipo_transaccion}: $${montoNum.toFixed(2)} | Ref: ${referencia}`,
        usuario_id: req.user.userId,
        ip_address: ipAddress
      });

      res.status(201).json({
        message: 'Transacción completada exitosamente',
        transaccion: nuevaTransaccion
      });

    } catch (error) {
      // Si algo falla → ROLLBACK completo. Ningún dato queda inconsistente.
      try { await t.rollback(); } catch (rollbackErr) { /* ya fue rollbackeada */ }
      
      console.error('[TRANSACCION_ERROR]', error.message);
      res.status(500).json({ message: 'Error al procesar la transacción. Ningún saldo fue modificado.' });
    }
  },

  /**
   * Obtener historial de transacciones.
   * Admin: todas. User: solo las de sus cuentas.
   */
  getAll: async (req, res) => {
    try {
      let whereClause = {};
      if (req.user.role !== 'admin') {
        const cuentasUsuario = await Cuenta.findAll({ where: { usuario_id: req.user.userId } });
        const idsCuentas = cuentasUsuario.map(c => c.id);
        whereClause = {
          [Op.or]: [
            { cuenta_id: idsCuentas },
            { cuenta_destino_id: idsCuentas }
          ]
        };
      }

      const transacciones = await Transaccion.findAll({
        where: whereClause,
        include: [
          { model: Cuenta, as: 'cuenta', attributes: ['id', 'numero_cuenta', 'moneda'] },
          { model: Cuenta, as: 'cuenta_destino', attributes: ['id', 'numero_cuenta', 'moneda'] }
        ],
        order: [['fecha', 'DESC']],
        limit: 200
      });
      res.json(transacciones);
    } catch (error) {
      console.error('[GET_TRANSACCIONES]', error.message);
      res.status(500).json({ message: 'Error al obtener el historial de transacciones' });
    }
  },

  /**
   * Obtener transacciones de una cuenta específica.
   */
  getByCuenta: async (req, res) => {
    try {
      // Validar que el usuario tenga acceso a esta cuenta
      if (req.user.role !== 'admin') {
        const cuenta = await Cuenta.findByPk(req.params.cuentaId);
        if (!cuenta || cuenta.usuario_id !== req.user.userId) {
          return res.status(403).json({ message: 'No tienes acceso a esta cuenta' });
        }
      }

      const transacciones = await Transaccion.findAll({
        where: {
          [Op.or]: [
            { cuenta_id: req.params.cuentaId },
            { cuenta_destino_id: req.params.cuentaId }
          ]
        },
        order: [['fecha', 'DESC']],
        limit: 100
      });
      res.json(transacciones);
    } catch (error) {
      console.error('[GET_BY_CUENTA]', error.message);
      res.status(500).json({ message: 'Error al obtener transacciones de la cuenta' });
    }
  }
};

module.exports = transaccionController;
