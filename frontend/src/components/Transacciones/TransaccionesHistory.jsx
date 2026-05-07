import React, { useState, useEffect } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './TransaccionesHistory.css';

function TransaccionesHistory() {
  const [transacciones, setTransacciones] = useState([]);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [tipoTransaccion, setTipoTransaccion] = useState('Transferencia');
  const [monto, setMonto] = useState('');
  const [cuentaOrigen, setCuentaOrigen] = useState('');
  const [cuentaDestino, setCuentaDestino] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [procesando, setProcesando] = useState(false);

  // Para cargar cuentas del usuario
  const [misCuentas, setMisCuentas] = useState([]);

  useEffect(() => {
    fetchTransacciones();
    fetchMisCuentas();
  }, []);

  const fetchMisCuentas = async () => {
    try {
      const response = await api.get('/cuentas');
      setMisCuentas(response.data);
    } catch (err) { }
  };

  const handleTransaccion = async (e) => {
    e.preventDefault();
    if (procesando) return; // prevenir doble click
    setProcesando(true);
    try {
      const response = await api.post('/transacciones', {
        tipo_transaccion: tipoTransaccion,
        monto: parseFloat(monto),
        cuenta_id: cuentaOrigen,
        cuenta_destino_id: tipoTransaccion === 'Transferencia' ? cuentaDestino : undefined,
        descripcion: descripcion || undefined
      });
      setShowForm(false);
      setMonto('');
      setDescripcion('');
      fetchTransacciones();
      fetchMisCuentas(); // actualizar saldos
      alert(`✅ ${response.data.message}\nReferencia: ${response.data.transaccion.referencia}`);
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Error al procesar la transacción');
    } finally {
      setProcesando(false);
    }
  };

  const fetchTransacciones = async () => {
    try {
      setLoading(true);
      const response = await api.get('/transacciones');
      setTransacciones(response.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const estadoColor = (estado) => {
    switch (estado) {
      case 'Completada': return '#10b981';
      case 'Fallida': return '#ef4444';
      case 'Pendiente': return '#f59e0b';
      case 'Reversada': return '#8b5cf6';
      default: return '#94a3b8';
    }
  };

  const esIngreso = (tipo) => tipo === 'Deposito' || tipo === 'Prestamo_Desembolso';

  return (
    <>
      <div className="transacciones-header animate-fade-in">
        <div>
          <h1 className="transacciones-title">
            {user?.role === 'admin' ? 'Movimientos Globales' : 'Tus Movimientos'}
          </h1>
          <p className="transacciones-subtitle">
            {user?.role === 'admin' ? 'Auditoría en tiempo real de transacciones' : 'Gestiona tus fondos y transferencias de forma segura'}
          </p>
        </div>
        {user?.role !== 'admin' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="primary-btn"
          >
            <ArrowRightLeft size={18} /> Nueva Operación
          </button>
        )}
      </div>

      {showForm && (
        <div className="glass-card transacciones-form-card animate-fade-in">
          <h3 className="transacciones-form-title">Realizar Operación</h3>
          <form onSubmit={handleTransaccion} className="transacciones-form">
            <div>
              <label className="form-label">Tipo de Operación</label>
              <select value={tipoTransaccion} onChange={e => setTipoTransaccion(e.target.value)} className="input-glass form-select">
                <option value="Transferencia">Transferencia a terceros</option>
                <option value="Retiro">Retiro</option>
                <option value="Deposito">Depósito</option>
              </select>
            </div>
            <div>
              <label className="form-label">Cuenta Origen</label>
              <select value={cuentaOrigen} onChange={e => setCuentaOrigen(e.target.value)} className="input-glass form-select" required>
                <option value="">Selecciona tu cuenta</option>
                {misCuentas.filter(c => c.estado === 'Activa').map(c => <option key={c.id} value={c.id}>{c.numero_cuenta} (${parseFloat(c.saldo).toFixed(2)} {c.moneda})</option>)}
              </select>
            </div>
            {tipoTransaccion === 'Transferencia' && (
              <div>
                <label className="form-label">ID Cuenta Destino</label>
                <input type="number" value={cuentaDestino} onChange={e => setCuentaDestino(e.target.value)} placeholder="Ej: 1" className="input-glass form-input" required />
              </div>
            )}
            <div>
              <label className="form-label">Monto</label>
              <input type="number" step="0.01" min="0.01" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" className="input-glass form-input" required />
            </div>
            <div className="form-span-2">
              <label className="form-label">Descripción (opcional)</label>
              <input type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Concepto del pago" maxLength={255} className="input-glass form-input" />
            </div>
            <div className="form-actions">
              <button type="submit" className="primary-btn form-submit-btn" disabled={procesando}>
                {procesando ? 'Procesando...' : 'Confirmar Operación'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-dot"></div>
          <p>Obteniendo historial de transacciones...</p>
        </div>
      ) : transacciones.length === 0 ? (
        <div className="glass-card empty-state-card">
          <ArrowRightLeft size={48} className="empty-state-icon" />
          <p className="empty-state-text">Aún no hay transacciones registradas.</p>
        </div>
      ) : (
        <div className="transacciones-list">
          {transacciones.map((t, index) => (
            <div key={t.id} className="glass-card transaccion-card animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="transaccion-left">
                <div className="glass-panel transaccion-icon-wrap">
                  <ArrowRightLeft size={24} color={esIngreso(t.tipo_transaccion) ? '#10b981' : 'var(--accent)'} />
                </div>
                <div>
                  <div className="transaccion-info-header">
                    <span className="transaccion-tipo">{t.tipo_transaccion.replace(/_/g, ' ')}</span>
                    <span
                      className="transaccion-badge"
                      style={{
                        background: `${estadoColor(t.estado)}20`,
                        color: estadoColor(t.estado),
                        border: `1px solid ${estadoColor(t.estado)}40`
                      }}
                    >
                      {t.estado}
                    </span>
                  </div>
                  <div className="transaccion-cuentas">
                    <span className="transaccion-cuenta-num">{t.cuenta?.numero_cuenta || `Cuenta #${t.cuenta_id}`}</span>
                    {t.cuenta_destino && <span className="transaccion-flecha">→</span>}
                    {t.cuenta_destino && <span className="transaccion-cuenta-num">{t.cuenta_destino.numero_cuenta}</span>}
                  </div>
                  {t.descripcion && (
                    <div className="transaccion-descripcion">"{t.descripcion}"</div>
                  )}
                </div>
              </div>
              <div className="transaccion-right">
                <div className={`transaccion-monto ${esIngreso(t.tipo_transaccion) ? 'ingreso' : 'egreso'}`}>
                  {esIngreso(t.tipo_transaccion) ? '+' : '-'}${parseFloat(t.monto).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="transaccion-meta">
                  {new Date(t.fecha).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} • Ref: {t.referencia?.substring(0, 8)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default TransaccionesHistory;
