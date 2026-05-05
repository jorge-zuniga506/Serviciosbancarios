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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>
          <Landmark size={24} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }}/> 
          {user?.role === 'admin' ? 'Administración de Préstamos' : 'Mis Préstamos'}
          {user?.role === 'admin' && (
            <span style={{ fontSize: '0.8rem', color: '#fff', background: '#ef4444', padding: '4px 8px', borderRadius: '4px', marginLeft: '12px', verticalAlign: 'middle' }}>Modo Admin</span>
          )}
        </h2>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="login-btn" 
          style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}
        >
          {user?.role === 'admin' ? 'Asignar Préstamo' : 'Solicitar Préstamo'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--bg-dark)', padding: '24px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '16px' }}>Nueva Solicitud</h3>
          <form onSubmit={handlePrestamo} style={{ display: 'grid', gridTemplateColumns: user?.role === 'admin' ? '1fr 1fr 1fr auto' : '1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
            {user?.role === 'admin' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Usuario Destino</label>
                <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--bg-card)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px' }} required>
                  <option value="">Seleccionar usuario</option>
                  {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
                </select>
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Monto a Solicitar</label>
              <input type="number" step="0.01" min="100" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '12px', background: 'var(--bg-card)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px' }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Tasa de Interés (%)</label>
              <input type="number" step="0.1" value={interes} onChange={e => setInteres(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--bg-card)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px' }} required />
            </div>
            <button type="submit" className="login-btn" style={{ marginTop: 0 }}>Enviar Solicitud</button>
          </form>
        </div>
      )}

      {loading ? (
        <p>Cargando información desde MySQL...</p>
      ) : prestamos.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
          <p>No hay préstamos solicitados.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {prestamos.map(p => (
            <div key={p.id} className="cuenta-card" style={{ background: 'var(--bg-dark)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="cuenta-tipo">Préstamo #{p.id}</div>
                <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', background: p.estado === 'Aprobado' ? '#065f46' : p.estado === 'Pagado' ? '#3b82f6' : '#9a3412', color: 'white' }}>
                  {p.estado}
                </span>
              </div>
              <div className="cuenta-saldo" style={{ marginTop: '16px' }}>
                ${parseFloat(p.monto).toLocaleString()}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '8px' }}>
                Interés: {p.interes}% | Restante a pagar: ${parseFloat(p.monto_restante || 0).toLocaleString()}
              </div>
              {user.role === 'admin' && p.estado === 'Pendiente' && (
                <button onClick={() => handleAprobar(p.id)} className="login-btn" style={{ marginTop: '12px', padding: '8px', fontSize: '0.85rem', background: '#059669' }}>
                  Aprobar Préstamo
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
