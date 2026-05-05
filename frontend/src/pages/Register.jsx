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
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <ShieldCheck size={48} color="#3b82f6" />
          <h2>Crear Cuenta</h2>
          <p>Registro Seguro con Cédula</p>
        </div>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleRegister}>
          <div className="input-group">
            <CreditCard size={20} className="input-icon" />
            <input
              type="text"
              placeholder="Número de Cédula (Ej: 101110111)"
              value={cedula}
              onChange={handleCedulaChange}
              required
            />
          </div>
          {loading && <p style={{fontSize: '0.8rem', color: '#3b82f6', marginBottom: '10px'}}>Buscando en Hacienda...</p>}
          <div className="input-group">
            <User size={20} className="input-icon" />
            <input
              type="text"
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <User size={20} className="input-icon" />
            <input
              type="text"
              placeholder="Apellidos"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <Mail size={20} className="input-icon" />
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
          <button type="submit" className="login-btn" disabled={loading}>Registrarse</button>
        </form>
        <div style={{ marginTop: '16px', fontSize: '0.9rem' }}>
          <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none' }}>¿Ya tienes cuenta? Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
