import React, { useState } from 'react';
import { ShieldCheck, User, Lock, CreditCard, Mail } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import './RegisterForm.css';

function RegisterForm() {
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
    if (val.length >= 9) {
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
    <div className="register-wrap">
      <div className="glass-panel register-card animate-fade-in">
        <div className="register-header">
          <div className="glass-panel register-icon-wrap">
            <ShieldCheck size={32} color="var(--primary)" />
          </div>
          <h2 className="register-title">Crear Cuenta</h2>
          <p className="register-subtitle">Registro inteligente con validación oficial</p>
        </div>

        {error && (
          <div className="register-error">{error}</div>
        )}

        <form onSubmit={handleRegister} className="register-form">
          <div className="register-span-2">
            <label className="register-label">Cédula de Identidad</label>
            <div className="register-input-wrap">
              <CreditCard size={18} className="register-input-icon" />
              <input
                type="text"
                className="register-input with-icon"
                placeholder="Ej: 101110111"
                value={cedula}
                onChange={handleCedulaChange}
                required
              />
            </div>
            {loading && <p className="register-cedula-status">🔍 Validando en Hacienda...</p>}
          </div>

          <div>
            <label className="register-label">Nombre</label>
            <input
              type="text"
              className="register-input"
              placeholder="Tu nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="register-label">Apellidos</label>
            <input
              type="text"
              className="register-input"
              placeholder="Tus apellidos"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              required
            />
          </div>

          <div className="register-span-2">
            <label className="register-label">Correo Electrónico</label>
            <input
              type="email"
              className="register-input"
              placeholder="ejemplo@banco.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="register-span-2">
            <label className="register-label">Contraseña</label>
            <input
              type="password"
              className="register-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="primary-btn register-submit-btn" disabled={loading}>
            Completar Registro
          </button>
        </form>

        <div className="register-footer-link">
          <span>¿Ya tienes una cuenta? </span>
          <Link to="/login">Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}

export default RegisterForm;
