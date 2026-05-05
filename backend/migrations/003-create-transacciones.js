'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Transacciones', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      monto: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false
      },
      tipo_transaccion: {
        type: Sequelize.ENUM('Transferencia', 'Deposito', 'Retiro'),
        allowNull: false
      },
      descripcion: {
        type: Sequelize.STRING
      },
      fecha: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
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
      cuenta_destino_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Cuentas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.dropTable('Transacciones');
  }
};
