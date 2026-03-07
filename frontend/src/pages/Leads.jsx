import React, { useState, useEffect, useCallback, memo } from 'react';
import { useAuth } from '../App';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { 
  Plus, Search, Loader2, Sparkles, Mail, Phone, Building2, 
  MoreHorizontal, Trash2, Edit, RefreshCw, Upload, FileSpreadsheet
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
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
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
    setDropdownOpen(null);
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
    </div>
  );
}
