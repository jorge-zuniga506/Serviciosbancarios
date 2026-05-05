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
      <div className="page-header animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
            {user?.role === 'admin' ? 'Seguimiento de Pagos' : 'Tus Pagos'}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            {user?.role === 'admin' ? 'Monitoreo de recaudación y amortizaciones' : 'Gestiona las cuotas de tus préstamos activos'}
          </p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="primary-btn"
        >
          <CreditCard size={18} /> Nuevo Pago
        </button>
      </div>

      {showForm && (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '32px', border: '1px solid var(--accent)' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Realizar Pago a Préstamo</h3>
          <form onSubmit={handlePago} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '20px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '500' }}>Seleccionar Préstamo</label>
              <select value={prestamoId} onChange={e => setPrestamoId(e.target.value)} className="input-glass" style={{ width: '100%' }} required>
                <option value="">Selecciona tu préstamo</option>
                {misPrestamos.map(p => <option key={p.id} value={p.id}>Préstamo #{p.id} (${parseFloat(p.monto_restante).toLocaleString()})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '500' }}>Cuenta de Pago</label>
              <select value={cuentaId} onChange={e => setCuentaId(e.target.value)} className="input-glass" style={{ width: '100%' }} required>
                <option value="">Selecciona tu cuenta</option>
                {misCuentas.map(c => <option key={c.id} value={c.id}>{c.numero_cuenta} (${parseFloat(c.saldo).toFixed(2)})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '500' }}>Monto a Pagar</label>
              <input type="number" step="0.01" min="0.01" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" className="input-glass" style={{ width: '100%' }} required />
            </div>
            <button type="submit" className="primary-btn" disabled={procesando}>
              {procesando ? 'Procesando...' : 'Pagar Ahora'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="dot" style={{ width: '12px', height: '12px', background: 'var(--accent)', margin: '0 auto 16px' }}></div>
          <p>Cargando historial de pagos...</p>
        </div>
      ) : pagos.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center', borderStyle: 'dashed' }}>
          <CreditCard size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.5 }} />
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>No se encontraron pagos registrados.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {pagos.map((p, index) => (
            <div key={p.id} className="glass-card animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', animationDelay: `${index * 0.05}s` }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div className="glass-panel" style={{ padding: '12px', borderRadius: '16px', boxShadow: 'none', background: 'rgba(16, 185, 129, 0.05)' }}>
                  <CreditCard size={24} color="#10b981" />
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '4px' }}>Abono a Préstamo #{p.prestamo_id}</div>
                  {p.prestamo && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Estado del crédito: <span style={{ color: 'var(--accent)' }}>{p.prestamo.estado}</span> • Deuda remanente: <span style={{ color: '#f43f5e' }}>${parseFloat(p.saldo_restante_despues || 0).toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
                    {new Date(p.created_at || p.createdAt).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981', letterSpacing: '-0.02em' }}>
                  -${parseFloat(p.monto).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Transacción Exitosa</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </MainLayout>

  );
}

export default Pagos;
