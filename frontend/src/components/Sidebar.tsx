/**
 * Componente Sidebar centralizado.
 * Se usa en todas las páginas para mantener consistencia.
 * Incluye navegación + perfil de usuario en la parte baja.
 */
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Iconos SVG como componentes reutilizables
const IconDashboard = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.756 12h16.488m-16.488 3.75h16.488M3.756 19.5h16.488M3.756 6h16.488" />
  </svg>
);

const IconPacientes = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
  </svg>
);

const IconCitas = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

const IconHistoria = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const IconFacturacion = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
  </svg>
);

const IconInventario = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
  </svg>
);

const IconInformes = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const IconAdmin = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const IconPerfil = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const IconLogout = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
  </svg>
);

interface SidebarProps {
  // Permite al padre cerrar el menú móvil si es necesario
  onNavigate?: () => void;
}

function Sidebar({ onNavigate }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const esAdmin = user?.role === 'admin';
  const [menuPerfil, setMenuPerfil] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    onNavigate?.();
  };

  const togglePerfil = () => {
    setMenuPerfil(!menuPerfil);
  };

  const closePerfil = () => {
    setMenuPerfil(false);
    onNavigate?.();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>🏥 Podología</h1>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          <li>
            <Link 
              to="/" 
              className={isActive('/') ? 'active' : ''}
              onClick={onNavigate}
            >
              <span className="icon"><IconDashboard /></span>
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/pacientes" 
              className={isActive('/pacientes') ? 'active' : ''}
              onClick={onNavigate}
            >
              <span className="icon"><IconPacientes /></span>
              <span>Pacientes</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/citas" 
              className={isActive('/citas') ? 'active' : ''}
              onClick={onNavigate}
            >
              <span className="icon"><IconCitas /></span>
              <span>Citas</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/historia-clinica" 
              className={isActive('/historia-clinica') ? 'active' : ''}
              onClick={onNavigate}
            >
              <span className="icon"><IconHistoria /></span>
              <span>Historia Clínica</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/facturacion" 
              className={isActive('/facturacion') ? 'active' : ''}
              onClick={onNavigate}
            >
              <span className="icon"><IconFacturacion /></span>
              <span>Facturación</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/inventario" 
              className={isActive('/inventario') ? 'active' : ''}
              onClick={onNavigate}
            >
              <span className="icon"><IconInventario /></span>
              <span>Inventario</span>
            </Link>
          </li>
          <li>
            <Link 
              to="/informes" 
              className={isActive('/informes') ? 'active' : ''}
              onClick={onNavigate}
            >
              <span className="icon"><IconInformes /></span>
              <span>Informes</span>
            </Link>
          </li>
          {esAdmin && (
            <li>
              <Link 
                to="/admin" 
                className={isActive('/admin') ? 'active' : ''}
                onClick={onNavigate}
              >
                <span className="icon"><IconAdmin /></span>
                <span>Administración</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>

      {/* Perfil y cerrar sesión en la parte baja - Dropdown */}
      <div className="sidebar-footer">
        <button className="sidebar-user-btn" onClick={togglePerfil}>
          <div className="user-avatar">
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="user-info">
            <p className="user-name">{user?.full_name || 'Usuario'}</p>
            <p className="user-role">{user?.role || '—'}</p>
          </div>
          <span className={`dropdown-arrow ${menuPerfil ? 'open' : ''}`}>▼</span>
        </button>
        
        {menuPerfil && (
          <div className="sidebar-dropdown">
            <Link to="/perfil" className="sidebar-link" onClick={closePerfil}>
              <span className="icon"><IconPerfil /></span>
              <span>Mi perfil</span>
            </Link>
            <button onClick={handleLogout} className="sidebar-link logout">
              <span className="icon"><IconLogout /></span>
              <span>Cerrar sesión</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
