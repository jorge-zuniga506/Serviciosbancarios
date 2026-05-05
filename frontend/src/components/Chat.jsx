import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send } from 'lucide-react';
import api from '../services/api';

function Chat() {
  const [messages, setMessages] = useState([
    { role: 'bot', content: '¡Hola! Soy tu asistente bancario inteligente. ¿En qué te puedo ayudar hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setIsLoading(true);

    try {
      const response = await api.post('/chat/ask', {
        pregunta: userText
      });

      setMessages(prev => [...prev, { role: 'bot', content: response.data.asistente }]);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: 'Hubo un error de conexión con el banco. Por favor intenta nuevamente.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ height: '100%' }}>
      <div className="header">
        <Bot size={32} color="#3b82f6" />
        <div>
          <h1 className="header-title">Asistente Bancario</h1>
          <p className="header-subtitle">Impulsado por Gemini AI</p>
        </div>
      </div>

      <div className="chat-container">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div className="loading">
            <Bot size={20} />
            <div className="dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="input-area" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu consulta aquí..."
          disabled={isLoading}
        />
        <button type="submit" className="send-button" disabled={isLoading || !input.trim()}>
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}

export default Chat;
