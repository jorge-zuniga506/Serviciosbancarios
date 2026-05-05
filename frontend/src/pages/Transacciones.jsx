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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>
          <ArrowRightLeft size={24} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }}/> 
          {user?.role === 'admin' ? 'Todas las Transacciones' : 'Historial de Transacciones'}
          {user?.role === 'admin' && (
            <span style={{ fontSize: '0.8rem', color: '#fff', background: '#ef4444', padding: '4px 8px', borderRadius: '4px', marginLeft: '12px', verticalAlign: 'middle' }}>Modo Admin</span>
          )}
        </h2>
        {user?.role !== 'admin' && (
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="login-btn" 
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}
          >
            Nueva Operación
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: 'var(--bg-dark)', padding: '24px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '16px' }}>Realizar Operación</h3>
          <form onSubmit={handleTransaccion} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Tipo de Operación</label>
              <select value={tipoTransaccion} onChange={e => setTipoTransaccion(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--bg-card)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                <option value="Transferencia">Transferencia a terceros</option>
                <option value="Retiro">Retiro</option>
                <option value="Deposito">Depósito</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Cuenta Origen</label>
              <select value={cuentaOrigen} onChange={e => setCuentaOrigen(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--bg-card)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px' }} required>
                <option value="">Selecciona tu cuenta</option>
                {misCuentas.filter(c => c.estado === 'Activa').map(c => <option key={c.id} value={c.id}>{c.numero_cuenta} (Saldo: ${parseFloat(c.saldo).toFixed(2)} {c.moneda})</option>)}
              </select>
            </div>
            {tipoTransaccion === 'Transferencia' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>ID Cuenta Destino</label>
                <input type="number" value={cuentaDestino} onChange={e => setCuentaDestino(e.target.value)} placeholder="Ej: 1" style={{ width: '100%', padding: '12px', background: 'var(--bg-card)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px' }} required />
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Monto</label>
              <input type="number" step="0.01" min="0.01" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" style={{ width: '100%', padding: '12px', background: 'var(--bg-card)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px' }} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Descripción (opcional)</label>
              <input type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Concepto del pago" maxLength={255} style={{ width: '100%', padding: '12px', background: 'var(--bg-card)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
            <button type="submit" className="login-btn" style={{ marginTop: 0 }} disabled={procesando}>
              {procesando ? 'Procesando...' : 'Procesar'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <p>Cargando información desde MySQL...</p>
      ) : transacciones.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
          <p>No hay transacciones registradas.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {transacciones.map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-dark)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <strong>{t.tipo_transaccion.replace('_', ' ')}</strong>
                  <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: estadoColor(t.estado), color: '#fff' }}>
                    {t.estado}
                  </span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {t.cuenta?.numero_cuenta || `Cuenta #${t.cuenta_id}`}
                  {t.cuenta_destino && ` → ${t.cuenta_destino.numero_cuenta}`}
                </div>
                {t.descripcion && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic', marginTop: '2px' }}>{t.descripcion}</div>
                )}
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', fontFamily: 'monospace' }}>
                  Ref: {t.referencia?.substring(0, 8)}... | {new Date(t.fecha).toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: t.tipo_transaccion === 'Deposito' || t.tipo_transaccion === 'Prestamo_Desembolso' ? '#10b981' : '#ef4444' }}>
                  {t.tipo_transaccion === 'Deposito' || t.tipo_transaccion === 'Prestamo_Desembolso' ? '+' : '-'}${parseFloat(t.monto).toFixed(2)}
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
