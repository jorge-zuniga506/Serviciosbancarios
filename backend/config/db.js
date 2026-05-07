const { Sequelize } = require('sequelize');
const process = require('process');
const env = process.env.NODE_ENV || 'development';
const config = require('./config.js')[env];

let sequelize;

if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      host: config.host,
      dialect: config.dialect,
      logging: false, // Desactivar logs para mantener consola limpia
      define: {
        timestamps: true,
        underscored: true
      }
    }
  );
}

module.exports = sequelize;
