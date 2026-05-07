import React, { useState, useEffect } from 'react';
import { Landmark, Plus, X, AlertTriangle, Loader } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './PrestamosManager.css';

function PrestamosManager() {
  const [prestamos, setPrestamos] = useState([]);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [monto, setMonto] = useState('');
  const [interes, setInteres] = useState('5.5');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [usuarios, setUsuarios] = useState([]);

  // Modal de rechazo
  const [rechazandoId, setRechazandoId] = useState(null); // id del préstamo siendo rechazado
  const [razonModal, setRazonModal] = useState(null);      // { razon, nombreCliente }
  const [loadingRechazo, setLoadingRechazo] = useState(false);

  useEffect(() => {
    fetchPrestamos();
    if (user?.role === 'admin') fetchUsuarios();
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

  const handleRechazar = async (prestamo) => {
    if (!window.confirm(`¿Rechazar préstamo #${prestamo.id} de $${parseFloat(prestamo.monto).toLocaleString()}?\n\nGroq AI analizará el perfil del cliente y generará una razón personalizada.`)) return;

    setRechazandoId(prestamo.id);
    setLoadingRechazo(true);
    try {
      const response = await api.post(`/prestamos/${prestamo.id}/rechazar`);
      fetchPrestamos();
      setRazonModal({
        razon: response.data.razon_rechazo,
        nombreCliente: prestamo.usuario ? `${prestamo.usuario.nombre} ${prestamo.usuario.apellido}` : `Préstamo #${prestamo.id}`,
        monto: parseFloat(prestamo.monto).toLocaleString()
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Error al rechazar el préstamo');
    } finally {
      setRechazandoId(null);
      setLoadingRechazo(false);
    }
  };

  const estadoBadgeStyle = (estado) => {
    const colors = {
      Aprobado: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '#10b98140' },
      Pagado: { bg: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', border: '#6366f140' },
      Rechazado: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '#ef444440' },
    };
    const def = { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '#f59e0b40' };
    const c = colors[estado] || def;
    return { background: c.bg, color: c.color, border: `1px solid ${c.border}` };
  };

  return (
    <>
      {/* ── Modal razón de rechazo ── */}
      {razonModal && (
        <div className="rechazo-overlay" onClick={() => setRazonModal(null)}>
          <div className="rechazo-modal animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="rechazo-modal-header">
              <div className="rechazo-modal-icon">
                <AlertTriangle size={28} color="#ef4444" />
              </div>
              <div>
                <h2 className="rechazo-modal-title">Crédito Rechazado</h2>
                <p className="rechazo-modal-subtitle">
                  Cliente: <strong>{razonModal.nombreCliente}</strong> · Monto: <strong>${razonModal.monto}</strong>
                </p>
              </div>
              <button className="rechazo-modal-close" onClick={() => setRazonModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="rechazo-modal-body">
              <div className="rechazo-groq-badge">✦ Análisis generado por Groq AI</div>
              <p className="rechazo-razon">{razonModal.razon}</p>
            </div>
            <div className="rechazo-modal-footer">
              <button className="primary-btn" onClick={() => setRazonModal(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <div className="prestamos-header animate-fade-in">
        <div>
          <h1 className="prestamos-title">
            {user?.role === 'admin' ? 'Gestión de Créditos' : 'Tus Préstamos'}
          </h1>
          <p className="prestamos-subtitle">
            {user?.role === 'admin' ? 'Revisión y aprobación de solicitudes de financiamiento' : 'Consulta el estado de tus créditos y solicita financiamiento'}
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="primary-btn">
          {user?.role === 'admin' ? <Plus size={18} /> : <Landmark size={18} />}
          {user?.role === 'admin' ? 'Asignar Préstamo' : 'Solicitar Préstamo'}
        </button>
      </div>

      {showForm && (
        <div className="glass-card prestamos-form-card animate-fade-in">
          <h3 className="prestamos-form-title">Nueva Solicitud</h3>
          <form onSubmit={handlePrestamo} style={{ display: 'grid', gridTemplateColumns: user?.role === 'admin' ? '1fr 1fr 1fr auto' : '1fr 1fr auto', gap: '20px', alignItems: 'end' }}>
            {user?.role === 'admin' && (
              <div>
                <label className="form-label">Usuario Destino</label>
                <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="input-glass form-select" required>
                  <option value="">Seleccionar usuario</option>
                  {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="form-label">Monto a Solicitar</label>
              <input type="number" step="0.01" min="100" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" className="input-glass form-input" required />
            </div>
            <div>
              <label className="form-label">Tasa de Interés (%)</label>
              <input type="number" step="0.1" value={interes} onChange={e => setInteres(e.target.value)} className="input-glass form-input" required />
            </div>
            <button type="submit" className="primary-btn">Enviar Solicitud</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-dot"></div>
          <p>Consultando registros de crédito...</p>
        </div>
      ) : prestamos.length === 0 ? (
        <div className="glass-card empty-state-card">
          <Landmark size={48} className="empty-state-icon" />
          <p className="empty-state-text">No se encontraron préstamos activos.</p>
        </div>
      ) : (
        <div className="prestamos-grid">
          {prestamos.map((p, index) => (
            <div key={p.id} className="glass-card animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="prestamo-header">
                <div>
                  <div className="prestamo-id">Préstamo #{p.id}</div>
                  <div className="prestamo-ref">
                    {p.usuario ? `${p.usuario.nombre} ${p.usuario.apellido}` : 'Referencia Bancaria'}
                  </div>
                </div>
                <span className="prestamo-badge" style={estadoBadgeStyle(p.estado)}>
                  {p.estado}
                </span>
              </div>

              <div className="prestamo-monto-section">
                <div className="prestamo-monto-label">Monto Original</div>
                <div className="prestamo-monto-value">
                  <span className="prestamo-monto-symbol">$</span>
                  {parseFloat(p.monto).toLocaleString()}
                </div>
              </div>

              <div className="glass-panel prestamo-details-box">
                <div className="prestamo-detail-row">
                  <span className="prestamo-detail-label">Interés Anual</span>
                  <span className="prestamo-detail-value">{p.interes}%</span>
                </div>
                <div className="prestamo-detail-row">
                  <span className="prestamo-detail-label">Monto Restante</span>
                  <span className="prestamo-detail-value restante">${parseFloat(p.monto_restante || 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Razón de rechazo si existe */}
              {p.estado === 'Rechazado' && p.razon_rechazo && (
                <div className="prestamo-rechazo-nota">
                  <span className="prestamo-rechazo-label">✦ Razón IA:</span> {p.razon_rechazo}
                </div>
              )}

              {user.role === 'admin' && p.estado === 'Pendiente' && (
                <div className="prestamo-actions">
                  <button
                    onClick={() => handleAprobar(p.id)}
                    className="primary-btn prestamo-approve-btn"
                  >
                    Aprobar Crédito
                  </button>
                  <button
                    onClick={() => handleRechazar(p)}
                    className="prestamo-reject-btn"
                    disabled={rechazandoId === p.id}
                  >
                    {rechazandoId === p.id ? (
                      <><Loader size={16} className="spin-icon" /> Analizando...</>
                    ) : (
                      <><X size={16} /> Rechazar</>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default PrestamosManager;
