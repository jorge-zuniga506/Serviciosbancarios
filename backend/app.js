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

// Configuración de Sesiones
const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: 'Sessions', // Nombre exacto de la tabla que faltaba
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'clave_secreta_bancaria_777',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
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

// Iniciar Servidor
const PORT = process.env.PORT || 10000;

app.listen(PORT, async () => {
  console.log(`✅ Servidor bancario corriendo en el puerto ${PORT}`);
  try {
    await connectDB();
    // VITAL: Crear la tabla de sesiones apenas conecte la DB
    await sessionStore.sync();
    console.log('✅ Tabla de sesiones sincronizada');
  } catch (error) {
    console.error('❌ Error al iniciar:', error.message);
  }
});

module.exports = app;