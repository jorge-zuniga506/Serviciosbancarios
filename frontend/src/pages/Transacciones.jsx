import React, { useState, useEffect } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import api from '../services/api';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext';

function Transacciones() {
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

  return (
    <MainLayout>
      <div className="page-header animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
            {user?.role === 'admin' ? 'Movimientos Globales' : 'Tus Movimientos'}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
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
        <div className="glass-card animate-fade-in" style={{ marginBottom: '32px', border: '1px solid var(--accent)' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Realizar Operación</h3>
          <form onSubmit={handleTransaccion} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '500' }}>Tipo de Operación</label>
              <select value={tipoTransaccion} onChange={e => setTipoTransaccion(e.target.value)} className="input-glass" style={{ width: '100%' }}>
                <option value="Transferencia">Transferencia a terceros</option>
                <option value="Retiro">Retiro</option>
                <option value="Deposito">Depósito</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '500' }}>Cuenta Origen</label>
              <select value={cuentaOrigen} onChange={e => setCuentaOrigen(e.target.value)} className="input-glass" style={{ width: '100%' }} required>
                <option value="">Selecciona tu cuenta</option>
                {misCuentas.filter(c => c.estado === 'Activa').map(c => <option key={c.id} value={c.id}>{c.numero_cuenta} (${parseFloat(c.saldo).toFixed(2)} {c.moneda})</option>)}
              </select>
            </div>
            {tipoTransaccion === 'Transferencia' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '500' }}>ID Cuenta Destino</label>
                <input type="number" value={cuentaDestino} onChange={e => setCuentaDestino(e.target.value)} placeholder="Ej: 1" className="input-glass" style={{ width: '100%' }} required />
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '500' }}>Monto</label>
              <input type="number" step="0.01" min="0.01" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" className="input-glass" style={{ width: '100%' }} required />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '500' }}>Descripción (opcional)</label>
              <input type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Concepto del pago" maxLength={255} className="input-glass" style={{ width: '100%' }} />
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="primary-btn" disabled={procesando} style={{ padding: '12px 40px' }}>
                {procesando ? 'Procesando...' : 'Confirmar Operación'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="dot" style={{ width: '12px', height: '12px', background: 'var(--accent)', margin: '0 auto 16px' }}></div>
          <p>Obteniendo historial de transacciones...</p>
        </div>
      ) : transacciones.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center', borderStyle: 'dashed' }}>
          <ArrowRightLeft size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.5 }} />
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>Aún no hay transacciones registradas.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {transacciones.map((t, index) => (
            <div key={t.id} className="glass-card animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', animationDelay: `${index * 0.05}s` }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div className="glass-panel" style={{ padding: '12px', borderRadius: '16px', boxShadow: 'none', background: 'rgba(255,255,255,0.05)' }}>
                  <ArrowRightLeft size={24} color={t.tipo_transaccion === 'Deposito' || t.tipo_transaccion === 'Prestamo_Desembolso' ? '#10b981' : 'var(--accent)'} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{t.tipo_transaccion.replace(/_/g, ' ')}</span>
                    <span style={{ fontSize: '0.7rem', padding: '4px 10px', borderRadius: '20px', background: `${estadoColor(t.estado)}20`, color: estadoColor(t.estado), border: `1px solid ${estadoColor(t.estado)}40` }}>
                      {t.estado}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <span style={{ fontFamily: 'monospace' }}>{t.cuenta?.numero_cuenta || `Cuenta #${t.cuenta_id}`}</span>
                    {t.cuenta_destino && <span style={{ margin: '0 8px' }}>→</span>}
                    {t.cuenta_destino && <span style={{ fontFamily: 'monospace' }}>{t.cuenta_destino.numero_cuenta}</span>}
                  </div>
                  {t.descripcion && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic', marginTop: '4px' }}>"{t.descripcion}"</div>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: t.tipo_transaccion === 'Deposito' || t.tipo_transaccion === 'Prestamo_Desembolso' ? '#10b981' : '#f43f5e', letterSpacing: '-0.02em' }}>
                  {t.tipo_transaccion === 'Deposito' || t.tipo_transaccion === 'Prestamo_Desembolso' ? '+' : '-'}${parseFloat(t.monto).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
                  {new Date(t.fecha).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} • Ref: {t.referencia?.substring(0, 8)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </MainLayout>

  );
}

export default Transacciones;
