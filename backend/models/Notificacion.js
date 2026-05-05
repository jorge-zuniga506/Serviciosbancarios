'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Notificacion extends Model {
    static associate(models) {
      Notificacion.belongsTo(models.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
    }
  }
  Notificacion.init({
    mensaje: DataTypes.TEXT,
    leido: { type: DataTypes.BOOLEAN, defaultValue: false },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false }
  }, {
    sequelize,
    modelName: 'Notificacion',
    tableName: 'Notificaciones',
    underscored: true,
  });
  return Notificacion;
};
