require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./database');

const app = express();

// ============================
// SECURITY MIDDLEWARES
// ============================

// Trust proxy para obtener IP real detrás de reverse proxy
app.set('trust proxy', 1);

// CORS — solo permitir el frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

// Parse JSON con límite de tamaño (prevenir payload bombs)
app.use(express.json({ limit: '1mb' }));

// Logging
app.use(morgan('dev'));

// Rate Limiting global — máximo 100 requests por minuto por IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { message: 'Demasiadas solicitudes. Espera un momento antes de intentar de nuevo.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Rate Limiting estricto para login (prevenir brute force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 intentos
  message: { message: 'Demasiados intentos de login. Espera 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate Limiting para transacciones financieras
const transaccionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 transacciones por minuto
  message: { message: 'Has excedido el límite de transacciones por minuto. Espera un momento.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Headers de seguridad
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.removeHeader('X-Powered-By');
  next();
});

// ============================
// RUTAS
// ============================

const usuarioRoutes = require('./routes/Usuario');
const cuentaRoutes = require('./routes/Cuenta');
const transaccionRoutes = require('./routes/Transaccion');
const prestamoRoutes = require('./routes/Prestamo');
const pagoRoutes = require('./routes/Pago');
const chatRoutes = require('./routes/Chat');
const authRoutes = require('./routes/Auth');

// Ruta base
app.get('/', (req, res) => {
  res.json({ message: 'API de Servicios Bancarios v2.0 — Sistema Financiero Real' });
});

// Aplicar rate limiters específicos
app.use('/api/auth/login', loginLimiter);
app.use('/api/transacciones', transaccionLimiter);
app.use('/api/pagos', transaccionLimiter);

// Rutas
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/cuentas', cuentaRoutes);
app.use('/api/transacciones', transaccionRoutes);
app.use('/api/prestamos', prestamoRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/auth', authRoutes);

// ============================
// ERROR HANDLER GLOBAL
// ============================
app.use((err, req, res, next) => {
  console.error('[GLOBAL_ERROR]', err.message);
  // Nunca exponer stack traces en producción
  res.status(500).json({ message: 'Error interno del servidor' });
});

// ============================
// INICIAR SERVIDOR
// ============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`✅ Servidor corriendo en el puerto ${PORT}`);
  await connectDB();
});

module.exports = app;
