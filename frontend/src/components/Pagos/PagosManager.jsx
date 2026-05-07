import React, { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './PagosManager.css';

function PagosManager() {
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
      fetchCuentas();
      alert(`✅ ${response.data.message}\nDeuda restante: $${response.data.deuda_restante?.toFixed(2) || '0.00'}`);
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Error al procesar el pago');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <>
      <div className="pagos-header animate-fade-in">
        <div>
          <h1 className="pagos-title">
            {user?.role === 'admin' ? 'Seguimiento de Pagos' : 'Tus Pagos'}
          </h1>
          <p className="pagos-subtitle">
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
        <div className="glass-card pagos-form-card animate-fade-in">
          <h3 className="pagos-form-title">Realizar Pago a Préstamo</h3>
          <form onSubmit={handlePago} className="pagos-form">
            <div>
              <label className="form-label">Seleccionar Préstamo</label>
              <select value={prestamoId} onChange={e => setPrestamoId(e.target.value)} className="input-glass form-select" required>
                <option value="">Selecciona tu préstamo</option>
                {misPrestamos.map(p => <option key={p.id} value={p.id}>Préstamo #{p.id} (${parseFloat(p.monto_restante).toLocaleString()})</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Cuenta de Pago</label>
              <select value={cuentaId} onChange={e => setCuentaId(e.target.value)} className="input-glass form-select" required>
                <option value="">Selecciona tu cuenta</option>
                {misCuentas.map(c => <option key={c.id} value={c.id}>{c.numero_cuenta} (${parseFloat(c.saldo).toFixed(2)})</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Monto a Pagar</label>
              <input type="number" step="0.01" min="0.01" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" className="input-glass form-input" required />
            </div>
            <button type="submit" className="primary-btn" disabled={procesando}>
              {procesando ? 'Procesando...' : 'Pagar Ahora'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-dot"></div>
          <p>Cargando historial de pagos...</p>
        </div>
      ) : pagos.length === 0 ? (
        <div className="glass-card empty-state-card">
          <CreditCard size={48} className="empty-state-icon" />
          <p className="empty-state-text">No se encontraron pagos registrados.</p>
        </div>
      ) : (
        <div className="pagos-list">
          {pagos.map((p, index) => (
            <div key={p.id} className="glass-card pago-card animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="pago-left">
                <div className="glass-panel pago-icon-wrap">
                  <CreditCard size={24} color="#10b981" />
                </div>
                <div>
                  <div className="pago-titulo">Abono a Préstamo #{p.prestamo_id}</div>
                  {p.prestamo && (
                    <div className="pago-detalle">
                      Estado del crédito: <span className="pago-estado-label">{p.prestamo.estado}</span> • Deuda remanente: <span className="pago-deuda-label">${parseFloat(p.saldo_restante_despues || 0).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="pago-fecha">
                    {new Date(p.created_at || p.createdAt).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <div className="pago-right">
                <div className="pago-monto">
                  -${parseFloat(p.monto).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="pago-status">Transacción Exitosa</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default PagosManager;
