import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, ArrowRightLeft, Landmark, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';

function Sidebar() {
  const { logout, user } = useAuth();

  const menuItems = [
    { path: '/dashboard', icon: <LayoutDashboard size={20} />, label: 'Mis Cuentas', roles: ['admin', 'user'] },
    { path: '/usuarios', icon: <Users size={20} />, label: 'Usuarios', roles: ['admin'] },
    { path: '/transacciones', icon: <ArrowRightLeft size={20} />, label: 'Transacciones', roles: ['admin', 'user'] },
    { path: '/prestamos', icon: <Landmark size={20} />, label: 'Préstamos', roles: ['admin', 'user'] },
    { path: '/pagos', icon: <CreditCard size={20} />, label: 'Pagos', roles: ['admin', 'user'] },
  ];

  const visibleMenuItems = menuItems.filter(item => user && item.roles.includes(user.role));

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Landmark size={32} color="#ffffff" />
        <h2>BancoSeguro</h2>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          {visibleMenuItems.map((item) => (
            <li key={item.path}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button onClick={logout} className="logout-btn-sidebar">
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
