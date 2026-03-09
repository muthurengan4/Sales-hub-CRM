import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { Settings, Users, MapPin, UserCheck, RefreshCw, Plus, Trash2, Loader2, Save } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const modeDescriptions = {
  manual: 'Leads are not automatically assigned. Admins assign leads manually.',
  round_robin: 'Leads are distributed evenly among all sales agents in rotation.',
  territory: 'Leads are assigned based on their location (state/city) to specific agents.',
  default_agent: 'All new leads are assigned to a single default agent.'
};

export default function AssignmentSettings() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({
    mode: 'manual',
    default_agent_id: null,
    territories: []
  });
  const [newTerritory, setNewTerritory] = useState({ state: '', city: '', agent_id: '' });

  useEffect(() => {
    fetchSettings();
    fetchUsers();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API}/api/assignment-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSettings({
          mode: data.mode || 'manual',
          default_agent_id: data.default_agent_id || null,
          territories: data.territories || []
        });
      }
    } catch (error) {
      console.error('Failed to fetch assignment settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API}/api/users?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.items?.filter(u => ['sales_rep', 'manager', 'org_admin'].includes(u.role)) || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API}/api/assignment-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast.success('Assignment settings saved');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addTerritory = () => {
    if (!newTerritory.state || !newTerritory.agent_id) {
      toast.error('Please fill in state and select an agent');
      return;
    }
    
    setSettings(prev => ({
      ...prev,
      territories: [...prev.territories, { ...newTerritory }]
    }));
    setNewTerritory({ state: '', city: '', agent_id: '' });
  };

  const removeTerritory = (index) => {
    setSettings(prev => ({
      ...prev,
      territories: prev.territories.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="assignment-settings">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Lead Assignment Settings
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Configure how new leads are automatically assigned to sales agents
          </p>
        </div>
        <button onClick={handleSave} disabled={saving} className="elstar-btn-primary" data-testid="save-assignment-settings">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Settings
        </button>
      </div>

      {/* Assignment Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { mode: 'manual', icon: UserCheck, label: 'Manual Assignment' },
          { mode: 'round_robin', icon: RefreshCw, label: 'Round Robin' },
          { mode: 'territory', icon: MapPin, label: 'Territory Based' },
          { mode: 'default_agent', icon: Users, label: 'Default Agent' }
        ].map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            onClick={() => setSettings(prev => ({ ...prev, mode }))}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              settings.mode === mode 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50'
            }`}
            data-testid={`assignment-mode-${mode}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                settings.mode === mode ? 'ai-gradient text-white' : 'bg-secondary'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{modeDescriptions[mode]}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Default Agent Selection */}
      {settings.mode === 'default_agent' && (
        <div className="p-4 rounded-lg bg-secondary/50">
          <label className="block text-sm font-medium mb-2">Select Default Agent</label>
          <select
            value={settings.default_agent_id || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, default_agent_id: e.target.value }))}
            className="elstar-select"
            data-testid="default-agent-select"
          >
            <option value="">-- Select Agent --</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
            ))}
          </select>
        </div>
      )}

      {/* Territory Mapping */}
      {settings.mode === 'territory' && (
        <div className="p-4 rounded-lg bg-secondary/50 space-y-4">
          <h4 className="font-medium">Territory Mappings</h4>
          
          {/* Existing Territories */}
          {settings.territories.length > 0 && (
            <div className="space-y-2">
              {settings.territories.map((territory, index) => {
                const agent = users.find(u => u.id === territory.agent_id);
                return (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="font-medium">{territory.state}</span>
                      {territory.city && <span className="text-muted-foreground">• {territory.city}</span>}
                      <span className="text-muted-foreground">→</span>
                      <span className="text-primary">{agent?.name || 'Unknown Agent'}</span>
                    </div>
                    <button
                      onClick={() => removeTerritory(index)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add New Territory */}
          <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-border">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium mb-1">State *</label>
              <input
                type="text"
                value={newTerritory.state}
                onChange={(e) => setNewTerritory(prev => ({ ...prev, state: e.target.value }))}
                placeholder="e.g., Selangor"
                className="elstar-input"
                data-testid="territory-state-input"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium mb-1">City (Optional)</label>
              <input
                type="text"
                value={newTerritory.city}
                onChange={(e) => setNewTerritory(prev => ({ ...prev, city: e.target.value }))}
                placeholder="e.g., Petaling Jaya"
                className="elstar-input"
                data-testid="territory-city-input"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium mb-1">Assign To *</label>
              <select
                value={newTerritory.agent_id}
                onChange={(e) => setNewTerritory(prev => ({ ...prev, agent_id: e.target.value }))}
                className="elstar-select"
                data-testid="territory-agent-select"
              >
                <option value="">-- Select Agent --</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={addTerritory}
              className="elstar-btn-ghost"
              data-testid="add-territory-btn"
            >
              <Plus className="w-4 h-4 mr-1" /> Add
            </button>
          </div>
        </div>
      )}

      {/* Round Robin Info */}
      {settings.mode === 'round_robin' && (
        <div className="p-4 rounded-lg bg-secondary/50">
          <p className="text-sm text-muted-foreground">
            <strong>{users.length}</strong> agents will receive leads in rotation.
            The system will distribute leads evenly among: {users.map(u => u.name).join(', ') || 'No agents found'}
          </p>
        </div>
      )}
    </div>
  );
}
