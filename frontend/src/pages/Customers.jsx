import React, { useState, useEffect, useCallback, memo } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import { Plus, Search, Loader2, Mail, Phone, Building2, MoreHorizontal, Trash2, Edit, MapPin, User, Upload, FileSpreadsheet, X, Eye } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const initialFormData = {
  first_name: '', last_name: '', email: '', phone: '', company: '',
  job_title: '', linkedin: '', address: '', city: '', state: '', postcode: '', country: '', notes: '', tags: [], is_public: false
};

// Form Fields Component - MOVED OUTSIDE to prevent re-renders
const FormFields = memo(({ data, onChange }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">First Name / Clinic Name *</label>
        <input 
          className="elstar-input" 
          value={data.first_name || ''} 
          onChange={(e) => onChange('first_name', e.target.value)} 
          placeholder="Clinic Name" 
          data-testid="customer-first-name" 
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Last Name</label>
        <input 
          className="elstar-input" 
          value={data.last_name || ''} 
          onChange={(e) => onChange('last_name', e.target.value)} 
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">Email</label>
        <input 
          className="elstar-input" 
          type="email" 
          value={data.email || ''} 
          onChange={(e) => onChange('email', e.target.value)} 
          data-testid="customer-email" 
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Phone / Customer Number</label>
        <input 
          className="elstar-input" 
          value={data.phone || ''} 
          onChange={(e) => onChange('phone', e.target.value)} 
          placeholder="+60 123 456 789" 
        />
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">Company</label>
        <input 
          className="elstar-input" 
          value={data.company || ''} 
          onChange={(e) => onChange('company', e.target.value)} 
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Job Title</label>
        <input 
          className="elstar-input" 
          value={data.job_title || ''} 
          onChange={(e) => onChange('job_title', e.target.value)} 
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
      />
    </div>
    <div className="grid grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">City</label>
        <input 
          className="elstar-input" 
          value={data.city || ''} 
          onChange={(e) => onChange('city', e.target.value)} 
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Postcode</label>
        <input 
          className="elstar-input" 
          value={data.postcode || ''} 
          onChange={(e) => onChange('postcode', e.target.value)} 
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">State</label>
        <input 
          className="elstar-input" 
          value={data.state || ''} 
          onChange={(e) => onChange('state', e.target.value)} 
        />
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium mb-2">Country</label>
      <input 
        className="elstar-input" 
        value={data.country || ''} 
        onChange={(e) => onChange('country', e.target.value)} 
        placeholder="Malaysia" 
      />
    </div>
    <div className="flex items-center gap-2">
      <input 
        type="checkbox" 
        id="customer_is_public" 
        checked={data.is_public || false} 
        onChange={(e) => onChange('is_public', e.target.checked)}
        className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
      />
      <label htmlFor="customer_is_public" className="text-sm">Is Public</label>
    </div>
    <div>
      <label className="block text-sm font-medium mb-2">Notes</label>
      <textarea 
        className="elstar-input min-h-[80px]" 
        value={data.notes || ''} 
        onChange={(e) => onChange('notes', e.target.value)} 
      />
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
  const [selectedCustomer, setSelectedCustomer] = useState(null);
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

  useEffect(() => { fetchCustomers(); }, [currentPage, pageSize, debouncedSearch]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', pageSize);
      if (debouncedSearch) params.append('search', debouncedSearch);
      
      const url = `${API}/api/customers?${params.toString()}`;
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.items || []);
        setTotalItems(data.total || 0);
        setTotalPages(data.total_pages || 0);
      }
    } catch (error) { toast.error('Failed to fetch customers'); }
    finally { setLoading(false); }
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
    if (!formData.first_name) { toast.error('First name is required'); return; }
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

  const openEditDialog = (customer) => {
    setSelectedCustomer(customer);
    setFormData({ ...initialFormData, ...customer });
    setIsEditOpen(true);
    setDropdownOpen(null);
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
        setCurrentPage(1);
        fetchCustomers();
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to import customers');
      }
    } catch (error) {
      toast.error('Failed to import customers');
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="customers-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your customer database</p>
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

      <div className="elstar-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="elstar-input pl-10" data-testid="search-customers-input" />
        </div>
      </div>

      <div className="elstar-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium">No customers found</p>
            <p className="text-sm text-muted-foreground mb-4">Start building your customer database</p>
            <div className="flex gap-2">
              <button onClick={() => setIsImportOpen(true)} className="elstar-btn-ghost"><Upload className="w-4 h-4 mr-2" />Import Excel</button>
              <button onClick={() => { setFormData(initialFormData); setIsCreateOpen(true); }} className="elstar-btn-primary"><Plus className="w-4 h-4 mr-2" />Add Customer</button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {customers.map((customer) => (
                <div key={customer.id} className="elstar-card p-4" data-testid={`customer-card-${customer.id}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="elstar-avatar w-10 h-10">{customer.first_name?.charAt(0)?.toUpperCase()}</div>
                      <div>
                        <p className="font-medium">{customer.first_name} {customer.last_name}</p>
                        <p className="text-xs text-muted-foreground">{customer.job_title}</p>
                      </div>
                    </div>
                    <div className="relative">
                      <button onClick={() => setDropdownOpen(dropdownOpen === customer.id ? null : customer.id)} className="p-1 hover:bg-secondary rounded">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {dropdownOpen === customer.id && (
                        <>
                          <div className="fixed inset-0" onClick={() => setDropdownOpen(null)} />
                          <div className="elstar-dropdown animate-fade-in">
                            <button onClick={() => { navigate(`/profile/customer/${customer.id}`); setDropdownOpen(null); }} className="elstar-dropdown-item w-full text-left flex items-center gap-2"><Eye className="w-4 h-4" /> View Profile</button>
                            <button onClick={() => openEditDialog(customer)} className="elstar-dropdown-item w-full text-left flex items-center gap-2"><Edit className="w-4 h-4" /> Edit</button>
                            <button onClick={() => { handleDelete(customer.id); setDropdownOpen(null); }} className="elstar-dropdown-item w-full text-left flex items-center gap-2 text-red-500"><Trash2 className="w-4 h-4" /> Delete</button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {customer.company && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Building2 className="w-4 h-4" />{customer.company}</div>}
                    {customer.email && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="w-4 h-4" /><span className="truncate">{customer.email}</span></div>}
                    {customer.phone && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="w-4 h-4" />{customer.phone}</div>}
                    {(customer.city || customer.state) && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {customer.city}{customer.city && customer.state && ', '}{customer.state}
                      </div>
                    )}
                  </div>
                </div>
              ))}
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
              <p className="text-sm text-muted-foreground mb-4">
                Supported columns: Clinic Name, Address, Postcode, City, State, Customer Number, Is public
              </p>
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
