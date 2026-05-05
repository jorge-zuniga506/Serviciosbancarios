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
    <div className="chat-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="header" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-glass)' }}>
        <div className="glass-panel" style={{ padding: '10px', borderRadius: '12px', boxShadow: 'none', background: 'var(--accent-glow)' }}>
          <Bot size={24} color="white" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Asistente Bancario</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Impulsado por Gemini AI</p>
        </div>
      </div>

      <div className="chat-container" style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {messages.map((msg, index) => (
          <div key={index} className={`animate-fade-in`} style={{ 
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            background: msg.role === 'user' ? 'linear-gradient(135deg, var(--accent), #8b5cf6)' : 'rgba(255,255,255,0.05)',
            color: 'white',
            padding: '14px 18px',
            borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
            fontSize: '0.95rem',
            lineHeight: '1.6',
            boxShadow: msg.role === 'user' ? '0 4px 15px var(--accent-glow)' : 'none',
            border: msg.role === 'user' ? 'none' : '1px solid var(--border-glass)'
          }}>
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div className="loading" style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <div className="dots" style={{ display: 'flex', gap: '4px' }}>
              <div className="dot" style={{ animationDelay: '0s' }}></div>
              <div className="dot" style={{ animationDelay: '0.2s' }}></div>
              <div className="dot" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span>IA está pensando...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="input-area" onSubmit={handleSubmit} style={{ padding: '24px', borderTop: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ display: 'flex', gap: '12px', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
          <input
            type="text"
            className="input-glass"
            style={{ flex: 1, background: 'transparent', border: 'none', boxShadow: 'none', padding: '10px 14px' }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu consulta..."
            disabled={isLoading}
          />
          <button type="submit" className="primary-btn" style={{ padding: '10px', borderRadius: '12px' }} disabled={isLoading || !input.trim()}>
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>

  );
}

export default Chat;
