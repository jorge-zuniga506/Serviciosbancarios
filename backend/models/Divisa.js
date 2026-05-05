'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Divisa extends Model {
    static associate(models) {}
  }
  Divisa.init({
    codigo: { type: DataTypes.STRING(3), unique: true },
    nombre: DataTypes.STRING,
    tasa_cambio: DataTypes.DECIMAL(10, 4)
  }, {
    sequelize,
    modelName: 'Divisa',
    tableName: 'Divisas',
    underscored: true,
  });
  return Divisa;
};
