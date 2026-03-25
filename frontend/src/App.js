import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import './index.css';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetailPage from './pages/LeadDetailPage';
import Pipeline from './pages/Pipeline';
import Customers from './pages/Customers';
import CustomerDetailPage from './pages/CustomerDetailPage';
import Users from './pages/Users';
import Organization from './pages/Organization';
import Settings from './pages/Settings';
import Tasks from './pages/Tasks';
import CustomerProfile from './pages/CustomerProfile';
import CalendarPage from './pages/CalendarPage';
import WhatsAppMessages from './pages/WhatsAppMessages';
import Layout from './components/Layout';

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [orgSettings, setOrgSettings] = useState({
    currency: 'USD',
    currency_symbol: '$'
  });

  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            // Fetch organization settings for currency
            fetchOrgSettings(token);
          } else {
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch (error) {
          console.error('Auth verification failed:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    verifyToken();
  }, [token]);

  const fetchOrgSettings = async (authToken) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/organization-settings`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrgSettings(prev => ({
          ...prev,
          currency: data.currency || 'USD',
          currency_symbol: data.currency_symbol || '$'
        }));
      }
    } catch (error) {
      console.error('Failed to fetch org settings:', error);
    }
  };

  const refreshOrgSettings = () => {
    if (token) {
      fetchOrgSettings(token);
    }
  };

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const hasPermission = (permission) => {
    return user?.permissions?.includes(permission) || false;
  };

  const refreshUser = async () => {
    if (token) {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, hasPermission, refreshUser, orgSettings, refreshOrgSettings }}>
      {children}
    </AuthContext.Provider>
  );
};

// Theme Context
const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// Public Route
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster position="top-right" richColors closeButton />
          <Routes>
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="leads" element={<Leads />} />
              <Route path="leads/:id" element={<LeadDetailPage />} />
              <Route path="pipeline" element={<Pipeline />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customer/:id" element={<CustomerDetailPage />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="whatsapp" element={<WhatsAppMessages />} />
              <Route path="users" element={<Users />} />
              <Route path="organization" element={<Organization />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile/:type/:id" element={<CustomerProfile />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
