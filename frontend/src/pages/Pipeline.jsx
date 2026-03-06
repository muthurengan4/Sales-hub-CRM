import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { Plus, Loader2, DollarSign, Calendar, MoreHorizontal, Trash2, Edit, Sparkles, Building2, X } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const STAGES = [
  { id: 'lead', label: 'Lead', color: 'bg-slate-500' },
  { id: 'qualified', label: 'Qualified', color: 'bg-blue-500' },
  { id: 'demo', label: 'Demo', color: 'bg-purple-500' },
  { id: 'proposal', label: 'Proposal', color: 'bg-amber-500' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-orange-500' },
  { id: 'closed_won', label: 'Closed Won', color: 'bg-emerald-500' },
  { id: 'closed_lost', label: 'Closed Lost', color: 'bg-red-500' }
];

const getHealthClass = (score) => {
  if (score >= 80) return 'score-high';
  if (score >= 60) return 'score-medium';
  return 'score-low';
};

export default function Pipeline() {
  const { token } = useAuth();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [draggedDeal, setDraggedDeal] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [formData, setFormData] = useState({
    title: '', value: '', company: '', contact_name: '', stage: 'lead', expected_close_date: '', notes: ''
  });

  useEffect(() => { fetchDeals(); }, []);

  const fetchDeals = async () => {
    try {
      const response = await fetch(`${API}/api/deals`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) setDeals(await response.json());
    } catch (error) { toast.error('Failed to fetch deals'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.value) { toast.error('Title and value are required'); return; }
    setFormLoading(true);
    try {
      const response = await fetch(`${API}/api/deals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, value: parseFloat(formData.value) })
      });
      if (response.ok) { toast.success('Deal created'); setIsCreateOpen(false); resetForm(); fetchDeals(); }
    } catch (error) { toast.error('Failed to create deal'); }
    finally { setFormLoading(false); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!selectedDeal) return;
    setFormLoading(true);
    try {
      const response = await fetch(`${API}/api/deals/${selectedDeal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, value: parseFloat(formData.value) })
      });
      if (response.ok) { toast.success('Deal updated'); setIsEditOpen(false); setSelectedDeal(null); resetForm(); fetchDeals(); }
    } catch (error) { toast.error('Failed to update deal'); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (dealId) => {
    if (!window.confirm('Delete this deal?')) return;
    try { await fetch(`${API}/api/deals/${dealId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); toast.success('Deal deleted'); fetchDeals(); }
    catch (error) { toast.error('Failed to delete deal'); }
  };

  const handleDragStart = (e, deal) => { setDraggedDeal(deal); };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = async (e, newStage) => {
    e.preventDefault();
    if (!draggedDeal || draggedDeal.stage === newStage) { setDraggedDeal(null); return; }
    setDeals(prev => prev.map(d => d.id === draggedDeal.id ? {...d, stage: newStage} : d));
    try {
      await fetch(`${API}/api/deals/${draggedDeal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stage: newStage })
      });
      toast.success(`Moved to ${newStage.replace('_', ' ')}`);
      fetchDeals();
    } catch (error) { fetchDeals(); toast.error('Failed to update'); }
    setDraggedDeal(null);
  };

  const openEditDialog = (deal) => {
    setSelectedDeal(deal);
    setFormData({ ...deal, value: deal.value?.toString() || '' });
    setIsEditOpen(true);
    setDropdownOpen(null);
  };

  const resetForm = () => {
    setFormData({ title: '', value: '', company: '', contact_name: '', stage: 'lead', expected_close_date: '', notes: '' });
  };

  const getDealsByStage = (stageId) => deals.filter(d => d.stage === stageId);
  const getStageValue = (stageId) => getDealsByStage(stageId).reduce((sum, d) => sum + (d.value || 0), 0);
  const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

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

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6" data-testid="pipeline-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-muted-foreground mt-1">Drag and drop deals to update stages</p>
        </div>
        <button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="elstar-btn-primary flex items-center gap-2" data-testid="add-deal-btn">
          <Plus className="w-4 h-4" /> Add Deal
        </button>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
          {STAGES.map((stage) => (
            <div
              key={stage.id}
              className="elstar-kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
              data-testid={`pipeline-column-${stage.id}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                  <span className="font-medium text-sm">{stage.label}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                    {getDealsByStage(stage.id).length}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-mono mb-4">{formatCurrency(getStageValue(stage.id))}</p>

              {/* Cards */}
              <div className="space-y-3 min-h-[300px]">
                {getDealsByStage(stage.id).map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal)}
                    className={`elstar-kanban-card ${draggedDeal?.id === deal.id ? 'opacity-50' : ''}`}
                    data-testid={`deal-card-${deal.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm line-clamp-2 pr-2">{deal.title}</h4>
                      <div className="relative flex-shrink-0">
                        <button onClick={() => setDropdownOpen(dropdownOpen === deal.id ? null : deal.id)} className="p-1 hover:bg-secondary rounded">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {dropdownOpen === deal.id && (
                          <>
                            <div className="fixed inset-0" onClick={() => setDropdownOpen(null)} />
                            <div className="elstar-dropdown animate-fade-in" style={{ right: 0 }}>
                              <button onClick={() => openEditDialog(deal)} className="elstar-dropdown-item w-full text-left flex items-center gap-2">
                                <Edit className="w-4 h-4" /> Edit
                              </button>
                              <button onClick={() => { handleDelete(deal.id); setDropdownOpen(null); }} className="elstar-dropdown-item w-full text-left flex items-center gap-2 text-red-500">
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    {deal.company && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                        <Building2 className="w-3 h-3" /> {deal.company}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-sm font-semibold text-emerald-500">
                        <DollarSign className="w-4 h-4" /> {formatCurrency(deal.value)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Sparkles className={`w-4 h-4 ${getHealthClass(deal.ai_health_score)}`} />
                        <span className={`text-xs font-mono font-bold ${getHealthClass(deal.ai_health_score)}`}>{deal.ai_health_score}</span>
                      </div>
                    </div>
                    {deal.expected_close_date && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <Calendar className="w-3 h-3" /> {new Date(deal.expected_close_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
                {getDealsByStage(stage.id).length === 0 && (
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <p className="text-xs text-muted-foreground">No deals</p>
                    <p className="text-xs text-muted-foreground">Drag here</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create New Deal">
        <form onSubmit={handleCreate}>
          <div className="elstar-modal-body space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Deal Title *</label>
              <input className="elstar-input" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Enterprise License" data-testid="deal-title-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Value ($) *</label>
                <input className="elstar-input" type="number" value={formData.value} onChange={(e) => setFormData({...formData, value: e.target.value})} placeholder="50000" data-testid="deal-value-input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Expected Close</label>
                <input className="elstar-input" type="date" value={formData.expected_close_date} onChange={(e) => setFormData({...formData, expected_close_date: e.target.value})} data-testid="deal-close-date-input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Company</label>
                <input className="elstar-input" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} placeholder="Acme Corp" data-testid="deal-company-input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Contact</label>
                <input className="elstar-input" value={formData.contact_name} onChange={(e) => setFormData({...formData, contact_name: e.target.value})} placeholder="John Doe" data-testid="deal-contact-input" />
              </div>
            </div>
          </div>
          <div className="elstar-modal-footer">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="elstar-btn-ghost">Cancel</button>
            <button type="submit" disabled={formLoading} className="elstar-btn-primary flex items-center gap-2" data-testid="submit-deal-btn">
              {formLoading && <Loader2 className="w-4 h-4 animate-spin" />} Create Deal
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Deal">
        <form onSubmit={handleEdit}>
          <div className="elstar-modal-body space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Deal Title *</label>
              <input className="elstar-input" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} data-testid="edit-deal-title-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Value ($) *</label>
                <input className="elstar-input" type="number" value={formData.value} onChange={(e) => setFormData({...formData, value: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Expected Close</label>
                <input className="elstar-input" type="date" value={formData.expected_close_date} onChange={(e) => setFormData({...formData, expected_close_date: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Company</label>
                <input className="elstar-input" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Contact</label>
                <input className="elstar-input" value={formData.contact_name} onChange={(e) => setFormData({...formData, contact_name: e.target.value})} />
              </div>
            </div>
          </div>
          <div className="elstar-modal-footer">
            <button type="button" onClick={() => setIsEditOpen(false)} className="elstar-btn-ghost">Cancel</button>
            <button type="submit" disabled={formLoading} className="elstar-btn-primary flex items-center gap-2" data-testid="update-deal-btn">
              {formLoading && <Loader2 className="w-4 h-4 animate-spin" />} Update Deal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
