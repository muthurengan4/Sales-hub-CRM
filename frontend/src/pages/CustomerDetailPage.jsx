import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import { 
  ArrowLeft, Mail, Phone, Building2, MapPin, Edit, Loader2, User,
  CheckSquare, PhoneCall, MessageCircle, Calendar, Sparkles, Bot, Check
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const PIPELINE_STAGES = [
  { id: 'lead', label: 'Lead' },
  { id: 'qualified', label: 'Qualified' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'sales_closed', label: 'Sales Closed' },
  { id: 'lost', label: 'Lost' }
];

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState(null);
  const [activities, setActivities] = useState([]);
  const [deals, setDeals] = useState([]);
  const [allDeals, setAllDeals] = useState([]);
  const [aiAgents, setAiAgents] = useState([]);
  
  // Pipeline update form
  const [pipelineStatus, setPipelineStatus] = useState('lead');
  const [selectedDealId, setSelectedDealId] = useState('');
  const [remark, setRemark] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  
  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  
  // AI Call modal
  const [aiCallModal, setAiCallModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [aiCallDealId, setAiCallDealId] = useState('');
  const [aiCallLoading, setAiCallLoading] = useState(false);

  useEffect(() => {
    fetchCustomer();
    fetchDeals();
    fetchAllDeals();
    fetchActivities();
    fetchAiAgents();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      const response = await fetch(`${API}/api/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
        setPipelineStatus(data.pipeline_status || 'lead');
      } else {
        toast.error('Customer not found');
        navigate('/customers');
      }
    } catch (error) {
      toast.error('Failed to fetch customer');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeals = async () => {
    try {
      // Fetch lead-deal linkages for this customer
      const response = await fetch(`${API}/api/lead-deal-linkages?lead_id=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const linkagesData = await response.json();
        const linkedDeals = (linkagesData || []).map(linkage => ({
          id: linkage.deal_id,
          linkage_id: linkage.id,
          title: linkage.deal_title,
          value: linkage.deal_value,
          stage: linkage.pipeline_status,
          expected_close_date: linkage.deal_expected_close_date,
        }));
        setDeals(linkedDeals);
      }
    } catch (error) {
      console.error('Failed to fetch deals');
    }
  };

  const fetchAllDeals = async () => {
    try {
      const response = await fetch(`${API}/api/deals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setAllDeals(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch all deals');
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch(`${API}/api/activities?entity_id=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        setActivities(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch activities');
    }
  };

  const fetchAiAgents = async () => {
    try {
      const response = await fetch(`${API}/api/ai-agents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAiAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Failed to fetch AI agents');
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedDealId) {
      toast.error('Please select a deal to continue');
      return;
    }

    setUpdateLoading(true);
    try {
      // Create or update the lead-deal linkage
      await fetch(`${API}/api/lead-deal-linkages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          lead_id: id,
          deal_id: selectedDealId,
          pipeline_status: pipelineStatus,
          notes: remark
        })
      });

      // Log activity
      await fetch(`${API}/api/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: 'pipeline_change',
          entity_type: 'customer',
          entity_id: id,
          subject: `Status updated to ${PIPELINE_STAGES.find(s => s.id === pipelineStatus)?.label || pipelineStatus}`,
          description: remark || null,
          metadata: { stage: pipelineStatus, deal_id: selectedDealId }
        })
      });

      toast.success('Pipeline status updated');
      setRemark('');
      fetchDeals();
      fetchActivities();
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const response = await fetch(`${API}/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editData)
      });
      if (response.ok) {
        toast.success('Customer updated');
        setIsEditOpen(false);
        fetchCustomer();
      }
    } catch (error) {
      toast.error('Failed to update');
    } finally {
      setEditLoading(false);
    }
  };

  const openEditModal = () => {
    setEditData({
      company: customer.company || '',
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      postcode: customer.postcode || '',
      industry: customer.industry || '',
      source: customer.source || ''
    });
    setIsEditOpen(true);
  };

  const handleStartAiCall = async () => {
    if (!aiCallDealId) {
      toast.error('Please select a deal');
      return;
    }
    setAiCallLoading(true);
    try {
      // Log the AI call activity
      await fetch(`${API}/api/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: 'ai_call',
          entity_type: 'customer',
          entity_id: id,
          subject: `AI call initiated to ${customer.company || customer.first_name}`,
          description: `Agent: ${selectedAgent?.name || 'Default'}`,
          metadata: { deal_id: aiCallDealId, agent_id: selectedAgent?.id }
        })
      });
      toast.success('AI Call initiated (placeholder)');
      setAiCallModal(false);
      fetchActivities();
    } catch (error) {
      toast.error('Failed to initiate call');
    } finally {
      setAiCallLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!customer) return null;

  const companyName = customer.company || `${customer.first_name || ''} ${customer.last_name || ''}`.trim();

  return (
    <div className="space-y-6" data-testid="customer-detail-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/customers')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-xl sm:text-2xl font-bold uppercase">{companyName}</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={openEditModal} className="elstar-btn-ghost flex items-center gap-2">
            <Edit className="w-4 h-4" /> Edit
          </button>
          <button onClick={() => setAiCallModal(true)} className="elstar-btn-ghost text-green-600 flex items-center gap-2">
            <PhoneCall className="w-4 h-4" /> Start AI Calling
          </button>
        </div>
      </div>

      {/* Main Content - 3 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Contact Info */}
        <div className="lg:col-span-3 space-y-4">
          {/* Contact Information */}
          <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-border">
            <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-4">CONTACT INFORMATION</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-red-400 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">PIC Name</p>
                  <p className="font-medium">{customer.first_name || '-'} {customer.last_name || ''}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Company</p>
                  <p className="font-medium">{customer.company || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{customer.email || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{customer.phone || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-border">
            <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-4">ADDRESS</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <p className="text-sm">{customer.address || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Postcode</p>
                  <p className="font-medium">{customer.postcode || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">City</p>
                  <p className="font-medium">{customer.city || '-'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">State</p>
                <p className="font-medium text-sm">{customer.state || '-'}</p>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-border">
            <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-4">ADDITIONAL DETAILS</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Source</p>
                <p className="font-medium">{customer.source || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Industry</p>
                <p className="font-medium">{customer.industry || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">AI Score</p>
                <p className="font-medium text-primary">{customer.ai_score || 70}/100</p>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column - Actions & Timeline */}
        <div className="lg:col-span-5 space-y-4">
          {/* Log Activity */}
          <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-border">
            <h3 className="text-sm font-medium mb-3">Log Activity</h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { icon: CheckSquare, label: 'Task' },
                { icon: PhoneCall, label: 'Call' },
                { icon: MessageCircle, label: 'WhatsApp' },
                { icon: Mail, label: 'Email' },
                { icon: Calendar, label: 'Meeting' }
              ].map(({ icon: Icon, label }) => (
                <button key={label} className="flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg hover:bg-secondary transition-colors">
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>

            {/* Update Pipeline Status */}
            <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-3">UPDATE PIPELINE STATUS</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {PIPELINE_STAGES.map(stage => (
                <button
                  key={stage.id}
                  onClick={() => setPipelineStatus(stage.id)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    pipelineStatus === stage.id
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'border-border hover:bg-secondary'
                  }`}
                >
                  {stage.label}
                </button>
              ))}
            </div>

            {/* Deal Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Associate with Deal <span className="text-red-500">*</span></label>
              <select
                value={selectedDealId}
                onChange={(e) => setSelectedDealId(e.target.value)}
                className="elstar-select w-full"
              >
                <option value="">Select a deal (required)</option>
                {allDeals.map(deal => (
                  <option key={deal.id} value={deal.id}>{deal.title} - RM {(deal.value || 0).toLocaleString()}</option>
                ))}
              </select>
              {!selectedDealId && (
                <p className="text-xs text-red-500 mt-1">Please select a deal to continue</p>
              )}
            </div>

            {/* Remark */}
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Add comment..."
              className="elstar-input w-full min-h-[80px] mb-4"
            />

            <button
              onClick={handleUpdateStatus}
              disabled={updateLoading || !selectedDealId}
              className="w-full sm:w-auto elstar-btn-primary bg-amber-500 hover:bg-amber-600 flex items-center justify-center gap-2"
            >
              {updateLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Update
            </button>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-border">
            <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-4">ACTIVITY TIMELINE</h3>
            {activities.length > 0 ? (
              <div className="space-y-4">
                {activities.slice(0, 10).map((activity, index) => (
                  <div key={activity.id || index} className="flex gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'ai_call' ? 'bg-blue-500' :
                      activity.type === 'pipeline_change' ? 'bg-amber-500' :
                      'bg-gray-400'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {activity.subject}
                        {activity.type === 'ai_call' && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded">AI Call</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.owner_name || 'System'} · {formatDate(activity.created_at)}
                      </p>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No activities yet</p>
            )}
          </div>
        </div>

        {/* Right Column - Summary & Deals */}
        <div className="lg:col-span-4 space-y-4">
          {/* Activity Summary */}
          <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-border">
            <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-4">ACTIVITY SUMMARY</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-secondary/50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{activities.length}</p>
                <p className="text-xs text-muted-foreground">Total Activities</p>
              </div>
              <div className="text-center p-3 bg-secondary/50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{activities.filter(a => a.type === 'ai_call').length}</p>
                <p className="text-xs text-muted-foreground">AI Calls</p>
              </div>
              <div className="text-center p-3 bg-secondary/50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">0</p>
                <p className="text-xs text-muted-foreground">WhatsApp</p>
              </div>
              <div className="text-center p-3 bg-secondary/50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">{customer.ai_score || 70}</p>
                <p className="text-xs text-muted-foreground">AI Score</p>
              </div>
            </div>
          </div>

          {/* Deals */}
          <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wider">DEALS ({deals.length})</h3>
              {deals.length > 0 && (
                <p className="text-sm font-bold text-green-600">
                  Total: RM {deals.reduce((sum, d) => sum + (d.value || 0), 0).toLocaleString()}
                </p>
              )}
            </div>
            {deals.length > 0 ? (
              <div className="space-y-3">
                {deals.map(deal => (
                  <div key={deal.id} className="p-3 bg-gray-50 dark:bg-secondary rounded-lg">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{deal.title}</p>
                        <p className="text-lg font-bold text-primary mt-1">
                          RM {(deal.value || 0).toLocaleString()}
                        </p>
                      </div>
                      <span className="shrink-0 inline-block px-2 py-0.5 text-xs font-medium rounded bg-amber-500/20 text-amber-600">
                        {PIPELINE_STAGES.find(s => s.id === deal.stage)?.label || deal.stage}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No deals yet. Update status to create a deal automatically.
              </p>
            )}
          </div>

          {/* AI Score */}
          <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-border">
            <h3 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-4">AI SCORE</h3>
            <div className="text-center">
              <p className="text-5xl font-bold text-amber-500">{customer.ai_score || 70}</p>
              <p className="text-sm text-muted-foreground mt-2">Lead Health Score</p>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${customer.ai_score || 70}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Customer">
        <form onSubmit={handleEdit}>
          <div className="elstar-modal-body space-y-4 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Company</label>
                <input
                  type="text"
                  value={editData.company}
                  onChange={(e) => setEditData(prev => ({ ...prev, company: e.target.value }))}
                  className="elstar-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input
                  type="text"
                  value={editData.first_name}
                  onChange={(e) => setEditData(prev => ({ ...prev, first_name: e.target.value }))}
                  className="elstar-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="text"
                  value={editData.phone}
                  onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                  className="elstar-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                  className="elstar-input"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  type="text"
                  value={editData.address}
                  onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
                  className="elstar-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  type="text"
                  value={editData.city}
                  onChange={(e) => setEditData(prev => ({ ...prev, city: e.target.value }))}
                  className="elstar-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <input
                  type="text"
                  value={editData.state}
                  onChange={(e) => setEditData(prev => ({ ...prev, state: e.target.value }))}
                  className="elstar-input"
                />
              </div>
            </div>
          </div>
          <div className="elstar-modal-footer">
            <button type="button" onClick={() => setIsEditOpen(false)} className="elstar-btn-ghost">Cancel</button>
            <button type="submit" disabled={editLoading} className="elstar-btn-primary">
              {editLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* AI Call Modal */}
      <Modal 
        isOpen={aiCallModal} 
        onClose={() => setAiCallModal(false)} 
        title="Start AI Calling"
      >
        <div className="elstar-modal-body space-y-4">
          <div className="p-4 bg-secondary/50 rounded-lg">
            <p className="font-medium">{companyName}</p>
            <p className="text-sm text-muted-foreground">{customer.phone}</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">AI Agent</label>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {aiAgents.map((agent, index) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setSelectedAgent(agent)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    selectedAgent?.id === agent.id 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    ['bg-pink-500', 'bg-blue-500', 'bg-purple-500'][index % 3]
                  }`}>
                    {agent.name.charAt(0)}
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-medium">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">AI Voice Agent</p>
                  </div>
                  {selectedAgent?.id === agent.id && <Check className="w-5 h-5 text-primary" />}
                </button>
              ))}
            </div>
            {aiAgents.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No agents configured. Add agents in Settings.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Select Deal <span className="text-red-500">*</span></label>
            <select
              value={aiCallDealId}
              onChange={(e) => setAiCallDealId(e.target.value)}
              className="elstar-select w-full"
            >
              <option value="">Choose a deal...</option>
              {allDeals.map(deal => (
                <option key={deal.id} value={deal.id}>
                  {deal.title} - RM {(deal.value || 0).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="elstar-modal-footer">
          <button onClick={() => setAiCallModal(false)} className="elstar-btn-ghost">Cancel</button>
          <button 
            onClick={handleStartAiCall} 
            disabled={aiCallLoading || !aiCallDealId}
            className="elstar-btn-primary flex items-center gap-2"
          >
            {aiCallLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneCall className="w-4 h-4" />}
            Start Call
          </button>
        </div>
      </Modal>
    </div>
  );
}
