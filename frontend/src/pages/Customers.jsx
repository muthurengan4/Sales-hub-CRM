import React, { useState, useEffect, useCallback, memo } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import SlideInPanel from '../components/SlideInPanel';
import Pagination from '../components/Pagination';
import ActionDropdown from '../components/ActionDropdown';
import { Plus, Search, Loader2, Trash2, Edit, User, Upload, FileSpreadsheet, X, Pencil, ExternalLink } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

// Avatar colors array for variety
const avatarColors = [
  { bg: 'bg-amber-500', border: 'border-amber-400' },
  { bg: 'bg-emerald-500', border: 'border-emerald-400' },
  { bg: 'bg-purple-500', border: 'border-purple-400' },
  { bg: 'bg-blue-500', border: 'border-blue-400' },
  { bg: 'bg-pink-500', border: 'border-pink-400' },
  { bg: 'bg-cyan-500', border: 'border-cyan-400' },
  { bg: 'bg-orange-500', border: 'border-orange-400' },
];

// Role badge colors
const roleColors = {
  'Owner': 'bg-red-600 text-white',
  'PIC': 'bg-blue-600 text-white',
  'Doctor': 'bg-green-600 text-white',
  'Manager': 'bg-purple-600 text-white',
  'Staff': 'bg-gray-600 text-white',
};

const getAvatarColor = (index) => avatarColors[index % avatarColors.length];

const getRoleBadge = (role) => {
  if (!role) return { label: 'PIC', class: roleColors['PIC'] };
  const normalizedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  return { 
    label: normalizedRole, 
    class: roleColors[normalizedRole] || roleColors['PIC'] 
  };
};

const initialFormData = {
  first_name: '', last_name: '', email: '', phone: '', company: '',
  job_title: '', linkedin: '', address: '', city: '', state: '', postcode: '', country: '', notes: '', tags: [], is_public: false, industry: '', role: 'PIC'
};

// Form Fields Component
const FormFields = memo(({ data, onChange }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">Company Name *</label>
        <input className="elstar-input" value={data.company || ''} onChange={(e) => onChange('company', e.target.value)} placeholder="Company Name" data-testid="customer-company" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Industry</label>
        <input className="elstar-input" value={data.industry || ''} onChange={(e) => onChange('industry', e.target.value)} placeholder="Healthcare" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">PIC / Doctor Name *</label>
        <input className="elstar-input" value={data.first_name || ''} onChange={(e) => onChange('first_name', e.target.value)} placeholder="Dr. Wong" data-testid="customer-first-name" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Role</label>
        <select className="elstar-select" value={data.role || 'PIC'} onChange={(e) => onChange('role', e.target.value)}>
          <option value="Owner">Owner</option>
          <option value="PIC">PIC</option>
          <option value="Doctor">Doctor</option>
          <option value="Manager">Manager</option>
          <option value="Staff">Staff</option>
        </select>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">Email</label>
        <input className="elstar-input" type="email" value={data.email || ''} onChange={(e) => onChange('email', e.target.value)} data-testid="customer-email" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Mobile</label>
        <input className="elstar-input" value={data.phone || ''} onChange={(e) => onChange('phone', e.target.value)} placeholder="012-345 6789" />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">City</label>
        <input className="elstar-input" value={data.city || ''} onChange={(e) => onChange('city', e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Country</label>
        <input className="elstar-input" value={data.country || ''} onChange={(e) => onChange('country', e.target.value)} placeholder="Malaysia" />
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium mb-2">Notes</label>
      <textarea className="elstar-input min-h-[80px]" value={data.notes || ''} onChange={(e) => onChange('notes', e.target.value)} />
    </div>
  </div>
));

FormFields.displayName = 'FormFields';

export default function Customers() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [deals, setDeals] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { fetchCustomers(); }, [currentPage, pageSize, debouncedSearch]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', pageSize);
      if (debouncedSearch) params.append('search', debouncedSearch);
      
      const response = await fetch(`${API}/api/customers?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.items || []);
        setTotalItems(data.total || 0);
        setTotalPages(data.total_pages || 0);
      }
    } catch (error) { toast.error('Failed to fetch customers'); }
    finally { setLoading(false); }
  };

  const fetchCustomerDeals = async (customerId) => {
    try {
      const response = await fetch(`${API}/api/deals`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        // Filter deals that might be linked to this customer
        setDeals(data.slice(0, 3) || []);
      }
    } catch (error) {
      console.error('Failed to fetch deals');
    }
  };

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.company && !formData.first_name) { toast.error('Company name or PIC name is required'); return; }
    setFormLoading(true);
    try {
      const response = await fetch(`${API}/api/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (response.ok) { toast.success('Customer created'); setIsCreateOpen(false); setFormData(initialFormData); fetchCustomers(); }
      else { const data = await response.json(); toast.error(data.detail || 'Failed'); }
    } catch (error) { toast.error('Failed to create customer'); }
    finally { setFormLoading(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setFormLoading(true);
    try {
      const response = await fetch(`${API}/api/customers/${selectedCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (response.ok) { toast.success('Customer updated'); setIsEditOpen(false); setSelectedCustomer(null); setFormData(initialFormData); fetchCustomers(); }
    } catch (error) { toast.error('Failed to update customer'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm('Delete this customer?')) return;
    try {
      await fetch(`${API}/api/customers/${customerId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      toast.success('Customer deleted'); fetchCustomers();
    } catch (error) { toast.error('Failed to delete customer'); }
  };

  const openPreviewPanel = (customer) => {
    setSelectedCustomer(customer);
    fetchCustomerDeals(customer.id);
    setComments([
      { id: 1, author: 'Alex', date: '09 Mar 2026', text: 'Doctor interested. Requested demo next week.' }
    ]);
    setIsPreviewOpen(true);
  };

  const openEditDialog = (customer, closeDropdown) => {
    setSelectedCustomer(customer);
    setFormData({ ...initialFormData, ...customer });
    setIsEditOpen(true);
    if (closeDropdown) closeDropdown();
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) { toast.error('Please select a file'); return; }
    setImportLoading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', importFile);
    try {
      const response = await fetch(`${API}/api/customers/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataUpload
      });
      if (response.ok) {
        const result = await response.json();
        toast.success(`Successfully imported ${result.imported} customers`);
        setIsImportOpen(false);
        setImportFile(null);
        fetchCustomers();
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to import');
      }
    } catch (error) { toast.error('Failed to import customers'); }
    finally { setImportLoading(false); }
  };

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    const newCommentObj = {
      id: comments.length + 1,
      author: 'You',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      text: newComment
    };
    setComments([...comments, newCommentObj]);
    setNewComment('');
    toast.success('Comment added');
  };

  const formatDate = (date) => {
    return new Date(date || Date.now()).toLocaleDateString('en-GB', { 
      day: '2-digit', month: '2-digit', year: 'numeric' 
    }) + ' ' + new Date(date || Date.now()).toLocaleTimeString('en-GB', { 
      hour: '2-digit', minute: '2-digit', hour12: true 
    }).toUpperCase();
  };

  return (
    <div className="space-y-6" data-testid="customers-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground mt-1">{totalItems} active customers in your database</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsImportOpen(true)} className="elstar-btn-ghost flex items-center gap-2" data-testid="import-customer-btn">
            <Upload className="w-4 h-4" /> Import Excel
          </button>
          <button onClick={() => { setFormData(initialFormData); setIsCreateOpen(true); }} className="elstar-btn-primary flex items-center gap-2" data-testid="add-customer-btn">
            <Plus className="w-4 h-4" /> Add Customer
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary" data-testid="search-customers-input" />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium">No customers found</p>
            <p className="text-sm text-muted-foreground mb-4">Start building your customer database</p>
            <button onClick={() => { setFormData(initialFormData); setIsCreateOpen(true); }} className="elstar-btn-primary"><Plus className="w-4 h-4 mr-2" />Add Customer</button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">COMPANY NAME</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">PIC / DOCTOR</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">ROLE</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">MOBILE</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden xl:table-cell">EMAIL</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer, index) => {
                    const avatarColor = getAvatarColor(index);
                    const roleBadge = getRoleBadge(customer.role || customer.job_title);
                    const companyName = customer.company || `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
                    const industry = customer.industry || 'Healthcare';
                    const country = customer.country || 'Malaysia';
                    
                    return (
                      <tr key={customer.id} className="border-b border-border hover:bg-secondary/20 transition-colors" data-testid={`customer-row-${customer.id}`}>
                        {/* Company Name Column */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {/* Colored Avatar */}
                            <div className={`w-10 h-10 rounded-lg ${avatarColor.bg} border-2 ${avatarColor.border} flex items-center justify-center text-white font-bold text-lg`}>
                              {companyName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openPreviewPanel(customer)}
                                  className="font-medium text-foreground hover:text-primary hover:underline cursor-pointer transition-colors"
                                  data-testid={`company-name-${customer.id}`}
                                >
                                  {companyName}
                                </button>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{industry} - {country}</p>
                            </div>
                          </div>
                        </td>
                        
                        {/* PIC/Doctor Column */}
                        <td className="px-4 py-4 hidden sm:table-cell">
                          <span className="text-sm">{customer.first_name || '-'} {customer.last_name || ''}</span>
                        </td>
                        
                        {/* Role Column */}
                        <td className="px-4 py-4 hidden md:table-cell">
                          <span className={`inline-flex px-2.5 py-1 rounded text-xs font-medium ${roleBadge.class}`}>
                            {roleBadge.label}
                          </span>
                        </td>
                        
                        {/* Mobile Column */}
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <span className="text-sm text-muted-foreground">{customer.phone || '-'}</span>
                        </td>
                        
                        {/* Email Column */}
                        <td className="px-4 py-4 hidden xl:table-cell">
                          <span className="text-sm text-muted-foreground">{customer.email || '-'}</span>
                        </td>
                        
                        {/* Status Column */}
                        <td className="px-4 py-4">
                          <span className="inline-flex px-3 py-1 rounded-lg text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30">
                            Customer
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
          </>
        )}
      </div>

      {/* Preview Slide-In Panel */}
      <SlideInPanel
        isOpen={isPreviewOpen}
        onClose={() => { setIsPreviewOpen(false); setSelectedCustomer(null); }}
        title=""
        width="w-[420px]"
      >
        {selectedCustomer && (
          <div className="flex flex-col h-full -m-6">
            {/* Green Header */}
            <div className="bg-emerald-700 px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xl">
                  {(selectedCustomer.first_name || selectedCustomer.company || 'C').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">{selectedCustomer.first_name} {selectedCustomer.last_name}</h3>
                  <p className="text-emerald-200 text-sm">PIC at {selectedCustomer.company || 'Company'}</p>
                  <a href={`mailto:${selectedCustomer.email}`} className="text-primary text-sm hover:underline">{selectedCustomer.email}</a>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* About This Contact */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="text-muted-foreground">&#9662;</span> ABOUT THIS CONTACT
                </h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <a href={`mailto:${selectedCustomer.email}`} className="text-primary text-sm hover:underline">{selectedCustomer.email || '-'}</a>
                  </div>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Company name</p>
                      <p className="text-sm font-medium">{selectedCustomer.company || '-'}</p>
                    </div>
                    <button className="text-muted-foreground hover:text-primary">
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Lead status</p>
                    <p className="text-sm font-medium">Sales Closed</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Lifecycle stage</p>
                    <p className="text-sm font-medium">Customer</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Industry</p>
                    <p className="text-sm font-medium">{selectedCustomer.industry || 'Healthcare'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last contacted</p>
                    <p className="text-sm font-medium">{formatDate(selectedCustomer.updated_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone number</p>
                    <p className="text-sm font-medium">{selectedCustomer.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Job Title</p>
                    <p className="text-sm font-medium">{selectedCustomer.job_title || selectedCustomer.role || 'PIC'}</p>
                  </div>
                </div>
              </div>

              {/* Deals Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <span className="text-muted-foreground">&#9662;</span> DEALS
                  </h4>
                  <button className="text-primary text-xs hover:underline">+ Add Deal</button>
                </div>
                <div className="space-y-3">
                  {deals.map((deal) => (
                    <div key={deal.id} className="bg-secondary/30 rounded-lg p-3 border border-border">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-sm">{deal.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            RM {deal.value?.toLocaleString()} · Close: {new Date(deal.expected_close_date || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-600/20 text-blue-400">
                          {deal.stage || 'Lead'}
                        </span>
                      </div>
                      <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${deal.probability || 30}%` }}></div>
                      </div>
                    </div>
                  ))}
                  {deals.length === 0 && (
                    <p className="text-sm text-muted-foreground">No deals linked yet</p>
                  )}
                </div>
              </div>

              {/* Comments Section */}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="text-muted-foreground">&#9662;</span> COMMENTS
                </h4>
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border-b border-border pb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-primary text-sm font-medium">{comment.author}</span>
                        <span className="text-xs text-muted-foreground">{comment.date}</span>
                      </div>
                      <p className="text-sm text-foreground">{comment.text}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Add remark..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                    onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handlePostComment}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-1.5 rounded text-sm font-medium"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border px-6 py-4 flex items-center gap-3">
              <button
                onClick={() => {
                  // Navigate to lead detail page if lead_id exists, otherwise stay on customer view
                  if (selectedCustomer.lead_id) {
                    navigate(`/leads/${selectedCustomer.lead_id}`);
                  } else {
                    // For customers without a lead_id, navigate to customers list
                    toast.info('This customer was not converted from a lead');
                    setIsPreviewOpen(false);
                  }
                }}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Open Full Profile
              </button>
              <button
                onClick={() => { setIsPreviewOpen(false); setSelectedCustomer(null); }}
                className="px-6 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </SlideInPanel>

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add New Customer" size="lg">
        <form onSubmit={handleCreate}>
          <div className="elstar-modal-body max-h-96 overflow-y-auto">
            <FormFields data={formData} onChange={handleInputChange} />
          </div>
          <div className="elstar-modal-footer">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="elstar-btn-ghost">Cancel</button>
            <button type="submit" disabled={formLoading} className="elstar-btn-primary flex items-center gap-2" data-testid="submit-customer-btn">
              {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}Create Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Customer" size="lg">
        <form onSubmit={handleEdit}>
          <div className="elstar-modal-body max-h-96 overflow-y-auto">
            <FormFields data={formData} onChange={handleInputChange} />
          </div>
          <div className="elstar-modal-footer">
            <button type="button" onClick={() => setIsEditOpen(false)} className="elstar-btn-ghost">Cancel</button>
            <button type="submit" disabled={formLoading} className="elstar-btn-primary flex items-center gap-2">
              {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}Update Customer
            </button>
          </div>
        </form>
      </Modal>

      {/* Import Modal */}
      <Modal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} title="Import Customers from Excel">
        <form onSubmit={handleImport}>
          <div className="elstar-modal-body space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-primary" />
              <p className="font-medium mb-2">Upload Excel File</p>
              <p className="text-sm text-muted-foreground mb-4">Supported columns: Clinic Name, Address, Postcode, City, State, Customer Number</p>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setImportFile(e.target.files[0])} className="hidden" id="customer-excel-upload" />
              <label htmlFor="customer-excel-upload" className="elstar-btn-primary cursor-pointer inline-flex items-center gap-2">
                <Upload className="w-4 h-4" /> Choose File
              </label>
              {importFile && <p className="mt-4 text-sm text-primary font-medium">{importFile.name}</p>}
            </div>
          </div>
          <div className="elstar-modal-footer">
            <button type="button" onClick={() => { setIsImportOpen(false); setImportFile(null); }} className="elstar-btn-ghost">Cancel</button>
            <button type="submit" disabled={importLoading || !importFile} className="elstar-btn-primary flex items-center gap-2">
              {importLoading && <Loader2 className="w-4 h-4 animate-spin" />} Import Customers
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
