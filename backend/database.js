const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a Aiven MySQL');
    
    // ESTO ES LO NUEVO: Sincroniza todas las tablas antes de seguir
    await sequelize.sync({ alter: false }); 
    console.log('✅ Tablas sincronizadas');
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    throw error;
  }
};