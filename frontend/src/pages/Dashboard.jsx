import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Target,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

export default function Dashboard() {
  const { token, user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API}/api/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const stats = analytics ? [
    {
      title: 'Total Leads',
      value: analytics.total_leads,
      icon: Users,
      change: '+12%',
      positive: true,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500'
    },
    {
      title: 'Pipeline Value',
      value: formatCurrency(analytics.total_pipeline_value),
      icon: DollarSign,
      change: '+8%',
      positive: true,
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500'
    },
    {
      title: 'Won Revenue',
      value: formatCurrency(analytics.won_deals_value),
      icon: TrendingUp,
      change: '+23%',
      positive: true,
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-500'
    },
    {
      title: 'Conversion Rate',
      value: `${analytics.conversion_rate}%`,
      icon: Target,
      change: analytics.conversion_rate > 20 ? '+5%' : '-2%',
      positive: analytics.conversion_rate > 20,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-500'
    }
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
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening with your sales today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div 
            key={stat.title} 
            className="elstar-stat-card animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground font-medium">{stat.title}</span>
              <div className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            <div className={`flex items-center text-xs ${stat.positive ? 'text-emerald-500' : 'text-red-500'}`}>
              {stat.positive ? (
                <ArrowUpRight className="w-3 h-3 mr-1" />
              ) : (
                <ArrowDownRight className="w-3 h-3 mr-1" />
              )}
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
              <p className="text-sm text-muted-foreground">Monthly revenue overview</p>
            </div>
          </div>
          <div className="h-48 flex items-end gap-3">
            {analytics?.monthly_revenue?.map((item, i) => {
              const maxRev = Math.max(...analytics.monthly_revenue.map(r => r.revenue)) || 1;
              const height = Math.max(20, (item.revenue / maxRev) * 160);
              return (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-primary rounded-t transition-all duration-500 hover:bg-primary/80"
                    style={{ height: `${height}px` }}
                  />
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
                const width = (count / max) * 100;
                return (
                  <div key={stage}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="capitalize text-muted-foreground">{stage.replace('_', ' ')}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${width}%` }}
                      />
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
          <div className="flex items-start gap-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Follow up recommended</p>
              <p className="text-xs text-muted-foreground">Deals in negotiation stage need attention.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
