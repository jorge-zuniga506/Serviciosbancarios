require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const cookieParser = require('cookie-parser');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { connectDB, sequelize } = require('./database');

const app = express();

// Trust proxy para Render
app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// Configuración de almacenamiento de sesiones
const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: 'Sessions', // Nombre de la tabla que faltaba
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'clave_secreta_bancaria_777',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// ============================
// RUTAS DE LA API
// ============================
const authRoutes = require('./routes/Auth');
const usuarioRoutes = require('./routes/Usuario');
const cuentaRoutes = require('./routes/Cuenta');
const transaccionRoutes = require('./routes/Transaccion');
const prestamoRoutes = require('./routes/Prestamo');
const pagoRoutes = require('./routes/Pago');
const chatRoutes = require('./routes/Chat');

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/cuentas', cuentaRoutes);
app.use('/api/transacciones', transaccionRoutes);
app.use('/api/prestamos', prestamoRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/chat', chatRoutes);

// Servir Frontend en Producción
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
}

// ... (todo el código anterior igual)

// ============================
// INICIAR SERVIDOR
// ============================
const PORT = process.env.PORT || 10000;

async function startServer() {
  try {
    // 1. Conectar a la base de datos
    await connectDB();
    
    // 2. Sincronizar la tabla de sesiones (esto crea la tabla 'Sessions')
    await sessionStore.sync();
    console.log('✅ Tabla de sesiones lista.');

    // 3. Encender el servidor
    app.listen(PORT, () => {
      console.log(`✅ Servidor bancario en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error fatal al iniciar:', error.message);
    process.exit(1); // Cerrar si hay error crítico
  }
}

startServer();

module.exports = app;