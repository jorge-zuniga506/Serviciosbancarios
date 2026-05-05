'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Tarjetas', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      numero_tarjeta: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      tipo_tarjeta: {
        type: Sequelize.ENUM('Debito', 'Credito'),
        allowNull: false
      },
      fecha_vencimiento: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      cvv: {
        type: Sequelize.STRING(4),
        allowNull: false
      },
      estado: {
        type: Sequelize.ENUM('Activa', 'Bloqueada'),
        allowNull: false,
        defaultValue: 'Activa'
      },
      cuenta_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Cuentas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Tarjetas');
  }
};
