'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const { encrypt } = require('../utils/security');
    
    await queryInterface.bulkInsert('Roles', [
      {
        nombre: encrypt('ADMIN'),
        descripcion: 'Administrador con acceso total',
        nivel_seguridad: 10,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nombre: encrypt('USER'),
        descripcion: 'Usuario estándar del sistema',
        nivel_seguridad: 1,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
