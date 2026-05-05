const { Usuario, Cuenta, Prestamo, Transaccion } = require('../models');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const chatController = {
  ask: async (req, res) => {
    try {
      const { pregunta } = req.body;
      if (!pregunta) return res.status(400).json({ message: 'Por favor, haz una pregunta.' });

      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        return res.status(500).json({ message: 'API Key de Gemini no configurada.' });
      }

      // 1. Obtener datos de la BD
      const stats = {
        totalUsuarios: await Usuario.count(),
        totalCuentas: await Cuenta.count(),
        saldoGlobal: await Cuenta.sum('saldo') || 0,
        prestamosPendientes: await Prestamo.count({ where: { estado: 'Pendiente' } }),
      };

      // 2. Prompt de sistema (Contexto)
      const systemInstruction = `Eres un asistente bancario inteligente. 
      DATOS REALES DEL BANCO:
      - Usuarios: ${stats.totalUsuarios}
      - Cuentas: ${stats.totalCuentas}
      - Saldo Total: $${stats.saldoGlobal}
      - Préstamos Pendientes: ${stats.prestamosPendientes}

      Responde de forma muy breve, profesional y en español a la pregunta del usuario usando los datos anteriores.`;

      // 3. Inicializar cliente y modelo de Gemini
      const genAI = new GoogleGenerativeAI(geminiApiKey.trim());
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        systemInstruction: systemInstruction 
      });

      // 4. Llamada a la API de Gemini
      const result = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: pregunta }] }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      });
      
      const responseText = result.response.text();

      res.json({
        asistente: responseText || "No se pudo generar una respuesta.",
        datos_reales: stats
      });

    } catch (error) {
      console.error('Error Gemini:', error.message);
      res.status(500).json({ 
        error: 'Error al conectar con Gemini', 
        detalle: error.message 
      });
    }
  }
};

module.exports = chatController;

