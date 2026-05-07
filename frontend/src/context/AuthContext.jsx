import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al montar: si hay token, consultar /me para obtener el rol REAL desde la BD
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, []);

  /**
   * Obtiene el usuario actual desde la BD.
   * FUENTE DE VERDAD para el rol — nunca confiar en el JWT para esto.
   */
  const fetchMe = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (err) {
      // Token inválido o expirado
      console.warn('[AuthContext] Token inválido, cerrando sesión.');
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleAuthError = () => {
      logout();
    };
    window.addEventListener('auth-error', handleAuthError);

    let timeoutId;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      if (isAuthenticated) {
        timeoutId = setTimeout(() => {
          logout();
          alert('Tu sesión se cerró automáticamente por inactividad.');
        }, 240000);
      }
    };

    const events = ['mousemove', 'keydown', 'scroll', 'click'];
    if (isAuthenticated) {
      resetTimer();
      events.forEach(event => window.addEventListener(event, resetTimer));
    }

    return () => {
      window.removeEventListener('auth-error', handleAuthError);
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [isAuthenticated]);

  const login = async (cedula, password) => {
    const response = await api.post('/auth/login', { cedula, password });
    const token = response.data.token;
    localStorage.setItem('token', token);

    // Obtener usuario REAL desde la BD (con rol verificado)
    setUser(response.data.usuario);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
  };

  // No renderizar rutas hasta saber si el usuario es válido
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--background, #f8f9ff)', color: 'var(--text-muted, #666)' }}>
        <p>Verificando sesión...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
