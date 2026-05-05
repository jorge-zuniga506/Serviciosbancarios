'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Empleado extends Model {
    static associate(models) {
      Empleado.belongsTo(models.Sucursal, { foreignKey: 'sucursal_id', as: 'sucursal' });
    }
  }
  Empleado.init({
    nombre: { type: DataTypes.STRING, allowNull: false },
    cargo: DataTypes.STRING,
    sucursal_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Empleado',
    tableName: 'Empleados',
    underscored: true,
  });
  return Empleado;
};
