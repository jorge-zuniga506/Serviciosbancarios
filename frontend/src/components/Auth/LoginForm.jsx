import React, { useState } from 'react';
import { ShieldCheck, User, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './LoginForm.css';

function LoginForm() {
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
    <div className="login-form-wrap">
      <div className="glass-panel login-card animate-fade-in">
        <div className="login-header">
          <div className="glass-panel login-icon-wrap">
            <ShieldCheck size={40} color="var(--primary)" />
          </div>
          <h2 className="login-title">Acceso Seguro</h2>
          <p className="login-subtitle">Bienvenido a la banca del futuro</p>
        </div>

        {error && (
          <div className="login-error">{error}</div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="login-field">
            <label className="login-label">Correo Electrónico</label>
            <div className="login-input-wrap">
              <User size={18} className="login-input-icon" />
              <input
                type="email"
                className="login-input"
                placeholder="ejemplo@banco.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-label">Contraseña</label>
            <div className="login-input-wrap">
              <Lock size={18} className="login-input-icon" />
              <input
                type="password"
                className="login-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="primary-btn login-submit-btn">
            Ingresar al Sistema
          </button>
        </form>

        <div className="login-footer-link">
          <span>¿No tienes una cuenta? </span>
          <a href="/register">Regístrate ahora</a>
        </div>

        <div className="login-security-note">
          <p>🔒 Conexión cifrada de punto a punto (AES-256)</p>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
