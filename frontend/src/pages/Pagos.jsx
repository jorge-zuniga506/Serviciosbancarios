import React, { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import api from '../services/api';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext';

function Pagos() {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [monto, setMonto] = useState('');
  const [prestamoId, setPrestamoId] = useState('');
  const [cuentaId, setCuentaId] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [misPrestamos, setMisPrestamos] = useState([]);
  const [misCuentas, setMisCuentas] = useState([]);

  useEffect(() => {
    fetchPagos();
    fetchPrestamos();
    fetchCuentas();
  }, []);

  const fetchPrestamos = async () => {
    try {
      const response = await api.get('/prestamos');
      setMisPrestamos(response.data.filter(p => p.estado === 'Aprobado'));
    } catch (err) {}
  };

  const fetchCuentas = async () => {
    try {
      const response = await api.get('/cuentas');
      setMisCuentas(response.data.filter(c => c.estado === 'Activa'));
    } catch (err) {}
  };

  const fetchPagos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pagos');
      setPagos(response.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePago = async (e) => {
    e.preventDefault();
    if (procesando) return;
    setProcesando(true);
    try {
      const response = await api.post('/pagos', {
        monto: parseFloat(monto),
        prestamo_id: prestamoId,
        cuenta_id: cuentaId
      });
      setShowForm(false);
      setMonto('');
      fetchPagos();
      fetchPrestamos();
      fetchCuentas(); // actualizar saldos
      alert(`✅ ${response.data.message}\nDeuda restante: $${response.data.deuda_restante?.toFixed(2) || '0.00'}`);
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Error al procesar el pago');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <MainLayout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>
          <CreditCard size={24} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }}/> 
          Pagos de Préstamos
          {user?.role === 'admin' && (
            <span style={{ fontSize: '0.8rem', color: '#fff', background: '#ef4444', padding: '4px 8px', borderRadius: '4px', marginLeft: '12px', verticalAlign: 'middle' }}>Modo Admin</span>
          )}
        </h2>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="login-btn" 
          style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}
        >
          Nuevo Pago
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--bg-dark)', padding: '24px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '16px' }}>Realizar Pago a Préstamo</h3>
          <form onSubmit={handlePago} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Seleccionar Préstamo Aprobado</label>
              <select value={prestamoId} onChange={e => setPrestamoId(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--bg-card)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px' }} required>
                <option value="">Selecciona tu préstamo</option>
                {misPrestamos.map(p => <option key={p.id} value={p.id}>Préstamo #{p.id} (Resta: ${parseFloat(p.monto_restante).toLocaleString()})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Cuenta de Pago</label>
              <select value={cuentaId} onChange={e => setCuentaId(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--bg-card)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px' }} required>
                <option value="">Selecciona tu cuenta</option>
                {misCuentas.map(c => <option key={c.id} value={c.id}>{c.numero_cuenta} (Saldo: ${parseFloat(c.saldo).toFixed(2)})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Monto a Pagar</label>
              <input type="number" step="0.01" min="0.01" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '12px', background: 'var(--bg-card)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px' }} required />
            </div>
            <button type="submit" className="login-btn" style={{ marginTop: 0 }} disabled={procesando}>
              {procesando ? 'Procesando...' : 'Pagar Ahora'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <p>Cargando información desde MySQL...</p>
      ) : pagos.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
          <p>No hay pagos registrados.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {pagos.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-dark)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div>
                <strong>Abono a Préstamo #{p.prestamo_id}</strong>
                {p.prestamo && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Estado del préstamo: {p.prestamo.estado} | Restante: ${parseFloat(p.saldo_restante_despues || 0).toLocaleString()}
                  </div>
                )}
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                  {new Date(p.created_at || p.createdAt).toLocaleString()}
                </div>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#059669' }}>
                -${parseFloat(p.monto).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </MainLayout>
  );
}

export default Pagos;
