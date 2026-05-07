require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const cookieParser = require('cookie-parser');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { connectDB, sequelize } = require('./database'); // Importamos sequelize para la sesión

const app = express();

// ============================
// SECURITY MIDDLEWARES
// ============================

// Trust proxy para obtener IP real detrás de Render
app.set('trust proxy', 1);

// CORS — Permitir localhost y URL de producción
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan('dev'));

// Rate Limiting global
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { message: 'Demasiadas solicitudes. Espera un momento.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Headers de seguridad básicos
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.removeHeader('X-Powered-By');
  next();
});

// ============================
// CONFIGURACIÓN DE SESIONES (VITAL PARA RENDER)
// ============================
const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: 'Sessions',
});

app.use(session({
  secret: process.env.SESSION_SECRET || 'clave_secreta_bancaria_777',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true en Render (HTTPS)
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Sincronizar tabla de sesiones
sessionStore.sync();

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

// ============================
// PRODUCCIÓN: SERVIR FRONTEND
// ============================
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendPath));
  
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
} else {
  app.get('/', (req, res) => {
    res.json({ message: 'API de Servicios Bancarios corriendo en modo Desarrollo' });
  });
}

// ============================
// ERROR HANDLER GLOBAL
// ============================
app.use((err, req, res, next) => {
  console.error('[GLOBAL_ERROR]', err.message);
  res.status(500).json({ message: 'Error interno del servidor' });
});

// ============================
// INICIAR SERVIDOR
// ============================
const PORT = process.env.PORT || 10000;

app.listen(PORT, async () => {
  console.log(`✅ Servidor bancario corriendo en el puerto ${PORT}`);
  try {
    await connectDB();
  } catch (error) {
    console.error('❌ Error al conectar la DB al iniciar:', error.message);
  }
});

module.exports = app;