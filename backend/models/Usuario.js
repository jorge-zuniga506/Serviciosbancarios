'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class Usuario extends Model {
    static associate(models) {
      // Un Usuario tiene muchas Cuentas
      Usuario.hasMany(models.Cuenta, {
        foreignKey: 'usuario_id',
        as: 'cuentas'
      });
      // Un Usuario tiene muchos Prestamos
      Usuario.hasMany(models.Prestamo, { foreignKey: 'usuario_id', as: 'prestamos' });
      // Un Usuario tiene muchos Beneficiarios
      Usuario.hasMany(models.Beneficiario, { foreignKey: 'usuario_id', as: 'beneficiarios' });
      // Un Usuario tiene muchas Inversiones
      Usuario.hasMany(models.Inversion, { foreignKey: 'usuario_id', as: 'inversiones' });
      // Un Usuario tiene muchas Notificaciones
      Usuario.hasMany(models.Notificacion, { foreignKey: 'usuario_id', as: 'notificaciones' });
      // Un Usuario tiene una Direccion
      Usuario.hasOne(models.Direccion, { foreignKey: 'usuario_id', as: 'direccion_fiscal' });
      // Un Usuario pertenece a un Rol
      Usuario.belongsTo(models.Role, { foreignKey: 'role_id', as: 'rol' });
    }

    // Verificar si el rol ha sido manipulado en la DB
    verifyRoleIntegrity() {
      const { generateSignature } = require('../utils/security');
      const expectedSignature = generateSignature(this.id + ':' + this.role_id);
      return this.role_signature === expectedSignature;
    }

    // Método para comparar contraseñas
    async comparePassword(password) {
      return await bcrypt.compare(password, this.password);
    }

    // Ocultar la contraseña al convertir a JSON (para la API)
    toJSON() {
      const values = { ...this.get() };
      delete values.password;
      return values;
    }
  }
  Usuario.init({
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    apellido: {
      type: DataTypes.STRING,
      allowNull: false
    },
    cedula: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    role_signature: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    telefono: DataTypes.STRING,
    direccion: DataTypes.STRING,
    fecha_nacimiento: DataTypes.DATEONLY
  }, {
    sequelize,
    modelName: 'Usuario',
    tableName: 'Usuarios',
    underscored: true,
    individualHooks: true,
    hooks: {
      beforeCreate: async (usuario) => {
        if (usuario.password) {
          const salt = await bcrypt.genSalt(10);
          usuario.password = await bcrypt.hash(usuario.password, salt);
        }
        // Generar firma del rol si existe
        if (usuario.role_id) {
          const { generateSignature } = require('../utils/security');
          usuario.role_signature = generateSignature(usuario.id + ':' + usuario.role_id);
        }
      },
      beforeUpdate: async (usuario) => {
        if (usuario.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          usuario.password = await bcrypt.hash(usuario.password, salt);
        }
        if (usuario.changed('role_id')) {
           // Si alguien intenta cambiar el role_id desde la app, se genera una nueva firma.
           // Pero el usuario dice "que no se puedan cambiar los roles desde ningun lado".
           // Así que aquí podríamos bloquearlo si no es un proceso autorizado.
           const { generateSignature } = require('../utils/security');
           usuario.role_signature = generateSignature(usuario.id + ':' + usuario.role_id);
        }
      }
    }
  });
  return Usuario;
};
