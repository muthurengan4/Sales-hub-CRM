import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';

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

  if (loading) {
    return (
      <div className="has-text-centered p-6">
        <span className="loader"></span>
      </div>
    );
  }

  const stats = analytics ? [
    { title: 'Total Leads', value: analytics.total_leads, icon: '👥', color: 'is-info' },
    { title: 'Pipeline Value', value: formatCurrency(analytics.total_pipeline_value), icon: '💰', color: 'is-success' },
    { title: 'Won Revenue', value: formatCurrency(analytics.won_deals_value), icon: '📈', color: 'is-link' },
    { title: 'Conversion Rate', value: `${analytics.conversion_rate}%`, icon: '🎯', color: 'is-warning' }
  ] : [];

  return (
    <div data-testid="dashboard">
      {/* Header */}
      <div className="mb-5">
        <h1 className="title is-3">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="subtitle is-6 has-text-grey">Here's what's happening with your sales pipeline today.</p>
      </div>

      {/* Stats Grid */}
      <div className="columns is-multiline">
        {stats.map((stat, index) => (
          <div className="column is-6-tablet is-3-desktop" key={index}>
            <div className="box">
              <div className="is-flex is-justify-content-space-between is-align-items-center mb-3">
                <span className="is-size-7 has-text-grey has-text-weight-medium">{stat.title}</span>
                <span className={`tag ${stat.color} is-light`}>{stat.icon}</span>
              </div>
              <p className="title is-4 mb-1">{stat.value}</p>
              <p className="is-size-7 has-text-success">
                ↑ +12% from last month
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="columns">
        <div className="column is-6">
          <div className="box">
            <h2 className="title is-5 mb-4">
              <span className="mr-2">📈</span>
              Revenue Trend
            </h2>
            <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '1rem 0' }}>
              {analytics?.monthly_revenue?.map((item, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div 
                    style={{ 
                      width: '100%', 
                      background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                      borderRadius: '4px 4px 0 0',
                      height: `${Math.max(20, (item.revenue / (analytics.won_deals_value * 0.3 || 1)) * 150)}px`,
                      maxHeight: '150px'
                    }}
                  />
                  <span className="is-size-7 has-text-grey mt-2">{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="column is-6">
          <div className="box">
            <h2 className="title is-5 mb-4">
              <span className="mr-2">🎯</span>
              Pipeline Overview
            </h2>
            <div style={{ padding: '1rem 0' }}>
              {analytics && Object.entries(analytics.deals_by_stage).map(([stage, count]) => (
                <div key={stage} className="mb-3">
                  <div className="is-flex is-justify-content-space-between mb-1">
                    <span className="is-size-7 has-text-weight-medium" style={{ textTransform: 'capitalize' }}>
                      {stage.replace('_', ' ')}
                    </span>
                    <span className="is-size-7 has-text-grey">{count}</span>
                  </div>
                  <progress 
                    className="progress is-small is-link" 
                    value={count} 
                    max={Math.max(...Object.values(analytics.deals_by_stage), 1)}
                  />
                </div>
              ))}
              {(!analytics || Object.keys(analytics.deals_by_stage).length === 0) && (
                <p className="has-text-grey has-text-centered">No deals yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="box" style={{ border: '1px solid rgba(99, 102, 241, 0.3)' }}>
        <h2 className="title is-5 mb-4">
          <span className="ai-gradient mr-2" style={{ width: '28px', height: '28px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: '12px' }}>✦</span>
          </span>
          <span className="ai-text">AI Insights</span>
        </h2>
        
        <div className="content">
          <div className="message is-success is-small mb-3">
            <div className="message-body">
              <strong>Strong pipeline momentum</strong> - Your pipeline value has grown this month.
            </div>
          </div>
          <div className="message is-warning is-small mb-3">
            <div className="message-body">
              <strong>Focus on qualified leads</strong> - Review leads with high AI scores for demos.
            </div>
          </div>
          <div className="message is-info is-small">
            <div className="message-body">
              <strong>Follow up recommended</strong> - Deals in negotiation stage need attention.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
