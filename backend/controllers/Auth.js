/**
 * Controlador de Autenticación — Seguridad tipo banco
 * 
 * Implementa:
 * 1. Login con auditoría (éxitos y fallos)
 * 2. Hash bcrypt en modelo (ya existente)
 * 3. JWT con payload MÍNIMO (sin role — se consulta de BD)
 * 4. Registro con validación estricta — SIEMPRE role='user'
 * 5. Endpoint /me para obtener datos reales del usuario
 * 6. Admin hardcodeado por cédula: 120130740
 */
const { Usuario, Role } = require('../models');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { registrarAuditoria, getClientIP } = require('../middleware/auditLogger');
const { ADMIN_CEDULA } = require('../middleware/authMiddleware');
const { generateSignature } = require('../utils/security');

const authController = {
  login: async (req, res) => {
    const ipAddress = getClientIP(req);
    try {
      const { cedula, password } = req.body;

      if (!cedula || !password) {
        return res.status(400).json({ message: 'Por favor proporciona cédula y contraseña.' });
      }

      // Sanitizar cédula (solo números)
      const cedulaLimpia = cedula.toString().trim().replace(/\D/g, '');

      const usuario = await Usuario.findOne({ 
        where: { cedula: cedulaLimpia },
        include: [{ model: Role, as: 'rol' }]
      });

      if (!usuario) {
        console.log(`[LOGIN_DEBUG] Usuario no encontrado para cédula: ${cedulaLimpia}`);
        await registrarAuditoria({
          tabla: 'Usuarios',
          accion: 'LOGIN_FAILED',
          detalle: `Intento de login con cédula no registrada: ${cedulaLimpia}`,
          ip_address: ipAddress
        });
        return res.status(401).json({ message: 'Credenciales inválidas.' });
      }

      const isMatch = await usuario.comparePassword(password);
      
      if (!isMatch) {
        console.log(`[LOGIN_DEBUG] Contraseña incorrecta para usuario: ${usuario.id}`);
        await registrarAuditoria({
          tabla: 'Usuarios',
          registro_id: usuario.id,
          accion: 'LOGIN_FAILED',
          detalle: `Contraseña incorrecta para usuario ${usuario.id}`,
          usuario_id: usuario.id,
          ip_address: ipAddress
        });
        return res.status(401).json({ message: 'Credenciales inválidas.' });
      }

      // ── Determinar rol REAL basado en la cédula ──
      const nombreRolDeseado = usuario.cedula === ADMIN_CEDULA ? 'ADMIN' : 'USER';
      
      // Verificar si el rol actual coincide. Si no, corregir.
      const nombreRolActual = usuario.rol ? usuario.rol.nombre : null;

      if (nombreRolActual !== nombreRolDeseado) {
        const roles = await Role.findAll();
        const correctRole = roles.find(r => r.nombre === nombreRolDeseado);
        
        if (correctRole) {
          console.warn(`⚠️ [SECURITY] Corrigiendo rol de usuario ${usuario.id}: ${nombreRolActual} → ${nombreRolDeseado}`);
          await usuario.update({ 
            role_id: correctRole.id,
            role_signature: generateSignature(usuario.id + ':' + correctRole.id)
          });
        }
      }

      // Payload del JWT
      const payload = {
        userId: usuario.id,
        cedula: usuario.cedula,
        nombre: usuario.nombre
      };

      // Generar JWT
      const token = jwt.sign(
        payload, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h', algorithm: 'HS256' }
      );

      // ── SET COOKIE ──
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
        sameSite: 'strict',
        maxAge: 3600000 // 1 hora
      });

      // Registrar login exitoso
      await registrarAuditoria({
        tabla: 'Usuarios',
        registro_id: usuario.id,
        accion: 'LOGIN',
        detalle: `Login exitoso desde ${ipAddress} (rol: ${nombreRolDeseado})`,
        usuario_id: usuario.id,
        ip_address: ipAddress
      });

      const usuarioJSON = usuario.toJSON();
      usuarioJSON.role = nombreRolDeseado;

      res.json({
        message: 'Autenticación exitosa',
        usuario: usuarioJSON
      });

    } catch (error) {
      console.error('[LOGIN_ERROR]', error.message);
      res.status(500).json({ message: 'Error interno del servidor.' });
    }
  },

  /**
   * GET /api/auth/me — Retorna el usuario actual con su rol REAL desde la BD.
   * Este endpoint es la FUENTE DE VERDAD para el frontend.
   */
  me: async (req, res) => {
    try {
      const usuario = await Usuario.findByPk(req.user.userId, {
        include: ['cuentas', { model: Role, as: 'rol' }]
      });

      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado.' });
      }

      // Determinar rol REAL por cédula
      const nombreRolDeseado = usuario.cedula === ADMIN_CEDULA ? 'ADMIN' : 'USER';
      const nombreRolActual = usuario.rol ? usuario.rol.nombre : null;

      const usuarioJSON = usuario.toJSON();
      usuarioJSON.role = nombreRolActual;

      res.json(usuarioJSON);
    } catch (error) {
      console.error('[ME_ERROR]', error.message);
      res.status(500).json({ message: 'Error al obtener el perfil.' });
    }
  },

  logout: (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Sesión cerrada exitosamente.' });
  },

  register: async (req, res) => {
    const ipAddress = getClientIP(req);
    try {
      const { cedula, nombre, apellido, email, password } = req.body;

      // Validaciones estrictas
      if (!nombre || !apellido || !email || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios: nombre, apellido, email, password' });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
      }

      // Sanitizar cédula
      const cedulaLimpia = cedula ? cedula.toString().trim().replace(/\D/g, '') : null;

      // Verificar email duplicado antes de crear
      const emailLimpio = email.toString().trim().toLowerCase();
      const existenteEmail = await Usuario.findOne({ where: { email: emailLimpio } });
      if (existenteEmail) {
        return res.status(409).json({ message: 'Ya existe un usuario con este correo electrónico' });
      }

      // Verificar cédula duplicada
      if (cedulaLimpia) {
        const existenteCedula = await Usuario.findOne({ where: { cedula: cedulaLimpia } });
        if (existenteCedula) {
          return res.status(409).json({ message: 'Ya existe un usuario con esta cédula registrada' });
        }
      }

      // Determinar rol: SOLO la cédula autorizada puede ser admin
      const nombreRolDeseado = cedulaLimpia === ADMIN_CEDULA ? 'ADMIN' : 'USER';
      const roles = await Role.findAll();
      const roleObj = roles.find(r => r.nombre === nombreRolDeseado);

      const nuevoUsuario = await Usuario.create({
        cedula: cedulaLimpia,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: emailLimpio,
        password,
        role_id: roleObj ? roleObj.id : null
      });

      // Auditoría
      await registrarAuditoria({
        tabla: 'Usuarios',
        registro_id: nuevoUsuario.id,
        accion: 'CREATE',
        detalle: `Nuevo usuario registrado: ${emailLimpio} (rol: ${nombreRolDeseado})`,
        usuario_id: nuevoUsuario.id,
        ip_address: ipAddress
      });

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        usuario: nuevoUsuario.toJSON()
      });
    } catch (error) {
      console.error('[REGISTER_ERROR]', error);
      
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = error.errors[0]?.path;
        const message = field === 'cedula' ? 'Esta cédula ya está registrada' : 'Este correo ya está registrado';
        return res.status(409).json({ message });
      }

      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: error.errors.map(e => e.message).join(', ') });
      }
      
      res.status(500).json({ message: 'Error interno al procesar el registro' });
    }
  },

  getCedula: async (req, res) => {
    try {
      const { cedula } = req.params;
      // Sanitizar la cédula que llega por parámetro
      const cedulaLimpia = cedula.replace(/\D/g, '');
      
      const response = await axios.get(`https://api.hacienda.go.cr/fe/ae?identificacion=${cedulaLimpia}`, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36' 
        },
        timeout: 8000
      });

      res.json(response.data);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return res.status(404).json({ message: 'Cédula no encontrada en Hacienda' });
      }
      if (error.response && error.response.status === 429) {
        return res.status(429).json({ message: 'Demasiadas consultas a Hacienda. Intenta de nuevo en unos minutos.' });
      }
      console.error('[HACIENDA_API_ERROR]', error.message);
      res.status(500).json({ message: 'Error al consultar la API de Hacienda' });
    }
  }
};

module.exports = authController;
