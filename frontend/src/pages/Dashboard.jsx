import React, { useState, useEffect } from 'react';
import { Wallet, Plus, CreditCard } from 'lucide-react';
import api from '../services/api';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();
  
  // Form state
  const [tipoCuenta, setTipoCuenta] = useState('Ahorros');
  const [moneda, setMoneda] = useState('USD');

  useEffect(() => {
    fetchCuentas();
  }, []);

  const fetchCuentas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/cuentas');
      setCuentas(response.data);
    } catch (err) {
      console.error('Error fetching cuentas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCrearCuenta = async (e) => {
    e.preventDefault();
    try {
      // El servidor genera el numero_cuenta y asigna saldo 0 automáticamente
      await api.post('/cuentas', {
        tipo_cuenta: tipoCuenta,
        moneda: moneda
      });
      
      setShowForm(false);
      fetchCuentas();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al crear la cuenta');
    }
  };

  const estadoColor = (estado) => {
    switch (estado) {
      case 'Activa': return '#10b981';
      case 'Inactiva': return '#f59e0b';
      case 'Bloqueada': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  return (
    <MainLayout>
      <div className="page-header animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
            {user?.role === 'admin' ? 'Cuentas Globales' : 'Panel de Control'}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            {user?.role === 'admin' ? 'Supervisión de todas las cuentas del sistema' : `Bienvenido de nuevo, ${user?.nombre}`}
          </p>
        </div>
        {user?.role !== 'admin' && (
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="primary-btn"
          >
            <Plus size={18} /> Nueva Cuenta
          </button>
        )}
      </div>

      {showForm && (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '32px', border: '1px solid var(--accent)' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Abrir Nueva Cuenta</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Selecciona el tipo de cuenta y la moneda para comenzar.
          </p>
          <form onSubmit={handleCrearCuenta} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '20px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '500' }}>Tipo de Cuenta</label>
              <select 
                value={tipoCuenta} 
                onChange={e => setTipoCuenta(e.target.value)}
                className="input-glass"
                style={{ width: '100%' }}
              >
                <option value="Ahorros">Ahorros</option>
                <option value="Corriente">Corriente</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '500' }}>Moneda</label>
              <select 
                value={moneda} 
                onChange={e => setMoneda(e.target.value)}
                className="input-glass"
                style={{ width: '100%' }}
              >
                <option value="USD">USD</option>
                <option value="MXN">MXN</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <button type="submit" className="primary-btn">Crear Cuenta</button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="dot" style={{ width: '12px', height: '12px', background: 'var(--accent)', margin: '0 auto 16px' }}></div>
          <p>Sincronizando con la red bancaria...</p>
        </div>
      ) : cuentas.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center', borderStyle: 'dashed' }}>
          <Wallet size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.5 }} />
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>No se encontraron cuentas activas.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {cuentas.map((cuenta, index) => (
            <div key={cuenta.id} className="glass-card animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>{cuenta.tipo_cuenta}</span>
                    <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px', background: `${estadoColor(cuenta.estado)}20`, color: estadoColor(cuenta.estado), border: `1px solid ${estadoColor(cuenta.estado)}40` }}>
                      {cuenta.estado || 'Activa'}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.9rem', marginTop: '4px' }}>{cuenta.numero_cuenta}</div>
                </div>
                <div className="glass-panel" style={{ padding: '8px', borderRadius: '12px', boxShadow: 'none' }}>
                  <CreditCard size={20} color="var(--accent)" />
                </div>
              </div>

              {user?.role === 'admin' && cuenta.usuario && (
                <div style={{ marginBottom: '16px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '0.85rem' }}>
                   👤 <span style={{ color: 'var(--text-muted)' }}>Titular:</span> {cuenta.usuario.nombre} {cuenta.usuario.apellido}
                </div>
              )}

              <div style={{ marginTop: 'auto' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Saldo Disponible</div>
                <div style={{ fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
                  <span style={{ fontSize: '1rem', verticalAlign: 'top', marginRight: '2px', color: 'var(--text-muted)' }}>$</span>
                  {parseFloat(cuenta.saldo).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginLeft: '8px', fontWeight: '400' }}>{cuenta.moneda}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </MainLayout>

  );
}

export default Dashboard;
