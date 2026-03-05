import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '../components/ui/dialog';
import { ScrollArea, ScrollBar } from '../components/ui/scroll-area';
import { 
  Plus, 
  Loader2,
  DollarSign,
  Calendar,
  MoreHorizontal,
  Trash2,
  Edit,
  Sparkles,
  Building2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

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

const getHealthColor = (score) => {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-amber-500';
  return 'text-red-500';
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
    title: '',
    value: '',
    company: '',
    contact_name: '',
    stage: 'lead',
    expected_close_date: '',
    notes: ''
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
        const data = await response.json();
        setDeals(data);
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          value: parseFloat(formData.value)
        })
      });

      if (response.ok) {
        toast.success('Deal created successfully');
        setIsCreateOpen(false);
        resetForm();
        fetchDeals();
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to create deal');
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          value: parseFloat(formData.value)
        })
      });

      if (response.ok) {
        toast.success('Deal updated successfully');
        setIsEditOpen(false);
        setSelectedDeal(null);
        resetForm();
        fetchDeals();
      } else {
        const data = await response.json();
        toast.error(data.detail || 'Failed to update deal');
      }
    } catch (error) {
      toast.error('Failed to update deal');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (dealId) => {
    if (!window.confirm('Are you sure you want to delete this deal?')) return;

    try {
      const response = await fetch(`${API}/api/deals/${dealId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('Deal deleted');
        fetchDeals();
      }
    } catch (error) {
      toast.error('Failed to delete deal');
    }
  };

  const handleDragStart = (e, deal) => {
    setDraggedDeal(deal);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStage) => {
    e.preventDefault();
    if (!draggedDeal || draggedDeal.stage === newStage) {
      setDraggedDeal(null);
      return;
    }

    // Optimistic update
    setDeals(prev => prev.map(d => 
      d.id === draggedDeal.id ? {...d, stage: newStage} : d
    ));

    try {
      const response = await fetch(`${API}/api/deals/${draggedDeal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ stage: newStage })
      });

      if (response.ok) {
        toast.success(`Deal moved to ${newStage.replace('_', ' ')}`);
        fetchDeals(); // Refresh to get updated health score
      } else {
        // Revert on failure
        fetchDeals();
        toast.error('Failed to update deal');
      }
    } catch (error) {
      fetchDeals();
      toast.error('Failed to update deal');
    }

    setDraggedDeal(null);
  };

  const openEditDialog = (deal) => {
    setSelectedDeal(deal);
    setFormData({
      title: deal.title || '',
      value: deal.value?.toString() || '',
      company: deal.company || '',
      contact_name: deal.contact_name || '',
      stage: deal.stage || 'lead',
      expected_close_date: deal.expected_close_date || '',
      notes: deal.notes || ''
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      value: '',
      company: '',
      contact_name: '',
      stage: 'lead',
      expected_close_date: '',
      notes: ''
    });
  };

  const getDealsByStage = (stageId) => {
    return deals.filter(deal => deal.stage === stageId);
  };

  const getStageValue = (stageId) => {
    return getDealsByStage(stageId).reduce((sum, deal) => sum + (deal.value || 0), 0);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="pipeline-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pipeline</h1>
          <p className="text-muted-foreground">Drag and drop deals to update stages</p>
        </div>
        <Button 
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
          className="ai-gradient hover:opacity-90"
          data-testid="add-deal-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Deal
        </Button>
      </div>

      {/* Kanban Board */}
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 min-w-max">
          {STAGES.map((stage) => (
            <div
              key={stage.id}
              className="w-[300px] flex-shrink-0"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
              data-testid={`pipeline-column-${stage.id}`}
            >
              <Card className="h-full bg-secondary/30 border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                      <CardTitle className="text-sm font-semibold">{stage.label}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {getDealsByStage(stage.id).length}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {formatCurrency(getStageValue(stage.id))}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 min-h-[400px]">
                  {getDealsByStage(stage.id).map((deal) => (
                    <Card
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal)}
                      className={`kanban-card bg-card border-border hover:border-primary/50 hover:shadow-md transition-all duration-200 ${
                        draggedDeal?.id === deal.id ? 'opacity-50' : ''
                      }`}
                      data-testid={`deal-card-${deal.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm line-clamp-2">{deal.title}</h4>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-1">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(deal)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDelete(deal.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        {deal.company && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                            <Building2 className="w-3 h-3" />
                            <span>{deal.company}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-sm font-semibold">
                            <DollarSign className="w-4 h-4 text-emerald-500" />
                            <span>{formatCurrency(deal.value)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Sparkles className={`w-4 h-4 ${getHealthColor(deal.ai_health_score)}`} />
                            <span className={`text-xs font-mono ${getHealthColor(deal.ai_health_score)}`}>
                              {deal.ai_health_score}
                            </span>
                          </div>
                        </div>

                        {deal.expected_close_date && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(deal.expected_close_date).toLocaleDateString()}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {getDealsByStage(stage.id).length === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 text-center border-2 border-dashed border-border/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">No deals</p>
                      <p className="text-xs text-muted-foreground">Drag here to add</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Create Deal Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Deal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Deal Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Enterprise License Deal"
                data-testid="deal-title-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Value ($) *</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({...formData, value: e.target.value})}
                  placeholder="50000"
                  data-testid="deal-value-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="close_date">Expected Close</Label>
                <Input
                  id="close_date"
                  type="date"
                  value={formData.expected_close_date}
                  onChange={(e) => setFormData({...formData, expected_close_date: e.target.value})}
                  data-testid="deal-close-date-input"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  placeholder="Acme Corp"
                  data-testid="deal-company-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Contact Name</Label>
                <Input
                  id="contact"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                  placeholder="John Doe"
                  data-testid="deal-contact-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading} data-testid="submit-deal-btn">
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Deal'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Deal Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Deal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Deal Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                data-testid="edit-deal-title-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-value">Value ($) *</Label>
                <Input
                  id="edit-value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({...formData, value: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-close_date">Expected Close</Label>
                <Input
                  id="edit-close_date"
                  type="date"
                  value={formData.expected_close_date}
                  onChange={(e) => setFormData({...formData, expected_close_date: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-company">Company</Label>
                <Input
                  id="edit-company"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contact">Contact Name</Label>
                <Input
                  id="edit-contact"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={formLoading} data-testid="update-deal-btn">
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Deal'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
