'use strict';
const { Model } = require('sequelize');
const { encrypt, decrypt } = require('../utils/security');

module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    static associate(models) {
      Role.hasMany(models.Usuario, { foreignKey: 'role_id', as: 'usuarios' });
    }
  }
  Role.init({
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      get() {
        const rawValue = this.getDataValue('nombre');
        try {
          return rawValue ? decrypt(rawValue) : null;
        } catch (e) {
          return rawValue; // Fallback
        }
      },
      set(value) {
        this.setDataValue('nombre', encrypt(value.toUpperCase()));
      }
    },
    descripcion: DataTypes.STRING,
    nivel_seguridad: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  }, {
    sequelize,
    modelName: 'Role',
    tableName: 'Roles',
    timestamps: true,
    hooks: {
      beforeUpdate: () => {
        throw new Error('Los roles son inmutables. No se pueden modificar.');
      },
      beforeDestroy: () => {
        throw new Error('Los roles son inmutables. No se pueden eliminar.');
      }
    }
  });
  return Role;
};
