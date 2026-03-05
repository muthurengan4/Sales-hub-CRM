import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }
      
      login(data.token, data.user);
      toast.success('Account created successfully!');
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
                    <h1 className="title is-4">Create account</h1>
                    <p className="subtitle is-6 has-text-grey">Get started with AI-powered CRM</p>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="field">
                      <label className="label is-small">Full Name</label>
                      <div className="control">
                        <input
                          className="input"
                          type="text"
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          data-testid="register-name-input"
                        />
                      </div>
                    </div>

                    <div className="field">
                      <label className="label is-small">Email</label>
                      <div className="control">
                        <input
                          className="input"
                          type="email"
                          placeholder="you@company.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          data-testid="register-email-input"
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
                          data-testid="register-password-input"
                        />
                      </div>
                    </div>

                    <div className="field mt-5">
                      <button
                        type="submit"
                        className={`button is-link is-fullwidth ${loading ? 'is-loading' : ''}`}
                        disabled={loading}
                        data-testid="register-submit-btn"
                        style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', border: 'none' }}
                      >
                        Create account
                      </button>
                    </div>
                  </form>

                  <p className="has-text-centered mt-4 is-size-7">
                    Already have an account?{' '}
                    <Link to="/login" className="has-text-link" data-testid="login-link">
                      Sign in
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
