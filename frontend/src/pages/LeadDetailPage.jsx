import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import SlideInPanel from '../components/SlideInPanel';
import { 
  ArrowLeft, Edit, UserCheck, Phone, Mail, MessageCircle, Calendar,
  Building2, MapPin, Globe, Sparkles, Clock, CheckSquare, Send,
  PhoneCall, Video, FileText, Plus, Loader2, X, User, Activity
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const PIPELINE_STAGES = [
  { id: 'new', label: 'New' },
  { id: 'qualified', label: 'Qualified' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'closed', label: 'Sales Closed' }
];

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
  const { token, user } = useAuth();
  const chatEndRef = useRef(null);
  
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pipelineStatus, setPipelineStatus] = useState('new');
  const [remark, setRemark] = useState('');
  const [activities, setActivities] = useState([]);
  const [deals, setDeals] = useState([]);
  const [saving, setSaving] = useState(false);
  
  // Activity modal states
  const [activityModal, setActivityModal] = useState({ isOpen: false, type: null });
  const [activityForm, setActivityForm] = useState({ 
    title: '', 
    description: '', 
    notes: '', 
    scheduled_at: '',
    duration: '30'
  });

  // WhatsApp Chat states
  const [showWhatsAppChat, setShowWhatsAppChat] = useState(false);
  const [whatsappMessages, setWhatsappMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    fetchLead();
    fetchActivities();
    fetchDeals();
  }, [id]);

  useEffect(() => {
    if (showWhatsAppChat) {
      fetchWhatsAppMessages();
    }
  }, [showWhatsAppChat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [whatsappMessages]);

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
      // Fetch all deals and filter by linked_company_ids containing this lead's id
      const response = await fetch(`${API}/api/deals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Filter deals that have this lead in linked_company_ids
        const linkedDeals = (data || []).filter(deal => 
          deal.linked_company_ids?.includes(id)
        );
        setDeals(linkedDeals);
      }
    } catch (error) {
      console.error('Failed to fetch deals');
    }
  };

  const fetchWhatsAppMessages = async () => {
    try {
      const response = await fetch(`${API}/api/whatsapp/messages/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setWhatsappMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch WhatsApp messages');
    }
  };

  const handleSendWhatsAppMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    setSendingMessage(true);
    try {
      const response = await fetch(`${API}/api/whatsapp/send`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          contact_id: id,
          message: newMessage,
          phone: lead?.phone
        })
      });
      
      if (response.ok) {
        setNewMessage('');
        toast.success('Message sent');
        fetchWhatsAppMessages();
        fetchActivities();
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Failed to send message');
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
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
        
        // Auto-create deal when status is changed to qualified, proposal, negotiation, or closed
        if (['qualified', 'proposal', 'negotiation', 'closed'].includes(pipelineStatus)) {
          const existingDeal = deals.find(d => d.linked_company_ids?.includes(id));
          if (!existingDeal) {
            const dealResponse = await fetch(`${API}/api/deals`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}` 
              },
              body: JSON.stringify({
                title: `${lead.company || lead.name} Deal`,
                value: 0,
                stage: pipelineStatus === 'closed' ? 'sales_closed' : pipelineStatus,
                linked_company_ids: [id],
                expected_close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              })
            });
            if (dealResponse.ok) {
              toast.success('Deal automatically created');
              fetchDeals();
            }
          } else {
            // Update existing deal stage
            await fetch(`${API}/api/deals/${existingDeal.id}`, {
              method: 'PUT',
              headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}` 
              },
              body: JSON.stringify({ stage: pipelineStatus === 'closed' ? 'sales_closed' : pipelineStatus })
            });
            fetchDeals();
          }
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

  const handleLogActivity = (type) => {
    if (type === 'whatsapp') {
      setShowWhatsAppChat(true);
      return;
    }
    
    setActivityForm({ 
      title: '', 
      description: '', 
      notes: '', 
      scheduled_at: new Date().toISOString().slice(0, 16),
      duration: '30'
    });
    setActivityModal({ isOpen: true, type });
  };

  const handleSubmitActivity = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const activityType = activityModal.type;
    const activityLabel = LOG_ACTIVITY_TYPES.find(t => t.id === activityType)?.label;
    
    try {
      const response = await fetch(`${API}/api/leads/${id}/activities`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          type: activityType,
          description: activityForm.title || `${activityLabel} logged`,
          notes: activityForm.notes,
          scheduled_at: activityForm.scheduled_at
        })
      });
      
      if (response.ok) {
        toast.success(`${activityLabel} logged successfully`);
        setActivityModal({ isOpen: false, type: null });
        fetchActivities();
      } else {
        toast.error('Failed to log activity');
      }
    } catch (error) {
      toast.error('Failed to log activity');
    } finally {
      setSaving(false);
    }
  };

  // Edit modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});

  const handleConvertToCustomer = async () => {
    setSaving(true);
    try {
      // Create customer from lead data
      const customerData = {
        first_name: lead.pic_name || lead.name,
        last_name: '',
        company: lead.company || lead.name,
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        city: lead.city,
        state: lead.state,
        postcode: lead.postcode,
        country: lead.country,
        source: 'converted_lead',
        notes: `Converted from lead: ${lead.name}`
      };
      
      const response = await fetch(`${API}/api/customers`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(customerData)
      });
      
      if (response.ok) {
        // Update lead status to converted
        await fetch(`${API}/api/leads/${id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ ...lead, converted_to_client: true })
        });
        
        toast.success('Lead converted to customer');
        navigate('/customers');
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || 'Failed to convert lead');
      }
    } catch (error) {
      toast.error('Failed to convert lead');
    } finally {
      setSaving(false);
    }
  };

  const openEditForm = () => {
    setEditForm({ ...lead });
    setIsEditOpen(true);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(`${API}/api/leads/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(editForm)
      });
      
      if (response.ok) {
        toast.success('Lead updated successfully');
        setIsEditOpen(false);
        fetchLead();
      } else {
        toast.error('Failed to update lead');
      }
    } catch (error) {
      toast.error('Failed to update lead');
    } finally {
      setSaving(false);
    }
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

  const getActivityIcon = (type) => {
    switch(type) {
      case 'status_update': return { icon: '●', color: 'text-amber-500' };
      case 'email': return { icon: '■', color: 'text-blue-500' };
      case 'call': return { icon: '●', color: 'text-blue-400' };
      case 'ai_call': return { icon: '●', color: 'text-blue-400' };
      case 'whatsapp': return { icon: '●', color: 'text-green-500' };
      case 'task': return { icon: '●', color: 'text-purple-500' };
      case 'meeting': return { icon: '●', color: 'text-orange-500' };
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

  // Group activities by date
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

  const groupedActivities = groupActivitiesByDate(activities);
  const aiCallsCount = activities.filter(a => a.type === 'ai_call' || a.type === 'call').length;

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
            <h1 className="text-xl font-bold">{lead.pic_name || lead.name}</h1>
            {lead.company && (
              <p className="text-xs text-muted-foreground">at {lead.company}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={openEditForm}
            className="elstar-btn-ghost flex items-center gap-2"
            data-testid="edit-lead-btn"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button 
            onClick={handleConvertToCustomer}
            disabled={saving}
            className="elstar-btn-primary flex items-center gap-2"
            data-testid="convert-customer-btn"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
            Convert to Customer
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Sidebar - Contact Info (matching Image 4 layout) */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          {/* Contact Information Card */}
          <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-border">
            <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{lead.email || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">{lead.phone || lead.office_number || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-sm font-medium">{lead.city || lead.state || lead.country || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Summary Card (matching Image 4) */}
          <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-border">
            <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-4">Activity Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-secondary rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-amber-600">{activities.length}</p>
                <p className="text-xs text-muted-foreground">Activities</p>
              </div>
              <div className="bg-gray-50 dark:bg-secondary rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{aiCallsCount}</p>
                <p className="text-xs text-muted-foreground">AI Calls</p>
              </div>
              <div className="bg-gray-50 dark:bg-secondary rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-emerald-600">{deals.length}</p>
                <p className="text-xs text-muted-foreground">Deals</p>
              </div>
              <div className="bg-gray-50 dark:bg-secondary rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-purple-600">{lead.ai_score || 0}</p>
                <p className="text-xs text-muted-foreground">AI Score</p>
              </div>
            </div>
          </div>

          {/* Ownership Card */}
          <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-border">
            <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-4">Ownership</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
                {(lead.owner_name || user?.name || 'U')?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-sm">{lead.owner_name || user?.name || 'Unassigned'}</p>
                <p className="text-xs text-muted-foreground">Owner</p>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section - Activity & Pipeline Update */}
        <div className="col-span-12 lg:col-span-6 space-y-4">
          {/* Log Activity Section */}
          <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-border">
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
          <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-border space-y-4">
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

          {/* WhatsApp Chat Interface (Embedded) */}
          {showWhatsAppChat && (
            <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-green-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    {(lead.pic_name || lead.name)?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{lead.pic_name || lead.name}</p>
                    <p className="text-xs text-white/70">{lead.phone || 'No phone'}</p>
                  </div>
                </div>
                <button onClick={() => setShowWhatsAppChat(false)} className="p-1 hover:bg-white/10 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Chat Messages */}
              <div className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-100 dark:bg-secondary/30">
                {whatsappMessages.length > 0 ? (
                  whatsappMessages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] p-3 rounded-lg text-sm ${
                        msg.sender === 'me' 
                          ? 'bg-green-500 text-white rounded-br-none' 
                          : 'bg-white dark:bg-card rounded-bl-none'
                      }`}>
                        <p>{msg.text || msg.content || msg.message}</p>
                        <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-white/70' : 'text-muted-foreground'}`}>
                          {formatTime(msg.timestamp || msg.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No messages yet</p>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              
              {/* Message Input */}
              <form onSubmit={handleSendWhatsAppMessage} className="flex gap-2 p-3 border-t border-border">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 elstar-input"
                  data-testid="whatsapp-message-input"
                />
                <button 
                  type="submit" 
                  disabled={sendingMessage || !newMessage.trim()}
                  className="elstar-btn-primary px-4"
                  data-testid="send-whatsapp-btn"
                >
                  {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          )}

          {/* Activity Timeline */}
          <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-border">
            <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-4">Activity Timeline</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {Object.keys(groupedActivities).length > 0 ? (
                Object.entries(groupedActivities).map(([date, dateActivities]) => (
                  <div key={date}>
                    <p className="text-xs text-muted-foreground mb-3">{date}</p>
                    <div className="space-y-3">
                      {dateActivities.map((activity, idx) => {
                        const { icon, color } = getActivityIcon(activity.type);
                        return (
                          <div key={activity.id || idx} className="flex gap-3">
                            <span className={`text-lg ${color}`}>{icon}</span>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{activity.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {activity.user_name || 'System'} · {formatTime(activity.created_at)}
                              </p>
                              {activity.notes && (
                                <div className={`mt-2 p-2 rounded-lg text-xs ${
                                  activity.type === 'whatsapp' 
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-100' 
                                    : 'bg-gray-100 dark:bg-secondary'
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
        </div>

        {/* Right Sidebar - Company & Deals */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          {/* Company Section */}
          <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Company</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                  {(lead.company || lead.name)?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-semibold text-sm">{lead.company || lead.name}</p>
                  <p className="text-xs text-muted-foreground">{lead.office_number || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Deals Section - Shows deals auto-created from status updates */}
          <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-border">
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
                  <div key={deal.id} className="p-3 bg-gray-50 dark:bg-secondary rounded-lg space-y-2">
                    <p className="font-semibold text-sm">{deal.title}</p>
                    <p className="text-xs text-muted-foreground">
                      RM {(deal.value || 0).toLocaleString()}
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Stage</p>
                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-amber-500/20 text-amber-600">
                        {PIPELINE_STAGES.find(s => s.id === deal.stage || s.id === deal.stage?.replace('sales_', ''))?.label || deal.stage}
                      </span>
                    </div>
                    {deal.expected_close_date && (
                      <p className="text-xs text-muted-foreground">
                        Close: {formatDate(deal.expected_close_date)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No deals yet. Update status to create a deal automatically.
              </p>
            )}
          </div>

          {/* AI Score Section */}
          <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-border">
            <h3 className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-4">AI Score</h3>
            <div className="text-center">
              <p className="text-4xl font-bold text-amber-500">{lead.ai_score || 0}</p>
              <p className="text-xs text-muted-foreground mt-2">Lead Health Score</p>
              <div className="mt-3 h-2 bg-gray-100 dark:bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${lead.ai_score || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log Modal - Fixed with proper styling */}
      <Modal 
        isOpen={activityModal.isOpen} 
        onClose={() => setActivityModal({ isOpen: false, type: null })} 
        title={`Log ${LOG_ACTIVITY_TYPES.find(t => t.id === activityModal.type)?.label || 'Activity'}`}
      >
        <div className="elstar-modal-body">
          <form onSubmit={handleSubmitActivity} className="space-y-4">
            {activityModal.type === 'task' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Task Title *</label>
                  <input
                    className="elstar-input w-full"
                    value={activityForm.title}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Follow up call"
                    required
                    data-testid="activity-title-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Due Date</label>
                  <input
                    type="datetime-local"
                    className="elstar-input w-full"
                    value={activityForm.scheduled_at}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, scheduled_at: e.target.value }))}
                    data-testid="activity-date-input"
                  />
                </div>
              </>
            )}
            
            {activityModal.type === 'call' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Call Summary *</label>
                  <input
                    className="elstar-input w-full"
                    value={activityForm.title}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Discussed pricing"
                    required
                    data-testid="activity-title-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Call Duration</label>
                  <select
                    className="elstar-select w-full"
                    value={activityForm.duration}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, duration: e.target.value }))}
                    data-testid="activity-duration-select"
                  >
                    <option value="5">5 minutes</option>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">1 hour</option>
                  </select>
                </div>
              </>
            )}
            
            {activityModal.type === 'email' && (
              <div>
                <label className="block text-sm font-medium mb-2">Email Subject *</label>
                <input
                  className="elstar-input w-full"
                  value={activityForm.title}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Proposal sent"
                  required
                  data-testid="activity-title-input"
                />
              </div>
            )}
            
            {activityModal.type === 'meeting' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Meeting Title *</label>
                  <input
                    className="elstar-input w-full"
                    value={activityForm.title}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Product demo"
                    required
                    data-testid="activity-title-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Meeting Date & Time</label>
                  <input
                    type="datetime-local"
                    className="elstar-input w-full"
                    value={activityForm.scheduled_at}
                    onChange={(e) => setActivityForm(prev => ({ ...prev, scheduled_at: e.target.value }))}
                    data-testid="activity-date-input"
                  />
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                className="elstar-input min-h-[100px] w-full"
                value={activityForm.notes}
                onChange={(e) => setActivityForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any notes about this activity..."
                data-testid="activity-notes-input"
              />
            </div>
          </form>
        </div>
        <div className="elstar-modal-footer">
          <button 
            type="button" 
            onClick={() => setActivityModal({ isOpen: false, type: null })} 
            className="elstar-btn-ghost"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmitActivity}
            disabled={saving}
            className="elstar-btn-primary"
            data-testid="submit-activity-btn"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Log {LOG_ACTIVITY_TYPES.find(t => t.id === activityModal.type)?.label}
          </button>
        </div>
      </Modal>

      {/* Edit Lead Slide-in Panel */}
      <SlideInPanel isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Lead">
        <form onSubmit={handleEditSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Company Name</label>
            <input
              className="elstar-input w-full"
              value={editForm.name || editForm.company || ''}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value, company: e.target.value }))}
              placeholder="Company name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">PIC Name</label>
            <input
              className="elstar-input w-full"
              value={editForm.pic_name || ''}
              onChange={(e) => setEditForm(prev => ({ ...prev, pic_name: e.target.value }))}
              placeholder="Person in charge"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Job Title</label>
            <input
              className="elstar-input w-full"
              value={editForm.title || ''}
              onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Job title"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Mobile</label>
              <input
                className="elstar-input w-full"
                value={editForm.phone || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Mobile number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Office</label>
              <input
                className="elstar-input w-full"
                value={editForm.office_number || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, office_number: e.target.value }))}
                placeholder="Office number"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              className="elstar-input w-full"
              value={editForm.email || ''}
              onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Email address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Website</label>
            <input
              className="elstar-input w-full"
              value={editForm.website || ''}
              onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
              placeholder="Website URL"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">City</label>
              <input
                className="elstar-input w-full"
                value={editForm.city || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">State</label>
              <input
                className="elstar-input w-full"
                value={editForm.state || ''}
                onChange={(e) => setEditForm(prev => ({ ...prev, state: e.target.value }))}
                placeholder="State"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Country</label>
            <select
              className="elstar-select w-full"
              value={editForm.country || 'Malaysia'}
              onChange={(e) => setEditForm(prev => ({ ...prev, country: e.target.value }))}
            >
              <option value="Malaysia">Malaysia</option>
              <option value="Singapore">Singapore</option>
              <option value="Indonesia">Indonesia</option>
              <option value="Thailand">Thailand</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex gap-3 mt-6 pt-4 border-t border-border">
            <button type="submit" disabled={saving} className="elstar-btn-primary flex-1">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </button>
            <button type="button" onClick={() => setIsEditOpen(false)} className="elstar-btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      </SlideInPanel>
    </div>
  );
}
