import React, { useState, useEffect } from 'react';
import { Landmark } from 'lucide-react';
import api from '../services/api';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext';

function Prestamos() {
  const [prestamos, setPrestamos] = useState([]);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [monto, setMonto] = useState('');
  const [interes, setInteres] = useState('5.5');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    fetchPrestamos();
    if (user?.role === 'admin') {
      fetchUsuarios();
    }
  }, [user]);

  const fetchUsuarios = async () => {
    try {
      const response = await api.get('/usuarios');
      setUsuarios(response.data);
    } catch (err) {}
  };

  const fetchPrestamos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/prestamos');
      setPrestamos(response.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrestamo = async (e) => {
    e.preventDefault();
    try {
      await api.post('/prestamos', {
        monto: parseFloat(monto),
        interes: parseFloat(interes),
        usuario_id: user.role === 'admin' && selectedUserId ? selectedUserId : user.userId
      });
      setShowForm(false);
      setMonto('');
      setSelectedUserId('');
      fetchPrestamos();
      alert('Préstamo solicitado con éxito. Estado: Pendiente de aprobación.');
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Error al solicitar el préstamo');
    }
  };

  const handleAprobar = async (id) => {
    try {
      await api.put(`/prestamos/${id}/estado`, { estado: 'Aprobado' });
      fetchPrestamos();
      alert('Préstamo aprobado. El monto fue depositado en la cuenta del usuario.');
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Error al aprobar el préstamo');
    }
  };

  return (
    <MainLayout>
      <div className="page-header animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
            {user?.role === 'admin' ? 'Gestión de Créditos' : 'Tus Préstamos'}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            {user?.role === 'admin' ? 'Revisión y aprobación de solicitudes de financiamiento' : 'Consulta el estado de tus créditos y solicita financiamiento'}
          </p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="primary-btn"
        >
          {user?.role === 'admin' ? <Plus size={18} /> : <Landmark size={18} />}
          {user?.role === 'admin' ? 'Asignar Préstamo' : 'Solicitar Préstamo'}
        </button>
      </div>

      {showForm && (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '32px', border: '1px solid var(--accent)' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Nueva Solicitud</h3>
          <form onSubmit={handlePrestamo} style={{ display: 'grid', gridTemplateColumns: user?.role === 'admin' ? '1fr 1fr 1fr auto' : '1fr 1fr auto', gap: '20px', alignItems: 'end' }}>
            {user?.role === 'admin' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '500' }}>Usuario Destino</label>
                <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="input-glass" style={{ width: '100%' }} required>
                  <option value="">Seleccionar usuario</option>
                  {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '500' }}>Monto a Solicitar</label>
              <input type="number" step="0.01" min="100" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" className="input-glass" style={{ width: '100%' }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '500' }}>Tasa de Interés (%)</label>
              <input type="number" step="0.1" value={interes} onChange={e => setInteres(e.target.value)} className="input-glass" style={{ width: '100%' }} required />
            </div>
            <button type="submit" className="primary-btn">Enviar Solicitud</button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="dot" style={{ width: '12px', height: '12px', background: 'var(--accent)', margin: '0 auto 16px' }}></div>
          <p>Consultando registros de crédito...</p>
        </div>
      ) : prestamos.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center', borderStyle: 'dashed' }}>
          <Landmark size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.5 }} />
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>No se encontraron préstamos activos.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {prestamos.map((p, index) => (
            <div key={p.id} className="glass-card animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                   <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>Préstamo #{p.id}</div>
                   <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Referencia Bancaria</div>
                </div>
                <span style={{ 
                  padding: '4px 12px', 
                  borderRadius: '20px', 
                  fontSize: '0.75rem', 
                  background: p.estado === 'Aprobado' ? 'rgba(16, 185, 129, 0.1)' : p.estado === 'Pagado' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                  color: p.estado === 'Aprobado' ? '#10b981' : p.estado === 'Pagado' ? '#6366f1' : '#f59e0b',
                  border: `1px solid ${p.estado === 'Aprobado' ? '#10b98140' : p.estado === 'Pagado' ? '#6366f140' : '#f59e0b40'}`
                }}>
                  {p.estado}
                </span>
              </div>
              
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Monto Original</div>
                <div style={{ fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
                  <span style={{ fontSize: '1rem', verticalAlign: 'top', marginRight: '2px', color: 'var(--text-muted)' }}>$</span>
                  {parseFloat(p.monto).toLocaleString()}
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '16px', borderRadius: '16px', boxShadow: 'none', background: 'rgba(255,255,255,0.03)', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Interés Anual</span>
                  <span style={{ fontWeight: '600' }}>{p.interes}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Monto Restante</span>
                  <span style={{ fontWeight: '600', color: '#f43f5e' }}>${parseFloat(p.monto_restante || 0).toLocaleString()}</span>
                </div>
              </div>

              {user.role === 'admin' && p.estado === 'Pendiente' && (
                <button 
                  onClick={() => handleAprobar(p.id)} 
                  className="primary-btn" 
                  style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  Aprobar Crédito
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </MainLayout>

  );
}

export default Prestamos;
