/**
 * Controlador de Préstamos — Lógica Financiera Real
 * 
 * Flujo real:
 * 1. Usuario solicita préstamo → estado "Pendiente"
 * 2. Admin aprueba → desembolso real a cuenta del usuario, registrado en el ledger
 * 3. Admin puede rechazar → estado "Rechazado" con razón generada por Groq
 * 4. Pagos reducen monto_restante hasta "Pagado"
 */
const { Prestamo, Usuario, Cuenta, Transaccion, Pago, sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { registrarAuditoria, getClientIP } = require('../middleware/auditLogger');
const Groq = require('groq-sdk');
require('dotenv').config();

const prestamoController = {
  /**
   * Solicitar un préstamo.
   * Admin puede asignar a cualquier usuario.
   * User solo puede solicitar para sí mismo.
   */
  create: async (req, res) => {
    try {
      const { monto, interes } = req.body;
      const ipAddress = getClientIP(req);
      const montoNum = parseFloat(monto);
      const interesNum = parseFloat(interes);

      // Validaciones
      if (isNaN(montoNum) || montoNum < 100) {
        return res.status(400).json({ message: 'El monto mínimo de préstamo es $100' });
      }
      if (montoNum > 50000) {
        return res.status(400).json({ message: 'El monto máximo para préstamos automáticos es $50,000' });
      }
      if (isNaN(interesNum) || interesNum <= 0 || interesNum > 99.99) {
        return res.status(400).json({ message: 'La tasa de interés debe estar entre 0.1% y 99.99%' });
      }

      // Determinar usuario destino
      let usuario_id;
      if (req.user.role === 'admin' && req.body.usuario_id) {
        usuario_id = parseInt(req.body.usuario_id);
      } else {
        usuario_id = req.user.userId;
      }

      // Validar que el usuario existe
      const usuario = await Usuario.findByPk(usuario_id);
      if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

      // Verificar que no tenga demasiados préstamos pendientes
      const prestamosPendientes = await Prestamo.count({
        where: { usuario_id, estado: ['Pendiente', 'Aprobado'] }
      });
      if (prestamosPendientes >= 3) {
        return res.status(400).json({ message: 'El usuario ya tiene 3 préstamos activos. No se pueden solicitar más.' });
      }

      const nuevoPrestamo = await Prestamo.create({
        monto: montoNum,
        interes: interesNum,
        usuario_id,
        estado: 'Pendiente',
        monto_restante: null // Se calcula al aprobar
      });

      // Auditoría
      await registrarAuditoria({
        tabla: 'Prestamos',
        registro_id: nuevoPrestamo.id,
        accion: 'CREATE',
        detalle: `Solicitud de préstamo $${montoNum.toFixed(2)} al ${interesNum}% para usuario ${usuario_id}`,
        usuario_id: req.user.userId,
        ip_address: ipAddress
      });

      res.status(201).json({
        message: 'Solicitud de préstamo registrada exitosamente',
        prestamo: nuevoPrestamo
      });
    } catch (error) {
      console.error('[CREAR_PRESTAMO]', error.message);
      res.status(400).json({ message: 'Error al procesar la solicitud de préstamo' });
    }
  },

  getAll: async (req, res) => {
    try {
      const whereClause = req.user.role === 'admin' ? {} : { usuario_id: req.user.userId };
      const prestamos = await Prestamo.findAll({
        where: whereClause,
        include: [
          { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido', 'email'] },
          { model: require('../models').Pago, as: 'pagos' }
        ],
        order: [['created_at', 'DESC']]
      });
      res.json(prestamos);
    } catch (error) {
      console.error('[GET_PRESTAMOS]', error.message);
      res.status(500).json({ message: 'Error al obtener los préstamos' });
    }
  },

  /**
   * Aprobar o Rechazar un préstamo (solo admin).
   * Al aprobar:
   *   1. Encontrar la cuenta del usuario
   *   2. Desembolsar el dinero (actualizar saldo)
   *   3. Registrar la transacción en el ledger
   *   4. Calcular monto_restante con intereses
   */
  updateStatus: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { estado } = req.body;
      const ipAddress = getClientIP(req);

      // Solo admin
      if (req.user.role !== 'admin') {
        await t.rollback();
        return res.status(403).json({ message: 'Solo administradores pueden aprobar/rechazar préstamos' });
      }

      const estadosValidos = ['Aprobado', 'Rechazado'];
      if (!estadosValidos.includes(estado)) {
        await t.rollback();
        return res.status(400).json({ message: 'Estado inválido. Opciones: Aprobado, Rechazado' });
      }

      const prestamo = await Prestamo.findByPk(req.params.id, { transaction: t });
      if (!prestamo) {
        await t.rollback();
        return res.status(404).json({ message: 'Préstamo no encontrado' });
      }

      if (prestamo.estado !== 'Pendiente') {
        await t.rollback();
        return res.status(400).json({ message: `No se puede cambiar el estado de un préstamo que ya está "${prestamo.estado}"` });
      }

      if (estado === 'Aprobado') {
        // Buscar cuenta del usuario para desembolso
        const cuentaDestino = await Cuenta.findOne({
          where: { usuario_id: prestamo.usuario_id, estado: 'Activa' },
          lock: t.LOCK.UPDATE,
          transaction: t
        });

        if (!cuentaDestino) {
          await t.rollback();
          return res.status(400).json({ message: 'El usuario no tiene una cuenta activa para recibir el desembolso' });
        }

        const saldoAnterior = parseFloat(cuentaDestino.saldo);
        const montoDesembolso = parseFloat(prestamo.monto);

        // Desembolsar
        cuentaDestino.saldo = saldoAnterior + montoDesembolso;
        await cuentaDestino.save({ transaction: t });

        // Registrar en el ledger
        const referencia = uuidv4();
        await Transaccion.create({
          referencia,
          monto: montoDesembolso,
          tipo_transaccion: 'Prestamo_Desembolso',
          estado: 'Completada',
          descripcion: `Desembolso de préstamo #${prestamo.id} aprobado por admin`,
          fecha: new Date(),
          cuenta_id: cuentaDestino.id,
          cuenta_destino_id: null,
          ejecutado_por: req.user.userId,
          saldo_anterior_origen: saldoAnterior,
          saldo_posterior_origen: parseFloat(cuentaDestino.saldo),
          ip_address: ipAddress
        }, { transaction: t });

        // Calcular deuda total (monto + intereses)
        prestamo.monto_restante = montoDesembolso + (montoDesembolso * parseFloat(prestamo.interes) / 100);
        prestamo.fecha_aprobacion = new Date();
        prestamo.aprobado_por = req.user.userId;
        prestamo.cuenta_destino_id = cuentaDestino.id;
      }

      prestamo.estado = estado;
      await prestamo.save({ transaction: t });
      await t.commit();

      // Auditoría
      await registrarAuditoria({
        tabla: 'Prestamos',
        registro_id: prestamo.id,
        accion: 'UPDATE',
        detalle: `Préstamo #${prestamo.id} ${estado} por admin ${req.user.userId}`,
        usuario_id: req.user.userId,
        ip_address: ipAddress
      });

      res.json({
        message: `Préstamo ${estado.toLowerCase()} exitosamente`,
        prestamo
      });
    } catch (error) {
      try { await t.rollback(); } catch (e) { }
      console.error('[UPDATE_PRESTAMO]', error.message);
      res.status(500).json({ message: 'Error al procesar el préstamo. Ningún saldo fue modificado.' });
    }
  },
  /**
   * Rechazar préstamo con razón generada por Groq basada en estadísticas del cliente.
   * Solo admin. Recopila datos reales del usuario y genera análisis crediticio con IA.
   */
  rechazarConGroq: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      if (req.user.role !== 'admin') {
        await t.rollback();
        return res.status(403).json({ message: 'Solo administradores pueden rechazar préstamos' });
      }

      const prestamo = await Prestamo.findByPk(req.params.id, {
        include: [{ model: Usuario, as: 'usuario' }],
        transaction: t
      });

      if (!prestamo) {
        await t.rollback();
        return res.status(404).json({ message: 'Préstamo no encontrado' });
      }

      if (prestamo.estado !== 'Pendiente') {
        await t.rollback();
        return res.status(400).json({ message: `No se puede rechazar un préstamo en estado "${prestamo.estado}"` });
      }

      // ── Recopilar estadísticas del cliente ──
      const usuario = prestamo.usuario;
      const userId = prestamo.usuario_id;

      const [cuentas, prestamosAnteriores, pagosRealizados, transacciones] = await Promise.all([
        Cuenta.findAll({ where: { usuario_id: userId } }),
        Prestamo.findAll({ where: { usuario_id: userId } }),
        Pago.findAll({ where: { '$prestamo.usuario_id$': userId }, include: [{ model: Prestamo, as: 'prestamo' }] }).catch(() => []),
        Transaccion.findAll({ where: { cuenta_id: { [require('sequelize').Op.in]: [] } } }).catch(() => [])
      ]);

      const saldoTotal = cuentas.reduce((sum, c) => sum + parseFloat(c.saldo || 0), 0);
      const prestamosActivos = prestamosAnteriores.filter(p => p.estado === 'Aprobado').length;
      const prestamosRechazados = prestamosAnteriores.filter(p => p.estado === 'Rechazado').length;
      const prestamosPagados = prestamosAnteriores.filter(p => p.estado === 'Pagado').length;
      const deudaTotal = prestamosAnteriores
        .filter(p => p.estado === 'Aprobado')
        .reduce((sum, p) => sum + parseFloat(p.monto_restante || 0), 0);
      const montoSolicitado = parseFloat(prestamo.monto);
      const ratioDeudaSaldo = saldoTotal > 0 ? (deudaTotal / saldoTotal).toFixed(2) : 'N/A';

      // ── Llamar a Groq para generar razón ──
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY?.trim() });

      const prompt = `Eres un oficial de crédito bancario experto. Analiza este perfil crediticio y redacta una razón de rechazo formal, clara y específica en español (máximo 4 oraciones). 

PERFIL DEL CLIENTE:
- Nombre: ${usuario.nombre} ${usuario.apellido}
- Monto solicitado: $${montoSolicitado.toLocaleString()}
- Tasa de interés: ${prestamo.interes}%
- Saldo total en cuentas: $${saldoTotal.toFixed(2)}
- Préstamos activos actuales: ${prestamosActivos}
- Deuda vigente total: $${deudaTotal.toFixed(2)}
- Ratio deuda/saldo: ${ratioDeudaSaldo}
- Préstamos rechazados anteriores: ${prestamosRechazados}
- Préstamos pagados exitosamente: ${prestamosPagados}
- Número de cuentas: ${cuentas.length}

Redacta SOLO la razón de rechazo, sin saludos ni títulos. Sé específico con los números.`;

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.4,
        max_tokens: 300,
      });

      const razonRechazo = completion.choices[0]?.message?.content || 'Solicitud rechazada por no cumplir los criterios crediticios del banco.';

      // ── Actualizar estado del préstamo ──
      prestamo.estado = 'Rechazado';
      prestamo.razon_rechazo = razonRechazo;
      await prestamo.save({ transaction: t });
      await t.commit();

      await registrarAuditoria({
        tabla: 'Prestamos',
        registro_id: prestamo.id,
        accion: 'UPDATE',
        detalle: `Préstamo #${prestamo.id} RECHAZADO por admin ${req.user.userId}. Razón generada por IA.`,
        usuario_id: req.user.userId,
        ip_address: getClientIP(req)
      });

      res.json({
        message: 'Préstamo rechazado exitosamente',
        razon_rechazo: razonRechazo,
        prestamo
      });

    } catch (error) {
      try { await t.rollback(); } catch (e) { }
      console.error('[RECHAZAR_PRESTAMO_GROQ]', error.message);
      res.status(500).json({ message: 'Error al rechazar el préstamo', detalle: error.message });
    }
  }
};

module.exports = prestamoController;
