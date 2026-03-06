import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { 
  Users, DollarSign, TrendingUp, Target, Sparkles, ArrowUpRight, ArrowDownRight,
  Contact2, Building2, AlertCircle, Briefcase, Activity, Clock, Globe, UserPlus,
  BarChart3, PieChart as PieChartIcon, Percent
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

// Simple Pie Chart Component
const SimplePieChart = ({ data, colors }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No data available
      </div>
    );
  }

  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No data available
      </div>
    );
  }

  let cumulativePercent = 0;
  const segments = Object.entries(data).map(([key, value], index) => {
    const percent = (value / total) * 100;
    const startAngle = cumulativePercent * 3.6;
    cumulativePercent += percent;
    const endAngle = cumulativePercent * 3.6;
    
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);
    
    const largeArc = percent > 50 ? 1 : 0;
    
    return {
      key,
      value,
      percent: percent.toFixed(1),
      color: colors[index % colors.length],
      path: `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`
    };
  });

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-40 h-40">
        {segments.map((seg, i) => (
          <path
            key={seg.key}
            d={seg.path}
            fill={seg.color}
            className="transition-all hover:opacity-80"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
          />
        ))}
        <circle cx="50" cy="50" r="20" className="fill-card" />
      </svg>
      <div className="flex-1 space-y-2">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="capitalize text-muted-foreground flex-1">{seg.key.replace('_', ' ')}</span>
            <span className="font-medium">{seg.value}</span>
            <span className="text-xs text-muted-foreground">({seg.percent}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

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
          <button onClick={() => navigate('/organization')} className="elstar-btn-primary" data-testid="setup-org-btn">
            <Building2 className="w-4 h-4 mr-2" /> Set Up Organization
          </button>
        </div>
      </div>
    );
  }

  // 5 stat tiles
  const stats = analytics ? [
    { title: 'Total Leads', value: analytics.total_leads, icon: Users, change: '+12%', positive: true, iconBg: 'bg-amber-500/10', iconColor: 'text-amber-500' },
    { title: 'Active Deals', value: analytics.total_deals, icon: Briefcase, change: '+8%', positive: true, iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-500' },
    { title: 'Pipeline Value', value: formatCurrency(analytics.total_pipeline_value), icon: DollarSign, change: '+15%', positive: true, iconBg: 'bg-amber-600/10', iconColor: 'text-amber-600' },
    { title: 'Won Revenue', value: formatCurrency(analytics.won_deals_value), icon: TrendingUp, change: '+23%', positive: true, iconBg: 'bg-emerald-600/10', iconColor: 'text-emerald-600' },
    { title: 'Conversion', value: `${analytics.conversion_rate}%`, icon: Percent, change: '+5%', positive: true, iconBg: 'bg-amber-400/10', iconColor: 'text-amber-400' }
  ] : [];

  const pieColors = ['#D4AF37', '#FFD700', '#B8860B', '#DAA520', '#F4A460', '#CD853F'];
  const statusColors = ['#22c55e', '#eab308', '#3b82f6', '#ef4444'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dashboard">
      {/* Header with Organization Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> 
            {user?.organization_name || 'Your Organization'}
            {analytics?.organization_stats?.member_count && (
              <span className="text-xs px-2 py-0.5 rounded bg-secondary">
                {analytics.organization_stats.member_count} members
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium capitalize">
            {user?.role?.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Multi-tenancy Organization Card */}
      {analytics?.organization_stats?.name && (
        <div className="elstar-card p-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 ai-gradient rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{analytics.organization_stats.name}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                {analytics.organization_stats.domain && (
                  <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {analytics.organization_stats.domain}</span>
                )}
                {analytics.organization_stats.industry && (
                  <span className="capitalize">{analytics.organization_stats.industry}</span>
                )}
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {analytics.organization_stats.member_count} members</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5 Stats Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat, index) => (
          <div key={stat.title} className="elstar-stat-card animate-fade-in" style={{ animationDelay: `${index * 50}ms` }} data-testid={`stat-${stat.title.toLowerCase().replace(' ', '-')}`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <div className={`flex items-center text-xs ${stat.positive ? 'text-emerald-500' : 'text-red-500'}`}>
                {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <div className="text-xl font-bold mb-1">{stat.value}</div>
            <span className="text-xs text-muted-foreground">{stat.title}</span>
          </div>
        ))}
      </div>

      {/* Charts Row - Bar Chart and Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart - Revenue Trend */}
        <div className="elstar-card p-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-amber-500" />
            </div>
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
                <div key={i} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full">
                    <div 
                      className="w-full bg-primary rounded-t transition-all duration-500 hover:bg-primary/80 cursor-pointer" 
                      style={{ height: `${height}px` }}
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border px-2 py-1 rounded text-xs whitespace-nowrap shadow-lg">
                      {formatCurrency(item.revenue)}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground mt-2">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pie Chart - Lead Sources */}
        <div className="elstar-card p-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <PieChartIcon className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold">Lead Sources</h3>
              <p className="text-sm text-muted-foreground">Distribution by source</p>
            </div>
          </div>
          <SimplePieChart data={analytics?.leads_by_source} colors={pieColors} />
        </div>
      </div>

      {/* Second Row - Pipeline Overview and Lead Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline Overview */}
        <div className="elstar-card p-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-500" />
            </div>
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

        {/* Lead Status Pie Chart */}
        <div className="elstar-card p-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-amber-400/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold">Lead Status</h3>
              <p className="text-sm text-muted-foreground">Distribution by status</p>
            </div>
          </div>
          <SimplePieChart data={analytics?.leads_by_status} colors={statusColors} />
        </div>
      </div>

      {/* Activity Feed and Team Performance Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activities */}
        <div className="elstar-card p-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold">Recent Activities</h3>
              <p className="text-sm text-muted-foreground">Latest updates in your organization</p>
            </div>
          </div>
          <div className="space-y-4">
            {analytics?.recent_activities?.length > 0 ? (
              analytics.recent_activities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'lead_created' ? 'bg-amber-500/10' : 'bg-emerald-500/10'
                  }`}>
                    {activity.icon === 'user' ? (
                      <UserPlus className={`w-4 h-4 ${activity.type === 'lead_created' ? 'text-amber-500' : 'text-emerald-500'}`} />
                    ) : (
                      <Briefcase className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {activity.time}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activities</p>
                <p className="text-xs">Activities will appear as you add leads and deals</p>
              </div>
            )}
          </div>
        </div>

        {/* Team Performance (for managers/admins) */}
        {hasPermission('view_team_analytics') && (
          <div className="elstar-card p-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-semibold">Team Performance</h3>
                <p className="text-sm text-muted-foreground">Individual metrics</p>
              </div>
            </div>
            {analytics?.team_performance?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="elstar-table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th className="text-center">Leads</th>
                      <th className="text-center">Deals</th>
                      <th className="text-center">Won</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.team_performance.map((member) => (
                      <tr key={member.user_id}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="elstar-avatar w-7 h-7 text-xs">
                              {member.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{member.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">{member.role?.replace('_', ' ')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="text-center">{member.leads}</td>
                        <td className="text-center">{member.deals}</td>
                        <td className="text-center"><span className="text-emerald-500 font-medium">{member.won_deals}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No team data yet</p>
              </div>
            )}
          </div>
        )}

        {/* AI Insights (shown if no team permission) */}
        {!hasPermission('view_team_analytics') && (
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
        )}
      </div>

      {/* AI Insights Section (for admins with team view) */}
      {hasPermission('view_team_analytics') && (
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-start gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Strong pipeline</p>
                <p className="text-xs text-muted-foreground">Revenue growing steadily</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Lead quality</p>
                <p className="text-xs text-muted-foreground">Focus on high-score leads</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Team balance</p>
                <p className="text-xs text-muted-foreground">Distribute leads evenly</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
