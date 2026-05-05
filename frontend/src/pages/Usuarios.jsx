import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import api from '../services/api';
import MainLayout from '../layouts/MainLayout';

function Usuarios() {
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
    <MainLayout>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h2>
          <Users size={24} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }}/> 
          Usuarios Registrados
          <span style={{ fontSize: '0.8rem', color: '#fff', background: '#ef4444', padding: '4px 8px', borderRadius: '4px', marginLeft: '12px', verticalAlign: 'middle' }}>Modo Admin</span>
        </h2>
      </div>

      {loading ? (
        <p>Cargando información desde MySQL...</p>
      ) : usuarios.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
          <p>No hay usuarios en la base de datos.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {usuarios.map(user => (
            <div key={user.id} className="cuenta-card" style={{ background: 'var(--bg-dark)' }}>
              <div className="cuenta-tipo">{user.nombre} {user.apellido}</div>
              <div className="cuenta-numero">{user.email}</div>
              <div className="cuenta-saldo" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                Tel: {user.telefono || 'N/A'}
              </div>
            </div>
          ))}
        </div>
      )}
    </MainLayout>
  );
}

export default Usuarios;
