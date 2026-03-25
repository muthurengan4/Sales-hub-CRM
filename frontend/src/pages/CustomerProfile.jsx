import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { 
  ArrowLeft, Mail, Phone, Building2, MapPin, Calendar, Clock,
  User, Sparkles, FileText, PhoneCall, TrendingUp, Loader2,
  MessageSquare, Video, CheckCircle, AlertCircle, ExternalLink
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const activityIcons = {
  ai_call: PhoneCall,
  email: Mail,
  note: FileText,
  meeting: Video,
  pipeline_change: TrendingUp,
  status_change: CheckCircle,
  assignment: User,
  system: AlertCircle
};

const activityColors = {
  ai_call: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  email: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  note: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  meeting: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  pipeline_change: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  status_change: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
  assignment: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  system: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
};

const lifecycleStages = [
  { key: 'lead', label: 'Lead', color: 'bg-gray-200' },
  { key: 'ai_contacted', label: 'AI Contacted', color: 'bg-blue-400' },
  { key: 'interested', label: 'Interested', color: 'bg-green-400' },
  { key: 'opportunity', label: 'Opportunity', color: 'bg-purple-400' },
  { key: 'customer', label: 'Customer', color: 'bg-primary' },
  { key: 'repeat_customer', label: 'Repeat', color: 'bg-amber-400' }
];

export default function CustomerProfile() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { token, orgSettings } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [activities, setActivities] = useState([]);
  const [aiCalls, setAiCalls] = useState([]);
  const [deals, setDeals] = useState([]);
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState('timeline');

  useEffect(() => {
    fetchProfile();
  }, [type, id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const endpoint = type === 'lead' ? `/api/profile/lead/${id}` : `/api/profile/contact/${id}`;
      const response = await fetch(`${API}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setActivities(data.activities || []);
        setAiCalls(data.ai_calls || []);
        setDeals(data.deals || []);
        setStats(data.stats || {});
      } else {
        toast.error('Failed to load profile');
        navigate(-1);
      }
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLifecycleIndex = (stage) => {
    return lifecycleStages.findIndex(s => s.key === stage) || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-lg font-medium">Profile not found</p>
        <button onClick={() => navigate(-1)} className="elstar-btn-ghost mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </button>
      </div>
    );
  }

  const currentLifecycle = getLifecycleIndex(profile.lifecycle_stage || 'lead');

  return (
    <div className="space-y-6" data-testid="customer-profile-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">
            {profile.name || [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.company || 'Customer'}
          </h1>
          <p className="text-muted-foreground">
            {profile.title || profile.job_title || 'Contact'} at {profile.company || 'Company'}
          </p>
        </div>
        {(type === 'lead' || type === 'customer') && profile.ai_score && (
          <div className="ml-auto flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-bold text-primary">{profile.ai_score}</span>
            <span className="text-sm text-muted-foreground">AI Score</span>
          </div>
        )}
      </div>

      {/* Lifecycle Progress */}
      {type === 'lead' && (
        <div className="elstar-card p-6">
          <h3 className="font-medium mb-4">Customer Lifecycle</h3>
          <div className="flex items-center gap-2">
            {lifecycleStages.map((stage, index) => (
              <React.Fragment key={stage.key}>
                <div className="flex flex-col items-center flex-1">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium
                      ${index <= currentLifecycle ? stage.color : 'bg-gray-200 dark:bg-gray-700'}`}
                  >
                    {index + 1}
                  </div>
                  <span className={`text-xs mt-2 text-center ${index <= currentLifecycle ? 'font-medium' : 'text-muted-foreground'}`}>
                    {stage.label}
                  </span>
                </div>
                {index < lifecycleStages.length - 1 && (
                  <div className={`flex-1 h-1 ${index < currentLifecycle ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Contact Info */}
        <div className="space-y-6">
          {/* Contact Details Card */}
          <div className="elstar-card p-6">
            <h3 className="font-medium mb-4">Contact Information</h3>
            <div className="space-y-4">
              {profile.email && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <a href={`mailto:${profile.email}`} className="text-sm hover:text-primary">{profile.email}</a>
                  </div>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <a href={`tel:${profile.phone}`} className="text-sm hover:text-primary">{profile.phone}</a>
                  </div>
                </div>
              )}
              {profile.company && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Company</p>
                    <p className="text-sm">{profile.company}</p>
                  </div>
                </div>
              )}
              {(profile.city || profile.state) && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm">{[profile.city, profile.state].filter(Boolean).join(', ')}</p>
                  </div>
                </div>
              )}
              {profile.linkedin && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <ExternalLink className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">LinkedIn</p>
                    <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      View Profile
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Card */}
          <div className="elstar-card p-6">
            <h3 className="font-medium mb-4">Activity Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-secondary">
                <p className="text-2xl font-bold">{stats.total_activities || 0}</p>
                <p className="text-xs text-muted-foreground">Activities</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary">
                <p className="text-2xl font-bold">{stats.total_calls || 0}</p>
                <p className="text-xs text-muted-foreground">AI Calls</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary">
                <p className="text-2xl font-bold">{stats.total_deals || 0}</p>
                <p className="text-xs text-muted-foreground">Deals</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary">
                <p className="text-2xl font-bold text-primary">{profile.ai_score || '-'}</p>
                <p className="text-xs text-muted-foreground">AI Score</p>
              </div>
            </div>
          </div>

          {/* Owner Info */}
          <div className="elstar-card p-6">
            <h3 className="font-medium mb-4">Ownership</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="elstar-avatar w-10 h-10">{profile.owner_name?.charAt(0)}</div>
                <div>
                  <p className="text-sm font-medium">{profile.owner_name}</p>
                  <p className="text-xs text-muted-foreground">Owner</p>
                </div>
              </div>
              {profile.assigned_to_name && (
                <div className="flex items-center gap-3">
                  <div className="elstar-avatar w-10 h-10">{profile.assigned_to_name.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-medium">{profile.assigned_to_name}</p>
                    <p className="text-xs text-muted-foreground">Assigned</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Timeline & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-border">
            {[
              { id: 'timeline', label: 'Timeline', count: activities.length },
              { id: 'calls', label: 'AI Calls', count: aiCalls.length },
              { id: 'deals', label: 'Deals', count: deals.length },
              { id: 'notes', label: 'Notes' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab.id 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-secondary">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="elstar-card">
            {activeTab === 'timeline' && (
              <div className="p-6">
                {activities.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No activities yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activities.map((activity, index) => {
                      const Icon = activityIcons[activity.type] || FileText;
                      return (
                        <div key={activity.id || index} className="flex gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activityColors[activity.type] || activityColors.system}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{activity.subject}</p>
                            {activity.description && (
                              <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <span>{activity.owner_name || 'System'}</span>
                              <span>•</span>
                              <span>{formatDate(activity.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'calls' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">{aiCalls.length} calls</p>
                  <button className="elstar-btn-primary text-sm" data-testid="initiate-call-btn">
                    <PhoneCall className="w-4 h-4 mr-2" />
                    New AI Call (Placeholder)
                  </button>
                </div>
                {aiCalls.length === 0 ? (
                  <div className="text-center py-12">
                    <PhoneCall className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No AI calls yet</p>
                    <p className="text-sm text-muted-foreground mt-2">AI Call feature requires voice provider integration</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {aiCalls.map(call => (
                      <div key={call.id} className="p-4 rounded-lg bg-secondary">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <PhoneCall className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-medium">{call.phone_number}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(call.created_at)}</p>
                            </div>
                          </div>
                          <span className={`elstar-badge ${
                            call.status === 'completed' ? 'elstar-badge-success' :
                            call.status === 'pending' ? 'elstar-badge-warning' : 'elstar-badge-info'
                          }`}>
                            {call.status}
                          </span>
                        </div>
                        {call.ai_summary && (
                          <p className="mt-3 text-sm text-muted-foreground">{call.ai_summary}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'deals' && (
              <div className="p-6">
                {deals.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No deals associated</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deals.map(deal => (
                      <div key={deal.id} className="p-4 rounded-lg bg-secondary">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{deal.title}</p>
                            <p className="text-sm text-muted-foreground">{deal.company}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">{orgSettings?.currency_symbol || '$'}{deal.value?.toLocaleString()}</p>
                            <span className="elstar-badge elstar-badge-info">{deal.stage}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="p-6">
                {profile.notes ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p>{profile.notes}</p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No notes added</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
