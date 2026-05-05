'use strict';

/**
 * Migración: Transformación a sistema financiero realista.
 * 
 * Cambios:
 * - Transacciones: añade referencia, estado, snapshots de saldo, ip, ejecutor
 * - Cuentas: añade estado (Activa/Inactiva/Bloqueada)
 * - Auditoría: añade usuario_id, ip_address, registro_id, datos_anteriores/nuevos, enum de acciones
 * - Préstamos: añade fecha_aprobacion, aprobado_por, cuenta_destino_id, estado Rechazado
 * - Pagos: añade cuenta_id, transaccion_id, saldo_restante_despues
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ============ TRANSACCIONES ============
    // Añadir referencia UUID
    await queryInterface.addColumn('Transacciones', 'referencia', {
      type: Sequelize.STRING(36),
      allowNull: true, // temporalmente null para datos existentes
      unique: true
    }).catch(() => {});

    // Añadir estado
    await queryInterface.addColumn('Transacciones', 'estado', {
      type: Sequelize.ENUM('Pendiente', 'Completada', 'Fallida', 'Reversada'),
      allowNull: false,
      defaultValue: 'Completada'
    }).catch(() => {});

    // Snapshots de saldo
    await queryInterface.addColumn('Transacciones', 'saldo_anterior_origen', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true
    }).catch(() => {});

    await queryInterface.addColumn('Transacciones', 'saldo_posterior_origen', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true
    }).catch(() => {});

    await queryInterface.addColumn('Transacciones', 'saldo_anterior_destino', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true
    }).catch(() => {});

    await queryInterface.addColumn('Transacciones', 'saldo_posterior_destino', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true
    }).catch(() => {});

    // IP y ejecutor
    await queryInterface.addColumn('Transacciones', 'ip_address', {
      type: Sequelize.STRING(45),
      allowNull: true
    }).catch(() => {});

    await queryInterface.addColumn('Transacciones', 'ejecutado_por', {
      type: Sequelize.INTEGER,
      allowNull: true
    }).catch(() => {});

    // Actualizar tipo_transaccion para incluir nuevos tipos
    // MySQL requiere ALTER de ENUM
    await queryInterface.sequelize.query(
      "ALTER TABLE Transacciones MODIFY COLUMN tipo_transaccion ENUM('Transferencia', 'Deposito', 'Retiro', 'Prestamo_Desembolso', 'Pago_Prestamo') NOT NULL"
    ).catch(() => {});

    // ============ CUENTAS ============
    await queryInterface.addColumn('Cuentas', 'estado', {
      type: Sequelize.ENUM('Activa', 'Inactiva', 'Bloqueada'),
      allowNull: false,
      defaultValue: 'Activa'
    }).catch(() => {});

    // ============ AUDITORIA ============
    // Recrear tabla de auditoría con nuevos campos
    await queryInterface.addColumn('Auditoria', 'usuario_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    }).catch(() => {});

    await queryInterface.addColumn('Auditoria', 'ip_address', {
      type: Sequelize.STRING(45),
      allowNull: true
    }).catch(() => {});

    await queryInterface.addColumn('Auditoria', 'registro_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    }).catch(() => {});

    await queryInterface.addColumn('Auditoria', 'datos_anteriores', {
      type: Sequelize.TEXT,
      allowNull: true
    }).catch(() => {});

    await queryInterface.addColumn('Auditoria', 'datos_nuevos', {
      type: Sequelize.TEXT,
      allowNull: true
    }).catch(() => {});

    // Actualizar ENUM de acción
    await queryInterface.sequelize.query(
      "ALTER TABLE Auditoria MODIFY COLUMN accion ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGIN_FAILED', 'TRANSACCION', 'INTENTO_SOSPECHOSO') NOT NULL"
    ).catch(() => {});

    // ============ PRESTAMOS ============
    await queryInterface.addColumn('Prestamos', 'fecha_aprobacion', {
      type: Sequelize.DATE,
      allowNull: true
    }).catch(() => {});

    await queryInterface.addColumn('Prestamos', 'aprobado_por', {
      type: Sequelize.INTEGER,
      allowNull: true
    }).catch(() => {});

    await queryInterface.addColumn('Prestamos', 'cuenta_destino_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    }).catch(() => {});

    // Actualizar ENUM de estado de préstamos
    await queryInterface.sequelize.query(
      "ALTER TABLE Prestamos MODIFY COLUMN estado ENUM('Pendiente', 'Aprobado', 'Pagado', 'Rechazado') NOT NULL DEFAULT 'Pendiente'"
    ).catch(() => {});

    // ============ PAGOS ============
    await queryInterface.addColumn('Pagos', 'cuenta_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    }).catch(() => {});

    await queryInterface.addColumn('Pagos', 'transaccion_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    }).catch(() => {});

    await queryInterface.addColumn('Pagos', 'saldo_restante_despues', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true
    }).catch(() => {});

    // Asignar referencias a transacciones existentes que no tienen
    const { v4: uuidv4 } = require('uuid');
    const [transacciones] = await queryInterface.sequelize.query(
      'SELECT id FROM Transacciones WHERE referencia IS NULL'
    );
    for (const t of transacciones) {
      await queryInterface.sequelize.query(
        `UPDATE Transacciones SET referencia = '${uuidv4()}' WHERE id = ${t.id}`
      );
    }
  },

  async down(queryInterface, Sequelize) {
    // Revertir cambios (en orden inverso)
    await queryInterface.removeColumn('Pagos', 'saldo_restante_despues').catch(() => {});
    await queryInterface.removeColumn('Pagos', 'transaccion_id').catch(() => {});
    await queryInterface.removeColumn('Pagos', 'cuenta_id').catch(() => {});
    await queryInterface.removeColumn('Prestamos', 'cuenta_destino_id').catch(() => {});
    await queryInterface.removeColumn('Prestamos', 'aprobado_por').catch(() => {});
    await queryInterface.removeColumn('Prestamos', 'fecha_aprobacion').catch(() => {});
    await queryInterface.removeColumn('Auditoria', 'datos_nuevos').catch(() => {});
    await queryInterface.removeColumn('Auditoria', 'datos_anteriores').catch(() => {});
    await queryInterface.removeColumn('Auditoria', 'registro_id').catch(() => {});
    await queryInterface.removeColumn('Auditoria', 'ip_address').catch(() => {});
    await queryInterface.removeColumn('Auditoria', 'usuario_id').catch(() => {});
    await queryInterface.removeColumn('Cuentas', 'estado').catch(() => {});
    await queryInterface.removeColumn('Transacciones', 'ejecutado_por').catch(() => {});
    await queryInterface.removeColumn('Transacciones', 'ip_address').catch(() => {});
    await queryInterface.removeColumn('Transacciones', 'saldo_posterior_destino').catch(() => {});
    await queryInterface.removeColumn('Transacciones', 'saldo_anterior_destino').catch(() => {});
    await queryInterface.removeColumn('Transacciones', 'saldo_posterior_origen').catch(() => {});
    await queryInterface.removeColumn('Transacciones', 'saldo_anterior_origen').catch(() => {});
    await queryInterface.removeColumn('Transacciones', 'estado').catch(() => {});
    await queryInterface.removeColumn('Transacciones', 'referencia').catch(() => {});
  }
};
