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
      <div className="header" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--surface-container-lowest)', borderBottom: '1px solid var(--surface-container-highest)' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#dae2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#001946' }}>
          <Bot size={20} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--on-surface)' }}>Asistente Bancario</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>Impulsado por Groq AI</p>
        </div>
      </div>

      <div className="chat-container" style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--background)' }}>
        {messages.map((msg, index) => (
          <div key={index} className={`animate-fade-in`} style={{ 
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%',
            background: msg.role === 'user' ? 'var(--primary)' : 'var(--surface-container-low)',
            color: msg.role === 'user' ? '#ffffff' : 'var(--on-surface)',
            padding: '14px 18px',
            borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            fontSize: '0.9rem',
            lineHeight: '1.5',
            boxShadow: '0 2px 4px rgba(30, 41, 59, 0.05)',
            border: msg.role === 'user' ? 'none' : '1px solid var(--surface-container-highest)'
          }}>
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div className="loading" style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--on-surface-variant)', fontSize: '0.85rem' }}>
            <div className="dots" style={{ display: 'flex', gap: '4px' }}>
              <div className="dot" style={{ animationDelay: '0s', background: 'var(--primary)', width: '6px', height: '6px', borderRadius: '50%' }}></div>
              <div className="dot" style={{ animationDelay: '0.2s', background: 'var(--primary)', width: '6px', height: '6px', borderRadius: '50%' }}></div>
              <div className="dot" style={{ animationDelay: '0.4s', background: 'var(--primary)', width: '6px', height: '6px', borderRadius: '50%' }}></div>
            </div>
            <span>IA está analizando...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="input-area" onSubmit={handleSubmit} style={{ padding: '20px', borderTop: '1px solid var(--surface-container-highest)', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', gap: '12px', background: 'var(--background)', padding: '6px', borderRadius: '12px', border: '1px solid var(--outline)' }}>
          <input
            type="text"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', padding: '10px 14px', color: 'var(--on-surface)', fontSize: '0.9rem' }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu consulta..."
            disabled={isLoading}
          />
          <button type="submit" style={{ padding: '10px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} disabled={isLoading || !input.trim()}>
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>

  );
}

export default Chat;
