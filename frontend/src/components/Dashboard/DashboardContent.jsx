import React, { useState, useEffect } from 'react';
import { CreditCard, ArrowRightLeft, TrendingUp, Plus, Wallet } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './DashboardContent.css';

// ── Componente del cliente (Panel del Cliente - ModernBank design) ──
function ClientDashboard({ user }) {
  const [cuentas, setCuentas] = useState([]);
  const [transacciones, setTransacciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tipoCuenta, setTipoCuenta] = useState('Ahorros');
  const [moneda, setMoneda] = useState('USD');

  useEffect(() => {
    Promise.all([fetchCuentas(), fetchTransacciones()]).finally(() => setLoading(false));
  }, []);

  const fetchCuentas = async () => {
    try {
      const res = await api.get('/cuentas');
      setCuentas(res.data);
    } catch (e) {}
  };

  const fetchTransacciones = async () => {
    try {
      const res = await api.get('/transacciones');
      setTransacciones(res.data);
    } catch (e) {}
  };

  const handleCrearCuenta = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cuentas', { tipo_cuenta: tipoCuenta, moneda });
      setShowForm(false);
      fetchCuentas();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al crear la cuenta');
    }
  };

  const totalBalance = cuentas.reduce((sum, c) => sum + parseFloat(c.saldo || 0), 0);
  const getHour = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const esIngreso = (tipo) => tipo === 'Deposito' || tipo === 'Prestamo_Desembolso';

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return `Hoy, ${d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    if (d.toDateString() === yesterday.toDateString()) return 'Ayer';
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  if (loading) {
    return (
      <div className="client-loading">
        <div className="client-loading-dot"></div>
        <p>Cargando tu información financiera...</p>
      </div>
    );
  }

  return (
    <>
      {/* ── HEADER ── */}
      <div className="client-header animate-fade-in">
        <div>
          <h1 className="client-greeting">{getHour()}, {user?.nombre} 👋</h1>
          <p className="client-greeting-sub">Aquí está tu resumen financiero de hoy.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowForm(!showForm)} className="primary-btn">
            <Plus size={16} /> Nueva Cuenta
          </button>
        </div>
      </div>

      {/* ── FORMULARIO NUEVA CUENTA ── */}
      {showForm && (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '24px', border: '1px solid var(--accent)', padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1rem', fontWeight: '600' }}>Abrir Nueva Cuenta</h3>
          <form onSubmit={handleCrearCuenta} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '500' }}>Tipo de Cuenta</label>
              <select value={tipoCuenta} onChange={e => setTipoCuenta(e.target.value)} className="input-glass" style={{ width: '100%' }}>
                <option value="Ahorros">Ahorros</option>
                <option value="Corriente">Corriente</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '500' }}>Moneda</label>
              <select value={moneda} onChange={e => setMoneda(e.target.value)} className="input-glass" style={{ width: '100%' }}>
                <option value="USD">USD</option>
                <option value="MXN">MXN</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <button type="submit" className="primary-btn">Crear</button>
          </form>
        </div>
      )}

      {/* ── TOTAL BALANCE HERO ── */}
      <div className="balance-hero-card animate-fade-in">
        <div>
          <div className="balance-hero-label">Saldo Total</div>
          <div className="balance-hero-amount">
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            <span className="balance-hero-currency">USD</span>
          </div>
        </div>
        <div className="balance-hero-actions">
          <a href="/transacciones" className="primary-btn" style={{ textDecoration: 'none' }}>
            <ArrowRightLeft size={16} /> Transferir
          </a>
        </div>
      </div>

      {/* ── CUENTAS ACTIVAS ── */}
      <div className="section-header">
        <span className="section-title">Cuentas Activas</span>
        {cuentas.length > 0 && <a href="/dashboard" className="section-link">Ver todas</a>}
      </div>

      {cuentas.length === 0 ? (
        <div className="client-empty" style={{ marginBottom: '32px' }}>
          <Wallet size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
          <p>No tienes cuentas activas aún.</p>
        </div>
      ) : (
        <div className="accounts-row" style={{ marginBottom: '32px' }}>
          {cuentas.map((c) => (
            <div key={c.id} className="account-mini-card">
              <div className="account-mini-top">
                <div className="account-mini-icon">
                  <CreditCard size={18} color="var(--primary)" />
                </div>
                <span className="account-mini-num">···{c.numero_cuenta?.slice(-4) || c.id}</span>
              </div>
              <div className="account-mini-type">{c.tipo_cuenta}</div>
              <div className="account-mini-balance">
                ${parseFloat(c.saldo).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '4px', fontWeight: '400' }}>{c.moneda}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PROMO BANNER ── */}
      <div className="promo-banner animate-fade-in" style={{ marginBottom: '32px' }}>
        <div className="promo-banner-left">
          <div className="promo-badge">✦ Rendimiento</div>
          <div className="promo-title">Obtén 4.5% APY en Ahorros</div>
          <div className="promo-desc">Abre una cuenta de ahorros de alto rendimiento hoy y observa cómo crece tu dinero.</div>
        </div>
        <button className="promo-btn" onClick={() => setShowForm(true)}>
          Abrir Cuenta
        </button>
      </div>

      {/* ── ACTIVIDAD RECIENTE ── */}
      <div className="section-header">
        <span className="section-title">Actividad Reciente</span>
      </div>

      {transacciones.length === 0 ? (
        <div className="client-empty">
          <ArrowRightLeft size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
          <p>No hay transacciones recientes.</p>
        </div>
      ) : (
        <>
          <div className="activity-list animate-fade-in">
            {transacciones.slice(0, 5).map((t) => {
              const ingreso = esIngreso(t.tipo_transaccion);
              const statusClass = (t.estado || '').toLowerCase();
              return (
                <div key={t.id} className="activity-item">
                  <div className="activity-left">
                    <div className={`activity-icon ${ingreso ? 'ingreso' : 'egreso'}`}>
                      {ingreso ? '↓' : '↑'}
                    </div>
                    <div>
                      <div className="activity-name">
                        {t.tipo_transaccion.replace(/_/g, ' ')}
                        {t.descripcion ? ` · ${t.descripcion}` : ''}
                      </div>
                      <div className="activity-meta">
                        {formatDate(t.fecha)} • {t.cuenta?.numero_cuenta || `Cta. #${t.cuenta_id}`}
                      </div>
                    </div>
                  </div>
                  <div className="activity-right">
                    <div className={`activity-amount ${ingreso ? 'ingreso' : 'egreso'}`}>
                      {ingreso ? '+' : '-'}${parseFloat(t.monto).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className={`activity-status ${statusClass}`}>
                      {t.estado}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <a href="/transacciones" className="view-all-link">Ver todas las transacciones →</a>
        </>
      )}
    </>
  );
}

// ── Componente del admin (panel de cuentas globales) ──
function AdminDashboard({ user }) {
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/cuentas').then(r => setCuentas(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const estadoColor = (e) => ({ Activa: '#10b981', Inactiva: '#f59e0b', Bloqueada: '#ef4444' }[e] || '#94a3b8');

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Cargando...</div>;

  return (
    <>
      <div className="client-header animate-fade-in">
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.02em' }}>Cuentas Globales</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Supervisión de todas las cuentas del sistema</p>
        </div>
      </div>

      {cuentas.length === 0 ? (
        <div className="client-empty"><Wallet size={48} style={{ marginBottom: '16px', opacity: 0.4 }} /><p>No hay cuentas registradas.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {cuentas.map((c, i) => (
            <div key={c.id} className="account-mini-card animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="account-mini-top">
                <div className="account-mini-icon"><CreditCard size={18} color="var(--primary)" /></div>
                <span className="account-mini-num" style={{ background: `${estadoColor(c.estado)}20`, color: estadoColor(c.estado), border: `1px solid ${estadoColor(c.estado)}40` }}>{c.estado || 'Activa'}</span>
              </div>
              <div className="account-mini-type">{c.tipo_cuenta}</div>
              {c.usuario && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>👤 {c.usuario.nombre} {c.usuario.apellido}</div>}
              <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', marginBottom: '8px' }}>{c.numero_cuenta}</div>
              <div className="account-mini-balance">
                ${parseFloat(c.saldo).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '4px', fontWeight: '400' }}>{c.moneda}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── Root export ──
function DashboardContent() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === 'admin' ? <AdminDashboard user={user} /> : <ClientDashboard user={user} />;
}

export default DashboardContent;
