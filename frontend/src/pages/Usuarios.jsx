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
      <div className="page-header animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.02em' }}>Usuarios del Sistema</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Base de datos maestra de clientes y administradores</p>
        </div>
        <div className="glass-panel" style={{ padding: '8px 16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.85rem', fontWeight: '600' }}>
          ADMIN ACCESS
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="dot" style={{ width: '12px', height: '12px', background: 'var(--accent)', margin: '0 auto 16px' }}></div>
          <p>Consultando base de datos de usuarios...</p>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center', borderStyle: 'dashed' }}>
          <Users size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.5 }} />
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>No se encontraron usuarios registrados.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {usuarios.map((user, index) => (
            <div key={user.id} className="glass-card animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
                <div className="glass-panel" style={{ width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-glow)', fontSize: '1.2rem', fontWeight: '700' }}>
                  {user.nombre[0]}{user.apellido[0]}
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{user.nombre} {user.apellido}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: '600' }}>{user.role?.toUpperCase() || 'USER'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>📧</span>
                  <span style={{ color: 'var(--text-main)' }}>{user.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>📞</span>
                  <span style={{ color: 'var(--text-main)' }}>{user.telefono || 'No registrado'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>ID Interno:</span>
                  <code style={{ color: 'var(--accent)' }}>{user.id}</code>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </MainLayout>

  );
}

export default Usuarios;
