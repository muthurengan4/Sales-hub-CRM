import React, { useState, useEffect, useCallback, memo } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import ActionDropdown from '../components/ActionDropdown';
import { 
  Plus, Search, Loader2, Sparkles, Mail, Phone, Building2, 
  Trash2, Edit, RefreshCw, Upload, FileSpreadsheet, Eye, UserCheck, DollarSign
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const statusConfig = {
  new: { label: 'New', class: 'elstar-badge-info' },
  contacted: { label: 'Contacted', class: 'elstar-badge-warning' },
  qualified: { label: 'Qualified', class: 'elstar-badge-success' },
  lost: { label: 'Lost', class: 'elstar-badge-danger' }
};

const pipelineStageConfig = {
  new: { label: 'New', class: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
  contacted: { label: 'Contacted', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  no_answer: { label: 'No Answer', class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  interested: { label: 'Interested', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  follow_up: { label: 'Follow Up', class: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  booked: { label: 'Booked', class: 'bg-amber-200 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300' },
  won: { label: 'Won', class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  lost: { label: 'Lost', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
};

const getScoreClass = (score) => {
  if (score >= 80) return 'score-high';
  if (score >= 60) return 'score-medium';
  return 'score-low';
};

const initialFormData = {
  name: '', email: '', phone: '', company: '', title: '',
  linkedin: '', company_size: '', industry: '', source: '', notes: '',
  address: '', postcode: '', city: '', state: '', is_public: false, status: 'new'
};

// Form Fields Component - MOVED OUTSIDE to prevent re-renders
const LeadFormFields = memo(({ data, onChange, isEdit = false }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">Name *</label>
        <input 
          className="elstar-input" 
          value={data.name || ''} 
          onChange={(e) => onChange('name', e.target.value)} 
          placeholder="Clinic Name / Contact Name" 
          data-testid="lead-name-input" 
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Email</label>
        <input 
          className="elstar-input" 
          type="email" 
          value={data.email || ''} 
          onChange={(e) => onChange('email', e.target.value)} 
          placeholder="email@company.com" 
          data-testid="lead-email-input" 
        />
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">Phone / Contact Number</label>
        <input 
          className="elstar-input" 
          value={data.phone || ''} 
          onChange={(e) => onChange('phone', e.target.value)} 
          placeholder="+60 123 456 789" 
          data-testid="lead-phone-input" 
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Company</label>
        <input 
          className="elstar-input" 
          value={data.company || ''} 
          onChange={(e) => onChange('company', e.target.value)} 
          placeholder="Company Name" 
          data-testid="lead-company-input" 
        />
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">Address</label>
      <input 
        className="elstar-input" 
        value={data.address || ''} 
        onChange={(e) => onChange('address', e.target.value)} 
        placeholder="Full address" 
        data-testid="lead-address-input" 
      />
    </div>

    <div className="grid grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">City</label>
        <input 
          className="elstar-input" 
          value={data.city || ''} 
          onChange={(e) => onChange('city', e.target.value)} 
          placeholder="City" 
          data-testid="lead-city-input" 
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Postcode</label>
        <input 
          className="elstar-input" 
          value={data.postcode || ''} 
          onChange={(e) => onChange('postcode', e.target.value)} 
          placeholder="Postcode" 
          data-testid="lead-postcode-input" 
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">State</label>
        <input 
          className="elstar-input" 
          value={data.state || ''} 
          onChange={(e) => onChange('state', e.target.value)} 
          placeholder="State" 
          data-testid="lead-state-input" 
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">Job Title</label>
        <input 
          className="elstar-input" 
          value={data.title || ''} 
          onChange={(e) => onChange('title', e.target.value)} 
          placeholder="Sales Director" 
          data-testid="lead-title-input" 
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Industry</label>
        <input 
          className="elstar-input" 
          value={data.industry || ''} 
          onChange={(e) => onChange('industry', e.target.value)} 
          placeholder="Healthcare / Technology" 
          data-testid="lead-industry-input" 
        />
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">Company Size</label>
        <select 
          className="elstar-select" 
          value={data.company_size || ''} 
          onChange={(e) => onChange('company_size', e.target.value)} 
          data-testid="lead-company-size-select"
        >
          <option value="">Select size</option>
          <option value="1-10">1-10</option>
          <option value="11-50">11-50</option>
          <option value="51-200">51-200</option>
          <option value="201-500">201-500</option>
          <option value="500+">500+</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Source</label>
        <select 
          className="elstar-select" 
          value={data.source || ''} 
          onChange={(e) => onChange('source', e.target.value)} 
          data-testid="lead-source-select"
        >
          <option value="">Select source</option>
          <option value="website">Website</option>
          <option value="referral">Referral</option>
          <option value="linkedin">LinkedIn</option>
          <option value="cold_outreach">Cold Outreach</option>
          <option value="event">Event</option>
          <option value="import">Excel Import</option>
        </select>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <input 
        type="checkbox" 
        id="lead_is_public" 
        checked={data.is_public || false} 
        onChange={(e) => onChange('is_public', e.target.checked)}
        className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
      />
      <label htmlFor="lead_is_public" className="text-sm">Is Public</label>
    </div>

    {isEdit && (
      <div>
        <label className="block text-sm font-medium mb-2">Status</label>
        <select 
          className="elstar-select" 
          value={data.status || 'new'} 
          onChange={(e) => onChange('status', e.target.value)} 
          data-testid="edit-lead-status-select"
        >
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="lost">Lost</option>
        </select>
      </div>
    )}

    <div>
      <label className="block text-sm font-medium mb-2">Notes</label>
      <textarea 
        className="elstar-input min-h-[80px]" 
        value={data.notes || ''} 
        onChange={(e) => onChange('notes', e.target.value)} 
        placeholder="Additional notes..."
        data-testid="lead-notes-input"
      />
    </div>
  </div>
));

LeadFormFields.displayName = 'LeadFormFields';

const UsersIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

export default function Leads() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [convertData, setConvertData] = useState({ services: [{ name: '', amount: '', status: 'active' }], notes: '' });
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, currentPage, pageSize, debouncedSearch]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', pageSize);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (debouncedSearch) params.append('search', debouncedSearch);
      
      const url = `${API}/api/leads?${params.toString()}`;
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setLeads(data.items || []);
        setTotalItems(data.total || 0);
        setTotalPages(data.total_pages || 0);
      }
    } catch (error) {
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Stable callback to prevent re-renders
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

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
        setFormData(initialFormData);
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
        toast.success('Lead updated');
        setIsEditOpen(false);
        setSelectedLead(null);
        setFormData(initialFormData);
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
    setFormData({ ...initialFormData, ...lead });
    setIsEditOpen(true);
  };

  const openConvertDialog = (lead) => {
    setSelectedLead(lead);
    setConvertData({ services: [{ name: '', amount: '', status: 'active' }], notes: '' });
    setIsConvertOpen(true);
  };

  const handleConvert = async (e) => {
    e.preventDefault();
    if (!selectedLead) return;
    
    // Validate services
    const validServices = convertData.services.filter(s => s.name && s.amount);
    if (validServices.length === 0) {
      toast.error('Please add at least one service');
      return;
    }
    
    setFormLoading(true);
    try {
      const response = await fetch(`${API}/api/leads/${selectedLead.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          lead_id: selectedLead.id,
          services: validServices.map(s => ({ ...s, amount: parseFloat(s.amount) })),
          notes: convertData.notes
        })
      });
      
      if (response.ok) {
        toast.success('Lead converted to client successfully!');
        setIsConvertOpen(false);
        setSelectedLead(null);
        fetchLeads();
        navigate('/clients');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to convert lead');
      }
    } catch (error) {
      toast.error('Failed to convert lead');
    } finally {
      setFormLoading(false);
    }
  };

  const addService = () => {
    setConvertData(prev => ({
      ...prev,
      services: [...prev.services, { name: '', amount: '', status: 'active' }]
    }));
  };

  const removeService = (index) => {
    setConvertData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const updateService = (index, field, value) => {
    setConvertData(prev => ({
      ...prev,
      services: prev.services.map((s, i) => i === index ? { ...s, [field]: value } : s)
    }));
  };

  const openCreateDialog = () => {
    setFormData(initialFormData);
    setIsCreateOpen(true);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) { toast.error('Please select a file'); return; }
    
    setImportLoading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', importFile);
    
    try {
      const response = await fetch(`${API}/api/leads/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataUpload
      });
      
      if (response.ok) {
        const result = await response.json();
        toast.success(`Successfully imported ${result.imported} leads`);
        setIsImportOpen(false);
        setImportFile(null);
        setCurrentPage(1);
        fetchLeads();
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to import leads');
      }
    } catch (error) {
      toast.error('Failed to import leads');
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="leads-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground mt-1">Manage and track your sales leads</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsImportOpen(true)} 
            className="elstar-btn-ghost flex items-center gap-2"
            data-testid="import-lead-btn"
          >
            <Upload className="w-4 h-4" />
            Import Excel
          </button>
          <button 
            onClick={openCreateDialog} 
            className="elstar-btn-primary flex items-center gap-2" 
            data-testid="add-lead-btn"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>
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
          <select 
            value={statusFilter} 
            onChange={(e) => handleStatusFilterChange(e.target.value)} 
            className="elstar-select w-full sm:w-44" 
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

      {/* Leads Table */}
      <div className="elstar-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <UsersIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium">No leads found</p>
            <p className="text-sm text-muted-foreground mb-4">Get started by adding your first lead or importing from Excel</p>
            <div className="flex gap-2">
              <button onClick={() => setIsImportOpen(true)} className="elstar-btn-ghost">
                <Upload className="w-4 h-4 mr-2" />
                Import Excel
              </button>
              <button onClick={openCreateDialog} className="elstar-btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Lead
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="elstar-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th className="hidden md:table-cell">Company</th>
                    <th className="hidden sm:table-cell">Contact</th>
                    <th className="hidden lg:table-cell">Location</th>
                    <th>Status</th>
                    <th className="text-center">AI Score</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
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
                      <td className="hidden lg:table-cell">
                        <div className="text-xs text-muted-foreground">
                          {lead.city && <span>{lead.city}</span>}
                          {lead.city && lead.state && <span>, </span>}
                          {lead.state && <span>{lead.state}</span>}
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
                        <ActionDropdown testId={`lead-actions-${lead.id}`}>
                          {(closeDropdown) => (
                            <>
                              <button onClick={() => { navigate(`/profile/lead/${lead.id}`); closeDropdown(); }} className="elstar-dropdown-item w-full text-left flex items-center gap-2">
                                <Eye className="w-4 h-4" /> View Profile
                              </button>
                              <button onClick={() => { openEditDialog(lead); closeDropdown(); }} className="elstar-dropdown-item w-full text-left flex items-center gap-2">
                                <Edit className="w-4 h-4" /> Edit
                              </button>
                              <button onClick={() => { handleRefreshScore(lead.id); closeDropdown(); }} className="elstar-dropdown-item w-full text-left flex items-center gap-2">
                                <RefreshCw className="w-4 h-4" /> Refresh Score
                              </button>
                              {!lead.converted_to_client && (
                                <button onClick={() => { openConvertDialog(lead); closeDropdown(); }} className="elstar-dropdown-item w-full text-left flex items-center gap-2 text-green-600">
                                  <UserCheck className="w-4 h-4" /> Convert to Client
                                </button>
                              )}
                              <button onClick={() => { handleDelete(lead.id); closeDropdown(); }} className="elstar-dropdown-item w-full text-left flex items-center gap-2 text-red-500">
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            </>
                          )}
                        </ActionDropdown>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add New Lead" size="lg">
        <form onSubmit={handleCreate}>
          <div className="elstar-modal-body max-h-96 overflow-y-auto">
            <LeadFormFields data={formData} onChange={handleInputChange} />
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
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Lead" size="lg">
        <form onSubmit={handleEdit}>
          <div className="elstar-modal-body max-h-96 overflow-y-auto">
            <LeadFormFields data={formData} onChange={handleInputChange} isEdit />
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

      {/* Import Modal */}
      <Modal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} title="Import Leads from Excel">
        <form onSubmit={handleImport}>
          <div className="elstar-modal-body space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-primary" />
              <p className="font-medium mb-2">Upload Excel File</p>
              <p className="text-sm text-muted-foreground mb-4">
                Supported columns: Clinic Name, Address, Postcode, City, State, Contact Number, Is public
              </p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setImportFile(e.target.files[0])}
                className="hidden"
                id="excel-upload"
              />
              <label htmlFor="excel-upload" className="elstar-btn-primary cursor-pointer inline-flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Choose File
              </label>
              {importFile && (
                <p className="mt-4 text-sm text-primary font-medium">{importFile.name}</p>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Expected columns:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Clinic Name → Name</li>
                <li>Address → Address</li>
                <li>Postcode → Postcode</li>
                <li>City → City</li>
                <li>State → State</li>
                <li>Contact Number → Phone</li>
                <li>Is public → Is Public</li>
              </ul>
            </div>
          </div>
          <div className="elstar-modal-footer">
            <button type="button" onClick={() => { setIsImportOpen(false); setImportFile(null); }} className="elstar-btn-ghost">Cancel</button>
            <button type="submit" disabled={importLoading || !importFile} className="elstar-btn-primary flex items-center gap-2">
              {importLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Import Leads
            </button>
          </div>
        </form>
      </Modal>

      {/* Convert to Client Modal */}
      <Modal isOpen={isConvertOpen} onClose={() => setIsConvertOpen(false)} title="Convert Lead to Client" size="lg">
        <form onSubmit={handleConvert}>
          <div className="elstar-modal-body max-h-[60vh] overflow-y-auto space-y-4">
            {/* Lead Info */}
            {selectedLead && (
              <div className="p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <div className="elstar-avatar w-12 h-12">{selectedLead.name?.charAt(0)?.toUpperCase()}</div>
                  <div>
                    <p className="font-bold">{selectedLead.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedLead.company}</p>
                    {selectedLead.email && <p className="text-xs text-muted-foreground">{selectedLead.email}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Services */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="font-medium">Purchased Services *</label>
                <button type="button" onClick={addService} className="text-sm text-primary hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add Service
                </button>
              </div>
              <div className="space-y-3">
                {convertData.services.map((service, index) => (
                  <div key={index} className="flex items-end gap-3 p-3 rounded-lg bg-secondary/30">
                    <div className="flex-1">
                      <label className="block text-xs font-medium mb-1">Service Name *</label>
                      <input
                        type="text"
                        value={service.name}
                        onChange={(e) => updateService(index, 'name', e.target.value)}
                        placeholder="e.g., Premium Plan"
                        className="elstar-input"
                        data-testid={`service-name-${index}`}
                      />
                    </div>
                    <div className="w-32">
                      <label className="block text-xs font-medium mb-1">Amount ($) *</label>
                      <input
                        type="number"
                        value={service.amount}
                        onChange={(e) => updateService(index, 'amount', e.target.value)}
                        placeholder="0.00"
                        className="elstar-input"
                        data-testid={`service-amount-${index}`}
                      />
                    </div>
                    <div className="w-28">
                      <label className="block text-xs font-medium mb-1">Status</label>
                      <select
                        value={service.status}
                        onChange={(e) => updateService(index, 'status', e.target.value)}
                        className="elstar-select"
                      >
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                    {convertData.services.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeService(index)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {/* Total Value */}
              <div className="mt-3 p-3 rounded-lg bg-green-500/10 flex items-center justify-between">
                <span className="font-medium">Total Value:</span>
                <span className="text-xl font-bold text-green-500">
                  ${convertData.services.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">Conversion Notes</label>
              <textarea
                value={convertData.notes}
                onChange={(e) => setConvertData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any notes about this conversion..."
                className="elstar-input min-h-[80px]"
              />
            </div>
          </div>
          <div className="elstar-modal-footer">
            <button type="button" onClick={() => setIsConvertOpen(false)} className="elstar-btn-ghost">Cancel</button>
            <button type="submit" disabled={formLoading} className="elstar-btn-primary flex items-center gap-2" data-testid="convert-lead-btn">
              {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <UserCheck className="w-4 h-4" />
              Convert to Client
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
