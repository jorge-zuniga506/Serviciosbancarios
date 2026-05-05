import React, { useState } from 'react';
import { ShieldCheck, User, Lock, CreditCard, Mail, UserPlus, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../styles/AuthPage.css';

function AuthPage() {
  // ── Clase maestra que dispara todas las animaciones ──
  const [rightPanelActive, setRightPanelActive] = useState(false);

  // ── Login state ──
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const { login } = useAuth();

  // ── Register state ──
  const [cedula, setCedula] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [cedulaLoading, setCedulaLoading] = useState(false);
  const navigate = useNavigate();

  // ── Handlers ──
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await login(loginEmail, loginPassword);
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Error al iniciar sesión');
    }
  };

  const handleCedulaChange = async (e) => {
    const val = e.target.value;
    setCedula(val);
    if (val.length >= 9) {
      try {
        setCedulaLoading(true);
        const response = await api.get(`/auth/cedula/${val}`);
        if (response.data && response.data.nombre) {
          const partes = response.data.nombre.split(' ');
          setNombre(partes[0] || '');
          setApellido(partes.slice(1).join(' ') || '');
          setRegError('');
        }
      } catch (err) {
        setRegError('Cédula no encontrada en el registro nacional.');
        setNombre('');
        setApellido('');
      } finally {
        setCedulaLoading(false);
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError('');
    try {
      await api.post('/auth/register', { cedula, nombre, apellido, email: regEmail, password: regPassword });
      alert('✅ Registro exitoso. Ahora puedes iniciar sesión.');
      // Limpiamos y volvemos al panel de login
      setCedula(''); setNombre(''); setApellido(''); setRegEmail(''); setRegPassword('');
      setRightPanelActive(false);
    } catch (err) {
      setRegError(err.response?.data?.message || err.response?.data?.error || 'Error al registrarse');
    }
  };

  return (
    <div className="auth-page">
      <div className={`auth-container${rightPanelActive ? ' right-panel-active' : ''}`}>

        {/* ═══════════ LOGIN FORM (izquierda) ═══════════ */}
        <div className="auth-form-container sign-in">
          <form className="auth-form" onSubmit={handleLogin}>
            <h1>Bienvenido</h1>
            <p className="subtitle">Ingresa a tu banca digital</p>

            {loginError && <div className="error-box">{loginError}</div>}

            <div className="field-group">
              <label>Correo electrónico</label>
              <div className="input-wrap">
                <Mail size={16} className="field-icon" />
                <input
                  type="email"
                  placeholder="ejemplo@banco.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field-group">
              <label>Contraseña</label>
              <div className="input-wrap">
                <Lock size={16} className="field-icon" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="submit-btn">
              Ingresar
            </button>

            <p className="auth-footer">🔒 Conexión cifrada AES-256</p>
          </form>
        </div>

        {/* ═══════════ REGISTER FORM (derecha) ═══════════ */}
        <div className="auth-form-container sign-up">
          <form className="auth-form" onSubmit={handleRegister}>
            <h1>Crear Cuenta</h1>
            <p className="subtitle">Registro con validación oficial</p>

            {regError && <div className="error-box">{regError}</div>}

            <div className="field-group">
              <label>Cédula de identidad</label>
              <div className="input-wrap">
                <CreditCard size={16} className="field-icon" />
                <input
                  type="text"
                  placeholder="Ej: 101110111"
                  value={cedula}
                  onChange={handleCedulaChange}
                  required
                />
              </div>
              {cedulaLoading && <p className="cedula-status">🔍 Validando en Hacienda...</p>}
            </div>

            <div className="field-row">
              <div className="field-group">
                <label>Nombre</label>
                <div className="input-wrap">
                  <User size={16} className="field-icon" />
                  <input
                    type="text"
                    placeholder="Tu nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="field-group">
                <label>Apellidos</label>
                <div className="input-wrap">
                  <User size={16} className="field-icon" />
                  <input
                    type="text"
                    placeholder="Tus apellidos"
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="field-group">
              <label>Correo electrónico</label>
              <div className="input-wrap">
                <Mail size={16} className="field-icon" />
                <input
                  type="email"
                  placeholder="ejemplo@banco.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="field-group">
              <label>Contraseña</label>
              <div className="input-wrap">
                <Lock size={16} className="field-icon" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={cedulaLoading}>
              Completar Registro
            </button>
          </form>
        </div>

        {/* ═══════════ OVERLAY DESLIZANTE ═══════════ */}
        <div className="auth-overlay-container">
          <div className="auth-overlay">

            {/* Panel izquierdo (se muestra al activar registro) */}
            <div className="auth-overlay-panel overlay-left">
              <ShieldCheck size={36} strokeWidth={1.5} color="rgba(255,255,255,0.9)" />
              <h2>¿Ya tienes cuenta?</h2>
              <p>Inicia sesión para acceder a tu banca digital de forma segura</p>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setRightPanelActive(false)}
              >
                Iniciar Sesión
              </button>
            </div>

            {/* Panel derecho (se muestra en estado inicial) */}
            <div className="auth-overlay-panel overlay-right">
              <UserPlus size={36} strokeWidth={1.5} color="rgba(255,255,255,0.9)" />
              <h2>¿Eres nuevo?</h2>
              <p>Crea tu cuenta en segundos y comienza a disfrutar de la banca del futuro</p>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setRightPanelActive(true)}
              >
                Registrarse
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default AuthPage;
