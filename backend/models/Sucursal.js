'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Sucursal extends Model {
    static associate(models) {
      Sucursal.hasMany(models.Empleado, { foreignKey: 'sucursal_id', as: 'empleados' });
    }
  }
  Sucursal.init({
    nombre: { type: DataTypes.STRING, allowNull: false },
    direccion: DataTypes.STRING,
    ciudad: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Sucursal',
    tableName: 'Sucursales',
    underscored: true,
  });
  return Sucursal;
};
