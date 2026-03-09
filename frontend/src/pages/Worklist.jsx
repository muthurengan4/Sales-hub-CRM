import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../App';
import { toast } from 'sonner';
import Pagination from '../components/Pagination';
import { 
  Search, Loader2, Filter, Phone, Mail, User, Clock, 
  ChevronRight, RefreshCw, PhoneCall, Calendar, X
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const lifecycleColors = {
  lead: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  ai_contacted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  interested: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  opportunity: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  customer: 'bg-primary/10 text-primary',
  repeat_customer: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
};

const statusColors = {
  new: 'elstar-badge-info',
  contacted: 'elstar-badge-warning',
  qualified: 'elstar-badge-success',
  lost: 'elstar-badge-danger'
};

export default function Worklist() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    lifecycle_stage: '',
    assigned_to: '',
    date_from: '',
    date_to: ''
  });

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchWorklist();
  }, [currentPage, pageSize, filters]);

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch(`${API}/api/filter-options`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setFilterOptions(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
    }
  };

  const fetchWorklist = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', pageSize);
      
      if (filters.status) params.append('status', filters.status);
      if (filters.lifecycle_stage) params.append('lifecycle_stage', filters.lifecycle_stage);
      if (filters.assigned_to) params.append('assigned_to', filters.assigned_to);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      
      const response = await fetch(`${API}/api/worklist?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
        setTotalItems(data.total || 0);
        setTotalPages(data.total_pages || 0);
      }
    } catch (error) {
      toast.error('Failed to fetch worklist');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      lifecycle_stage: '',
      assigned_to: '',
      date_from: '',
      date_to: ''
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(v => v);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6" data-testid="worklist-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Worklist Dashboard</h1>
          <p className="text-muted-foreground">Active leads requiring attention</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`elstar-btn-ghost ${hasActiveFilters ? 'text-primary' : ''}`}
            data-testid="toggle-filters-btn"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 w-5 h-5 rounded-full ai-gradient text-white text-xs flex items-center justify-center">
                {Object.values(filters).filter(v => v).length}
              </span>
            )}
          </button>
          <button onClick={fetchWorklist} className="elstar-btn-ghost" data-testid="refresh-btn">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="elstar-card p-4 animate-fade-in" data-testid="filters-panel">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Advanced Filters</h3>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-sm text-primary hover:underline">
                Clear all
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="elstar-label">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="elstar-select"
                data-testid="filter-status"
              >
                <option value="">All Statuses</option>
                {filterOptions.statuses?.map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="elstar-label">Lifecycle Stage</label>
              <select
                value={filters.lifecycle_stage}
                onChange={(e) => handleFilterChange('lifecycle_stage', e.target.value)}
                className="elstar-select"
                data-testid="filter-lifecycle"
              >
                <option value="">All Stages</option>
                {filterOptions.lifecycle_stages?.map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="elstar-label">Assigned To</label>
              <select
                value={filters.assigned_to}
                onChange={(e) => handleFilterChange('assigned_to', e.target.value)}
                className="elstar-select"
                data-testid="filter-assigned"
              >
                <option value="">All Agents</option>
                {filterOptions.users?.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="elstar-label">Date From</label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="elstar-input"
                data-testid="filter-date-from"
              />
            </div>
            <div>
              <label className="elstar-label">Date To</label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="elstar-input"
                data-testid="filter-date-to"
              />
            </div>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="elstar-card p-4">
          <p className="text-sm text-muted-foreground">Total Active</p>
          <p className="text-2xl font-bold">{totalItems}</p>
        </div>
        <div className="elstar-card p-4">
          <p className="text-sm text-muted-foreground">New Today</p>
          <p className="text-2xl font-bold text-blue-500">
            {items.filter(i => new Date(i.registration_time).toDateString() === new Date().toDateString()).length}
          </p>
        </div>
        <div className="elstar-card p-4">
          <p className="text-sm text-muted-foreground">Needs Follow-up</p>
          <p className="text-2xl font-bold text-amber-500">
            {items.filter(i => i.status === 'contacted').length}
          </p>
        </div>
        <div className="elstar-card p-4">
          <p className="text-sm text-muted-foreground">Qualified</p>
          <p className="text-2xl font-bold text-green-500">
            {items.filter(i => i.status === 'qualified').length}
          </p>
        </div>
      </div>

      {/* Worklist Table */}
      <div className="elstar-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium">No items in worklist</p>
            <p className="text-sm text-muted-foreground">Add leads to see them here</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="elstar-table">
                <thead>
                  <tr>
                    <th className="w-20">#</th>
                    <th>Customer</th>
                    <th className="hidden md:table-cell">Contact</th>
                    <th className="hidden lg:table-cell">Assigned</th>
                    <th>Status</th>
                    <th className="hidden sm:table-cell">Lifecycle</th>
                    <th className="hidden lg:table-cell">Registered</th>
                    <th className="w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} data-testid={`worklist-row-${item.id}`}>
                      <td className="font-mono text-xs text-muted-foreground">{item.id}</td>
                      <td>
                        <p className="font-medium">{item.customer_name}</p>
                      </td>
                      <td className="hidden md:table-cell">
                        <div className="space-y-1">
                          {item.customer_email && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="w-3 h-3" />{item.customer_email}
                            </div>
                          )}
                          {item.customer_phone && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="w-3 h-3" />{item.customer_phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="hidden lg:table-cell">
                        {item.assigned_agent_name || <span className="text-muted-foreground">Unassigned</span>}
                      </td>
                      <td>
                        <span className={`elstar-badge ${statusColors[item.status] || 'elstar-badge-info'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell">
                        <span className={`text-xs px-2 py-1 rounded-full ${lifecycleColors[item.lifecycle_stage] || lifecycleColors.lead}`}>
                          {item.lifecycle_stage?.replace('_', ' ') || 'Lead'}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDate(item.registration_time)}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button 
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            title="AI Call (Placeholder)"
                            data-testid={`ai-call-btn-${item.id}`}
                          >
                            <PhoneCall className="w-4 h-4 text-primary" />
                          </button>
                          <a 
                            href={`/leads?profile=${item.entity_id}`}
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            title="View Profile"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </a>
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
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
          </>
        )}
      </div>
    </div>
  );
}
