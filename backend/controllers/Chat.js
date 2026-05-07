const { Usuario, Cuenta, Prestamo, Transaccion } = require('../models');
const Groq = require('groq-sdk');
require('dotenv').config();

const chatController = {
  ask: async (req, res) => {
    try {
      const { pregunta } = req.body;
      if (!pregunta) return res.status(400).json({ message: 'Por favor, haz una pregunta.' });

      const groqApiKey = process.env.GROQ_API_KEY;
      if (!groqApiKey) {
        return res.status(500).json({ message: 'API Key de Groq no configurada.' });
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

      // 3. Inicializar cliente de Groq
      const groq = new Groq({ apiKey: groqApiKey.trim() });

      // 4. Llamada a la API de Groq
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: pregunta }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        max_tokens: 500,
      });
      
      const responseText = chatCompletion.choices[0]?.message?.content;

      res.json({
        asistente: responseText || "No se pudo generar una respuesta.",
        datos_reales: stats
      });

    } catch (error) {
      console.error('Error Groq:', error.message);
      res.status(500).json({ 
        error: 'Error al conectar con Groq', 
        detalle: error.message 
      });
    }
  }
};

module.exports = chatController;

