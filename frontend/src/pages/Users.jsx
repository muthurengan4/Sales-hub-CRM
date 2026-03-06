import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { Plus, Loader2, MoreHorizontal, Trash2, Edit, X, UserPlus, Shield, Mail, Clock } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const ROLES = [
  { id: 'org_admin', name: 'Organization Admin', desc: 'Full access to organization settings and all data' },
  { id: 'manager', name: 'Manager', desc: 'Can view all data and manage team members' },
  { id: 'sales_rep', name: 'Sales Rep', desc: 'Can manage their own leads and deals' },
  { id: 'viewer', name: 'Viewer', desc: 'Read-only access to their assigned data' }
];

const getRoleBadge = (role) => {
  const colors = {
    super_admin: 'elstar-badge-primary',
    org_admin: 'elstar-badge-info',
    manager: 'elstar-badge-success',
    sales_rep: 'elstar-badge-warning',
    viewer: 'elstar-badge bg-slate-500/10 text-slate-400'
  };
  return colors[role] || colors.viewer;
};

export default function Users() {
  const { token, user: currentUser, hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [inviteData, setInviteData] = useState({ email: '', name: '', role: 'sales_rep' });
  const [editData, setEditData] = useState({ role: '', is_active: true });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API}/api/users`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) setUsers(await response.json());
    } catch (error) { toast.error('Failed to fetch users'); }
    finally { setLoading(false); }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteData.email || !inviteData.name) { toast.error('Email and name are required'); return; }
    setFormLoading(true);
    try {
      const response = await fetch(`${API}/api/users/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(inviteData)
      });
      if (response.ok) {
        toast.success('User invited successfully');
        setIsInviteOpen(false);
        setInviteData({ email: '', name: '', role: 'sales_rep' });
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to invite user');
      }
    } catch (error) { toast.error('Failed to invite user'); }
    finally { setFormLoading(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setFormLoading(true);
    try {
      const response = await fetch(`${API}/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editData)
      });
      if (response.ok) {
        toast.success('User updated');
        setIsEditOpen(false);
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (error) { toast.error('Failed to update user'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this user? This action cannot be undone.')) return;
    try {
      const response = await fetch(`${API}/api/users/${userId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) { toast.success('User deleted'); fetchUsers(); }
      else { const data = await response.json(); toast.error(data.detail || 'Failed'); }
    } catch (error) { toast.error('Failed to delete user'); }
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setEditData({ role: user.role, is_active: user.is_active });
    setIsEditOpen(true);
    setDropdownOpen(null);
  };

  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
      <div className="elstar-modal-overlay" onClick={onClose}>
        <div className="elstar-modal animate-fade-in" onClick={e => e.stopPropagation()}>
          <div className="elstar-modal-header flex items-center justify-between">
            <h3 className="font-semibold text-lg">{title}</h3>
            <button onClick={onClose} className="p-1 hover:bg-secondary rounded"><X className="w-5 h-5" /></button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  const canManageUsers = hasPermission('manage_users');
  const canInvite = hasPermission('invite_users');

  return (
    <div className="space-y-6" data-testid="users-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Team Members</h1>
          <p className="text-muted-foreground mt-1">Manage your organization's users and roles</p>
        </div>
        {canInvite && (
          <button onClick={() => setIsInviteOpen(true)} className="elstar-btn-primary flex items-center gap-2" data-testid="invite-user-btn">
            <UserPlus className="w-4 h-4" /> Invite User
          </button>
        )}
      </div>

      {/* Role Legend */}
      <div className="elstar-card p-4">
        <h3 className="font-medium mb-3 flex items-center gap-2"><Shield className="w-4 h-4" /> Role Permissions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ROLES.map(role => (
            <div key={role.id} className="p-3 bg-secondary/30 rounded-lg">
              <span className={`elstar-badge ${getRoleBadge(role.id)} mb-2`}>{role.name}</span>
              <p className="text-xs text-muted-foreground">{role.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Users List */}
      <div className="elstar-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="font-medium">No team members yet</p>
            <p className="text-sm text-muted-foreground mb-4">Invite your first team member to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="elstar-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th className="hidden md:table-cell">Status</th>
                  <th className="hidden sm:table-cell">Last Login</th>
                  {canManageUsers && <th className="w-12"></th>}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} data-testid={`user-row-${user.id}`}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="elstar-avatar w-9 h-9 text-sm">{user.name?.charAt(0)?.toUpperCase()}</div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><span className={`elstar-badge ${getRoleBadge(user.role)}`}>{user.role?.replace('_', ' ')}</span></td>
                    <td className="hidden md:table-cell">
                      <span className={`elstar-badge ${user.is_active ? 'elstar-badge-success' : 'elstar-badge-danger'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="hidden sm:table-cell">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                      </div>
                    </td>
                    {canManageUsers && (
                      <td>
                        {user.id !== currentUser.id && (
                          <div className="relative">
                            <button onClick={() => setDropdownOpen(dropdownOpen === user.id ? null : user.id)} className="p-2 hover:bg-secondary rounded-lg">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                            {dropdownOpen === user.id && (
                              <>
                                <div className="fixed inset-0" onClick={() => setDropdownOpen(null)} />
                                <div className="elstar-dropdown animate-fade-in">
                                  <button onClick={() => openEditDialog(user)} className="elstar-dropdown-item w-full text-left flex items-center gap-2">
                                    <Edit className="w-4 h-4" /> Edit Role
                                  </button>
                                  <button onClick={() => { handleDelete(user.id); setDropdownOpen(null); }} className="elstar-dropdown-item w-full text-left flex items-center gap-2 text-red-500">
                                    <Trash2 className="w-4 h-4" /> Remove
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <Modal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite Team Member">
        <form onSubmit={handleInvite}>
          <div className="elstar-modal-body space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name *</label>
              <input className="elstar-input" value={inviteData.name} onChange={(e) => setInviteData({...inviteData, name: e.target.value})} placeholder="John Doe" data-testid="invite-name-input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email Address *</label>
              <input className="elstar-input" type="email" value={inviteData.email} onChange={(e) => setInviteData({...inviteData, email: e.target.value})} placeholder="john@company.com" data-testid="invite-email-input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <select className="elstar-select" value={inviteData.role} onChange={(e) => setInviteData({...inviteData, role: e.target.value})} data-testid="invite-role-select">
                {ROLES.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
              </select>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-500">A temporary password will be generated. The user can change it after first login.</p>
            </div>
          </div>
          <div className="elstar-modal-footer">
            <button type="button" onClick={() => setIsInviteOpen(false)} className="elstar-btn-ghost">Cancel</button>
            <button type="submit" disabled={formLoading} className="elstar-btn-primary flex items-center gap-2" data-testid="submit-invite-btn">
              {formLoading && <Loader2 className="w-4 h-4 animate-spin" />} Send Invite
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit User">
        <form onSubmit={handleUpdate}>
          <div className="elstar-modal-body space-y-4">
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
              <div className="elstar-avatar w-10 h-10">{selectedUser?.name?.charAt(0)?.toUpperCase()}</div>
              <div>
                <p className="font-medium">{selectedUser?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <select className="elstar-select" value={editData.role} onChange={(e) => setEditData({...editData, role: e.target.value})}>
                {ROLES.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select className="elstar-select" value={editData.is_active ? 'active' : 'inactive'} onChange={(e) => setEditData({...editData, is_active: e.target.value === 'active'})}>
                <option value="active">Active</option>
                <option value="inactive">Inactive (Suspended)</option>
              </select>
            </div>
          </div>
          <div className="elstar-modal-footer">
            <button type="button" onClick={() => setIsEditOpen(false)} className="elstar-btn-ghost">Cancel</button>
            <button type="submit" disabled={formLoading} className="elstar-btn-primary flex items-center gap-2">
              {formLoading && <Loader2 className="w-4 h-4 animate-spin" />} Update User
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
