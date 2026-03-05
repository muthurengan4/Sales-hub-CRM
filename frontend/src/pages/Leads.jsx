import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const statusColors = {
  new: 'is-new',
  contacted: 'is-contacted',
  qualified: 'is-qualified',
  lost: 'is-lost'
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
      if (statusFilter && statusFilter !== 'all') {
        url += `?status=${statusFilter}`;
      }
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setLeads(await response.json());
      }
    } catch (error) {
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Name is required');
      return;
    }
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
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to create lead');
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
        toast.success('Lead updated successfully');
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
      const response = await fetch(`${API}/api/leads/${leadId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        toast.success('Lead deleted');
        fetchLeads();
      }
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

  const openEditDialog = (lead) => {
    setSelectedLead(lead);
    setFormData({ ...lead, status: lead.status || 'new' });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '', email: '', phone: '', company: '', title: '',
      linkedin: '', company_size: '', industry: '', source: '', notes: ''
    });
  };

  const filteredLeads = leads.filter(lead => {
    if (!search) return true;
    const s = search.toLowerCase();
    return lead.name?.toLowerCase().includes(s) || 
           lead.company?.toLowerCase().includes(s) || 
           lead.email?.toLowerCase().includes(s);
  });

  return (
    <div data-testid="leads-page">
      {/* Header */}
      <div className="is-flex is-justify-content-space-between is-align-items-center mb-5 is-flex-wrap-wrap" style={{ gap: '1rem' }}>
        <div>
          <h1 className="title is-3 mb-1">Leads</h1>
          <p className="subtitle is-6 has-text-grey">Manage and track your sales leads</p>
        </div>
        <button 
          className="button is-link"
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
          data-testid="add-lead-btn"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', border: 'none' }}
        >
          + Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="box mb-5">
        <div className="columns">
          <div className="column is-6">
            <div className="field">
              <div className="control has-icons-left">
                <input
                  className="input"
                  type="text"
                  placeholder="Search leads..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="search-leads-input"
                />
                <span className="icon is-small is-left">🔍</span>
              </div>
            </div>
          </div>
          <div className="column is-3">
            <div className="field">
              <div className="select is-fullwidth">
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  data-testid="status-filter"
                >
                  <option value="all">All Statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="box" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="has-text-centered p-6">
            <span className="loader"></span>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="has-text-centered p-6">
            <p className="is-size-1 mb-3">👥</p>
            <p className="title is-5">No leads found</p>
            <p className="subtitle is-6 has-text-grey mb-4">Get started by adding your first lead</p>
            <button className="button is-link" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
              + Add Lead
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="table is-fullwidth is-hoverable">
              <thead>
                <tr>
                  <th>Name</th>
                  <th className="is-hidden-mobile">Company</th>
                  <th className="is-hidden-touch">Contact</th>
                  <th>Status</th>
                  <th className="has-text-centered">AI Score</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} data-testid={`lead-row-${lead.id}`}>
                    <td>
                      <p className="has-text-weight-medium">{lead.name}</p>
                      <p className="is-size-7 has-text-grey">{lead.title}</p>
                    </td>
                    <td className="is-hidden-mobile">
                      <span className="icon-text">
                        <span className="icon is-small">🏢</span>
                        <span>{lead.company || '-'}</span>
                      </span>
                    </td>
                    <td className="is-hidden-touch">
                      {lead.email && <p className="is-size-7">✉️ {lead.email}</p>}
                      {lead.phone && <p className="is-size-7">📞 {lead.phone}</p>}
                    </td>
                    <td>
                      <span className={`tag ${statusColors[lead.status] || 'is-new'}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="has-text-centered">
                      <span className={`has-text-weight-bold ${getScoreClass(lead.ai_score)}`}>
                        ✦ {lead.ai_score}
                      </span>
                    </td>
                    <td>
                      <div className="dropdown is-hoverable is-right">
                        <div className="dropdown-trigger">
                          <button className="button is-small is-ghost">⋯</button>
                        </div>
                        <div className="dropdown-menu">
                          <div className="dropdown-content">
                            <a className="dropdown-item" onClick={() => openEditDialog(lead)}>
                              ✏️ Edit
                            </a>
                            <a className="dropdown-item has-text-danger" onClick={() => handleDelete(lead.id)}>
                              🗑️ Delete
                            </a>
                          </div>
                        </div>
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
      <div className={`modal ${isCreateOpen ? 'is-active' : ''}`}>
        <div className="modal-background" onClick={() => setIsCreateOpen(false)}></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">Add New Lead</p>
            <button className="delete" onClick={() => setIsCreateOpen(false)}></button>
          </header>
          <form onSubmit={handleCreate}>
            <section className="modal-card-body">
              <div className="field">
                <label className="label is-small">Name *</label>
                <input className="input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="John Doe" data-testid="lead-name-input" />
              </div>
              <div className="columns">
                <div className="column">
                  <div className="field">
                    <label className="label is-small">Email</label>
                    <input className="input" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="john@company.com" data-testid="lead-email-input" />
                  </div>
                </div>
                <div className="column">
                  <div className="field">
                    <label className="label is-small">Phone</label>
                    <input className="input" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+1 234 567 890" data-testid="lead-phone-input" />
                  </div>
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <div className="field">
                    <label className="label is-small">Company</label>
                    <input className="input" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} placeholder="Acme Inc" data-testid="lead-company-input" />
                  </div>
                </div>
                <div className="column">
                  <div className="field">
                    <label className="label is-small">Job Title</label>
                    <input className="input" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Sales Director" data-testid="lead-title-input" />
                  </div>
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <div className="field">
                    <label className="label is-small">Company Size</label>
                    <div className="select is-fullwidth">
                      <select value={formData.company_size} onChange={(e) => setFormData({...formData, company_size: e.target.value})} data-testid="lead-company-size-select">
                        <option value="">Select size</option>
                        <option value="1-10">1-10</option>
                        <option value="11-50">11-50</option>
                        <option value="51-200">51-200</option>
                        <option value="201-500">201-500</option>
                        <option value="500+">500+</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="column">
                  <div className="field">
                    <label className="label is-small">Industry</label>
                    <input className="input" value={formData.industry} onChange={(e) => setFormData({...formData, industry: e.target.value})} placeholder="Technology" data-testid="lead-industry-input" />
                  </div>
                </div>
              </div>
              <div className="field">
                <label className="label is-small">Source</label>
                <div className="select is-fullwidth">
                  <select value={formData.source} onChange={(e) => setFormData({...formData, source: e.target.value})} data-testid="lead-source-select">
                    <option value="">Select source</option>
                    <option value="website">Website</option>
                    <option value="referral">Referral</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="cold_outreach">Cold Outreach</option>
                    <option value="event">Event</option>
                  </select>
                </div>
              </div>
            </section>
            <footer className="modal-card-foot">
              <button type="button" className="button" onClick={() => setIsCreateOpen(false)}>Cancel</button>
              <button type="submit" className={`button is-link ${formLoading ? 'is-loading' : ''}`} data-testid="submit-lead-btn">Create Lead</button>
            </footer>
          </form>
        </div>
      </div>

      {/* Edit Modal */}
      <div className={`modal ${isEditOpen ? 'is-active' : ''}`}>
        <div className="modal-background" onClick={() => setIsEditOpen(false)}></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">Edit Lead</p>
            <button className="delete" onClick={() => setIsEditOpen(false)}></button>
          </header>
          <form onSubmit={handleEdit}>
            <section className="modal-card-body">
              <div className="field">
                <label className="label is-small">Name *</label>
                <input className="input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} data-testid="edit-lead-name-input" />
              </div>
              <div className="columns">
                <div className="column">
                  <div className="field">
                    <label className="label is-small">Email</label>
                    <input className="input" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>
                <div className="column">
                  <div className="field">
                    <label className="label is-small">Phone</label>
                    <input className="input" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <div className="field">
                    <label className="label is-small">Company</label>
                    <input className="input" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} />
                  </div>
                </div>
                <div className="column">
                  <div className="field">
                    <label className="label is-small">Job Title</label>
                    <input className="input" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="field">
                <label className="label is-small">Status</label>
                <div className="select is-fullwidth">
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} data-testid="edit-lead-status-select">
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
              </div>
            </section>
            <footer className="modal-card-foot">
              <button type="button" className="button" onClick={() => setIsEditOpen(false)}>Cancel</button>
              <button type="submit" className={`button is-link ${formLoading ? 'is-loading' : ''}`} data-testid="update-lead-btn">Update Lead</button>
            </footer>
          </form>
        </div>
      </div>
    </div>
  );
}
