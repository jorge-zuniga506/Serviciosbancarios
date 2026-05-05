'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Pago extends Model {
    static associate(models) {
      Pago.belongsTo(models.Prestamo, { foreignKey: 'prestamo_id', as: 'prestamo' });
      Pago.belongsTo(models.Cuenta, { foreignKey: 'cuenta_id', as: 'cuenta' });
      // Referencia a la transacción del ledger
      Pago.belongsTo(models.Transaccion, { foreignKey: 'transaccion_id', as: 'transaccion' });
    }
  }
  Pago.init({
    monto: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: { args: [0.01], msg: 'El monto del pago debe ser mayor a cero' }
      }
    },
    prestamo_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    cuenta_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Cuenta desde la que se paga'
    },
    transaccion_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Transacción asociada en el ledger'
    },
    saldo_restante_despues: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Saldo restante del préstamo después del pago'
    }
  }, {
    sequelize,
    modelName: 'Pago',
    tableName: 'Pagos',
    underscored: true,
  });
  return Pago;
};
