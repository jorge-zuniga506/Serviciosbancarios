'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Direccion extends Model {
    static associate(models) {
      Direccion.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    }
  }
  Direccion.init({
    calle: DataTypes.STRING,
    codigo_postal: DataTypes.STRING,
    usuario_id: { type: DataTypes.INTEGER, allowNull: false, unique: true }
  }, {
    sequelize,
    modelName: 'Direccion',
    tableName: 'Direcciones',
    underscored: true,
  });
  return Direccion;
};
