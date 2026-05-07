import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import api from '../../services/api';
import './UsuariosList.css';

function UsuariosList() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const response = await api.get('/usuarios');
      setUsuarios(response.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="usuarios-header animate-fade-in">
        <div>
          <h1 className="usuarios-title">Usuarios del Sistema</h1>
          <p className="usuarios-subtitle">Base de datos maestra de clientes y administradores</p>
        </div>
        <div className="glass-panel admin-badge">
          ADMIN ACCESS
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-dot"></div>
          <p>Consultando base de datos de usuarios...</p>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="glass-card empty-state-card">
          <Users size={48} className="empty-state-icon" />
          <p className="empty-state-text">No se encontraron usuarios registrados.</p>
        </div>
      ) : (
        <div className="usuarios-grid">
          {usuarios.map((user, index) => (
            <div key={user.id} className="glass-card animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="user-header">
                <div className="glass-panel user-avatar">
                  {user.nombre[0]}{user.apellido[0]}
                </div>
                <div>
                  <div className="user-name">{user.nombre} {user.apellido}</div>
                  <div className="user-role">{user.role?.toUpperCase() || 'USER'}</div>
                  <div className="user-id">ID: {user.cedula || 'Sin cédula'}</div>
                </div>
              </div>

              <div className="user-details">
                <div className="user-detail-row">
                  <span className="detail-icon">📧</span>
                  <span className="detail-text">{user.email}</span>
                </div>
                <div className="user-detail-row">
                  <span className="detail-icon">📞</span>
                  <span className="detail-text">{user.telefono || 'No registrado'}</span>
                </div>
                <div className="internal-id-box">
                  <span className="internal-id-label">ID Interno:</span>
                  <code className="internal-id-value">{user.id}</code>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default UsuariosList;
