'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Cuenta extends Model {
    static associate(models) {
      // Una Cuenta pertenece a un Usuario
      Cuenta.belongsTo(models.Usuario, {
        foreignKey: 'usuario_id',
        as: 'usuario'
      });
      // Una Cuenta tiene muchas Transacciones
      Cuenta.hasMany(models.Transaccion, {
        foreignKey: 'cuenta_id',
        as: 'transacciones'
      });
      // Una Cuenta tiene muchas Tarjetas
      Cuenta.hasMany(models.Tarjeta, {
        foreignKey: 'cuenta_id',
        as: 'tarjetas'
      });
    }
  }
  Cuenta.init({
    numero_cuenta: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    tipo_cuenta: {
      type: DataTypes.ENUM('Ahorros', 'Corriente'),
      allowNull: false
    },
    saldo: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: { args: [0], msg: 'El saldo no puede ser negativo' }
      }
    },
    moneda: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'USD'
    },
    estado: {
      type: DataTypes.ENUM('Activa', 'Inactiva', 'Bloqueada'),
      allowNull: false,
      defaultValue: 'Activa'
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Cuenta',
    tableName: 'Cuentas',
    underscored: true,
  });
  return Cuenta;
};
