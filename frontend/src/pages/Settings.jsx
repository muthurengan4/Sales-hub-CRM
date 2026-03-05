import React from 'react';
import { useAuth, useTheme } from '../App';

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div data-testid="settings-page" style={{ maxWidth: '700px' }}>
      {/* Header */}
      <div className="mb-5">
        <h1 className="title is-3">Settings</h1>
        <p className="subtitle is-6 has-text-grey">Manage your account and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="box mb-5">
        <h2 className="title is-5 mb-4">
          <span className="mr-2">👤</span>
          Profile
        </h2>
        <p className="subtitle is-6 has-text-grey mb-4">Your account information</p>
        
        <div className="is-flex is-align-items-center">
          <div 
            style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: 'rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '1rem'
            }}
          >
            <span className="has-text-link is-size-3 has-text-weight-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <p className="title is-5 mb-1">{user?.name}</p>
            <p className="is-size-7 has-text-grey mb-2">{user?.email}</p>
            <span className="tag is-light" style={{ textTransform: 'capitalize' }}>
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Appearance Card */}
      <div className="box mb-5">
        <h2 className="title is-5 mb-4">
          <span className="mr-2">{theme === 'dark' ? '🌙' : '☀️'}</span>
          Appearance
        </h2>
        <p className="subtitle is-6 has-text-grey mb-4">Customize your interface</p>
        
        <div className="is-flex is-justify-content-space-between is-align-items-center">
          <div>
            <p className="has-text-weight-medium">Dark Mode</p>
            <p className="is-size-7 has-text-grey">Switch between light and dark themes</p>
          </div>
          <div className="field">
            <input 
              id="darkModeSwitch" 
              type="checkbox" 
              className="switch is-rounded is-link"
              checked={theme === 'dark'}
              onChange={toggleTheme}
              data-testid="dark-mode-switch"
            />
            <label htmlFor="darkModeSwitch">
              <button 
                className={`button is-small ${theme === 'dark' ? 'is-link' : 'is-light'}`}
                onClick={toggleTheme}
              >
                {theme === 'dark' ? 'Dark' : 'Light'}
              </button>
            </label>
          </div>
        </div>
      </div>

      {/* AI Features Card */}
      <div className="box mb-5" style={{ border: '1px solid rgba(99, 102, 241, 0.3)' }}>
        <h2 className="title is-5 mb-4">
          <span className="ai-gradient mr-2" style={{ width: '28px', height: '28px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: '12px' }}>✦</span>
          </span>
          <span className="ai-text">AI Features</span>
        </h2>
        <p className="subtitle is-6 has-text-grey mb-4">AI-powered capabilities in your CRM</p>
        
        <div className="message is-success is-small mb-3">
          <div className="message-body">
            <div className="is-flex is-justify-content-space-between is-align-items-center">
              <div>
                <p className="has-text-weight-medium">Lead Scoring</p>
                <p className="is-size-7">AI analyzes leads and provides scores from 0-100</p>
              </div>
              <span className="tag is-success">Active</span>
            </div>
          </div>
        </div>
        
        <div className="message is-success is-small mb-3">
          <div className="message-body">
            <div className="is-flex is-justify-content-space-between is-align-items-center">
              <div>
                <p className="has-text-weight-medium">Deal Health Monitoring</p>
                <p className="is-size-7">Track deal progress and identify risks</p>
              </div>
              <span className="tag is-success">Active</span>
            </div>
          </div>
        </div>
        
        <div className="message is-success is-small">
          <div className="message-body">
            <div className="is-flex is-justify-content-space-between is-align-items-center">
              <div>
                <p className="has-text-weight-medium">Insights Generation</p>
                <p className="is-size-7">Get AI-powered recommendations for your pipeline</p>
              </div>
              <span className="tag is-success">Active</span>
            </div>
          </div>
        </div>
        
        <hr />
        <p className="is-size-7 has-text-grey">
          Powered by Claude Sonnet 4.5 • AI features use Emergent LLM integration
        </p>
      </div>

      {/* Security Card */}
      <div className="box">
        <h2 className="title is-5 mb-4">
          <span className="mr-2">🔒</span>
          Security
        </h2>
        <p className="subtitle is-6 has-text-grey mb-4">Account security settings</p>
        
        <div className="is-flex is-justify-content-space-between is-align-items-center mb-4">
          <div>
            <p className="has-text-weight-medium">Authentication</p>
            <p className="is-size-7 has-text-grey">JWT-based secure authentication</p>
          </div>
          <span className="tag is-success is-light">Secured</span>
        </div>
        
        <hr />
        
        <div className="is-flex is-justify-content-space-between is-align-items-center">
          <div>
            <p className="has-text-weight-medium">Session</p>
            <p className="is-size-7 has-text-grey">24-hour token expiration</p>
          </div>
          <span className="tag is-light">Active</span>
        </div>
      </div>
    </div>
  );
}
