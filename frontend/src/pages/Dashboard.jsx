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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>
          <Wallet size={24} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }}/> 
          {user?.role === 'admin' ? 'Cuentas Globales' : 'Mis Cuentas'}
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
            <Plus size={18} /> Nueva Cuenta
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: 'var(--bg-dark)', padding: '24px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '16px' }}>Abrir Nueva Cuenta</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
            La cuenta se creará con saldo $0.00. Podrás depositar fondos desde la sección de Transacciones.
          </p>
          <form onSubmit={handleCrearCuenta} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Tipo de Cuenta</label>
              <select 
                value={tipoCuenta} 
                onChange={e => setTipoCuenta(e.target.value)}
                style={{ width: '100%', padding: '12px', background: 'var(--bg-card)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px' }}
              >
                <option value="Ahorros">Ahorros</option>
                <option value="Corriente">Corriente</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Moneda</label>
              <select 
                value={moneda} 
                onChange={e => setMoneda(e.target.value)}
                style={{ width: '100%', padding: '12px', background: 'var(--bg-card)', color: 'white', border: '1px solid var(--border-color)', borderRadius: '8px' }}
              >
                <option value="USD">USD</option>
                <option value="MXN">MXN</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <button type="submit" className="login-btn" style={{ marginTop: 0 }}>Abrir Cuenta</button>
          </form>
        </div>
      )}

      {loading ? (
        <p>Cargando información desde MySQL...</p>
      ) : cuentas.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
          <p>No tienes cuentas registradas en la base de datos.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {cuentas.map(cuenta => (
            <div key={cuenta.id} className="cuenta-card" style={{ background: 'var(--bg-dark)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="cuenta-tipo">
                  {cuenta.tipo_cuenta}
                  {user?.role === 'admin' && cuenta.usuario && (
                    <span style={{ fontSize: '0.8rem', color: '#fff', background: '#3b82f6', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' }}>
                      {cuenta.usuario.nombre} {cuenta.usuario.apellido}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', background: estadoColor(cuenta.estado), color: '#fff' }}>
                    {cuenta.estado || 'Activa'}
                  </span>
                  <CreditCard size={20} color="var(--text-muted)" />
                </div>
              </div>
              <div className="cuenta-numero">{cuenta.numero_cuenta}</div>
              <div className="cuenta-saldo">
                ${parseFloat(cuenta.saldo).toLocaleString('en-US', { minimumFractionDigits: 2 })} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{cuenta.moneda}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </MainLayout>
  );
}

export default Dashboard;
