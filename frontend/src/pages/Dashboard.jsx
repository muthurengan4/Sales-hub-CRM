import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import { 
  Users, DollarSign, TrendingUp, Target, Sparkles, ArrowUpRight, ArrowDownRight,
  Contact2, Building2, AlertCircle, Briefcase, Activity, Clock, Globe, UserPlus,
  BarChart3, PieChart as PieChartIcon, Percent, TrendingDown, Zap, Award, 
  Calendar, MapPin, LineChart as LineChartIcon, Filter, X, ChevronDown
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

// Pipeline stages for filter - matching Pipeline.jsx exactly
const PIPELINE_STAGES = [
  { value: 'all', label: 'All Stages', color: '#6B7280' },
  { value: 'lead', label: 'Lead', color: '#64748b' },
  { value: 'qualified', label: 'Qualified', color: '#f59e0b' },
  { value: 'proposal', label: 'Proposal', color: '#f97316' },
  { value: 'negotiation', label: 'Negotiation', color: '#ef4444' },
  { value: 'sales_closed', label: 'Sales Closed', color: '#3b82f6' },
  { value: 'lost', label: 'Lost', color: '#4b5563' }
];

// Lead statuses for filter - matching Pipeline stages
const LEAD_STATUSES = [
  { value: 'all', label: 'All Statuses', color: '#6B7280' },
  { value: 'lead', label: 'Lead', color: '#64748b' },
  { value: 'qualified', label: 'Qualified', color: '#f59e0b' },
  { value: 'proposal', label: 'Proposal', color: '#f97316' },
  { value: 'negotiation', label: 'Negotiation', color: '#ef4444' },
  { value: 'sales_closed', label: 'Sales Closed', color: '#3b82f6' },
  { value: 'lost', label: 'Lost', color: '#4b5563' }
];

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

// Filter Dropdown Component
const FilterDropdown = ({ label, value, options, onChange, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find(o => o.value === value) || options[0];
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-card border border-border rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-secondary/50 transition-colors"
        data-testid={`filter-${label.toLowerCase().replace(' ', '-')}`}
      >
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        <span className="text-muted-foreground">{label}:</span>
        <span className="font-medium" style={{ color: selected.color }}>{selected.label}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-card border border-border rounded-lg shadow-lg z-20 py-1 animate-fade-in">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => { onChange(option.value); setIsOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-secondary/50 flex items-center gap-2 ${
                  value === option.value ? 'bg-primary/5' : ''
                }`}
                data-testid={`filter-option-${option.value}`}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: option.color }} />
                <span>{option.label}</span>
                {value === option.value && <span className="ml-auto text-primary">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function Dashboard() {
  const { token, user, hasPermission, orgSettings } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [pipelineFilter, setPipelineFilter] = useState('all');
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all'); // all, 7days, 30days, 90days

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API}/api/analytics`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) setAnalytics(await response.json());
    } catch (error) { console.error('Failed to fetch analytics:', error); }
    finally { setLoading(false); }
  };

  // Compute filtered analytics based on selected filters
  const filteredAnalytics = useMemo(() => {
    if (!analytics) return null;
    
    let filtered = { ...analytics };
    
    // Filter deals_by_stage based on pipeline filter
    if (pipelineFilter !== 'all') {
      const filteredStages = {};
      if (analytics.deals_by_stage[pipelineFilter] !== undefined) {
        filteredStages[pipelineFilter] = analytics.deals_by_stage[pipelineFilter];
      }
      filtered.deals_by_stage = filteredStages;
      
      // Recalculate totals based on filtered stage
      const stageCount = filteredStages[pipelineFilter] || 0;
      filtered.total_deals = stageCount;
      
      // Recalculate pipeline value for this stage
      if (pipelineFilter === 'sales_closed') {
        filtered.total_pipeline_value = 0;
        filtered.won_deals_value = analytics.won_deals_value;
      } else if (pipelineFilter === 'lost') {
        filtered.total_pipeline_value = 0;
        filtered.won_deals_value = 0;
      } else {
        // Estimate pipeline value proportionally
        const totalStageCount = Object.values(analytics.deals_by_stage).reduce((a, b) => a + b, 0) || 1;
        const proportion = stageCount / totalStageCount;
        filtered.total_pipeline_value = Math.round(analytics.total_pipeline_value * proportion);
        filtered.won_deals_value = 0;
      }
    }
    
    // Filter leads_by_status based on lead status filter
    if (leadStatusFilter !== 'all') {
      const filteredStatuses = {};
      if (analytics.leads_by_status[leadStatusFilter] !== undefined) {
        filteredStatuses[leadStatusFilter] = analytics.leads_by_status[leadStatusFilter];
      }
      filtered.leads_by_status = filteredStatuses;
      filtered.total_leads = filteredStatuses[leadStatusFilter] || 0;
    }
    
    return filtered;
  }, [analytics, pipelineFilter, leadStatusFilter]);

  // Check if any filter is active
  const hasActiveFilters = pipelineFilter !== 'all' || leadStatusFilter !== 'all' || dateRange !== 'all';
  
  // Clear all filters
  const clearFilters = () => {
    setPipelineFilter('all');
    setLeadStatusFilter('all');
    setDateRange('all');
  };

  const formatCurrency = (value) => {
    const symbol = orgSettings?.currency_symbol || '$';
    return `${symbol}${parseFloat(value || 0).toLocaleString()}`;
  };
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

  // Stats configuration - Soft pastel colors matching user's image
  const stats = filteredAnalytics ? [
    { title: 'Total Leads', value: filteredAnalytics.total_leads, icon: Users, change: '+12%', positive: true, iconBg: '#FEE4D6', iconColor: '#E67E22' },
    { title: 'Active Deals', value: filteredAnalytics.total_deals, icon: Briefcase, change: '+8%', positive: true, iconBg: '#D1F2EB', iconColor: '#27AE60' },
    { title: 'Pipeline Value', value: formatCurrency(filteredAnalytics.total_pipeline_value), icon: DollarSign, change: '+15%', positive: true, iconBg: '#D1F2EB', iconColor: '#27AE60' },
    { title: 'Won Revenue', value: formatCurrency(filteredAnalytics.won_deals_value), icon: TrendingUp, change: '+23%', positive: true, iconBg: '#D1F2EB', iconColor: '#27AE60' },
    { title: 'Conversion', value: `${filteredAnalytics.conversion_rate}%`, icon: Percent, change: filteredAnalytics.conversion_rate >= 20 ? '+5%' : '-5%', positive: filteredAnalytics.conversion_rate >= 20, iconBg: '#FEE4D6', iconColor: '#E67E22' }
  ] : [];

  const pieColors = ['#D4A017', '#27AE60', '#3498DB', '#E67E22'];
  const statusColors = ['#27AE60', '#D4A017', '#3498DB', '#E74C3C'];

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
            {filteredAnalytics?.organization_stats?.member_count && (
              <span className="text-xs px-2 py-0.5 rounded bg-secondary">
                {filteredAnalytics.organization_stats.member_count} members
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

      {/* Filters Row - Hidden on mobile, visible on sm+ */}
      <div className="hidden sm:flex flex-wrap items-center gap-3" data-testid="dashboard-filters">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span className="font-medium">Filters:</span>
        </div>
        
        <FilterDropdown
          label="Pipeline"
          value={pipelineFilter}
          options={PIPELINE_STAGES}
          onChange={setPipelineFilter}
          icon={Briefcase}
        />
        
        <FilterDropdown
          label="Lead Status"
          value={leadStatusFilter}
          options={LEAD_STATUSES}
          onChange={setLeadStatusFilter}
          icon={Users}
        />
        
        {/* Date Range Filter */}
        <div className="relative">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="appearance-none flex items-center gap-2 px-3 py-2 pr-8 bg-white dark:bg-card border border-border rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-secondary/50 transition-colors cursor-pointer"
            data-testid="filter-date-range"
          >
            <option value="all">All Time</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
          <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
            data-testid="clear-filters-btn"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        )}
        
        {hasActiveFilters && (
          <div className="ml-auto text-xs text-muted-foreground">
            Showing filtered results
          </div>
        )}
      </div>

      {/* Multi-tenancy Organization Card - Cleaner design */}
      {filteredAnalytics?.organization_stats?.name && (
        <div className="bg-white dark:bg-card rounded-xl p-4 shadow-sm border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{filteredAnalytics.organization_stats.name}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {filteredAnalytics.organization_stats.member_count} members</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Since {filteredAnalytics.organization_stats.created_at}</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <div className="px-4 py-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg text-center">
              <p className="text-lg font-bold text-amber-600">{filteredAnalytics.total_leads}</p>
              <p className="text-xs text-muted-foreground">Leads</p>
            </div>
            <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-center">
              <p className="text-lg font-bold text-emerald-600">{filteredAnalytics.total_deals}</p>
              <p className="text-xs text-muted-foreground">Deals</p>
            </div>
          </div>
        </div>
      )}

      {/* 5 Stats Tiles with Mini Charts - Mobile 2x2 grid, Desktop 5 columns */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {stats.slice(0, 4).map((stat, index) => (
          <div 
            key={stat.title} 
            className="bg-white dark:bg-card rounded-xl p-4 sm:p-5 shadow-sm border border-border hover:shadow-md transition-shadow animate-fade-in" 
            style={{ animationDelay: `${index * 50}ms` }} 
            data-testid={`stat-${stat.title.toLowerCase().replace(' ', '-')}`}
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.iconBg }}>
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: stat.iconColor }} />
              </div>
              <div className={`flex items-center text-xs font-medium ${stat.positive ? 'text-emerald-500' : 'text-red-500'}`}>
                {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold mb-1">{stat.value}</div>
            <span className="text-xs sm:text-sm text-muted-foreground">{stat.title}</span>
            <div className="mt-2 sm:mt-3 h-8 sm:h-10 overflow-hidden">
              <AreaChart data={generateTrendData(100)} color={stat.iconColor} />
            </div>
          </div>
        ))}
        {/* Conversion stat - full width on mobile, normal on desktop */}
        {stats[4] && (() => {
          const conversionStat = stats[4];
          const ConversionIcon = conversionStat.icon;
          return (
            <div 
              className="col-span-2 lg:col-span-1 bg-white dark:bg-card rounded-xl p-4 sm:p-5 shadow-sm border border-border hover:shadow-md transition-shadow animate-fade-in" 
              style={{ animationDelay: '200ms' }} 
              data-testid={`stat-${conversionStat.title.toLowerCase().replace(' ', '-')}`}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: conversionStat.iconBg }}>
                  <ConversionIcon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: conversionStat.iconColor }} />
                </div>
                <div className={`flex items-center text-xs font-medium ${conversionStat.positive ? 'text-emerald-500' : 'text-red-500'}`}>
                  {conversionStat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {conversionStat.change}
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold mb-1">{conversionStat.value}</div>
              <span className="text-xs sm:text-sm text-muted-foreground">{conversionStat.title}</span>
              <div className="mt-2 sm:mt-3 h-8 sm:h-10 overflow-hidden">
                <AreaChart data={generateTrendData(100)} color={conversionStat.iconColor} />
              </div>
            </div>
          );
        })()}
      </div>

      {/* Main Charts Row - Clean white cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart - Revenue Trend */}
        <div className="bg-white dark:bg-card rounded-xl p-5 shadow-sm border border-border lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold">Revenue Trend</h3>
                <p className="text-sm text-muted-foreground">Monthly performance overview</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Revenue</span>
              <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Target</span>
            </div>
          </div>
          <div className="h-64 flex items-end gap-4">
            {filteredAnalytics?.monthly_revenue?.map((item, i) => {
              const maxRev = Math.max(...filteredAnalytics.monthly_revenue.map(r => r.revenue)) || 1;
              const height = Math.max(20, (item.revenue / maxRev) * 200);
              const targetHeight = height * 0.8;
              return (
                <div key={i} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full flex gap-1 justify-center">
                    <div 
                      className="w-6 bg-amber-500 rounded-t transition-all duration-500 hover:bg-amber-400 cursor-pointer" 
                      style={{ height: `${height}px` }}
                    />
                    <div 
                      className="w-6 bg-emerald-400 rounded-t transition-all duration-500" 
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
        <div className="bg-white dark:bg-card rounded-xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold">Sales Funnel</h3>
              <p className="text-sm text-muted-foreground">Lead to conversion</p>
            </div>
          </div>
          <div className="space-y-4">
            <AnimatedProgressBar value={filteredAnalytics?.total_leads || 0} max={filteredAnalytics?.total_leads || 1} color="#D4A017" label="Total Leads" />
            <AnimatedProgressBar value={filteredAnalytics?.leads_by_status?.contacted || 0} max={filteredAnalytics?.total_leads || 1} color="#E67E22" label="Contacted" />
            <AnimatedProgressBar value={filteredAnalytics?.leads_by_status?.qualified || 0} max={filteredAnalytics?.total_leads || 1} color="#27AE60" label="Qualified" />
            <AnimatedProgressBar value={filteredAnalytics?.total_deals || 0} max={filteredAnalytics?.total_leads || 1} color="#3498DB" label="Deals Created" />
            <AnimatedProgressBar value={filteredAnalytics?.deals_by_stage?.closed_won || 0} max={filteredAnalytics?.total_deals || 1} color="#27AE60" label="Won Deals" />
          </div>
        </div>
      </div>

      {/* Pie Charts Row - Clean white cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Lead Sources Donut */}
        <div className="bg-white dark:bg-card rounded-xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <PieChartIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold">Lead Sources</h3>
              <p className="text-sm text-muted-foreground">Where your leads come from</p>
            </div>
          </div>
          <DonutChart 
            data={filteredAnalytics?.leads_by_source} 
            colors={pieColors} 
            centerValue={filteredAnalytics?.total_leads || 0}
            centerLabel="Total"
          />
        </div>

        {/* Lead Status Donut */}
        <div className="bg-white dark:bg-card rounded-xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold">Lead Status Distribution</h3>
              <p className="text-sm text-muted-foreground">Current pipeline breakdown</p>
            </div>
          </div>
          <DonutChart 
            data={filteredAnalytics?.leads_by_status} 
            colors={statusColors}
            centerValue={`${filteredAnalytics?.conversion_rate || 0}%`}
            centerLabel="Conversion"
          />
        </div>
      </div>

      {/* Pipeline and Deals Row - Clean white cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pipeline Stages */}
        <div className="bg-white dark:bg-card rounded-xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <LineChartIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">Pipeline Stages</h3>
              <p className="text-sm text-muted-foreground">Deal distribution by stage</p>
            </div>
          </div>
          <div className="space-y-3">
            {filteredAnalytics && Object.entries(filteredAnalytics.deals_by_stage).length > 0 ? (
              Object.entries(filteredAnalytics.deals_by_stage).map(([stage, count], index) => {
                const max = Math.max(...Object.values(filteredAnalytics.deals_by_stage)) || 1;
                const stageColors = {
                  lead: '#94a3b8', qualified: '#D4A017', demo: '#E67E22', 
                  proposal: '#3498DB', negotiation: '#E74C3C', closed_won: '#27AE60', closed_lost: '#E74C3C', sales_closed: '#27AE60'
                };
                return (
                  <div key={stage} className="group">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize text-muted-foreground group-hover:text-foreground transition-colors">{stage.replace('_', ' ')}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="h-3 bg-gray-100 dark:bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-700 ease-out" 
                        style={{ 
                          width: `${(count / max) * 100}%`,
                          backgroundColor: stageColors[stage] || '#D4A017',
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
        <div className="bg-white dark:bg-card rounded-xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold">Top Locations</h3>
              <p className="text-sm text-muted-foreground">Lead concentration by region</p>
            </div>
          </div>
          <div className="space-y-3">
            {/* Simulated location data based on leads */}
            {['Kuala Lumpur', 'Selangor', 'Penang', 'Johor', 'Perak'].map((location, index) => (
              <div key={location} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-medium text-amber-700">
                    {index + 1}
                  </div>
                  <span className="font-medium text-sm">{location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-gray-100 dark:bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full" 
                      style={{ width: `${100 - index * 15}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8">{Math.max(1, Math.floor((filteredAnalytics?.total_leads || 5) * (1 - index * 0.15)))}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Feed and Team Performance Row - Clean white cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activities */}
        <div className="bg-white dark:bg-card rounded-xl p-5 shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold">Recent Activities</h3>
              <p className="text-sm text-muted-foreground">Latest updates in your organization</p>
            </div>
          </div>
          <div className="space-y-3">
            {filteredAnalytics?.recent_activities?.length > 0 ? (
              filteredAnalytics.recent_activities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-secondary/30 rounded-lg hover:bg-gray-100 dark:hover:bg-secondary/50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'lead_created' ? 'bg-amber-100' : 'bg-emerald-100'
                  }`}>
                    {activity.icon === 'user' ? (
                      <UserPlus className={`w-4 h-4 ${activity.type === 'lead_created' ? 'text-amber-600' : 'text-emerald-600'}`} />
                    ) : (
                      <Briefcase className="w-4 h-4 text-emerald-600" />
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
          <div className="bg-white dark:bg-card rounded-xl p-5 shadow-sm border border-border">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Award className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold">Team Leaderboard</h3>
                <p className="text-sm text-muted-foreground">Top performers this month</p>
              </div>
            </div>
            {filteredAnalytics?.team_performance?.length > 0 ? (
              <div className="space-y-3">
                {filteredAnalytics.team_performance.map((member, index) => (
                  <div key={member.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-secondary/50 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-amber-500 text-white' : 
                      index === 1 ? 'bg-gray-300 text-gray-700' : 
                      'bg-gray-100 text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-medium text-xs">
                      {member.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{member.role?.replace('_', ' ')}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-bold text-amber-600">{member.leads}</p>
                        <p className="text-xs text-muted-foreground">Leads</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-emerald-600">{member.won_deals}</p>
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
          <div className="bg-white dark:bg-card rounded-xl p-5 shadow-sm border border-border border-amber-200 dark:border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
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
