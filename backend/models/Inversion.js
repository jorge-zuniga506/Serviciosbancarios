'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Inversion extends Model {
    static associate(models) {
      Inversion.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    }
  }
  Inversion.init({
    monto: DataTypes.DECIMAL(15, 2),
    tipo: DataTypes.STRING,
    usuario_id: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    sequelize,
    modelName: 'Inversion',
    tableName: 'Inversiones',
    underscored: true,
  });
  return Inversion;
};
