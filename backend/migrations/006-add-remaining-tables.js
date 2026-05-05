'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 6. Sucursales
    await queryInterface.createTable('Sucursales', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: Sequelize.STRING, allowNull: false },
      direccion: { type: Sequelize.STRING },
      ciudad: { type: Sequelize.STRING },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 7. Empleados
    await queryInterface.createTable('Empleados', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: Sequelize.STRING, allowNull: false },
      cargo: { type: Sequelize.STRING },
      sucursal_id: { type: Sequelize.INTEGER, references: { model: 'Sucursales', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 8. Prestamos
    await queryInterface.createTable('Prestamos', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      monto: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      interes: { type: Sequelize.DECIMAL(5, 2), allowNull: false },
      estado: { type: Sequelize.ENUM('Pendiente', 'Aprobado', 'Pagado'), defaultValue: 'Pendiente' },
      usuario_id: { type: Sequelize.INTEGER, references: { model: 'Usuarios', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 9. Pagos
    await queryInterface.createTable('Pagos', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      monto: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      prestamo_id: { type: Sequelize.INTEGER, references: { model: 'Prestamos', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 10. Beneficiarios
    await queryInterface.createTable('Beneficiarios', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nombre: { type: Sequelize.STRING, allowNull: false },
      parentesco: { type: Sequelize.STRING },
      usuario_id: { type: Sequelize.INTEGER, references: { model: 'Usuarios', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 11. Auditoria
    await queryInterface.createTable('Auditoria', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      tabla: { type: Sequelize.STRING },
      accion: { type: Sequelize.STRING },
      detalle: { type: Sequelize.TEXT },
      fecha: { type: Sequelize.DATE, defaultValue: Sequelize.NOW }
    });

    // 12. Divisas
    await queryInterface.createTable('Divisas', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      codigo: { type: Sequelize.STRING(3), unique: true },
      nombre: { type: Sequelize.STRING },
      tasa_cambio: { type: Sequelize.DECIMAL(10, 4) },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 13. Inversiones
    await queryInterface.createTable('Inversiones', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      monto: { type: Sequelize.DECIMAL(15, 2) },
      tipo: { type: Sequelize.STRING },
      usuario_id: { type: Sequelize.INTEGER, references: { model: 'Usuarios', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 14. Notificaciones
    await queryInterface.createTable('Notificaciones', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      mensaje: { type: Sequelize.TEXT },
      leido: { type: Sequelize.BOOLEAN, defaultValue: false },
      usuario_id: { type: Sequelize.INTEGER, references: { model: 'Usuarios', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });

    // 15. Direcciones
    await queryInterface.createTable('Direcciones', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      calle: { type: Sequelize.STRING },
      codigo_postal: { type: Sequelize.STRING },
      usuario_id: { type: Sequelize.INTEGER, references: { model: 'Usuarios', key: 'id' }, unique: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Direcciones');
    await queryInterface.dropTable('Notificaciones');
    await queryInterface.dropTable('Inversiones');
    await queryInterface.dropTable('Divisas');
    await queryInterface.dropTable('Auditoria');
    await queryInterface.dropTable('Beneficiarios');
    await queryInterface.dropTable('Pagos');
    await queryInterface.dropTable('Prestamos');
    await queryInterface.dropTable('Empleados');
    await queryInterface.dropTable('Sucursales');
  }
};
