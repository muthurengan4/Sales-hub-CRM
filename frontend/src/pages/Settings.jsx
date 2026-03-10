import React, { useState, useEffect } from 'react';
import { useAuth, useTheme } from '../App';
import { toast } from 'sonner';
import { 
  Moon, Sun, User, Shield, Sparkles, Check, DollarSign, 
  Calendar, Save, Loader2, ExternalLink, Key, Globe, RefreshCw
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

export default function Settings() {
  const { user, token, hasPermission } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [orgSettings, setOrgSettings] = useState({
    currency: 'USD',
    currency_symbol: '$',
    google_calendar_client_id: '',
    google_calendar_client_secret: '',
    google_calendar_enabled: false,
    google_calendar_connected: false
  });

  useEffect(() => {
    if (user?.organization_id) {
      fetchSettings();
      fetchCurrencies();
    } else {
      setLoading(false);
    }
    
    // Check URL params for Google Calendar callback
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_calendar') === 'connected') {
      toast.success('Google Calendar connected successfully!');
      window.history.replaceState({}, '', '/settings');
    }
  }, [user?.organization_id]);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API}/api/organization-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrgSettings(prev => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await fetch(`${API}/api/currencies`);
      if (response.ok) {
        const data = await response.json();
        setCurrencies(data.currencies || []);
      }
    } catch (error) {
      console.error('Failed to fetch currencies:', error);
    }
  };

  const handleCurrencyChange = (code) => {
    const currency = currencies.find(c => c.code === code);
    if (currency) {
      setOrgSettings(prev => ({
        ...prev,
        currency: currency.code,
        currency_symbol: currency.symbol
      }));
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API}/api/organization-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          currency: orgSettings.currency,
          currency_symbol: orgSettings.currency_symbol,
          google_calendar_client_id: orgSettings.google_calendar_client_id || null,
          google_calendar_client_secret: orgSettings.google_calendar_client_secret || null,
          google_calendar_enabled: orgSettings.google_calendar_enabled
        })
      });

      if (response.ok) {
        toast.success('Settings saved successfully');
        fetchSettings(); // Refresh to get updated connected status
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const connectGoogleCalendar = async () => {
    try {
      const response = await fetch(`${API}/api/google-calendar/auth-url`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.auth_url;
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to get authorization URL');
      }
    } catch (error) {
      toast.error('Failed to connect Google Calendar');
    }
  };

  const isAdmin = hasPermission('manage_organization');

  return (
    <div className="max-w-4xl space-y-6" data-testid="settings-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account and organization preferences</p>
        </div>
        {isAdmin && user?.organization_id && (
          <button 
            onClick={saveSettings} 
            disabled={saving}
            className="elstar-btn-primary"
            data-testid="save-settings-btn"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Settings
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="elstar-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Profile</h2>
            <p className="text-sm text-muted-foreground">Your account information</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg">
          <div className="elstar-avatar w-16 h-16 text-xl">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-lg font-semibold">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium capitalize">
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Appearance Card */}
      <div className="elstar-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
          </div>
          <div>
            <h2 className="font-semibold">Appearance</h2>
            <p className="text-sm text-muted-foreground">Customize your interface</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
          <div>
            <p className="font-medium">Dark Mode</p>
            <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-14 h-8 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-secondary'}`}
            data-testid="dark-mode-switch"
          >
            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* Currency Settings - Admin Only */}
      {isAdmin && user?.organization_id && (
        <div className="elstar-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent-blue/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-accent-blue" />
            </div>
            <div>
              <h2 className="font-semibold">Currency Settings</h2>
              <p className="text-sm text-muted-foreground">Configure your organization's currency</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Default Currency</label>
              <select
                value={orgSettings.currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
                className="elstar-select w-full max-w-xs"
                data-testid="currency-select"
              >
                {currencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} - {currency.name} ({currency.code})
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                This currency will be used throughout the application for all monetary values
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Current: {orgSettings.currency_symbol} ({orgSettings.currency})</p>
                  <p className="text-sm text-muted-foreground">
                    Example: {orgSettings.currency_symbol}1,000.00
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Google Calendar Integration - Admin Only */}
      {isAdmin && user?.organization_id && (
        <div className="elstar-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent-blue/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-accent-blue" />
            </div>
            <div>
              <h2 className="font-semibold">Google Calendar Integration</h2>
              <p className="text-sm text-muted-foreground">Connect your Google Calendar to sync tasks and meetings</p>
            </div>
            {orgSettings.google_calendar_connected && (
              <span className="ml-auto elstar-badge elstar-badge-success">Connected</span>
            )}
          </div>
          
          <div className="space-y-4">
            {/* OAuth Credentials */}
            <div className="p-4 rounded-lg bg-secondary/30 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Key className="w-4 h-4 text-muted-foreground" />
                <p className="font-medium text-sm">OAuth Credentials</p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Client ID</label>
                  <input
                    type="text"
                    value={orgSettings.google_calendar_client_id || ''}
                    onChange={(e) => setOrgSettings(prev => ({ ...prev, google_calendar_client_id: e.target.value }))}
                    placeholder="e.g., 123456789-abc...apps.googleusercontent.com"
                    className="elstar-input text-sm"
                    data-testid="google-client-id"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Client Secret</label>
                  <input
                    type="password"
                    value={orgSettings.google_calendar_client_secret || ''}
                    onChange={(e) => setOrgSettings(prev => ({ ...prev, google_calendar_client_secret: e.target.value }))}
                    placeholder="GOCSPX-..."
                    className="elstar-input text-sm"
                    data-testid="google-client-secret"
                  />
                </div>
              </div>
              
              <div className="mt-3 p-3 rounded bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  <strong>Setup Instructions:</strong> Go to{' '}
                  <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">
                    Google Cloud Console
                  </a>
                  {' '}→ Create project → Enable Calendar API → Create OAuth credentials → Add redirect URI:{' '}
                  <code className="bg-secondary px-1 rounded">{API}/api/google-calendar/callback</code>
                </p>
              </div>
            </div>

            {/* Enable/Connect Toggle */}
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
              <div>
                <p className="font-medium">Enable Google Calendar</p>
                <p className="text-sm text-muted-foreground">
                  {orgSettings.google_calendar_connected 
                    ? 'Calendar is connected and syncing' 
                    : 'Save credentials first, then connect'}
                </p>
              </div>
              
              {orgSettings.google_calendar_client_id && orgSettings.google_calendar_client_secret ? (
                orgSettings.google_calendar_connected ? (
                  <span className="flex items-center gap-2 text-sm text-accent-blue">
                    <Check className="w-4 h-4" /> Connected
                  </span>
                ) : (
                  <button 
                    onClick={connectGoogleCalendar}
                    className="elstar-btn-primary text-sm"
                    data-testid="connect-google-btn"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Connect
                  </button>
                )
              ) : (
                <span className="text-xs text-muted-foreground">Enter credentials first</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Features Card */}
      <div className="elstar-card p-6 border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg ai-gradient flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold ai-text">AI Features</h2>
            <p className="text-sm text-muted-foreground">AI-powered capabilities</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {[
            { name: 'Lead Scoring', desc: 'AI analyzes leads and provides scores from 0-100' },
            { name: 'Deal Health Monitoring', desc: 'Track deal progress and identify risks' },
            { name: 'AI Calling', desc: 'Automated AI voice calls (Placeholder - Integration required)', status: 'Placeholder' },
            { name: 'AI WhatsApp', desc: 'Automated WhatsApp messages (Placeholder - Integration required)', status: 'Placeholder' }
          ].map((feature) => (
            <div key={feature.name} className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: 'rgba(160, 196, 255, 0.08)', border: '1px solid rgba(160, 196, 255, 0.2)' }}>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(160, 196, 255, 0.2)' }}>
                  <Check className="w-3 h-3 text-accent-blue" />
                </div>
                <div>
                  <p className="font-medium text-sm">{feature.name}</p>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
              <span className={`elstar-badge ${feature.status === 'Placeholder' ? 'elstar-badge-warning' : 'elstar-badge-success'}`}>
                {feature.status || 'Active'}
              </span>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">Powered by Claude Sonnet 4.5 • AI features use Emergent LLM integration</p>
        </div>
      </div>

      {/* Security Card */}
      <div className="elstar-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(160, 196, 255, 0.15)' }}>
            <Shield className="w-5 h-5 text-accent-blue" />
          </div>
          <div>
            <h2 className="font-semibold">Security</h2>
            <p className="text-sm text-muted-foreground">Account security settings</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
            <div>
              <p className="font-medium text-sm">Authentication</p>
              <p className="text-xs text-muted-foreground">JWT-based secure authentication</p>
            </div>
            <span className="elstar-badge elstar-badge-success">Secured</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
            <div>
              <p className="font-medium text-sm">Session</p>
              <p className="text-xs text-muted-foreground">24-hour token expiration</p>
            </div>
            <span className="elstar-badge elstar-badge-info">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
