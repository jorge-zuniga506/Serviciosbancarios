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
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <ShieldCheck size={48} color="#3b82f6" />
          <h2>Acceso Seguro</h2>
          <p>Sistema Bancario (RFC 7519)</p>
        </div>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <User size={20} className="input-icon" />
            <input
              type="email"
              placeholder="Correo Electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <Lock size={20} className="input-icon" />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-btn">Ingresar</button>
        </form>
        <div style={{ marginTop: '16px', fontSize: '0.9rem' }}>
          <a href="/register" style={{ color: '#3b82f6', textDecoration: 'none' }}>¿No tienes cuenta? Regístrate aquí</a>
        </div>
        <div className="security-note">
          <p>🔒 Toda la comunicación debe realizarse bajo HTTPS.</p>
        </div>
      </div>
    </div>
  );
}

export default Login;
