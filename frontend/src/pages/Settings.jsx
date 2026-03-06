import React from 'react';
import { useAuth, useTheme } from '../App';
import { Moon, Sun, User, Shield, Sparkles, Check } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="max-w-3xl space-y-6" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="elstar-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <User className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="font-semibold">Profile</h2>
            <p className="text-sm text-muted-foreground">Your account information</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg">
          <div className="elstar-avatar w-16 h-16 text-xl">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <p className="text-lg font-semibold">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium capitalize">
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Appearance Card */}
      <div className="elstar-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-amber-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
          </div>
          <div>
            <h2 className="font-semibold">Appearance</h2>
            <p className="text-sm text-muted-foreground">Customize your interface</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
          <div>
            <p className="font-medium">Dark Mode</p>
            <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-14 h-8 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-secondary'}`}
            data-testid="dark-mode-switch"
          >
            <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* AI Features Card */}
      <div className="elstar-card p-6 border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg ai-gradient flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold ai-text">AI Features</h2>
            <p className="text-sm text-muted-foreground">AI-powered capabilities in SalesHub</p>
          </div>
        </div>
        
        <div className="space-y-3">
          {[
            { name: 'Lead Scoring', desc: 'AI analyzes leads and provides scores from 0-100' },
            { name: 'Deal Health Monitoring', desc: 'Track deal progress and identify risks' },
            { name: 'Insights Generation', desc: 'Get AI-powered recommendations for your pipeline' }
          ].map((feature) => (
            <div key={feature.name} className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-emerald-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">{feature.name}</p>
                  <p className="text-xs text-muted-foreground">{feature.desc}</p>
                </div>
              </div>
              <span className="elstar-badge elstar-badge-success">Active</span>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">Powered by Claude Sonnet 4.5 • AI features use Emergent LLM integration</p>
        </div>
      </div>

      {/* Security Card */}
      <div className="elstar-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="font-semibold">Security</h2>
            <p className="text-sm text-muted-foreground">Account security settings</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
            <div>
              <p className="font-medium text-sm">Authentication</p>
              <p className="text-xs text-muted-foreground">JWT-based secure authentication</p>
            </div>
            <span className="elstar-badge elstar-badge-success">Secured</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
            <div>
              <p className="font-medium text-sm">Session</p>
              <p className="text-xs text-muted-foreground">24-hour token expiration</p>
            </div>
            <span className="elstar-badge elstar-badge-info">Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
