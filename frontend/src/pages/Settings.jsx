import React, { useState, useEffect } from 'react';
import { useAuth, useTheme } from '../App';
import { toast } from 'sonner';
import { 
  Moon, Sun, User, Shield, Sparkles, Check, DollarSign, 
  Calendar, Save, Loader2, ExternalLink, Key, Globe, RefreshCw,
  MessageCircle, Phone, Plus, Trash2, Bot
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

export default function Settings() {
  const { user, token, hasPermission } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingTwilio, setTestingTwilio] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [orgSettings, setOrgSettings] = useState({
    currency: 'USD',
    currency_symbol: '$',
    google_calendar_client_id: '',
    google_calendar_client_secret: '',
    google_calendar_enabled: false,
    google_calendar_connected: false,
    // Twilio WhatsApp
    twilio_account_sid: '',
    twilio_auth_token: '',
    twilio_whatsapp_number: '',
    twilio_enabled: false,
    twilio_connected: false
  });
  
  // ElevenLabs AI Agents
  const [aiAgents, setAiAgents] = useState([]);
  const [newAgent, setNewAgent] = useState({ name: '', agent_id: '' });

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
      
      // Fetch AI agents
      const agentsRes = await fetch(`${API}/api/ai-agents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (agentsRes.ok) {
        const agentsData = await agentsRes.json();
        setAiAgents(agentsData.agents || []);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAiAgent = async () => {
    if (!newAgent.name || !newAgent.agent_id) {
      toast.error('Agent name and ID are required');
      return;
    }
    
    try {
      const response = await fetch(`${API}/api/ai-agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newAgent)
      });
      
      if (response.ok) {
        const data = await response.json();
        setAiAgents(prev => [...prev, data.agent]);
        setNewAgent({ name: '', agent_id: '' });
        toast.success('AI Agent added successfully');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to add agent');
      }
    } catch (error) {
      toast.error('Failed to add agent');
    }
  };

  const deleteAiAgent = async (agentId) => {
    if (!window.confirm('Delete this AI agent?')) return;
    
    try {
      const response = await fetch(`${API}/api/ai-agents/${agentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        setAiAgents(prev => prev.filter(a => a.id !== agentId));
        toast.success('AI Agent removed');
      }
    } catch (error) {
      toast.error('Failed to remove agent');
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
          google_calendar_enabled: orgSettings.google_calendar_enabled,
          // Twilio settings
          twilio_account_sid: orgSettings.twilio_account_sid || null,
          twilio_auth_token: orgSettings.twilio_auth_token || null,
          twilio_whatsapp_number: orgSettings.twilio_whatsapp_number || null,
          twilio_enabled: orgSettings.twilio_enabled
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

  const testTwilioConnection = async () => {
    setTestingTwilio(true);
    try {
      const response = await fetch(`${API}/api/twilio/test-connection`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(`Twilio connected! Account: ${data.account_name}`);
        fetchSettings();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to connect to Twilio');
      }
    } catch (error) {
      toast.error('Failed to test Twilio connection');
    } finally {
      setTestingTwilio(false);
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

      {/* Twilio WhatsApp Integration - Admin Only */}
      {isAdmin && user?.organization_id && (
        <div className="elstar-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h2 className="font-semibold">Twilio WhatsApp Integration</h2>
              <p className="text-sm text-muted-foreground">Connect Twilio to send WhatsApp messages from this panel</p>
            </div>
            {orgSettings.twilio_connected && (
              <span className="ml-auto elstar-badge elstar-badge-success">Connected</span>
            )}
          </div>
          
          <div className="space-y-4">
            {/* Twilio Credentials */}
            <div className="p-4 rounded-lg bg-secondary/30 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Key className="w-4 h-4 text-muted-foreground" />
                <p className="font-medium text-sm">Twilio API Credentials</p>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Account SID</label>
                  <input
                    type="text"
                    value={orgSettings.twilio_account_sid || ''}
                    onChange={(e) => setOrgSettings(prev => ({ ...prev, twilio_account_sid: e.target.value }))}
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="elstar-input text-sm"
                    data-testid="twilio-account-sid"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Auth Token</label>
                  <input
                    type="password"
                    value={orgSettings.twilio_auth_token || ''}
                    onChange={(e) => setOrgSettings(prev => ({ ...prev, twilio_auth_token: e.target.value }))}
                    placeholder="Your Twilio Auth Token"
                    className="elstar-input text-sm"
                    data-testid="twilio-auth-token"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">WhatsApp Number</label>
                  <input
                    type="text"
                    value={orgSettings.twilio_whatsapp_number || ''}
                    onChange={(e) => setOrgSettings(prev => ({ ...prev, twilio_whatsapp_number: e.target.value }))}
                    placeholder="+14155238886 (Twilio Sandbox) or your business number"
                    className="elstar-input text-sm"
                    data-testid="twilio-whatsapp-number"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    For sandbox testing, use: +14155238886
                  </p>
                </div>
              </div>
              
              <div className="mt-3 p-3 rounded bg-green-500/10 border border-green-500/20">
                <p className="text-xs text-green-600 dark:text-green-400">
                  <strong>Setup Instructions:</strong>
                  <br />1. Sign up at{' '}
                  <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" className="underline">
                    twilio.com
                  </a>
                  <br />2. Go to Console → Account SID & Auth Token
                  <br />3. For WhatsApp Sandbox: Messaging → Try it out → Send a WhatsApp message
                  <br />4. Send the join code from WhatsApp Sandbox to enable testing
                </p>
              </div>
            </div>

            {/* Enable/Connect Toggle */}
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="twilio-enabled"
                  checked={orgSettings.twilio_enabled || false}
                  onChange={(e) => setOrgSettings(prev => ({ ...prev, twilio_enabled: e.target.checked }))}
                  className="w-4 h-4 rounded border-border"
                  data-testid="twilio-enabled-checkbox"
                />
                <div>
                  <label htmlFor="twilio-enabled" className="font-medium cursor-pointer">Enable Twilio WhatsApp</label>
                  <p className="text-sm text-muted-foreground">
                    {orgSettings.twilio_connected 
                      ? 'WhatsApp messaging is active' 
                      : 'Save credentials and test connection'}
                  </p>
                </div>
              </div>
              
              {orgSettings.twilio_account_sid && orgSettings.twilio_auth_token ? (
                <button 
                  onClick={testTwilioConnection}
                  disabled={testingTwilio}
                  className="elstar-btn-primary text-sm"
                  data-testid="test-twilio-btn"
                >
                  {testingTwilio ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  Test Connection
                </button>
              ) : (
                <span className="text-xs text-muted-foreground">Enter credentials first</span>
              )}
            </div>
            
            {/* Current Status */}
            {orgSettings.twilio_whatsapp_number && (
              <div className="p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">WhatsApp Number: {orgSettings.twilio_whatsapp_number}</p>
                    <p className="text-sm text-muted-foreground">
                      Messages will be sent from this number
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ElevenLabs AI Agents Configuration - Admin Only */}
      {isAdmin && user?.organization_id && (
        <div className="elstar-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="font-semibold">AI Calling Agents (ElevenLabs)</h2>
              <p className="text-sm text-muted-foreground">Configure AI voice agents for automated calling</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Add New Agent Form */}
            <div className="p-4 rounded-lg bg-secondary/30 border border-border">
              <h3 className="font-medium text-sm mb-3">Add New Agent</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Agent Name *</label>
                  <input
                    type="text"
                    value={newAgent.name}
                    onChange={(e) => setNewAgent(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Sarah"
                    className="elstar-input text-sm"
                    data-testid="new-agent-name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Agent ID *</label>
                  <input
                    type="text"
                    value={newAgent.agent_id}
                    onChange={(e) => setNewAgent(prev => ({ ...prev, agent_id: e.target.value }))}
                    placeholder="e.g., abc123xyz..."
                    className="elstar-input text-sm"
                    data-testid="new-agent-id"
                  />
                </div>
              </div>
              <button
                onClick={addAiAgent}
                className="mt-3 elstar-btn-primary text-sm flex items-center gap-2"
                data-testid="add-agent-btn"
              >
                <Plus className="w-4 h-4" /> Add Agent
              </button>
            </div>

            {/* Configured Agents List */}
            <div>
              <h3 className="font-medium text-sm mb-3">Configured Agents ({aiAgents.length})</h3>
              {aiAgents.length > 0 ? (
                <div className="space-y-2">
                  {aiAgents.map((agent, index) => (
                    <div key={agent.id || index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          ['bg-pink-500', 'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500'][index % 5]
                        }`}>
                          {agent.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-xs text-muted-foreground">{agent.description || 'AI Voice Agent'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-secondary px-2 py-1 rounded">{agent.agent_id?.substring(0, 12)}...</code>
                        <button
                          onClick={() => deleteAiAgent(agent.id)}
                          className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                          title="Remove agent"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-lg">
                  <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No AI agents configured yet</p>
                  <p className="text-xs mt-1">Add your ElevenLabs agent IDs above</p>
                </div>
              )}
            </div>

            {/* Setup Instructions */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                <strong>Setup Instructions:</strong>
                <br />1. Sign up at{' '}
                <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="underline">
                  elevenlabs.io
                </a>
                <br />2. Create a Conversational AI Agent
                <br />3. Copy the Agent ID from the agent settings
                <br />4. Paste the Agent ID above and give it a name
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Score Configuration - Admin Only */}
      {isAdmin && user?.organization_id && (
        <div className="elstar-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h2 className="font-semibold">AI Score Configuration</h2>
              <p className="text-sm text-muted-foreground">Configure how AI scores are calculated based on pipeline stages</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              AI Score is automatically calculated based on the lead's pipeline stage. Each stage has a base score that contributes to the final AI Score.
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { stage: 'Lead', score: 20, color: 'bg-slate-500' },
                { stage: 'Qualified', score: 40, color: 'bg-amber-500' },
                { stage: 'Proposal', score: 60, color: 'bg-orange-500' },
                { stage: 'Negotiation', score: 75, color: 'bg-red-500' },
                { stage: 'Sales Closed', score: 100, color: 'bg-blue-500' },
                { stage: 'Lost', score: 0, color: 'bg-gray-600' }
              ].map(item => (
                <div key={item.stage} className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="font-medium text-sm">{item.stage}</span>
                  </div>
                  <p className="text-2xl font-bold text-primary">{item.score}</p>
                  <p className="text-xs text-muted-foreground">Base Score</p>
                </div>
              ))}
            </div>
            
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-600 dark:text-amber-400">
                <strong>How it works:</strong> When a lead's pipeline status is updated, the AI Score is automatically recalculated. 
                Additional factors like engagement, deal value, and activity count may also influence the final score.
              </p>
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
            { name: 'AI WhatsApp', desc: orgSettings.twilio_connected ? 'Twilio WhatsApp messaging enabled' : 'Connect Twilio in settings above to enable', status: orgSettings.twilio_connected ? 'Active' : 'Placeholder' }
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
