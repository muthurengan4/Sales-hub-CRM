import React, { useState, useEffect, useCallback, memo } from 'react';
import { useAuth } from '../App';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import ActionDropdown from '../components/ActionDropdown';
import { Plus, Loader2, DollarSign, Calendar, Trash2, Edit, Sparkles, Building2, Search, Eye } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

// Call-based pipeline stages
const STAGES = [
  { id: 'new', label: 'New', color: 'bg-slate-500' },
  { id: 'contacted', label: 'Contacted', color: 'bg-blue-500' },
  { id: 'no_answer', label: 'No Answer', color: 'bg-amber-400' },
  { id: 'interested', label: 'Interested', color: 'bg-emerald-400' },
  { id: 'follow_up', label: 'Follow Up', color: 'bg-purple-500' },
  { id: 'booked', label: 'Booked', color: 'bg-amber-500' },
  { id: 'won', label: 'Won', color: 'bg-emerald-500' },
  { id: 'lost', label: 'Lost', color: 'bg-red-500' }
];

const getHealthClass = (score) => {
  if (score >= 80) return 'score-high';
  if (score >= 60) return 'score-medium';
  return 'score-low';
};

const initialFormData = {
  title: '', value: '', company: '', contact_name: '', stage: 'new', expected_close_date: '', notes: '', linked_company_ids: []
};

// Deal Form Fields - MOVED OUTSIDE to prevent re-renders
const DealFormFields = memo(({ data, onChange, isEdit = false, companies = [], companySearch, setCompanySearch }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium mb-2">Deal Title *</label>
      <input 
        className="elstar-input" 
        value={data.title || ''} 
        onChange={(e) => onChange('title', e.target.value)} 
        placeholder="GLOCO Cloud EMR" 
        data-testid="deal-title-input"
      />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">Deal Value (RM) *</label>
        <input 
          className="elstar-input" 
          type="number" 
          value={data.value || ''} 
          onChange={(e) => onChange('value', e.target.value)} 
          placeholder="8800"
          data-testid="deal-value-input"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Expected Close Date *</label>
        <input 
          className="elstar-input" 
          type="date" 
          value={data.expected_close_date || ''} 
          onChange={(e) => onChange('expected_close_date', e.target.value)}
          data-testid="deal-close-date-input"
        />
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium mb-2">Pipeline Stage</label>
      <select 
        className="elstar-select" 
        value={data.stage || 'new'} 
        onChange={(e) => onChange('stage', e.target.value)}
      >
        {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
      </select>
    </div>
    
    {/* Link Companies Section */}
    <div>
      <label className="block text-sm font-medium mb-2">Link Companies</label>
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={companySearch || ''}
          onChange={(e) => setCompanySearch(e.target.value)}
          className="elstar-input pl-10"
          placeholder="Search companies..."
        />
      </div>
      <div className="max-h-40 overflow-y-auto border border-border rounded-lg">
        {companies.filter(c => 
          !companySearch || 
          c.name?.toLowerCase().includes(companySearch.toLowerCase()) ||
          c.pic_name?.toLowerCase().includes(companySearch.toLowerCase())
        ).map(company => (
          <label key={company.id} className="flex items-center gap-3 p-2 hover:bg-secondary cursor-pointer border-b border-border last:border-0">
            <input
              type="checkbox"
              checked={(data.linked_company_ids || []).includes(company.id)}
              onChange={(e) => {
                const newIds = e.target.checked 
                  ? [...(data.linked_company_ids || []), company.id]
                  : (data.linked_company_ids || []).filter(id => id !== company.id);
                onChange('linked_company_ids', newIds);
              }}
              className="w-4 h-4 rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{company.name}</p>
              <p className="text-xs text-muted-foreground truncate">{company.pic_name}</p>
            </div>
          </label>
        ))}
        {companies.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground text-center">No companies available</p>
        )}
      </div>
      {(data.linked_company_ids || []).length > 0 && (
        <p className="text-xs text-primary mt-2">{data.linked_company_ids.length} company(ies) selected</p>
      )}
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">Notes</label>
      <textarea 
        className="elstar-input min-h-[80px]" 
        value={data.notes || ''} 
        onChange={(e) => onChange('notes', e.target.value)} 
        placeholder="Additional notes..."
      />
    </div>
  </div>
));

DealFormFields.displayName = 'DealFormFields';

export default function Pipeline() {
  const { token } = useAuth();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDealDetailOpen, setIsDealDetailOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [draggedDeal, setDraggedDeal] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [companies, setCompanies] = useState([]);
  const [companySearch, setCompanySearch] = useState('');

  useEffect(() => { fetchDeals(); fetchCompanies(); }, []);

  const fetchDeals = async () => {
    try {
      const response = await fetch(`${API}/api/deals`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) setDeals(await response.json());
    } catch (error) { toast.error('Failed to fetch deals'); }
    finally { setLoading(false); }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch(`${API}/api/lookup/companies`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.companies || []);
      }
    } catch (error) { console.error('Failed to fetch companies:', error); }
  };

  // Stable callback to prevent re-renders
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

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
      if (response.ok) { toast.success('Deal created'); setIsCreateOpen(false); setFormData(initialFormData); fetchDeals(); }
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
      if (response.ok) { toast.success('Deal updated'); setIsEditOpen(false); setSelectedDeal(null); setFormData(initialFormData); fetchDeals(); }
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
    setFormData({ ...deal, value: deal.value?.toString() || '', linked_company_ids: deal.linked_company_ids || [] });
    setIsEditOpen(true);
  };

  const openDealDetail = async (deal) => {
    try {
      const response = await fetch(`${API}/api/deals/${deal.id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const fullDeal = await response.json();
        setSelectedDeal(fullDeal);
        setIsDealDetailOpen(true);
      }
    } catch (error) {
      toast.error('Failed to load deal details');
    }
  };

  const getDealsByStage = (stageId) => deals.filter(d => d.stage === stageId);
  const getStageValue = (stageId) => getDealsByStage(stageId).reduce((sum, d) => sum + (d.value || 0), 0);
  const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6" data-testid="pipeline-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-muted-foreground mt-1">Drag and drop deals to update stages</p>
        </div>
        <button onClick={() => { setFormData(initialFormData); setIsCreateOpen(true); }} className="elstar-btn-primary flex items-center gap-2" data-testid="add-deal-btn">
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
                      <ActionDropdown testId={`deal-actions-${deal.id}`}>
                        {(closeDropdown) => (
                          <>
                            <button onClick={() => { openDealDetail(deal); closeDropdown(); }} className="elstar-dropdown-item w-full text-left flex items-center gap-2">
                              <Eye className="w-4 h-4" /> View Details
                            </button>
                            <button onClick={() => { openEditDialog(deal); closeDropdown(); }} className="elstar-dropdown-item w-full text-left flex items-center gap-2">
                              <Edit className="w-4 h-4" /> Edit
                            </button>
                            <button onClick={() => { handleDelete(deal.id); closeDropdown(); }} className="elstar-dropdown-item w-full text-left flex items-center gap-2 text-red-500">
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </>
                        )}
                      </ActionDropdown>
                    </div>
                    
                    {/* Linked Companies */}
                    {deal.linked_companies && deal.linked_companies.length > 0 && (
                      <div className="mb-2 text-xs">
                        <span className="text-primary font-medium">{deal.linked_companies[0]?.name}</span>
                        {deal.linked_companies_count > 1 && (
                          <span className="text-muted-foreground ml-1">+{deal.linked_companies_count - 1} more</span>
                        )}
                      </div>
                    )}
                    
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span className="font-mono font-medium text-foreground">{formatCurrency(deal.value)}</span>
                      </div>
                      {deal.company && !deal.linked_companies?.length && <div className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /><span>{deal.company}</span></div>}
                      {deal.expected_close_date && <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /><span>{deal.expected_close_date}</span></div>}
                    </div>
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Health Score</span>
                      <div className="flex items-center gap-1">
                        <Sparkles className={`w-3.5 h-3.5 ${getHealthClass(deal.ai_health_score)}`} />
                        <span className={`font-mono text-xs font-bold ${getHealthClass(deal.ai_health_score)}`}>{deal.ai_health_score}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {getDealsByStage(stage.id).length === 0 && (
                  <div className="flex items-center justify-center h-24 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground">
                    Drop deals here
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
          <div className="elstar-modal-body">
            <DealFormFields data={formData} onChange={handleInputChange} companies={companies} companySearch={companySearch} setCompanySearch={setCompanySearch} />
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
          <div className="elstar-modal-body">
            <DealFormFields data={formData} onChange={handleInputChange} isEdit companies={companies} companySearch={companySearch} setCompanySearch={setCompanySearch} />
          </div>
          <div className="elstar-modal-footer">
            <button type="button" onClick={() => setIsEditOpen(false)} className="elstar-btn-ghost">Cancel</button>
            <button type="submit" disabled={formLoading} className="elstar-btn-primary flex items-center gap-2">
              {formLoading && <Loader2 className="w-4 h-4 animate-spin" />} Update Deal
            </button>
          </div>
        </form>
      </Modal>

      {/* Deal Detail Modal */}
      <Modal isOpen={isDealDetailOpen} onClose={() => setIsDealDetailOpen(false)} title="Deal Details">
        {selectedDeal && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">{selectedDeal.title}</h3>
                <p className="text-2xl font-bold text-primary mt-2">{formatCurrency(selectedDeal.value)}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${STAGES.find(s => s.id === selectedDeal.stage)?.color} text-white`}>
                {STAGES.find(s => s.id === selectedDeal.stage)?.label}
              </span>
            </div>
            
            {selectedDeal.linked_companies && selectedDeal.linked_companies.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Linked Companies ({selectedDeal.linked_companies.length})</h4>
                <div className="space-y-2">
                  {selectedDeal.linked_companies.map((company, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium">{company.name}</p>
                        <p className="text-sm text-muted-foreground">{company.pic_name} - {company.location}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">{company.mobile}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Expected Close</p>
                <p className="font-medium">{selectedDeal.expected_close_date || 'Not set'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Health Score</p>
                <p className={`font-bold ${getHealthClass(selectedDeal.ai_health_score)}`}>{selectedDeal.ai_health_score}</p>
              </div>
            </div>
            
            {selectedDeal.notes && (
              <div>
                <p className="text-muted-foreground text-sm">Notes</p>
                <p className="mt-1">{selectedDeal.notes}</p>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <button onClick={() => setIsDealDetailOpen(false)} className="elstar-btn-ghost">Close</button>
              <button onClick={() => { setIsDealDetailOpen(false); openEditDialog(selectedDeal); }} className="elstar-btn-primary">
                <Edit className="w-4 h-4 mr-2" /> Edit Deal
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
