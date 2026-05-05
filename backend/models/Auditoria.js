'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Auditoria extends Model {
    static associate(models) {
      Auditoria.belongsTo(models.Usuario, {
        foreignKey: 'usuario_id',
        as: 'usuario'
      });
    }
  }
  Auditoria.init({
    tabla: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Nombre de la tabla afectada'
    },
    registro_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID del registro afectado'
    },
    accion: {
      type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGIN_FAILED', 'TRANSACCION', 'INTENTO_SOSPECHOSO'),
      allowNull: false
    },
    detalle: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Descripción detallada del evento'
    },
    datos_anteriores: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON de los datos antes del cambio'
    },
    datos_nuevos: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON de los datos después del cambio'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Quién ejecutó la acción'
    },
    fecha: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Auditoria',
    tableName: 'Auditoria',
    timestamps: false,
    underscored: true,
  });
  return Auditoria;
};
