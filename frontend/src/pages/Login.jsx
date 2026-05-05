import React, { useState } from 'react';
import { ShieldCheck, User, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    }
  };
  return (
    <div className="login-container" style={{ 
      background: 'radial-gradient(circle at center, rgba(99, 102, 241, 0.1) 0%, transparent 70%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw'
    }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '48px', width: '100%', maxWidth: '440px', textAlign: 'center' }}>
        <div className="login-header" style={{ marginBottom: '40px' }}>
          <div className="glass-panel" style={{ width: '80px', height: '80px', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-glow)', boxShadow: '0 0 30px var(--accent-glow)' }}>
            <ShieldCheck size={40} color="white" />
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '8px' }}>Acceso Seguro</h2>
          <p style={{ color: 'var(--text-muted)' }}>Bienvenido a la banca del futuro</p>
        </div>

        {error && (
          <div className="error-message" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '12px', borderRadius: '12px', marginBottom: '24px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="input-glass"
                style={{ width: '100%', paddingLeft: '48px' }}
                placeholder="ejemplo@banco.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="input-glass"
                style={{ width: '100%', paddingLeft: '48px' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="primary-btn" style={{ justifyContent: 'center', padding: '14px', marginTop: '12px', fontSize: '1rem' }}>
            Ingresar al Sistema
          </button>
        </form>

        <div style={{ marginTop: '32px', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>¿No tienes una cuenta? </span>
          <a href="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>Regístrate ahora</a>
        </div>

        <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--border-glass)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <p>🔒 Conexión cifrada de punto a punto (AES-256)</p>
        </div>
      </div>
    </div>
  );
}


export default Login;
