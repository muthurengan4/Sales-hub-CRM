import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Loader2,
  Sparkles,
  Mail,
  Phone,
  Building2,
  MoreHorizontal,
  Trash2,
  Edit,
  RefreshCw,
  X
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const statusConfig = {
  new: { label: 'New', class: 'elstar-badge-info' },
  contacted: { label: 'Contacted', class: 'elstar-badge-warning' },
  qualified: { label: 'Qualified', class: 'elstar-badge-success' },
  lost: { label: 'Lost', class: 'elstar-badge-danger' }
};

const getScoreClass = (score) => {
  if (score >= 80) return 'score-high';
  if (score >= 60) return 'score-medium';
  return 'score-low';
};

export default function Leads() {
  const { token } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', company: '', title: '',
    linkedin: '', company_size: '', industry: '', source: '', notes: ''
  });

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  const fetchLeads = async () => {
    try {
      let url = `${API}/api/leads`;
      if (statusFilter && statusFilter !== 'all') url += `?status=${statusFilter}`;
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) setLeads(await response.json());
    } catch (error) {
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name) { toast.error('Name is required'); return; }
    setFormLoading(true);
    try {
      const response = await fetch(`${API}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        toast.success('Lead created successfully');
        setIsCreateOpen(false);
        resetForm();
        fetchLeads();
      }
    } catch (error) {
      toast.error('Failed to create lead');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selectedLead) return;
    setFormLoading(true);
    try {
      const response = await fetch(`${API}/api/leads/${selectedLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        toast.success('Lead updated');
        setIsEditOpen(false);
        setSelectedLead(null);
        resetForm();
        fetchLeads();
      }
    } catch (error) {
      toast.error('Failed to update lead');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (leadId) => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      await fetch(`${API}/api/leads/${leadId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      toast.success('Lead deleted');
      fetchLeads();
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

  const handleRefreshScore = async (leadId) => {
    try {
      await fetch(`${API}/api/leads/${leadId}/refresh-score`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      toast.success('AI score refreshed');
      fetchLeads();
    } catch (error) {
      toast.error('Failed to refresh score');
    }
  };

  const openEditDialog = (lead) => {
    setSelectedLead(lead);
    setFormData({ ...lead, status: lead.status || 'new' });
    setIsEditOpen(true);
    setDropdownOpen(null);
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', company: '', title: '', linkedin: '', company_size: '', industry: '', source: '', notes: '' });
  };

  const filteredLeads = leads.filter(lead => {
    if (!search) return true;
    const s = search.toLowerCase();
    return lead.name?.toLowerCase().includes(s) || lead.company?.toLowerCase().includes(s) || lead.email?.toLowerCase().includes(s);
  });

  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
      <div className="elstar-modal-overlay" onClick={onClose}>
        <div className="elstar-modal animate-fade-in" onClick={e => e.stopPropagation()}>
          <div className="elstar-modal-header flex items-center justify-between">
            <h3 className="font-semibold text-lg">{title}</h3>
            <button onClick={onClose} className="p-1 hover:bg-secondary rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" data-testid="leads-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground mt-1">Manage and track your sales leads</p>
        </div>
        <button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="elstar-btn-primary flex items-center gap-2" data-testid="add-lead-btn">
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="elstar-card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="elstar-input pl-10"
              data-testid="search-leads-input"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="elstar-select w-full sm:w-44" data-testid="status-filter">
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="elstar-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium">No leads found</p>
            <p className="text-sm text-muted-foreground mb-4">Get started by adding your first lead</p>
            <button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="elstar-btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="elstar-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th className="hidden md:table-cell">Company</th>
                  <th className="hidden sm:table-cell">Contact</th>
                  <th>Status</th>
                  <th className="text-center">AI Score</th>
                  <th className="w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} data-testid={`lead-row-${lead.id}`}>
                    <td>
                      <p className="font-medium">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.title}</p>
                    </td>
                    <td className="hidden md:table-cell">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="w-4 h-4" />
                        <span>{lead.company || '-'}</span>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell">
                      <div className="space-y-1">
                        {lead.email && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="w-3 h-3" />{lead.email}</div>}
                        {lead.phone && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="w-3 h-3" />{lead.phone}</div>}
                      </div>
                    </td>
                    <td>
                      <span className={`elstar-badge ${statusConfig[lead.status]?.class || 'elstar-badge-info'}`}>
                        {statusConfig[lead.status]?.label || lead.status}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Sparkles className={`w-4 h-4 ${getScoreClass(lead.ai_score)}`} />
                        <span className={`font-mono font-bold ${getScoreClass(lead.ai_score)}`}>{lead.ai_score}</span>
                      </div>
                    </td>
                    <td>
                      <div className="relative">
                        <button onClick={() => setDropdownOpen(dropdownOpen === lead.id ? null : lead.id)} className="p-2 hover:bg-secondary rounded-lg">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {dropdownOpen === lead.id && (
                          <>
                            <div className="fixed inset-0" onClick={() => setDropdownOpen(null)} />
                            <div className="elstar-dropdown animate-fade-in">
                              <button onClick={() => openEditDialog(lead)} className="elstar-dropdown-item w-full text-left flex items-center gap-2">
                                <Edit className="w-4 h-4" /> Edit
                              </button>
                              <button onClick={() => { handleRefreshScore(lead.id); setDropdownOpen(null); }} className="elstar-dropdown-item w-full text-left flex items-center gap-2">
                                <RefreshCw className="w-4 h-4" /> Refresh Score
                              </button>
                              <button onClick={() => { handleDelete(lead.id); setDropdownOpen(null); }} className="elstar-dropdown-item w-full text-left flex items-center gap-2 text-red-500">
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add New Lead">
        <form onSubmit={handleCreate}>
          <div className="elstar-modal-body space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <input className="elstar-input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="John Doe" data-testid="lead-name-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input className="elstar-input" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="john@company.com" data-testid="lead-email-input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input className="elstar-input" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+1 234 567 890" data-testid="lead-phone-input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Company</label>
                <input className="elstar-input" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} placeholder="Acme Inc" data-testid="lead-company-input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Job Title</label>
                <input className="elstar-input" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Sales Director" data-testid="lead-title-input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Company Size</label>
                <select className="elstar-select" value={formData.company_size} onChange={(e) => setFormData({...formData, company_size: e.target.value})} data-testid="lead-company-size-select">
                  <option value="">Select size</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="500+">500+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Industry</label>
                <input className="elstar-input" value={formData.industry} onChange={(e) => setFormData({...formData, industry: e.target.value})} placeholder="Technology" data-testid="lead-industry-input" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Source</label>
              <select className="elstar-select" value={formData.source} onChange={(e) => setFormData({...formData, source: e.target.value})} data-testid="lead-source-select">
                <option value="">Select source</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="linkedin">LinkedIn</option>
                <option value="cold_outreach">Cold Outreach</option>
                <option value="event">Event</option>
              </select>
            </div>
          </div>
          <div className="elstar-modal-footer">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="elstar-btn-ghost">Cancel</button>
            <button type="submit" disabled={formLoading} className="elstar-btn-primary flex items-center gap-2" data-testid="submit-lead-btn">
              {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Lead
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Lead">
        <form onSubmit={handleEdit}>
          <div className="elstar-modal-body space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name *</label>
              <input className="elstar-input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} data-testid="edit-lead-name-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input className="elstar-input" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input className="elstar-input" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Company</label>
                <input className="elstar-input" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Job Title</label>
                <input className="elstar-input" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select className="elstar-select" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} data-testid="edit-lead-status-select">
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>
          <div className="elstar-modal-footer">
            <button type="button" onClick={() => setIsEditOpen(false)} className="elstar-btn-ghost">Cancel</button>
            <button type="submit" disabled={formLoading} className="elstar-btn-primary flex items-center gap-2" data-testid="update-lead-btn">
              {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Update Lead
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const Users = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
