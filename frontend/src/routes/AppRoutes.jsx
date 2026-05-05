import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthPage from '../pages/AuthPage';
import Dashboard from '../pages/Dashboard';
import Usuarios from '../pages/Usuarios';
import Transacciones from '../pages/Transacciones';
import Prestamos from '../pages/Prestamos';
import Pagos from '../pages/Pagos';

// Rutas Privadas
const PrivateRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRole && user && user.role !== requiredRole) return <Navigate to="/dashboard" replace />;
  
  return children;
};

// Rutas Públicas (solo accesibles si no estás logueado)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth unificado: Login + Registro en un solo Sliding Panel */}
        <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><AuthPage /></PublicRoute>} />
        
        {/* Rutas Privadas */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/usuarios" element={<PrivateRoute requiredRole="admin"><Usuarios /></PrivateRoute>} />
        <Route path="/transacciones" element={<PrivateRoute><Transacciones /></PrivateRoute>} />
        <Route path="/prestamos" element={<PrivateRoute><Prestamos /></PrivateRoute>} />
        <Route path="/pagos" element={<PrivateRoute><Pagos /></PrivateRoute>} />
        
        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
