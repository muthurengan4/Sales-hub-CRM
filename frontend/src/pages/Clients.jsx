import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import ActionDropdown from '../components/ActionDropdown';
import { 
  Search, Loader2, Plus, DollarSign, User, Mail, Phone, Building2,
  Calendar, CheckCircle, AlertCircle, Eye, Package
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const serviceStatusColors = {
  active: 'elstar-badge-success',
  expired: 'elstar-badge-warning',
  cancelled: 'elstar-badge-danger'
};

export default function Clients() {
  const { token, orgSettings } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchClients();
  }, [currentPage, pageSize, debouncedSearch]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', pageSize);
      if (debouncedSearch) params.append('search', debouncedSearch);
      
      const response = await fetch(`${API}/api/clients?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setClients(data.items || []);
        setTotalItems(data.total || 0);
        setTotalPages(data.total_pages || 0);
      }
    } catch (error) {
      toast.error('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  const openClientDetail = async (clientId, closeDropdown) => {
    try {
      const response = await fetch(`${API}/api/clients/${clientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedClient(data);
        setIsDetailOpen(true);
      }
    } catch (error) {
      toast.error('Failed to load client details');
    }
    if (closeDropdown) closeDropdown();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '-';
    return `${orgSettings.currency_symbol}${parseFloat(amount).toLocaleString()}`;
  };

  // Calculate stats
  const totalValue = clients.reduce((sum, c) => sum + (c.total_value || 0), 0);
  const activeServices = clients.reduce((sum, c) => 
    sum + (c.services?.filter(s => s.status === 'active')?.length || 0), 0);

  return (
    <div className="space-y-6" data-testid="clients-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground mt-1">Converted leads with purchased services</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="elstar-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Clients</p>
              <p className="text-2xl font-bold">{totalItems}</p>
            </div>
          </div>
        </div>
        <div className="elstar-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
            </div>
          </div>
        </div>
        <div className="elstar-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Services</p>
              <p className="text-2xl font-bold">{activeServices}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="elstar-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="elstar-input pl-10"
            data-testid="search-clients-input"
          />
        </div>
      </div>

      {/* Clients List */}
      <div className="elstar-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium">No clients yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Convert leads after successful sales to see them here
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="elstar-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th className="hidden md:table-cell">Company</th>
                    <th className="hidden sm:table-cell">Services</th>
                    <th>Total Value</th>
                    <th className="hidden lg:table-cell">Converted</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} data-testid={`client-row-${client.id}`}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="elstar-avatar w-9 h-9 text-sm">
                            {client.customer_name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{client.customer_name}</p>
                            {client.customer_email && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3" />{client.customer_email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell">
                        {client.company ? (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building2 className="w-4 h-4" />
                            <span>{client.company}</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="hidden sm:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {client.services?.slice(0, 2).map((service, idx) => (
                            <span key={idx} className={`elstar-badge text-xs ${serviceStatusColors[service.status] || 'elstar-badge-info'}`}>
                              {service.name}
                            </span>
                          ))}
                          {client.services?.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{client.services.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="font-bold text-green-500">
                          {formatCurrency(client.total_value)}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {formatDate(client.created_at)}
                        </div>
                      </td>
                      <td>
                        <ActionDropdown testId={`client-actions-${client.id}`}>
                          {(closeDropdown) => (
                            <button 
                              onClick={() => openClientDetail(client.id, closeDropdown)}
                              className="elstar-dropdown-item w-full text-left flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4" /> View Details
                            </button>
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
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
          </>
        )}
      </div>

      {/* Client Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Client Details" size="lg">
        {selectedClient && (
          <div className="space-y-6">
            {/* Client Info */}
            <div className="flex items-start gap-4">
              <div className="elstar-avatar w-16 h-16 text-2xl">
                {selectedClient.client?.customer_name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-bold">{selectedClient.client?.customer_name}</h3>
                <p className="text-muted-foreground">{selectedClient.client?.company}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  {selectedClient.client?.customer_email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" /> {selectedClient.client?.customer_email}
                    </span>
                  )}
                  {selectedClient.client?.customer_phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" /> {selectedClient.client?.customer_phone}
                    </span>
                  )}
                </div>
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-green-500">
                  {formatCurrency(selectedClient.client?.total_value)}
                </p>
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-medium mb-3">Purchased Services</h4>
              <div className="space-y-2">
                {selectedClient.client?.services?.map((service, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <div>
                      <p className="font-medium">{service.name}</p>
                      {service.description && (
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(service.amount)}</p>
                      <span className={`elstar-badge text-xs ${serviceStatusColors[service.status]}`}>
                        {service.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversion Info */}
            <div className="p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Converted by {selectedClient.client?.converted_by_name} on {formatDate(selectedClient.client?.created_at)}</span>
              </div>
            </div>

            {/* Notes */}
            {selectedClient.client?.notes && (
              <div>
                <h4 className="font-medium mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground">{selectedClient.client.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
