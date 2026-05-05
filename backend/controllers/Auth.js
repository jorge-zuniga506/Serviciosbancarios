/**
 * Controlador de Autenticación — Seguridad tipo banco
 * 
 * Implementa:
 * 1. Login con auditoría (éxitos y fallos)
 * 2. Hash bcrypt en modelo (ya existente)
 * 3. JWT con payload mínimo
 * 4. Registro con validación estricta
 * 5. No expone datos sensibles en errores
 */
const { Usuario } = require('../models');
const jwt = require('jsonwebtoken');
const { registrarAuditoria, getClientIP } = require('../middleware/auditLogger');

const authController = {
  login: async (req, res) => {
    const ipAddress = getClientIP(req);
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Por favor proporciona email y contraseña.' });
      }

      // Sanitizar email
      const emailLimpio = email.toString().trim().toLowerCase();

      const usuario = await Usuario.findOne({ where: { email: emailLimpio } });

      if (!usuario) {
        // Registrar intento fallido (sin revelar si el email existe)
        await registrarAuditoria({
          tabla: 'Usuarios',
          accion: 'LOGIN_FAILED',
          detalle: `Intento de login con email no registrado: ${emailLimpio}`,
          ip_address: ipAddress
        });
        return res.status(401).json({ message: 'Credenciales inválidas.' });
      }

      const isMatch = await usuario.comparePassword(password);
      
      if (!isMatch) {
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

      // Payload del JWT (mínimo necesario, sin datos sensibles)
      const payload = {
        userId: usuario.id,
        role: usuario.role || 'user'
      };

      // Generar JWT firmado con HMAC SHA256, expiración 1 hora
      const token = jwt.sign(
        payload, 
        process.env.JWT_SECRET, 
        { expiresIn: '1h', algorithm: 'HS256' }
      );

      // Registrar login exitoso
      await registrarAuditoria({
        tabla: 'Usuarios',
        registro_id: usuario.id,
        accion: 'LOGIN',
        detalle: `Login exitoso desde ${ipAddress}`,
        usuario_id: usuario.id,
        ip_address: ipAddress
      });

      res.json({
        message: 'Autenticación exitosa',
        token,
        usuario: usuario.toJSON()
      });

    } catch (error) {
      console.error('[LOGIN_ERROR]', error.message);
      res.status(500).json({ message: 'Error interno del servidor.' });
    }
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

      // Verificar email duplicado antes de crear (mejor mensaje)
      const emailLimpio = email.toString().trim().toLowerCase();
      const existente = await Usuario.findOne({ where: { email: emailLimpio } });
      if (existente) {
        return res.status(409).json({ message: 'Ya existe un usuario con este correo electrónico' });
      }

      const nuevoUsuario = await Usuario.create({
        cedula: cedula || null,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: emailLimpio,
        password,
        role: 'user'
      });

      // Auditoría
      await registrarAuditoria({
        tabla: 'Usuarios',
        registro_id: nuevoUsuario.id,
        accion: 'CREATE',
        detalle: `Nuevo usuario registrado: ${emailLimpio}`,
        usuario_id: nuevoUsuario.id,
        ip_address: ipAddress
      });

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        usuario: nuevoUsuario.toJSON()
      });
    } catch (error) {
      console.error('[REGISTER_ERROR]', error.message);
      // No exponer errores internos
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({ message: error.errors.map(e => e.message).join(', ') });
      }
      res.status(500).json({ message: 'Error al registrar el usuario' });
    }
  },

  getCedula: async (req, res) => {
    try {
      const { cedula } = req.params;
      const fetch = (await import('node-fetch')).default || require('node-fetch'); // compatibilidad
      const response = await fetch(`https://api.hacienda.go.cr/fe/ae?identificacion=${cedula}`);
      if (!response.ok) {
        return res.status(404).json({ message: 'Cédula no encontrada en Hacienda' });
      }
      const data = await response.json();
      res.json(data);
    } catch (error) {
      // Usaremos node-fetch o fetch nativo si está disponible
      try {
        const response = await global.fetch(`https://api.hacienda.go.cr/fe/ae?identificacion=${req.params.cedula}`);
        const data = await response.json();
        return res.json(data);
      } catch (err) {
        res.status(500).json({ message: 'Error al consultar la API de Hacienda' });
      }
    }
  }
};

module.exports = authController;
