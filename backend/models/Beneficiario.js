'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Beneficiario extends Model {
    static associate(models) {
      Beneficiario.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    }
  }
  Beneficiario.init({
    nombre: { type: DataTypes.STRING, allowNull: false },
    parentesco: DataTypes.STRING,
    usuario_id: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    sequelize,
    modelName: 'Beneficiario',
    tableName: 'Beneficiarios',
    underscored: true,
  });
  return Beneficiario;
};
