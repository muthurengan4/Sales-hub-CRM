import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { 
  ArrowLeft, Edit, UserCheck, Phone, Mail, MessageCircle, Calendar,
  Building2, MapPin, Globe, Sparkles, Clock, CheckSquare, Send,
  PhoneCall, Video, FileText, Plus, Loader2
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const PIPELINE_STAGES = [
  { id: 'new', label: 'New' },
  { id: 'qualified', label: 'Qualified' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'closed', label: 'Sales Closed' }
];

const ACTIVITY_TABS = ['Activity', 'Notes', 'Emails', 'Calls', 'Tasks', 'WhatsApp', 'Meetings'];

const LOG_ACTIVITY_TYPES = [
  { id: 'task', label: 'Task', icon: CheckSquare, color: 'text-blue-500' },
  { id: 'call', label: 'Call', icon: PhoneCall, color: 'text-green-500' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-green-600' },
  { id: 'email', label: 'Email', icon: Mail, color: 'text-amber-500' },
  { id: 'meeting', label: 'Meeting', icon: Calendar, color: 'text-purple-500' }
];

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Activity');
  const [pipelineStatus, setPipelineStatus] = useState('new');
  const [remark, setRemark] = useState('');
  const [activities, setActivities] = useState([]);
  const [deals, setDeals] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLead();
    fetchActivities();
    fetchDeals();
  }, [id]);

  const fetchLead = async () => {
    try {
      const response = await fetch(`${API}/api/leads/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLead(data);
        setPipelineStatus(data.pipeline_status || data.status || 'new');
      } else {
        toast.error('Lead not found');
        navigate('/leads');
      }
    } catch (error) {
      toast.error('Failed to load lead');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch(`${API}/api/leads/${id}/activities`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Failed to fetch activities');
    }
  };

  const fetchDeals = async () => {
    try {
      const response = await fetch(`${API}/api/deals?lead_id=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDeals(data.items || []);
      }
    } catch (error) {
      console.error('Failed to fetch deals');
    }
  };

  const handleUpdateStatus = async () => {
    setSaving(true);
    try {
      // Update lead status
      const response = await fetch(`${API}/api/leads/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          ...lead,
          pipeline_status: pipelineStatus,
          status: pipelineStatus === 'closed' ? 'qualified' : (pipelineStatus === 'new' ? 'new' : 'contacted')
        })
      });
      
      if (response.ok) {
        // Log activity if remark exists
        if (remark.trim()) {
          await fetch(`${API}/api/leads/${id}/activities`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify({
              type: 'status_update',
              description: `Status updated to ${PIPELINE_STAGES.find(s => s.id === pipelineStatus)?.label}`,
              notes: remark
            })
          });
        }
        
        toast.success('Pipeline status updated');
        setRemark('');
        fetchLead();
        fetchActivities();
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleLogActivity = async (type) => {
    const activityLabel = LOG_ACTIVITY_TYPES.find(t => t.id === type)?.label;
    toast.info(`Opening ${activityLabel} logger...`);
    // This would open a modal for logging the specific activity type
  };

  const handleConvertToCustomer = () => {
    navigate(`/leads?convert=${id}`);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  };

  const groupActivitiesByDate = (activities) => {
    const groups = {};
    const today = new Date().toDateString();
    
    activities.forEach(activity => {
      const actDate = new Date(activity.created_at);
      const dateKey = actDate.toDateString();
      const displayDate = dateKey === today ? 'TODAY' : formatDate(activity.created_at).toUpperCase();
      
      if (!groups[displayDate]) {
        groups[displayDate] = [];
      }
      groups[displayDate].push(activity);
    });
    
    return groups;
  };

  const getActivityIcon = (type) => {
    switch(type) {
      case 'status_update': return { icon: '●', color: 'text-amber-500' };
      case 'email': return { icon: '■', color: 'text-blue-500' };
      case 'call': return { icon: '●', color: 'text-blue-400' };
      case 'ai_call': return { icon: '●', color: 'text-blue-400' };
      case 'whatsapp': return { icon: '●', color: 'text-green-500' };
      case 'import': return { icon: '◐', color: 'text-gray-400' };
      default: return { icon: '●', color: 'text-gray-400' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Lead not found</p>
      </div>
    );
  }

  const groupedActivities = groupActivitiesByDate(activities);

  return (
    <div className="space-y-0" data-testid="lead-detail-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/leads')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div>
            <h1 className="text-xl font-bold uppercase">{lead.company || lead.name}</h1>
            <p className="text-xs text-muted-foreground">Detail View</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(`/leads?edit=${id}`)}
            className="elstar-btn-ghost flex items-center gap-2"
            data-testid="edit-lead-btn"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button 
            onClick={handleConvertToCustomer}
            className="elstar-btn-primary flex items-center gap-2"
            data-testid="convert-customer-btn"
          >
            <UserCheck className="w-4 h-4" />
            Convert to Customer
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar - Contact Info */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          {/* Lead Profile Card */}
          <div className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground mb-3">
              {(lead.pic_name || lead.name)?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <h2 className="font-semibold text-lg">{lead.pic_name || 'Unknown'}</h2>
            <p className="text-sm text-muted-foreground">{lead.title || 'Person in Charge'}</p>
            <span className="inline-block mt-2 px-3 py-1 text-xs font-medium rounded-full bg-amber-500/20 text-amber-500">
              {PIPELINE_STAGES.find(s => s.id === (lead.pipeline_status || lead.status))?.label || 'New'}
            </span>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex justify-center gap-4">
            <button className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-secondary transition-colors" data-testid="call-btn">
              <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <span className="text-xs">Call</span>
            </button>
            <button className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-secondary transition-colors" data-testid="email-btn">
              <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <span className="text-xs">Email</span>
            </button>
            <button 
              onClick={() => navigate(`/whatsapp?leadId=${id}`)}
              className="flex flex-col items-center gap-1 p-3 rounded-lg hover:bg-secondary transition-colors" 
              data-testid="whatsapp-btn"
            >
              <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="text-xs">WA</span>
            </button>
          </div>

          {/* Contact Info Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Contact Info</h3>
            
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Company Name</p>
                <p className="font-medium">{lead.company || lead.name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Mobile</p>
                <p className="font-medium">{lead.phone || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Office</p>
                <p className="font-medium">{lead.office_number || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Fax</p>
                <p className="font-medium">{lead.fax_number || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Email</p>
                <p className="font-medium">{lead.email || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Website</p>
                <p className="font-medium">{lead.website || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Location</p>
                <p className="font-medium">{lead.city ? `${lead.city}${lead.state ? `, ${lead.state}` : ''}` : '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Country</p>
                <p className="font-medium">{lead.country || 'Malaysia'}</p>
              </div>
            </div>

            {/* Pipeline Section */}
            <div className="pt-4 border-t border-border">
              <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-3">Pipeline</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Status</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded bg-amber-500/20 text-amber-500">
                    {PIPELINE_STAGES.find(s => s.id === (lead.pipeline_status || lead.status))?.label || 'New'}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">AI Score</p>
                  <p className="font-bold text-amber-500">* {lead.ai_score || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Last Contact</p>
                  <p className="font-medium">{formatDate(lead.updated_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase">Owner</p>
                  <p className="font-medium">{lead.owner_name || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section - Activity & Pipeline Update */}
        <div className="col-span-12 lg:col-span-6 space-y-6">
          {/* Tabs */}
          <div className="flex gap-6 border-b border-border">
            {ACTIVITY_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium transition-colors ${
                  activeTab === tab 
                    ? 'text-amber-500 border-b-2 border-amber-500' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid={`tab-${tab.toLowerCase()}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Log Activity Section */}
          <div className="elstar-card p-4">
            <p className="text-sm text-muted-foreground mb-3">Log Activity</p>
            <div className="flex gap-2 flex-wrap">
              {LOG_ACTIVITY_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => handleLogActivity(type.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-sm"
                  data-testid={`log-${type.id}-btn`}
                >
                  <type.icon className={`w-4 h-4 ${type.color}`} />
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Update Pipeline Status Section */}
          <div className="elstar-card p-4 space-y-4">
            <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Update Pipeline Status</h3>
            
            <div className="flex gap-2 flex-wrap">
              {PIPELINE_STAGES.map(stage => (
                <button
                  key={stage.id}
                  onClick={() => setPipelineStatus(stage.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    pipelineStatus === stage.id
                      ? 'bg-amber-500 text-black'
                      : 'bg-secondary hover:bg-secondary/80 text-foreground'
                  }`}
                  data-testid={`stage-${stage.id}`}
                >
                  {stage.label}
                </button>
              ))}
            </div>

            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Add remark..."
              className="elstar-input min-h-[80px] w-full"
              data-testid="remark-input"
            />

            <div className="flex justify-end">
              <button
                onClick={handleUpdateStatus}
                disabled={saving}
                className="elstar-btn-primary"
                data-testid="save-update-btn"
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Update
              </button>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="space-y-6">
            {Object.keys(groupedActivities).length > 0 ? (
              Object.entries(groupedActivities).map(([date, dateActivities]) => (
                <div key={date}>
                  <p className="text-xs text-muted-foreground mb-4">{date} — {formatDate(dateActivities[0]?.created_at)}</p>
                  <div className="space-y-4">
                    {dateActivities.map((activity, idx) => {
                      const { icon, color } = getActivityIcon(activity.type);
                      return (
                        <div key={activity.id || idx} className="flex gap-3">
                          <span className={`text-lg ${color}`}>{icon}</span>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-sm">{activity.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  {activity.user_name || 'System'} · {formatDate(activity.created_at)} · {formatTime(activity.created_at)}
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground">{formatTime(activity.created_at)}</span>
                            </div>
                            {activity.notes && (
                              <div className={`mt-2 p-3 rounded-lg text-sm ${
                                activity.type === 'whatsapp' 
                                  ? 'bg-green-900/30 text-green-100' 
                                  : 'bg-secondary'
                              }`}>
                                {activity.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No activities recorded yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Company & Deals */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          {/* Company Section */}
          <div className="elstar-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Company</h3>
              <button className="text-xs text-amber-500 hover:underline">+ Add</button>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">{lead.company || lead.name}</p>
              <p className="text-sm text-muted-foreground">{lead.office_number || '-'}</p>
            </div>
          </div>

          {/* Deals Section */}
          <div className="elstar-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Deals</h3>
              <button 
                onClick={() => navigate('/pipeline')}
                className="text-xs text-amber-500 hover:underline"
              >
                + Add
              </button>
            </div>
            {deals.length > 0 ? (
              <div className="space-y-4">
                {deals.map(deal => (
                  <div key={deal.id} className="space-y-2">
                    <p className="font-semibold text-sm">{deal.title}</p>
                    <p className="text-xs text-muted-foreground">
                      RM {deal.value?.toLocaleString()} · Close: {formatDate(deal.expected_close_date)}
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Stage</p>
                      <p className="text-xs font-medium text-amber-500">{deal.stage}</p>
                      <div className="h-1 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500"
                          style={{ width: `${(PIPELINE_STAGES.findIndex(s => s.id === deal.stage) + 1) * 20}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No deals linked</p>
            )}
          </div>

          {/* AI Score Section */}
          <div className="elstar-card p-4">
            <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-4">AI Score</h3>
            <div className="text-center">
              <p className="text-5xl font-bold text-amber-500">{lead.ai_score || 0}</p>
              <p className="text-xs text-muted-foreground mt-2">Lead Health Score</p>
              <div className="mt-3 h-1 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500"
                  style={{ width: `${lead.ai_score || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
