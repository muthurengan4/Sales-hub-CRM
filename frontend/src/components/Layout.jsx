import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth, useTheme } from '../App';
import NotificationsDropdown from './NotificationsDropdown';
import { 
  LayoutDashboard, Users, Kanban, Settings, LogOut, Moon, Sun,
  Menu, X, ChevronDown, Building2, UserCircle, Contact2, Shield, ClipboardList, Briefcase, CheckSquare, Calendar, MessageCircle
} from 'lucide-react';

export default function Layout() {
  const { user, logout, hasPermission } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  // Dynamic navigation based on permissions
  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', show: true },
    { to: '/leads', icon: Users, label: 'Leads', show: hasPermission('view_all_leads') || hasPermission('view_own_leads') },
    { to: '/pipeline', icon: Kanban, label: 'Pipeline', show: hasPermission('view_all_deals') || hasPermission('view_own_deals') },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks', show: hasPermission('view_all_leads') || hasPermission('view_own_leads') },
    { to: '/customers', icon: Contact2, label: 'Customers', show: hasPermission('view_contacts') },
    { to: '/calendar', icon: Calendar, label: 'Calendar', show: true },
    { to: '/whatsapp', icon: MessageCircle, label: 'WhatsApp', show: hasPermission('view_all_leads') || hasPermission('view_own_leads') },
    { to: '/users', icon: UserCircle, label: 'Team', show: hasPermission('view_users') },
    { to: '/organization', icon: Building2, label: 'Organization', show: hasPermission('view_organization') },
    { to: '/settings', icon: Settings, label: 'Settings', show: true },
  ].filter(item => item.show);

  const getRoleBadge = (role) => {
    const colors = {
      super_admin: 'bg-[#D4A017]/20 text-[#F5C77A]',
      org_admin: 'bg-[#D4A017]/20 text-[#D4A017]',
      manager: 'bg-emerald-500/20 text-emerald-400',
      sales_rep: 'bg-[#C5B3FF]/20 text-[#C5B3FF]',
      viewer: 'bg-slate-500/20 text-slate-400'
    };
    return colors[role] || colors.viewer;
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border
        transform transition-transform duration-200 ease-in-out flex flex-col
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
              <span className="font-bold text-lg">AISalesTask</span>
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">v2.0</span>
            </div>
          </div>
        </div>

        {/* Organization Info */}
        {user?.organization_name && (
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="truncate font-medium">{user.organization_name}</span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `elstar-nav-item ${isActive ? 'active' : ''}`}
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-2">
            <div className="elstar-avatar w-9 h-9 text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getRoleBadge(user?.role)}`}>
                {user?.role?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border px-4 lg:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 hover:bg-secondary rounded-lg" onClick={() => setMobileOpen(!mobileOpen)} data-testid="mobile-menu-btn">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <NotificationsDropdown />
            <button onClick={toggleTheme} className="p-2 hover:bg-secondary rounded-lg" data-testid="theme-toggle">
              {theme === 'dark' ? <Sun className="w-5 h-5 text-muted-foreground" /> : <Moon className="w-5 h-5 text-muted-foreground" />}
            </button>

            {/* User Menu */}
            <div className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 p-2 hover:bg-secondary rounded-lg">
                <div className="elstar-avatar w-8 h-8 text-sm">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</div>
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
                      <div className="flex items-center gap-1 mt-1">
                        <Shield className="w-3 h-3" />
                        <span className="text-xs capitalize">{user?.role?.replace('_', ' ')}</span>
                      </div>
                    </div>
                    <button onClick={handleLogout} className="elstar-dropdown-item w-full text-left flex items-center gap-2 text-red-500" data-testid="logout-btn">
                      <LogOut className="w-4 h-4" /> Sign out
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
