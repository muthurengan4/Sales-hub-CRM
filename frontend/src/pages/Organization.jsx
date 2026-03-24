import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../App';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import AssignmentSettings from '../components/AssignmentSettings';
import { Loader2, Building2, Users, Globe, Briefcase, Save, Plus, Check, Mail, UserPlus, LogIn, Trash2, Phone, BarChart3, X } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

export default function Organization() {
  const { token, user, hasPermission, refreshUser, login } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', domain: '', industry: '', size: '' });
  const [editData, setEditData] = useState({ name: '', domain: '', industry: '', size: '' });
  
  // Team management state
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviting, setInviting] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newUserCredentials, setNewUserCredentials] = useState(null);

  useEffect(() => { fetchOrganizations(); fetchTeamMembers(); }, []);

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

  // Fetch team members
  const fetchTeamMembers = async () => {
    setLoadingTeam(true);
    try {
      const response = await fetch(`${API}/api/organization/team`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data.members || []);
      }
    } catch (error) {
      console.error('Failed to fetch team members');
    } finally {
      setLoadingTeam(false);
    }
  };

  // Invite team member
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) {
      toast.error('Email is required');
      return;
    }
    setInviting(true);
    try {
      const response = await fetch(`${API}/api/organization/team/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: inviteEmail, name: inviteName || null })
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        if (data.is_new && data.temp_password) {
          setNewUserCredentials({
            email: inviteEmail,
            password: data.temp_password
          });
        }
        setInviteEmail('');
        setInviteName('');
        setShowInviteModal(false);
        fetchTeamMembers();
      } else {
        toast.error(data.detail || 'Failed to invite user');
      }
    } catch (error) {
      toast.error('Failed to invite user');
    } finally {
      setInviting(false);
    }
  };

  // Impersonate (login as) team member
  const handleImpersonate = async (memberId, memberName) => {
    if (!window.confirm(`You will be logged in as ${memberName}. Continue?`)) return;
    
    try {
      const response = await fetch(`${API}/api/organization/team/${memberId}/impersonate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        // Store original admin info for "Return to Admin" feature
        localStorage.setItem('impersonation_original_token', token);
        localStorage.setItem('impersonation_info', JSON.stringify(data.impersonation));
        
        // Login as the team member
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        toast.success(`Now viewing as ${memberName}`);
        window.location.href = '/'; // Refresh to dashboard
      } else {
        toast.error(data.detail || 'Failed to impersonate');
      }
    } catch (error) {
      toast.error('Failed to impersonate user');
    }
  };

  // Remove team member
  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from the organization?`)) return;
    
    try {
      const response = await fetch(`${API}/api/organization/team/${memberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        fetchTeamMembers();
      } else {
        toast.error(data.detail || 'Failed to remove member');
      }
    } catch (error) {
      toast.error('Failed to remove member');
    }
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
      <div className="elstar-card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 ai-gradient rounded-lg flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-semibold">{currentOrg?.name}</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground mt-1">
              {currentOrg?.domain && <span className="flex items-center gap-1"><Globe className="w-3 h-3 sm:w-4 sm:h-4" />{currentOrg.domain}</span>}
              {currentOrg?.industry && <span className="flex items-center gap-1"><Briefcase className="w-3 h-3 sm:w-4 sm:h-4" />{currentOrg.industry}</span>}
              {currentOrg?.size && <span className="flex items-center gap-1"><Users className="w-3 h-3 sm:w-4 sm:h-4" />{currentOrg.size} employees</span>}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 bg-secondary/30 rounded-lg">
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-primary">{currentOrg?.member_count || 1}</p>
            <p className="text-xs text-muted-foreground">Members</p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-emerald-500">{currentOrg?.lead_count || 0}</p>
            <p className="text-xs text-muted-foreground">Leads</p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-amber-500">{currentOrg?.deal_count || 0}</p>
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

      {/* Team Management - Only show for admins */}
      {user?.organization_id && hasPermission('manage_organization') && (
        <div className="elstar-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg">Sales Team</h3>
              <p className="text-sm text-muted-foreground">Manage your organization's team members</p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="elstar-btn-primary flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Add Team Member
            </button>
          </div>

          {loadingTeam ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No team members yet</p>
              <p className="text-sm">Invite your sales team to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div 
                  key={member.id} 
                  className={`p-4 rounded-lg border ${member.is_current_user ? 'border-primary bg-primary/5' : 'border-border'} hover:bg-secondary/30 transition-colors`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                        member.role === 'org_admin' ? 'bg-gradient-to-br from-amber-500 to-orange-500' :
                        member.role === 'manager' ? 'bg-gradient-to-br from-blue-500 to-purple-500' :
                        'bg-gradient-to-br from-green-500 to-teal-500'
                      }`}>
                        {(member.name || member.email).charAt(0).toUpperCase()}
                      </div>
                      
                      {/* Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{member.name || member.email.split('@')[0]}</p>
                          {member.is_current_user && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">You</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {member.stats?.leads || 0} leads
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {member.stats?.ai_calls || 0} calls
                          </span>
                          <span className="flex items-center gap-1">
                            <BarChart3 className="w-3 h-3" /> {member.stats?.tasks || 0} tasks
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        member.role === 'org_admin' ? 'bg-amber-500/20 text-amber-500' :
                        member.role === 'manager' ? 'bg-blue-500/20 text-blue-500' :
                        'bg-green-500/20 text-green-500'
                      }`}>
                        {member.role?.replace('_', ' ')}
                      </span>
                      
                      {!member.is_current_user && (
                        <>
                          <button
                            onClick={() => handleImpersonate(member.id, member.name || member.email)}
                            className="p-2 hover:bg-primary/10 rounded-lg text-primary transition-colors"
                            title="Login as this user"
                          >
                            <LogIn className="w-4 h-4" />
                          </button>
                          {member.role !== 'org_admin' && (
                            <button
                              onClick={() => handleRemoveMember(member.id, member.name || member.email)}
                              className="p-2 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors"
                              title="Remove from organization"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invite Team Member Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => { setShowInviteModal(false); setInviteEmail(''); setInviteName(''); }}
        title="Add Team Member"
        size="md"
      >
        <form onSubmit={handleInvite}>
          <div className="elstar-modal-body space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email Address *</label>
              <input
                type="email"
                className="elstar-input w-full"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@company.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Name (Optional)</label>
              <input
                type="text"
                className="elstar-input w-full"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-sm">
              <p className="text-blue-500 font-medium">What happens next?</p>
              <ul className="text-muted-foreground mt-1 space-y-1">
                <li>• A new account will be created for this email</li>
                <li>• They will get access to all AI agents in your organization</li>
                <li>• You'll receive their temporary login credentials</li>
              </ul>
            </div>
          </div>
          <div className="elstar-modal-footer">
            <button
              type="button"
              onClick={() => setShowInviteModal(false)}
              className="elstar-btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviting || !inviteEmail}
              className="elstar-btn-primary flex items-center gap-2"
            >
              {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Send Invitation
            </button>
          </div>
        </form>
      </Modal>

      {/* New User Credentials Modal */}
      <Modal
        isOpen={!!newUserCredentials}
        onClose={() => setNewUserCredentials(null)}
        title="New Team Member Added"
        size="md"
      >
        {newUserCredentials && (
          <div className="elstar-modal-body space-y-4">
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-lg font-semibold">Account Created Successfully!</p>
              <p className="text-sm text-muted-foreground mt-1">Share these credentials with your team member</p>
            </div>
            
            <div className="p-4 rounded-lg bg-secondary/50 border border-border space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-mono text-sm">{newUserCredentials.email}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Temporary Password</p>
                <p className="font-mono text-sm font-bold text-primary">{newUserCredentials.password}</p>
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground text-center">
              ⚠️ Please save these credentials. The password cannot be retrieved later.
            </p>
            
            <div className="flex justify-center">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`Email: ${newUserCredentials.email}\nPassword: ${newUserCredentials.password}`);
                  toast.success('Credentials copied to clipboard');
                }}
                className="elstar-btn-ghost text-sm"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        )}
        <div className="elstar-modal-footer">
          <button
            onClick={() => setNewUserCredentials(null)}
            className="elstar-btn-primary w-full"
          >
            Done
          </button>
        </div>
      </Modal>
    </div>
  );
}
