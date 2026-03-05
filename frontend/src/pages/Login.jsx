import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }
      
      login(data.token, data.user);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-theme="dark">
      <section className="hero is-fullheight">
        <div className="hero-body">
          <div className="container">
            <div className="columns is-centered">
              <div className="column is-5-tablet is-4-desktop">
                <div className="box" style={{ borderRadius: '12px' }}>
                  <div className="has-text-centered mb-5">
                    <div 
                      className="ai-gradient" 
                      style={{ 
                        width: '60px', 
                        height: '60px', 
                        borderRadius: '12px', 
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1rem'
                      }}
                    >
                      <span style={{ fontSize: '24px', color: 'white' }}>✦</span>
                    </div>
                    <h1 className="title is-4">Welcome back</h1>
                    <p className="subtitle is-6 has-text-grey">Sign in to your CRM account</p>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="field">
                      <label className="label is-small">Email</label>
                      <div className="control">
                        <input
                          className="input"
                          type="email"
                          placeholder="you@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          data-testid="login-email-input"
                        />
                      </div>
                    </div>

                    <div className="field">
                      <label className="label is-small">Password</label>
                      <div className="control">
                        <input
                          className="input"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          data-testid="login-password-input"
                        />
                      </div>
                    </div>

                    <div className="field mt-5">
                      <button
                        type="submit"
                        className={`button is-link is-fullwidth ${loading ? 'is-loading' : ''}`}
                        disabled={loading}
                        data-testid="login-submit-btn"
                        style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', border: 'none' }}
                      >
                        Sign in
                      </button>
                    </div>
                  </form>

                  <p className="has-text-centered mt-4 is-size-7">
                    Don't have an account?{' '}
                    <Link to="/register" className="has-text-link" data-testid="register-link">
                      Create one
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
