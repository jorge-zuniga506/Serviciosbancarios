'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Prestamo extends Model {
    static associate(models) {
      Prestamo.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
      Prestamo.hasMany(models.Pago, { foreignKey: 'prestamo_id', as: 'pagos' });
      // Cuenta donde se desembolsó el préstamo
      Prestamo.belongsTo(models.Cuenta, { foreignKey: 'cuenta_destino_id', as: 'cuenta_destino' });
    }
  }
  Prestamo.init({
    monto: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: { args: [100], msg: 'El monto mínimo de préstamo es $100' }
      }
    },
    interes: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      validate: {
        min: { args: [0.1], msg: 'La tasa de interés debe ser mayor a 0' },
        max: { args: [99.99], msg: 'La tasa de interés no puede exceder 99.99%' }
      }
    },
    monto_restante: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Deuda pendiente incluyendo intereses'
    },
    estado: {
      type: DataTypes.ENUM('Pendiente', 'Aprobado', 'Pagado', 'Rechazado'),
      defaultValue: 'Pendiente'
    },
    fecha_aprobacion: {
      type: DataTypes.DATE,
      allowNull: true
    },
    aprobado_por: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Admin que aprobó el préstamo'
    },
    cuenta_destino_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Cuenta donde se desembolsó'
    },
    razon_rechazo: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Razón de rechazo generada por IA (Groq)'
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Prestamo',
    tableName: 'Prestamos',
    underscored: true,
  });
  return Prestamo;
};
