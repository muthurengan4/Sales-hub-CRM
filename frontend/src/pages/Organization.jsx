import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../App';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import AssignmentSettings from '../components/AssignmentSettings';
import { Loader2, Building2, Users, Globe, Briefcase, Save, Plus, Check } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

export default function Organization() {
  const { token, user, hasPermission, refreshUser } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', domain: '', industry: '', size: '' });
  const [editData, setEditData] = useState({ name: '', domain: '', industry: '', size: '' });

  useEffect(() => { fetchOrganizations(); }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch(`${API}/api/organizations`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const orgs = await response.json();
        setOrganizations(orgs);
        if (orgs.length > 0 && user?.organization_id) {
          const currentOrg = orgs.find(o => o.id === user.organization_id);
          if (currentOrg) {
            setEditData({ name: currentOrg.name, domain: currentOrg.domain || '', industry: currentOrg.industry || '', size: currentOrg.size || '' });
          }
        }
      }
    } catch (error) { toast.error('Failed to fetch organizations'); }
    finally { setLoading(false); }
  };

  // Stable callback to prevent re-renders
  const handleFormChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleEditChange = useCallback((field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name) { toast.error('Organization name is required'); return; }
    setSaving(true);
    try {
      const response = await fetch(`${API}/api/organizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        toast.success('Organization created! You are now the admin.');
        setIsCreateOpen(false);
        setFormData({ name: '', domain: '', industry: '', size: '' });
        await refreshUser();
        fetchOrganizations();
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to create organization');
      }
    } catch (error) { toast.error('Failed to create organization'); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!user?.organization_id) return;
    setSaving(true);
    try {
      const response = await fetch(`${API}/api/organizations/${user.organization_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editData)
      });
      if (response.ok) {
        toast.success('Organization updated');
        await refreshUser();
        fetchOrganizations();
      }
    } catch (error) { toast.error('Failed to update organization'); }
    finally { setSaving(false); }
  };

  const currentOrg = organizations.find(o => o.id === user?.organization_id);
  const canManageSettings = hasPermission('manage_settings');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // No organization yet
  if (!user?.organization_id) {
    return (
      <div className="space-y-6" data-testid="organization-page">
        <div>
          <h1 className="text-2xl font-bold">Organization</h1>
          <p className="text-muted-foreground mt-1">Set up your organization to start collaborating</p>
        </div>

        <div className="elstar-card p-8 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Create Your Organization</h2>
          <p className="text-muted-foreground mb-6">
            Create an organization to invite team members and collaborate on leads and deals.
          </p>
          <button onClick={() => setIsCreateOpen(true)} className="elstar-btn-primary" data-testid="create-org-btn">
            <Plus className="w-4 h-4 mr-2" /> Create Organization
          </button>
        </div>

        {/* Create Modal */}
        <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Organization">
          <form onSubmit={handleCreate}>
            <div className="elstar-modal-body space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Organization Name *</label>
                <input 
                  className="elstar-input" 
                  value={formData.name} 
                  onChange={(e) => handleFormChange('name', e.target.value)} 
                  placeholder="Acme Inc" 
                  data-testid="org-name-input" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Domain</label>
                <input 
                  className="elstar-input" 
                  value={formData.domain} 
                  onChange={(e) => handleFormChange('domain', e.target.value)} 
                  placeholder="acme.com" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Industry</label>
                  <select 
                    className="elstar-select" 
                    value={formData.industry} 
                    onChange={(e) => handleFormChange('industry', e.target.value)}
                  >
                    <option value="">Select...</option>
                    <option value="technology">Technology</option>
                    <option value="finance">Finance</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="retail">Retail</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Company Size</label>
                  <select 
                    className="elstar-select" 
                    value={formData.size} 
                    onChange={(e) => handleFormChange('size', e.target.value)}
                  >
                    <option value="">Select...</option>
                    <option value="1-10">1-10</option>
                    <option value="11-50">11-50</option>
                    <option value="51-200">51-200</option>
                    <option value="201-500">201-500</option>
                    <option value="500+">500+</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="elstar-modal-footer">
              <button type="button" onClick={() => setIsCreateOpen(false)} className="elstar-btn-ghost">Cancel</button>
              <button type="submit" disabled={saving} className="elstar-btn-primary flex items-center gap-2" data-testid="submit-org-btn">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Create
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl" data-testid="organization-page">
      <div>
        <h1 className="text-2xl font-bold">Organization Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your organization details</p>
      </div>

      {/* Organization Overview */}
      <div className="elstar-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 ai-gradient rounded-lg flex items-center justify-center">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{currentOrg?.name}</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              {currentOrg?.domain && <span className="flex items-center gap-1"><Globe className="w-4 h-4" />{currentOrg.domain}</span>}
              {currentOrg?.industry && <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" />{currentOrg.industry}</span>}
              {currentOrg?.size && <span className="flex items-center gap-1"><Users className="w-4 h-4" />{currentOrg.size} employees</span>}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 p-4 bg-secondary/30 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{currentOrg?.member_count || 1}</p>
            <p className="text-xs text-muted-foreground">Members</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-500">{currentOrg?.lead_count || 0}</p>
            <p className="text-xs text-muted-foreground">Leads</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-500">{currentOrg?.deal_count || 0}</p>
            <p className="text-xs text-muted-foreground">Deals</p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {canManageSettings && (
        <div className="elstar-card p-6">
          <h3 className="font-semibold mb-4">Organization Details</h3>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Organization Name</label>
              <input 
                className="elstar-input" 
                value={editData.name} 
                onChange={(e) => handleEditChange('name', e.target.value)} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Domain</label>
              <input 
                className="elstar-input" 
                value={editData.domain} 
                onChange={(e) => handleEditChange('domain', e.target.value)} 
                placeholder="company.com" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Industry</label>
                <select 
                  className="elstar-select" 
                  value={editData.industry} 
                  onChange={(e) => handleEditChange('industry', e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="technology">Technology</option>
                  <option value="finance">Finance</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="retail">Retail</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Company Size</label>
                <select 
                  className="elstar-select" 
                  value={editData.size} 
                  onChange={(e) => handleEditChange('size', e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="500+">500+</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="elstar-btn-primary flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Membership Status */}
      <div className="elstar-card p-6">
        <h3 className="font-semibold mb-4">Your Membership</h3>
        <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="elstar-avatar w-10 h-10">{user?.name?.charAt(0)?.toUpperCase()}</div>
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <span className="elstar-badge elstar-badge-primary capitalize">{user?.role?.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Assignment Settings - Only show for admins */}
      {user?.organization_id && hasPermission('manage_organization') && (
        <div className="elstar-card p-6">
          <AssignmentSettings />
        </div>
      )}
    </div>
  );
}
