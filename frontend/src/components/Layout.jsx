import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth, useTheme } from '../App';
import { 
  LayoutDashboard, 
  Users, 
  Kanban, 
  Settings, 
  LogOut, 
  Moon, 
  Sun,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/pipeline', icon: Kanban, label: 'Pipeline' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border
        transform transition-transform duration-200 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-16 px-6 flex items-center border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 ai-gradient rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div>
              <span className="font-bold text-lg">SalesCRM</span>
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">PRO</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `elstar-nav-item ${isActive ? 'active' : ''}`
              }
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User Section at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="flex items-center gap-3 p-2">
            <div className="elstar-avatar w-9 h-9 text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border px-4 lg:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 hover:bg-secondary rounded-lg"
              onClick={() => setMobileOpen(!mobileOpen)}
              data-testid="mobile-menu-btn"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-lg font-semibold hidden sm:block">Dashboard</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
              data-testid="theme-toggle"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Moon className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <div className="elstar-avatar w-8 h-8 text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="hidden sm:block text-sm font-medium">{user?.name?.split(' ')[0]}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0" onClick={() => setUserMenuOpen(false)} />
                  <div className="elstar-dropdown animate-fade-in">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="elstar-dropdown-item w-full text-left flex items-center gap-2 text-red-500"
                      data-testid="logout-btn"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
