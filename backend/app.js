require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const cookieParser = require('cookie-parser');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { connectDB, sequelize } = require('./database');

const app = express();

// Middlewares
app.set('trust proxy', 1);
app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Configuración de Sesiones
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
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Importar Rutas
const authRoutes = require('./routes/Auth');
const usuarioRoutes = require('./routes/Usuario');
const cuentaRoutes = require('./routes/Cuenta');
const transaccionRoutes = require('./routes/Transaccion');
const prestamoRoutes = require('./routes/Prestamo');

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/cuentas', cuentaRoutes);
app.use('/api/transacciones', transaccionRoutes);
app.use('/api/prestamos', prestamoRoutes);

// Servir Frontend
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
}

// ============================
// ARRANQUE SEGURO (EL CAMBIO CLAVE)
// ============================
const PORT = process.env.PORT || 10000;

async function start() {
  try {
    // 1. Conectar a la DB
    await connectDB();
    
    // 2. Sincronizar la tabla de sesiones ANTES de cualquier otra cosa
    // El { alter: true } asegura que si la tabla no existe, se cree en ese momento
    await sessionStore.sync({ alter: true });
    console.log('✅ Tabla de sesiones confirmada en Aiven');
    
    // 3. Encender el servidor
    app.listen(PORT, () => {
      console.log(`🚀 SERVIDOR VIVO EN PUERTO ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Error fatal en el arranque:', err.message);
    // IMPORTANTE: Si hay error, no dejamos que el proceso siga "vivo" a medias
    process.exit(1); 
  }
}

start();