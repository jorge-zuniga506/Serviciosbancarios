'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Crear tabla Roles
    await queryInterface.createTable('Roles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      descripcion: {
        type: Sequelize.STRING
      },
      nivel_seguridad: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // 2. Modificar Usuarios
    // Remover columna role antiga si existe (o ignorar si falla)
    try {
      await queryInterface.removeColumn('Usuarios', 'role');
    } catch (e) {
      console.log('Columna role no existía o ya fue eliminada');
    }

    await queryInterface.addColumn('Usuarios', 'role_id', {
      type: Sequelize.INTEGER,
      references: {
        model: 'Roles',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      allowNull: true
    });

    await queryInterface.addColumn('Usuarios', 'role_signature', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Usuarios', 'role_signature');
    await queryInterface.removeColumn('Usuarios', 'role_id');
    await queryInterface.addColumn('Usuarios', 'role', {
      type: Sequelize.ENUM('admin', 'user'),
      defaultValue: 'user'
    });
    await queryInterface.dropTable('Roles');
  }
};
