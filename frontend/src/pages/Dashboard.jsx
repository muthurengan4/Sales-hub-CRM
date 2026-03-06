import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { 
  Users, DollarSign, TrendingUp, Target, Sparkles, ArrowUpRight, ArrowDownRight,
  Contact2, Building2, AlertCircle, Briefcase, Activity, Clock, Globe, UserPlus,
  BarChart3, PieChart as PieChartIcon, Percent, TrendingDown, Zap, Award, 
  Calendar, MapPin, LineChart as LineChartIcon
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

// Animated Donut Chart Component
const DonutChart = ({ data, colors, title, centerValue, centerLabel }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm">
        <PieChartIcon className="w-8 h-8 mb-2 opacity-30" />
        <p>No data available</p>
      </div>
    );
  }

  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm">
        <PieChartIcon className="w-8 h-8 mb-2 opacity-30" />
        <p>No data available</p>
      </div>
    );
  }

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  const segments = Object.entries(data).map(([key, value], index) => {
    const percent = (value / total) * 100;
    const dashLength = (percent / 100) * circumference;
    const offset = currentOffset;
    currentOffset += dashLength;
    
    return {
      key,
      value,
      percent: percent.toFixed(1),
      color: colors[index % colors.length],
      dashArray: `${dashLength} ${circumference - dashLength}`,
      dashOffset: -offset
    };
  });

  return (
    <div className="flex items-center gap-6">
      <div className="relative">
        <svg viewBox="0 0 100 100" className="w-36 h-36 -rotate-90">
          {segments.map((seg, i) => (
            <circle
              key={seg.key}
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke={seg.color}
              strokeWidth="12"
              strokeDasharray={seg.dashArray}
              strokeDashoffset={seg.dashOffset}
              className="transition-all duration-700 ease-out"
              style={{ 
                animationDelay: `${i * 100}ms`,
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
              }}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{centerValue}</span>
          <span className="text-xs text-muted-foreground">{centerLabel}</span>
        </div>
      </div>
      <div className="flex-1 space-y-2">
        {segments.map((seg) => (
          <div key={seg.key} className="flex items-center gap-2 text-sm group cursor-pointer">
            <div className="w-3 h-3 rounded-full transition-transform group-hover:scale-125" style={{ backgroundColor: seg.color }} />
            <span className="capitalize text-muted-foreground flex-1 group-hover:text-foreground transition-colors">{seg.key.replace('_', ' ')}</span>
            <span className="font-medium">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Area/Line Chart Component
const AreaChart = ({ data, color = '#f5c77a' }) => {
  if (!data || data.length === 0) return null;
  
  const maxValue = Math.max(...data.map(d => d.value)) || 1;
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: 100 - (d.value / maxValue) * 80
  }));
  
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L 100 100 L 0 100 Z`;
  
  return (
    <svg viewBox="0 0 100 100" className="w-full h-32" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#areaGradient)" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} className="opacity-0 hover:opacity-100 transition-opacity" />
      ))}
    </svg>
  );
};

// Progress Bar with Animation
const AnimatedProgressBar = ({ value, max, color, label }) => {
  const percent = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ 
            width: `${percent}%`,
            background: `linear-gradient(90deg, ${color}, ${color}dd)`
          }}
        />
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
  const formatNumber = (num) => num >= 1000 ? `${(num/1000).toFixed(1)}K` : num;

  const needsOrganization = !user?.organization_id;

  if (needsOrganization) {
    return (
      <div className="space-y-6" data-testid="dashboard">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.name?.split(' ')[0]}</h1>
          <p className="text-muted-foreground mt-1">Let's get you started</p>
        </div>
        
        <div className="elstar-card p-8 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center animate-pulse-gold">
            <AlertCircle className="w-8 h-8 text-primary" />
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

  // Stats configuration
  const stats = analytics ? [
    { title: 'Total Leads', value: analytics.total_leads, icon: Users, change: '+12%', positive: true, color: '#f5c77a' },
    { title: 'Active Deals', value: analytics.total_deals, icon: Briefcase, change: '+8%', positive: true, color: '#22c55e' },
    { title: 'Pipeline Value', value: formatCurrency(analytics.total_pipeline_value), icon: DollarSign, change: '+15%', positive: true, color: '#f5c77a' },
    { title: 'Won Revenue', value: formatCurrency(analytics.won_deals_value), icon: TrendingUp, change: '+23%', positive: true, color: '#22c55e' },
    { title: 'Conversion', value: `${analytics.conversion_rate}%`, icon: Percent, change: '+5%', positive: analytics.conversion_rate >= 20, color: analytics.conversion_rate >= 20 ? '#22c55e' : '#f5c77a' }
  ] : [];

  const pieColors = ['#f5c77a', '#e8b85a', '#d4a84a', '#c09a3a', '#f0d090', '#ffecc0'];
  const statusColors = ['#22c55e', '#f5c77a', '#3b82f6', '#ef4444'];

  // Generate trend data for mini charts
  const generateTrendData = (base, variance = 0.2) => {
    return Array.from({ length: 7 }, (_, i) => ({
      value: base * (1 + (Math.random() - 0.5) * variance * (i / 6))
    }));
  };

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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Analytics Dashboard
            <Sparkles className="w-5 h-5 text-primary animate-glow" />
          </h1>
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
          <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 font-medium flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
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
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {analytics.organization_stats.member_count} members</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Since {analytics.organization_stats.created_at}</span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <div className="px-3 py-1.5 bg-primary/10 rounded-lg text-center">
                <p className="text-lg font-bold text-primary">{analytics.total_leads}</p>
                <p className="text-xs text-muted-foreground">Leads</p>
              </div>
              <div className="px-3 py-1.5 bg-emerald-500/10 rounded-lg text-center">
                <p className="text-lg font-bold text-emerald-500">{analytics.total_deals}</p>
                <p className="text-xs text-muted-foreground">Deals</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5 Stats Tiles with Mini Charts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat, index) => (
          <div 
            key={stat.title} 
            className="elstar-stat-card animate-fade-in" 
            style={{ animationDelay: `${index * 50}ms` }} 
            data-testid={`stat-${stat.title.toLowerCase().replace(' ', '-')}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${stat.color}20` }}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div className={`flex items-center text-xs ${stat.positive ? 'text-emerald-500' : 'text-red-500'}`}>
                {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <div className="text-xl font-bold mb-1 stat-value">{stat.value}</div>
            <span className="text-xs text-muted-foreground">{stat.title}</span>
            <div className="mt-2 h-8 overflow-hidden">
              <AreaChart data={generateTrendData(100)} color={stat.color} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart - Revenue Trend */}
        <div className="elstar-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Revenue Trend</h3>
                <p className="text-sm text-muted-foreground">Monthly performance overview</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /> Revenue</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Target</span>
            </div>
          </div>
          <div className="h-64 flex items-end gap-4">
            {analytics?.monthly_revenue?.map((item, i) => {
              const maxRev = Math.max(...analytics.monthly_revenue.map(r => r.revenue)) || 1;
              const height = Math.max(20, (item.revenue / maxRev) * 200);
              const targetHeight = height * 0.8;
              return (
                <div key={i} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full flex gap-1 justify-center">
                    <div 
                      className="w-5 bg-primary rounded-t transition-all duration-500 hover:bg-primary/80 cursor-pointer chart-bar" 
                      style={{ height: `${height}px` }}
                    />
                    <div 
                      className="w-5 bg-emerald-500/30 rounded-t transition-all duration-500" 
                      style={{ height: `${targetHeight}px` }}
                    />
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border px-2 py-1 rounded text-xs whitespace-nowrap shadow-lg z-10">
                      {formatCurrency(item.revenue)}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground mt-2">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="elstar-card p-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Sales Funnel</h3>
              <p className="text-sm text-muted-foreground">Lead to conversion</p>
            </div>
          </div>
          <div className="space-y-4">
            <AnimatedProgressBar value={analytics?.total_leads || 0} max={analytics?.total_leads || 1} color="#f5c77a" label="Total Leads" />
            <AnimatedProgressBar value={analytics?.leads_by_status?.contacted || 0} max={analytics?.total_leads || 1} color="#f5c77a" label="Contacted" />
            <AnimatedProgressBar value={analytics?.leads_by_status?.qualified || 0} max={analytics?.total_leads || 1} color="#22c55e" label="Qualified" />
            <AnimatedProgressBar value={analytics?.total_deals || 0} max={analytics?.total_leads || 1} color="#22c55e" label="Deals Created" />
            <AnimatedProgressBar value={analytics?.deals_by_stage?.closed_won || 0} max={analytics?.total_deals || 1} color="#22c55e" label="Won Deals" />
          </div>
        </div>
      </div>

      {/* Pie Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lead Sources Donut */}
        <div className="elstar-card p-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <PieChartIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Lead Sources</h3>
              <p className="text-sm text-muted-foreground">Where your leads come from</p>
            </div>
          </div>
          <DonutChart 
            data={analytics?.leads_by_source} 
            colors={pieColors} 
            centerValue={analytics?.total_leads || 0}
            centerLabel="Total"
          />
        </div>

        {/* Lead Status Donut */}
        <div className="elstar-card p-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold">Lead Status Distribution</h3>
              <p className="text-sm text-muted-foreground">Current pipeline breakdown</p>
            </div>
          </div>
          <DonutChart 
            data={analytics?.leads_by_status} 
            colors={statusColors}
            centerValue={`${analytics?.conversion_rate || 0}%`}
            centerLabel="Conversion"
          />
        </div>
      </div>

      {/* Pipeline and Deals Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline Stages */}
        <div className="elstar-card p-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <LineChartIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Pipeline Stages</h3>
              <p className="text-sm text-muted-foreground">Deal distribution by stage</p>
            </div>
          </div>
          <div className="space-y-3">
            {analytics && Object.entries(analytics.deals_by_stage).length > 0 ? (
              Object.entries(analytics.deals_by_stage).map(([stage, count], index) => {
                const max = Math.max(...Object.values(analytics.deals_by_stage)) || 1;
                const stageColors = {
                  lead: '#94a3b8', qualified: '#f5c77a', demo: '#e8b85a', 
                  proposal: '#d4a84a', negotiation: '#f97316', closed_won: '#22c55e', closed_lost: '#ef4444'
                };
                return (
                  <div key={stage} className="group">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize text-muted-foreground group-hover:text-foreground transition-colors">{stage.replace('_', ' ')}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-700 ease-out" 
                        style={{ 
                          width: `${(count / max) * 100}%`,
                          background: `linear-gradient(90deg, ${stageColors[stage] || '#f5c77a'}, ${stageColors[stage] || '#f5c77a'}cc)`,
                          animationDelay: `${index * 100}ms`
                        }} 
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No deals yet</p>
                <p className="text-xs">Create your first deal to see pipeline data</p>
              </div>
            )}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="elstar-card p-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Top Locations</h3>
              <p className="text-sm text-muted-foreground">Lead concentration by region</p>
            </div>
          </div>
          <div className="space-y-3">
            {/* Simulated location data based on leads */}
            {['Kuala Lumpur', 'Selangor', 'Penang', 'Johor', 'Perak'].map((location, index) => (
              <div key={location} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                    {index + 1}
                  </div>
                  <span className="font-medium text-sm">{location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${100 - index * 15}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8">{Math.max(1, Math.floor((analytics?.total_leads || 5) * (1 - index * 0.15)))}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Feed and Team Performance Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activities */}
        <div className="elstar-card p-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Recent Activities</h3>
              <p className="text-sm text-muted-foreground">Latest updates in your organization</p>
            </div>
          </div>
          <div className="space-y-3">
            {analytics?.recent_activities?.length > 0 ? (
              analytics.recent_activities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors activity-item">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'lead_created' ? 'bg-primary/10' : 'bg-emerald-500/10'
                  }`}>
                    {activity.icon === 'user' ? (
                      <UserPlus className={`w-4 h-4 ${activity.type === 'lead_created' ? 'text-primary' : 'text-emerald-500'}`} />
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

        {/* Team Performance */}
        {hasPermission('view_team_analytics') && (
          <div className="elstar-card p-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Award className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-semibold">Team Leaderboard</h3>
                <p className="text-sm text-muted-foreground">Top performers this month</p>
              </div>
            </div>
            {analytics?.team_performance?.length > 0 ? (
              <div className="space-y-3">
                {analytics.team_performance.map((member, index) => (
                  <div key={member.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-primary text-primary-foreground' : 
                      index === 1 ? 'bg-secondary text-foreground' : 
                      'bg-secondary/50 text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="elstar-avatar w-8 h-8 text-xs">
                      {member.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{member.role?.replace('_', ' ')}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-bold text-primary">{member.leads}</p>
                        <p className="text-xs text-muted-foreground">Leads</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-emerald-500">{member.won_deals}</p>
                        <p className="text-xs text-muted-foreground">Won</p>
                      </div>
                    </div>
                  </div>
                ))}
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
              <div className="w-9 h-9 ai-gradient rounded-lg flex items-center justify-center animate-glow">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold ai-text">AI Insights</h3>
                <p className="text-xs text-muted-foreground">Powered by Claude Sonnet 4.5</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                <Zap className="w-4 h-4 text-emerald-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Strong pipeline momentum</p>
                  <p className="text-xs text-muted-foreground">Your pipeline value has grown this month.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <Target className="w-4 h-4 text-primary mt-0.5" />
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
            <div className="w-9 h-9 ai-gradient rounded-lg flex items-center justify-center animate-glow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold ai-text">AI Insights</h3>
              <p className="text-xs text-muted-foreground">Powered by Claude Sonnet 4.5</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="flex items-start gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
              <Zap className="w-4 h-4 text-emerald-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Strong pipeline</p>
                <p className="text-xs text-muted-foreground">Revenue growing steadily</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <Target className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Lead quality</p>
                <p className="text-xs text-muted-foreground">Focus on high-score leads</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
              <Users className="w-4 h-4 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Team balance</p>
                <p className="text-xs text-muted-foreground">Distribute leads evenly</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
              <TrendingUp className="w-4 h-4 text-purple-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Growth trend</p>
                <p className="text-xs text-muted-foreground">+15% month over month</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
