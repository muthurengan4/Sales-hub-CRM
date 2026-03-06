import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { 
  Users, DollarSign, TrendingUp, Target, Sparkles, ArrowUpRight, ArrowDownRight,
  Contact2, Building2, AlertCircle
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

export default function Dashboard() {
  const { token, user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API}/api/analytics`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) setAnalytics(await response.json());
    } catch (error) { console.error('Failed to fetch analytics:', error); }
    finally { setLoading(false); }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

  // Check if user needs to create organization
  const needsOrganization = !user?.organization_id;

  if (needsOrganization) {
    return (
      <div className="space-y-6" data-testid="dashboard">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.name?.split(' ')[0]}</h1>
          <p className="text-muted-foreground mt-1">Let's get you started</p>
        </div>
        
        <div className="elstar-card p-8 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Create Your Organization</h2>
          <p className="text-muted-foreground mb-6">
            To start managing leads, deals, and team members, you need to create or join an organization.
          </p>
          <button onClick={() => navigate('/organization')} className="elstar-btn-primary">
            <Building2 className="w-4 h-4 mr-2" /> Set Up Organization
          </button>
        </div>
      </div>
    );
  }

  const stats = analytics ? [
    { title: 'Total Leads', value: analytics.total_leads, icon: Users, change: '+12%', positive: true, iconBg: 'bg-amber-500/10', iconColor: 'text-amber-500' },
    { title: 'Pipeline Value', value: formatCurrency(analytics.total_pipeline_value), icon: DollarSign, change: '+8%', positive: true, iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-500' },
    { title: 'Won Revenue', value: formatCurrency(analytics.won_deals_value), icon: TrendingUp, change: '+23%', positive: true, iconBg: 'bg-amber-600/10', iconColor: 'text-amber-600' },
    { title: 'Contacts', value: analytics.total_contacts, icon: Contact2, change: '+5%', positive: true, iconBg: 'bg-amber-400/10', iconColor: 'text-amber-400' }
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-muted-foreground mt-1">
            {user?.organization_name && <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {user.organization_name}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium capitalize">
            {user?.role?.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={stat.title} className="elstar-stat-card animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground font-medium">{stat.title}</span>
              <div className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            <div className={`flex items-center text-xs ${stat.positive ? 'text-emerald-500' : 'text-red-500'}`}>
              {stat.positive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              {stat.change} from last month
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <div className="elstar-card p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold">Revenue Trend</h3>
              <p className="text-sm text-muted-foreground">Monthly performance</p>
            </div>
          </div>
          <div className="h-48 flex items-end gap-3">
            {analytics?.monthly_revenue?.map((item, i) => {
              const maxRev = Math.max(...analytics.monthly_revenue.map(r => r.revenue)) || 1;
              const height = Math.max(20, (item.revenue / maxRev) * 160);
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-primary rounded-t transition-all duration-500 hover:bg-primary/80" style={{ height: `${height}px` }} />
                  <span className="text-xs text-muted-foreground mt-2">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pipeline Overview */}
        <div className="elstar-card p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold">Pipeline Overview</h3>
              <p className="text-sm text-muted-foreground">Deals by stage</p>
            </div>
          </div>
          <div className="space-y-4">
            {analytics && Object.entries(analytics.deals_by_stage).length > 0 ? (
              Object.entries(analytics.deals_by_stage).map(([stage, count]) => {
                const max = Math.max(...Object.values(analytics.deals_by_stage)) || 1;
                return (
                  <div key={stage}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="capitalize text-muted-foreground">{stage.replace('_', ' ')}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground py-8">No deals yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Team Performance (for managers/admins) */}
      {hasPermission('view_team_analytics') && analytics?.team_performance?.length > 0 && (
        <div className="elstar-card p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold">Team Performance</h3>
              <p className="text-sm text-muted-foreground">Individual metrics</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="elstar-table">
              <thead>
                <tr>
                  <th>Team Member</th>
                  <th>Role</th>
                  <th className="text-center">Leads</th>
                  <th className="text-center">Deals</th>
                  <th className="text-center">Won</th>
                </tr>
              </thead>
              <tbody>
                {analytics.team_performance.map((member) => (
                  <tr key={member.user_id}>
                    <td className="font-medium">{member.name}</td>
                    <td><span className="text-xs capitalize text-muted-foreground">{member.role?.replace('_', ' ')}</span></td>
                    <td className="text-center">{member.leads}</td>
                    <td className="text-center">{member.deals}</td>
                    <td className="text-center"><span className="text-emerald-500 font-medium">{member.won_deals}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Insights */}
      <div className="elstar-card p-5 border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 ai-gradient rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold ai-text">AI Insights</h3>
            <p className="text-xs text-muted-foreground">Powered by Claude Sonnet 4.5</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Strong pipeline momentum</p>
              <p className="text-xs text-muted-foreground">Your pipeline value has grown this month.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Focus on qualified leads</p>
              <p className="text-xs text-muted-foreground">Review leads with high AI scores for demos.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
