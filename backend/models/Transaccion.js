'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Transaccion extends Model {
    static associate(models) {
      // Una Transaccion pertenece a una Cuenta (origen)
      Transaccion.belongsTo(models.Cuenta, {
        foreignKey: 'cuenta_id',
        as: 'cuenta'
      });
      // Una Transaccion puede tener una Cuenta destino (para transferencias)
      Transaccion.belongsTo(models.Cuenta, {
        foreignKey: 'cuenta_destino_id',
        as: 'cuenta_destino'
      });
      // Quién ejecutó la operación (trazabilidad)
      Transaccion.belongsTo(models.Usuario, {
        foreignKey: 'ejecutado_por',
        as: 'ejecutor'
      });
    }
  }
  Transaccion.init({
    referencia: {
      type: DataTypes.STRING(36),
      allowNull: false,
      unique: true,
      comment: 'UUID v4 - clave de idempotencia'
    },
    monto: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: { args: [0.01], msg: 'El monto debe ser mayor a cero' },
        isDecimal: { msg: 'El monto debe ser un número válido' }
      }
    },
    tipo_transaccion: {
      type: DataTypes.ENUM('Transferencia', 'Deposito', 'Retiro', 'Prestamo_Desembolso', 'Pago_Prestamo'),
      allowNull: false
    },
    estado: {
      type: DataTypes.ENUM('Pendiente', 'Completada', 'Fallida', 'Reversada'),
      allowNull: false,
      defaultValue: 'Pendiente'
    },
    descripcion: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    saldo_anterior_origen: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Snapshot del saldo antes de la operación (cuenta origen)'
    },
    saldo_posterior_origen: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Snapshot del saldo después de la operación (cuenta origen)'
    },
    saldo_anterior_destino: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Snapshot del saldo antes de la operación (cuenta destino)'
    },
    saldo_posterior_destino: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Snapshot del saldo después de la operación (cuenta destino)'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IP del cliente que realizó la operación'
    },
    cuenta_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    cuenta_destino_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    ejecutado_por: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID del usuario que ejecutó la operación'
    }
  }, {
    sequelize,
    modelName: 'Transaccion',
    tableName: 'Transacciones',
    underscored: true,
    // Las transacciones financieras NUNCA se eliminan
    paranoid: false,
  });
  return Transaccion;
};
