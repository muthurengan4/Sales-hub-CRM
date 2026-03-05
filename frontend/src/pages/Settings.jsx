import React from 'react';
import { useAuth, useTheme } from '../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { Moon, Sun, User, Shield, Sparkles } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-3xl" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            <CardTitle>Profile</CardTitle>
          </div>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="font-semibold text-lg">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Badge variant="secondary" className="mt-1 capitalize">{user?.role?.replace('_', ' ')}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>Customize your interface</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="dark-mode" className="font-medium">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark themes
              </p>
            </div>
            <Switch
              id="dark-mode"
              checked={theme === 'dark'}
              onCheckedChange={toggleTheme}
              data-testid="dark-mode-switch"
            />
          </div>
        </CardContent>
      </Card>

      {/* AI Features Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md ai-gradient">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <CardTitle className="ai-text">AI Features</CardTitle>
          </div>
          <CardDescription>AI-powered capabilities in your CRM</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
              <div>
                <p className="font-medium text-sm">Lead Scoring</p>
                <p className="text-xs text-muted-foreground">AI analyzes leads and provides scores from 0-100</p>
              </div>
              <Badge className="ml-auto">Active</Badge>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
              <div>
                <p className="font-medium text-sm">Deal Health Monitoring</p>
                <p className="text-xs text-muted-foreground">Track deal progress and identify risks</p>
              </div>
              <Badge className="ml-auto">Active</Badge>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
              <div>
                <p className="font-medium text-sm">Insights Generation</p>
                <p className="text-xs text-muted-foreground">Get AI-powered recommendations for your pipeline</p>
              </div>
              <Badge className="ml-auto">Active</Badge>
            </div>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">
            Powered by Claude Sonnet 4.5 • AI features use Emergent LLM integration
          </p>
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>Account security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium text-sm">Authentication</p>
              <p className="text-xs text-muted-foreground">JWT-based secure authentication</p>
            </div>
            <Badge variant="outline" className="text-emerald-500 border-emerald-500/20">Secured</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium text-sm">Session</p>
              <p className="text-xs text-muted-foreground">24-hour token expiration</p>
            </div>
            <Badge variant="outline">Active</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
