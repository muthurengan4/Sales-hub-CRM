import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const STAGES = [
  { id: 'lead', label: 'Lead', color: '#64748b' },
  { id: 'qualified', label: 'Qualified', color: '#3b82f6' },
  { id: 'demo', label: 'Demo', color: '#8b5cf6' },
  { id: 'proposal', label: 'Proposal', color: '#f59e0b' },
  { id: 'negotiation', label: 'Negotiation', color: '#f97316' },
  { id: 'closed_won', label: 'Closed Won', color: '#10b981' },
  { id: 'closed_lost', label: 'Closed Lost', color: '#ef4444' }
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
  const [formData, setFormData] = useState({
    title: '', value: '', company: '', contact_name: '', stage: 'lead', expected_close_date: '', notes: ''
  });

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const response = await fetch(`${API}/api/deals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setDeals(await response.json());
      }
    } catch (error) {
      toast.error('Failed to fetch deals');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.value) {
      toast.error('Title and value are required');
      return;
    }
    setFormLoading(true);
    try {
      const response = await fetch(`${API}/api/deals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, value: parseFloat(formData.value) })
      });
      if (response.ok) {
        toast.success('Deal created successfully');
        setIsCreateOpen(false);
        resetForm();
        fetchDeals();
      }
    } catch (error) {
      toast.error('Failed to create deal');
    } finally {
      setFormLoading(false);
    }
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
      if (response.ok) {
        toast.success('Deal updated');
        setIsEditOpen(false);
        setSelectedDeal(null);
        resetForm();
        fetchDeals();
      }
    } catch (error) {
      toast.error('Failed to update deal');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (dealId) => {
    if (!window.confirm('Delete this deal?')) return;
    try {
      await fetch(`${API}/api/deals/${dealId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Deal deleted');
      fetchDeals();
    } catch (error) {
      toast.error('Failed to delete deal');
    }
  };

  const handleDragStart = (e, deal) => {
    setDraggedDeal(deal);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, newStage) => {
    e.preventDefault();
    if (!draggedDeal || draggedDeal.stage === newStage) {
      setDraggedDeal(null);
      return;
    }
    setDeals(prev => prev.map(d => d.id === draggedDeal.id ? {...d, stage: newStage} : d));
    try {
      await fetch(`${API}/api/deals/${draggedDeal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stage: newStage })
      });
      toast.success(`Deal moved to ${newStage.replace('_', ' ')}`);
      fetchDeals();
    } catch (error) {
      fetchDeals();
      toast.error('Failed to update deal');
    }
    setDraggedDeal(null);
  };

  const openEditDialog = (deal) => {
    setSelectedDeal(deal);
    setFormData({ ...deal, value: deal.value?.toString() || '' });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({ title: '', value: '', company: '', contact_name: '', stage: 'lead', expected_close_date: '', notes: '' });
  };

  const getDealsByStage = (stageId) => deals.filter(d => d.stage === stageId);
  const getStageValue = (stageId) => getDealsByStage(stageId).reduce((sum, d) => sum + (d.value || 0), 0);

  const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

  if (loading) {
    return <div className="has-text-centered p-6"><span className="loader"></span></div>;
  }

  return (
    <div data-testid="pipeline-page">
      {/* Header */}
      <div className="is-flex is-justify-content-space-between is-align-items-center mb-5 is-flex-wrap-wrap" style={{ gap: '1rem' }}>
        <div>
          <h1 className="title is-3 mb-1">Pipeline</h1>
          <p className="subtitle is-6 has-text-grey">Drag and drop deals to update stages</p>
        </div>
        <button 
          className="button is-link"
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
          data-testid="add-deal-btn"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', border: 'none' }}
        >
          + Add Deal
        </button>
      </div>

      {/* Kanban Board */}
      <div style={{ overflowX: 'auto', paddingBottom: '1rem' }}>
        <div className="is-flex" style={{ gap: '1rem', minWidth: 'max-content' }}>
          {STAGES.map((stage) => (
            <div
              key={stage.id}
              className="kanban-column"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
              data-testid={`pipeline-column-${stage.id}`}
            >
              <div className="is-flex is-justify-content-space-between is-align-items-center mb-3">
                <div className="is-flex is-align-items-center">
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: stage.color, marginRight: '8px' }}></span>
                  <span className="has-text-weight-semibold is-size-7">{stage.label}</span>
                  <span className="tag is-light ml-2 is-small">{getDealsByStage(stage.id).length}</span>
                </div>
              </div>
              <p className="is-size-7 has-text-grey mb-3" style={{ fontFamily: 'JetBrains Mono' }}>
                {formatCurrency(getStageValue(stage.id))}
              </p>
              
              <div style={{ minHeight: '300px' }}>
                {getDealsByStage(stage.id).map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal)}
                    className="box kanban-card mb-3"
                    style={{ opacity: draggedDeal?.id === deal.id ? 0.5 : 1 }}
                    data-testid={`deal-card-${deal.id}`}
                  >
                    <div className="is-flex is-justify-content-space-between mb-2">
                      <p className="has-text-weight-medium is-size-7" style={{ lineHeight: 1.3 }}>{deal.title}</p>
                      <div className="dropdown is-hoverable is-right">
                        <div className="dropdown-trigger">
                          <button className="button is-small is-ghost" style={{ height: '20px', padding: '0 4px' }}>⋯</button>
                        </div>
                        <div className="dropdown-menu" style={{ minWidth: '100px' }}>
                          <div className="dropdown-content">
                            <a className="dropdown-item is-size-7" onClick={() => openEditDialog(deal)}>Edit</a>
                            <a className="dropdown-item is-size-7 has-text-danger" onClick={() => handleDelete(deal.id)}>Delete</a>
                          </div>
                        </div>
                      </div>
                    </div>
                    {deal.company && (
                      <p className="is-size-7 has-text-grey mb-2">🏢 {deal.company}</p>
                    )}
                    <div className="is-flex is-justify-content-space-between is-align-items-center">
                      <span className="has-text-weight-semibold is-size-7 has-text-success">
                        💰 {formatCurrency(deal.value)}
                      </span>
                      <span className={`is-size-7 has-text-weight-bold ${getHealthClass(deal.ai_health_score)}`}>
                        ✦ {deal.ai_health_score}
                      </span>
                    </div>
                    {deal.expected_close_date && (
                      <p className="is-size-7 has-text-grey mt-2">📅 {new Date(deal.expected_close_date).toLocaleDateString()}</p>
                    )}
                  </div>
                ))}
                
                {getDealsByStage(stage.id).length === 0 && (
                  <div className="has-text-centered p-4" style={{ border: '2px dashed var(--bulma-border)', borderRadius: '8px' }}>
                    <p className="is-size-7 has-text-grey">No deals</p>
                    <p className="is-size-7 has-text-grey">Drag here to add</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Modal */}
      <div className={`modal ${isCreateOpen ? 'is-active' : ''}`}>
        <div className="modal-background" onClick={() => setIsCreateOpen(false)}></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">Create New Deal</p>
            <button className="delete" onClick={() => setIsCreateOpen(false)}></button>
          </header>
          <form onSubmit={handleCreate}>
            <section className="modal-card-body">
              <div className="field">
                <label className="label is-small">Deal Title *</label>
                <input className="input" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Enterprise License Deal" data-testid="deal-title-input" />
              </div>
              <div className="columns">
                <div className="column">
                  <div className="field">
                    <label className="label is-small">Value ($) *</label>
                    <input className="input" type="number" value={formData.value} onChange={(e) => setFormData({...formData, value: e.target.value})} placeholder="50000" data-testid="deal-value-input" />
                  </div>
                </div>
                <div className="column">
                  <div className="field">
                    <label className="label is-small">Expected Close</label>
                    <input className="input" type="date" value={formData.expected_close_date} onChange={(e) => setFormData({...formData, expected_close_date: e.target.value})} data-testid="deal-close-date-input" />
                  </div>
                </div>
              </div>
              <div className="columns">
                <div className="column">
                  <div className="field">
                    <label className="label is-small">Company</label>
                    <input className="input" value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} placeholder="Acme Corp" data-testid="deal-company-input" />
                  </div>
                </div>
                <div className="column">
                  <div className="field">
                    <label className="label is-small">Contact Name</label>
                    <input className="input" value={formData.contact_name} onChange={(e) => setFormData({...formData, contact_name: e.target.value})} placeholder="John Doe" data-testid="deal-contact-input" />
                  </div>
                </div>
              </div>
            </section>
            <footer className="modal-card-foot">
              <button type="button" className="button" onClick={() => setIsCreateOpen(false)}>Cancel</button>
              <button type="submit" className={`button is-link ${formLoading ? 'is-loading' : ''}`} data-testid="submit-deal-btn">Create Deal</button>
            </footer>
          </form>
        </div>
      </div>

      {/* Edit Modal */}
      <div className={`modal ${isEditOpen ? 'is-active' : ''}`}>
        <div className="modal-background" onClick={() => setIsEditOpen(false)}></div>
        <div className="modal-card">
          <header className="modal-card-head">
            <p className="modal-card-title">Edit Deal</p>
            <button className="delete" onClick={() => setIsEditOpen(false)}></button>
          </header>
          <form onSubmit={handleEdit}>
            <section className="modal-card-body">
              <div className="field">
                <label className="label is-small">Deal Title *</label>
                <input className="input" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} data-testid="edit-deal-title-input" />
              </div>
              <div className="columns">
                <div className="column">
                  <div className="field">
                    <label className="label is-small">Value ($) *</label>
                    <input className="input" type="number" value={formData.value} onChange={(e) => setFormData({...formData, value: e.target.value})} />
                  </div>
                </div>
                <div className="column">
                  <div className="field">
                    <label className="label is-small">Expected Close</label>
                    <input className="input" type="date" value={formData.expected_close_date} onChange={(e) => setFormData({...formData, expected_close_date: e.target.value})} />
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
                    <label className="label is-small">Contact Name</label>
                    <input className="input" value={formData.contact_name} onChange={(e) => setFormData({...formData, contact_name: e.target.value})} />
                  </div>
                </div>
              </div>
            </section>
            <footer className="modal-card-foot">
              <button type="button" className="button" onClick={() => setIsEditOpen(false)}>Cancel</button>
              <button type="submit" className={`button is-link ${formLoading ? 'is-loading' : ''}`} data-testid="update-deal-btn">Update Deal</button>
            </footer>
          </form>
        </div>
      </div>
    </div>
  );
}
