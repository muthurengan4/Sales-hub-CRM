import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import Pagination from '../components/Pagination';
import ActionDropdown from '../components/ActionDropdown';
import { 
  Plus, Search, Loader2, Calendar, Clock, User, DollarSign,
  Trash2, Edit, CheckCircle, AlertCircle, 
  Filter, RefreshCw, CalendarPlus
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const paymentStatusConfig = {
  paid: { label: 'Paid', class: 'elstar-badge-success' },
  partially_paid: { label: 'Partially Paid', class: 'elstar-badge-warning' },
  unpaid: { label: 'Unpaid', class: 'elstar-badge-danger' }
};

const taskStatusConfig = {
  pending: { label: 'Pending', class: 'elstar-badge-info' },
  in_progress: { label: 'In Progress', class: 'elstar-badge-warning' },
  completed: { label: 'Completed', class: 'elstar-badge-success' }
};

const priorityConfig = {
  low: { label: 'Low', class: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
  medium: { label: 'Medium', class: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  high: { label: 'High', class: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' }
};

const initialFormData = {
  title: '',
  description: '',
  lead_id: '',
  client_id: '',
  deal_id: '',
  assigned_to: '',
  due_date: '',
  payment_status: 'unpaid',
  payment_amount: '',
  paid_amount: '',
  priority: 'medium',
  status: 'pending'
};

export default function Tasks() {
  const { token, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [showFilters, setShowFilters] = useState(false);
  
  // Data for dropdowns
  const [leads, setLeads] = useState([]);
  const [clients, setClients] = useState([]);
  const [deals, setDeals] = useState([]);
  const [users, setUsers] = useState([]);
  const [orgSettings, setOrgSettings] = useState({ currency_symbol: '$' });
  const [search, setSearch] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    payment_status: '',
    assigned_to: '',
    deal_id: ''
  });

  useEffect(() => {
    fetchTasks();
    fetchDropdownData();
    fetchOrgSettings();
  }, [currentPage, pageSize, filters]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', pageSize);
      if (filters.status) params.append('status', filters.status);
      if (filters.payment_status) params.append('payment_status', filters.payment_status);
      if (filters.assigned_to) params.append('assigned_to', filters.assigned_to);
      if (filters.deal_id) params.append('deal_id', filters.deal_id);
      if (search) params.append('search', search);
      
      const response = await fetch(`${API}/api/tasks?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data.items || []);
        setTotalItems(data.total || 0);
        setTotalPages(data.total_pages || 0);
      }
    } catch (error) {
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      // Fetch leads
      const leadsRes = await fetch(`${API}/api/leads?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setLeads(data.items || []);
      }
      
      // Fetch clients
      const clientsRes = await fetch(`${API}/api/clients?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (clientsRes.ok) {
        const data = await clientsRes.json();
        setClients(data.items || []);
      }
      
      // Fetch deals
      const dealsRes = await fetch(`${API}/api/deals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (dealsRes.ok) {
        const data = await dealsRes.json();
        setDeals(data || []);
      }
      
      // Fetch users
      const usersRes = await fetch(`${API}/api/users?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch dropdown data:', error);
    }
  };

  const fetchOrgSettings = async () => {
    try {
      const response = await fetch(`${API}/api/organization-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setOrgSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch org settings:', error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error('Title is required');
      return;
    }
    
    setFormLoading(true);
    try {
      const response = await fetch(`${API}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          payment_amount: formData.payment_amount ? parseFloat(formData.payment_amount) : null,
          paid_amount: formData.paid_amount ? parseFloat(formData.paid_amount) : 0
        })
      });
      
      if (response.ok) {
        toast.success('Task created successfully');
        setIsCreateOpen(false);
        setFormData(initialFormData);
        fetchTasks();
      } else {
        toast.error('Failed to create task');
      }
    } catch (error) {
      toast.error('Failed to create task');
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    
    setFormLoading(true);
    try {
      const response = await fetch(`${API}/api/tasks/${selectedTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          payment_amount: formData.payment_amount ? parseFloat(formData.payment_amount) : null,
          paid_amount: formData.paid_amount ? parseFloat(formData.paid_amount) : 0
        })
      });
      
      if (response.ok) {
        toast.success('Task updated successfully');
        setIsEditOpen(false);
        setSelectedTask(null);
        fetchTasks();
      } else {
        toast.error('Failed to update task');
      }
    } catch (error) {
      toast.error('Failed to update task');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const response = await fetch(`${API}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Task deleted');
        fetchTasks();
      } else {
        toast.error('Failed to delete task');
      }
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const syncToCalendar = async (taskId, closeDropdown) => {
    try {
      const response = await fetch(`${API}/api/google-calendar/sync-task/${taskId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        toast.success('Task synced to Google Calendar');
        fetchTasks();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to sync task');
      }
    } catch (error) {
      toast.error('Failed to sync to calendar');
    }
    if (closeDropdown) closeDropdown();
  };

  const openEditDialog = (task, closeDropdown) => {
    setSelectedTask(task);
    setFormData({
      title: task.title || '',
      description: task.description || '',
      lead_id: task.lead_id || '',
      client_id: task.client_id || '',
      assigned_to: task.assigned_to || '',
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      payment_status: task.payment_status || 'unpaid',
      payment_amount: task.payment_amount || '',
      paid_amount: task.paid_amount || '',
      priority: task.priority || 'medium',
      status: task.status || 'pending'
    });
    setIsEditOpen(true);
    if (closeDropdown) closeDropdown();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return `${orgSettings.currency_symbol}${parseFloat(amount).toLocaleString()}`;
  };

  // Stats
  const totalPayable = tasks.reduce((sum, t) => sum + (t.payment_amount || 0), 0);
  const totalPaid = tasks.reduce((sum, t) => sum + (t.paid_amount || 0), 0);
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-6" data-testid="tasks-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-muted-foreground mt-1">Your daily work list - all follow-ups and visits</p>
        </div>
        <button 
          onClick={() => { setFormData(initialFormData); setIsCreateOpen(true); }} 
          className="elstar-btn-primary"
          data-testid="create-task-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          + Add Task
        </button>
      </div>

      {/* Filters Row - PDF style */}
      <div className="elstar-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="elstar-input pl-10"
              data-testid="search-tasks-input"
            />
          </div>
          <select
            value={filters.deal_id}
            onChange={(e) => { setFilters(prev => ({ ...prev, deal_id: e.target.value })); setCurrentPage(1); }}
            className="elstar-select w-40"
            data-testid="deals-filter"
          >
            <option value="">All Deals</option>
            {deals.map(deal => (
              <option key={deal.id} value={deal.id}>{deal.title}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => { setFilters(prev => ({ ...prev, status: e.target.value })); setCurrentPage(1); }}
            className="elstar-select w-40"
            data-testid="status-filter"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={filters.assigned_to}
            onChange={(e) => { setFilters(prev => ({ ...prev, assigned_to: e.target.value })); setCurrentPage(1); }}
            className="elstar-select w-44"
            data-testid="salesperson-filter"
          >
            <option value="">All Sales Person</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <select
            value={filters.payment_status}
            onChange={(e) => { setFilters(prev => ({ ...prev, payment_status: e.target.value })); setCurrentPage(1); }}
            className="elstar-select w-40"
            data-testid="payment-filter"
          >
            <option value="">All Payment</option>
            <option value="paid">Paid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="elstar-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
              <p className="text-2xl font-bold">{totalItems}</p>
            </div>
          </div>
        </div>
        <div className="elstar-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(160, 196, 255, 0.15)' }}>
              <Clock className="w-5 h-5 text-accent-blue" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{pendingTasks}</p>
            </div>
          </div>
        </div>
        <div className="elstar-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Payable</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPayable)}</p>
            </div>
          </div>
        </div>
        <div className="elstar-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(160, 196, 255, 0.15)' }}>
              <DollarSign className="w-5 h-5 text-accent-blue" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-2xl font-bold text-accent-blue">{formatCurrency(totalPaid)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="elstar-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium">No tasks yet</p>
            <p className="text-sm text-muted-foreground mt-2">Create your first task to get started</p>
            <button 
              onClick={() => { setFormData(initialFormData); setIsCreateOpen(true); }}
              className="elstar-btn-primary mt-4"
            >
              <Plus className="w-4 h-4 mr-2" /> New Task
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="elstar-table">
                <thead>
                  <tr>
                    <th className="w-14">NO.</th>
                    <th>COMPANY NAME</th>
                    <th className="hidden md:table-cell">DEAL</th>
                    <th>STATUS</th>
                    <th className="hidden sm:table-cell">PIC NAME</th>
                    <th className="hidden lg:table-cell">SALES PERSON</th>
                    <th className="hidden xl:table-cell">REG TIME</th>
                    <th>PAYMENT</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, index) => (
                    <tr key={task.id} data-testid={`task-row-${task.id}`}>
                      <td className="text-center font-medium text-muted-foreground">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td>
                        <p className="font-medium">{task.company_name || task.lead_name || task.client_name || task.title}</p>
                        {task.title !== task.company_name && task.title !== task.lead_name && (
                          <p className="text-xs text-muted-foreground">{task.title}</p>
                        )}
                      </td>
                      <td className="hidden md:table-cell">
                        {task.deal_name ? (
                          <span className="text-sm">{task.deal_name}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td>
                        <span className={`elstar-badge ${taskStatusConfig[task.status]?.class}`}>
                          {taskStatusConfig[task.status]?.label}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell">
                        <span className="text-sm">{task.pic_name || task.lead_name || '-'}</span>
                      </td>
                      <td className="hidden lg:table-cell">
                        {task.assigned_to_name || <span className="text-muted-foreground">Unassigned</span>}
                      </td>
                      <td className="hidden xl:table-cell">
                        <div className="text-xs text-muted-foreground">
                          {formatDate(task.reg_time || task.created_at)}
                        </div>
                      </td>
                      <td>
                        <span className={`elstar-badge ${paymentStatusConfig[task.payment_status]?.class}`}>
                          {paymentStatusConfig[task.payment_status]?.label}
                        </span>
                      </td>
                      <td>
                        <ActionDropdown testId={`task-actions-${task.id}`}>
                          {(closeDropdown) => (
                            <>
                              <button onClick={() => openEditDialog(task, closeDropdown)} className="elstar-dropdown-item w-full text-left flex items-center gap-2">
                                <Edit className="w-4 h-4" /> Edit
                              </button>
                              <button onClick={() => syncToCalendar(task.id, closeDropdown)} className="elstar-dropdown-item w-full text-left flex items-center gap-2">
                                <CalendarPlus className="w-4 h-4" /> Sync to Calendar
                              </button>
                              <button onClick={() => { handleDelete(task.id); closeDropdown(); }} className="elstar-dropdown-item w-full text-left flex items-center gap-2 text-red-500">
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
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            />
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal 
        isOpen={isCreateOpen || isEditOpen} 
        onClose={() => { setIsCreateOpen(false); setIsEditOpen(false); setSelectedTask(null); }} 
        title={isEditOpen ? 'Edit Task' : 'Create Task'}
        size="lg"
      >
        <form onSubmit={isEditOpen ? handleUpdate : handleCreate}>
          <div className="elstar-modal-body space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="elstar-label">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="elstar-input"
                placeholder="Task title"
                data-testid="task-title-input"
              />
            </div>
            
            <div>
              <label className="elstar-label">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="elstar-input min-h-[80px]"
                placeholder="Task description"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="elstar-label">Company Name *</label>
                <select
                  value={formData.lead_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, lead_id: e.target.value }))}
                  className="elstar-select"
                  data-testid="task-company-select"
                >
                  <option value="">Select company...</option>
                  {leads.map(lead => (
                    <option key={lead.id} value={lead.id}>{lead.company || lead.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="elstar-label">Deal *</label>
                <select
                  value={formData.deal_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, deal_id: e.target.value }))}
                  className="elstar-select"
                  data-testid="task-deal-select"
                >
                  <option value="">Select deal...</option>
                  {deals.map(deal => (
                    <option key={deal.id} value={deal.id}>{deal.title}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="elstar-label">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="elstar-select"
                  data-testid="task-status-select"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="elstar-label">Sales Person *</label>
                <select
                  value={formData.assigned_to}
                  onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
                  className="elstar-select"
                  data-testid="task-assigned-select"
                >
                  <option value="">Select sales person...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="elstar-label">Payment Status *</label>
              <select
                value={formData.payment_status}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_status: e.target.value }))}
                className="elstar-select"
                data-testid="task-payment-select"
              >
                <option value="unpaid">Unpaid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="elstar-label">Assigned To</label>
                <select
                  value={formData.assigned_to}
                  onChange={(e) => setFormData(prev => ({ ...prev, assigned_to: e.target.value }))}
                  className="elstar-select"
                >
                  <option value="">Select assignee</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="elstar-label">Due Date</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  className="elstar-input"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="elstar-label">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="elstar-select"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              {isEditOpen && (
                <div>
                  <label className="elstar-label">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="elstar-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className="border-t border-border pt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Payment Details
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="elstar-label">Total Amount ({orgSettings.currency_symbol})</label>
                  <input
                    type="number"
                    value={formData.payment_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_amount: e.target.value }))}
                    className="elstar-input"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="elstar-label">Paid Amount ({orgSettings.currency_symbol})</label>
                  <input
                    type="number"
                    value={formData.paid_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, paid_amount: e.target.value }))}
                    className="elstar-input"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="elstar-label">Payment Status</label>
                  <select
                    value={formData.payment_status}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_status: e.target.value }))}
                    className="elstar-select"
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="elstar-modal-footer">
            <button type="button" onClick={() => { setIsCreateOpen(false); setIsEditOpen(false); }} className="elstar-btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={formLoading} className="elstar-btn-primary">
              {formLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditOpen ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
