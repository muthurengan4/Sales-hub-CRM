import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth, useTheme } from '../App';
import { useState } from 'react';

const navItems = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/leads', icon: '👥', label: 'Leads' },
  { to: '/pipeline', icon: '📋', label: 'Pipeline' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div data-theme={theme} style={{ minHeight: '100vh', background: 'var(--bulma-scheme-main)' }}>
      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'is-active' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Logo */}
        <div className="p-4" style={{ borderBottom: '1px solid var(--bulma-border)' }}>
          <div className="is-flex is-align-items-center">
            <div 
              className="ai-gradient mr-3" 
              style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '10px', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <span style={{ color: 'white', fontSize: '18px' }}>✦</span>
            </div>
            <div>
              <p className="has-text-weight-bold is-size-5">SalesCRM</p>
              <p className="is-size-7 has-text-grey">AI-Powered</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="menu p-4" style={{ flex: 1 }}>
          <ul className="menu-list">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) => isActive ? 'is-active' : ''}
                  onClick={() => setMobileOpen(false)}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                  style={{ borderRadius: '8px', marginBottom: '4px' }}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        <div className="p-4" style={{ borderTop: '1px solid var(--bulma-border)' }}>
          <div className="is-flex is-align-items-center mb-3">
            <div 
              style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '50%', 
                background: 'rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px'
              }}
            >
              <span className="has-text-link has-text-weight-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="is-size-7 has-text-weight-medium" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </p>
              <p className="is-size-7 has-text-grey" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </p>
            </div>
          </div>
          <div className="buttons are-small">
            <button
              className="button is-light is-small"
              onClick={toggleTheme}
              data-testid="theme-toggle"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              className="button is-danger is-light is-small"
              onClick={handleLogout}
              data-testid="logout-btn"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <nav className="navbar is-hidden-desktop is-fixed-top" style={{ background: 'var(--bulma-scheme-main-bis)' }}>
        <div className="navbar-brand">
          <button 
            className="navbar-burger"
            onClick={() => setMobileOpen(!mobileOpen)}
            data-testid="mobile-menu-btn"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className="navbar-item">
            <div className="is-flex is-align-items-center">
              <div className="ai-gradient mr-2" style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white' }}>✦</span>
              </div>
              <span className="has-text-weight-bold">SalesCRM</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="is-hidden-desktop"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 20 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="main-content" style={{ paddingTop: 'calc(52px + 2rem)' }}>
        <Outlet />
      </main>

      <style>{`
        @media screen and (min-width: 1024px) {
          .main-content { padding-top: 2rem !important; }
        }
      `}</style>
    </div>
  );
}
