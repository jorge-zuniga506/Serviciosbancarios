'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Tarjeta extends Model {
    static associate(models) {
      // Una Tarjeta pertenece a una Cuenta
      Tarjeta.belongsTo(models.Cuenta, {
        foreignKey: 'cuenta_id',
        as: 'cuenta'
      });
    }
  }
  Tarjeta.init({
    numero_tarjeta: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    tipo_tarjeta: {
      type: DataTypes.ENUM('Debito', 'Credito'),
      allowNull: false
    },
    fecha_vencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    cvv: {
      type: DataTypes.STRING(4),
      allowNull: false
    },
    estado: {
      type: DataTypes.ENUM('Activa', 'Bloqueada'),
      allowNull: false,
      defaultValue: 'Activa'
    },
    cuenta_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Tarjeta',
    tableName: 'Tarjetas',
    underscored: true,
  });
  return Tarjeta;
};
