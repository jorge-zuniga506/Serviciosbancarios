import React, { useState } from 'react';
import { ShieldCheck, User, Lock, CreditCard, Mail } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

function Register() {
  const [cedula, setCedula] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCedulaChange = async (e) => {
    const val = e.target.value;
    setCedula(val);
    if (val.length >= 9) { // Longitud típica de cédula tica
      try {
        setLoading(true);
        const response = await api.get(`/auth/cedula/${val}`);
        if (response.data && response.data.nombre) {
          const partes = response.data.nombre.split(' ');
          setNombre(partes[0] || '');
          setApellido(partes.slice(1).join(' ') || '');
          setError('');
        }
      } catch (err) {
        setError('Cédula no encontrada en el registro nacional.');
        setNombre('');
        setApellido('');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/auth/register', { cedula, nombre, apellido, email, password });
      alert('Registro exitoso. Ahora puedes iniciar sesión.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Error al registrarse');
    }
  };

  return (
    <div className="login-container" style={{ 
      background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      width: '100vw',
      padding: '40px 20px'
    }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '48px', width: '100%', maxWidth: '500px', textAlign: 'center' }}>
        <div className="login-header" style={{ marginBottom: '32px' }}>
          <div className="glass-panel" style={{ width: '64px', height: '64px', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-glow)' }}>
            <ShieldCheck size={32} color="white" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '8px' }}>Crear Cuenta</h2>
          <p style={{ color: 'var(--text-muted)' }}>Registro inteligente con validación oficial</p>
        </div>

        {error && (
          <div className="error-message" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '12px', borderRadius: '12px', marginBottom: '24px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', textAlign: 'left' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Cédula de Identidad</label>
            <div style={{ position: 'relative' }}>
              <CreditCard size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-glass"
                style={{ width: '100%', paddingLeft: '48px' }}
                placeholder="Ej: 101110111"
                value={cedula}
                onChange={handleCedulaChange}
                required
              />
            </div>
            {loading && <p style={{fontSize: '0.75rem', color: 'var(--accent)', marginTop: '8px', marginLeft: '4px'}}>🔍 Validando en Hacienda...</p>}
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Nombre</label>
            <input
              type="text"
              className="input-glass"
              style={{ width: '100%' }}
              placeholder="Tu nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Apellidos</label>
            <input
              type="text"
              className="input-glass"
              style={{ width: '100%' }}
              placeholder="Tus apellidos"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              required
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Correo Electrónico</label>
            <input
              type="email"
              className="input-glass"
              style={{ width: '100%' }}
              placeholder="ejemplo@banco.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'block', marginLeft: '4px' }}>Contraseña</label>
            <input
              type="password"
              className="input-glass"
              style={{ width: '100%' }}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="primary-btn" style={{ gridColumn: 'span 2', justifyContent: 'center', padding: '14px', marginTop: '10px' }} disabled={loading}>
            Completar Registro
          </button>
        </form>

        <div style={{ marginTop: '24px', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>¿Ya tienes una cuenta? </span>
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}


export default Register;
