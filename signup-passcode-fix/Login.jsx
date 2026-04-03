import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { Loader2, X, Eye, EyeOff } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Passcode modal state
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcode, setPasscode] = useState(['', '', '', '']);
  const [passcodeError, setPasscodeError] = useState('');
  const [verifyingPasscode, setVerifyingPasscode] = useState(false);

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

  // Handle passcode input change
  const handlePasscodeChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    if (value && !/^\d$/.test(value)) return; // Only allow digits
    
    const newPasscode = [...passcode];
    newPasscode[index] = value;
    setPasscode(newPasscode);
    setPasscodeError('');
    
    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`passcode-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Handle passcode key down for backspace
  const handlePasscodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !passcode[index] && index > 0) {
      const prevInput = document.getElementById(`passcode-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Handle passcode paste
  const handlePasscodePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 4);
    if (/^\d+$/.test(pastedData)) {
      const newPasscode = pastedData.split('').concat(['', '', '', '']).slice(0, 4);
      setPasscode(newPasscode);
      setPasscodeError('');
    }
  };

  // Verify passcode and navigate to signup
  const verifyPasscode = async () => {
    const fullPasscode = passcode.join('');
    if (fullPasscode.length !== 4) {
      setPasscodeError('Please enter all 4 digits');
      return;
    }
    
    setVerifyingPasscode(true);
    try {
      const response = await fetch(`${API}/api/signup-passcode/verify/${fullPasscode}`);
      const data = await response.json();
      
      if (data.valid) {
        setShowPasscodeModal(false);
        setPasscode(['', '', '', '']);
        navigate('/register');
      } else {
        setPasscodeError('Invalid passcode. Please try again.');
      }
    } catch (error) {
      setPasscodeError('Failed to verify passcode. Please try again.');
    } finally {
      setVerifyingPasscode(false);
    }
  };

  // Handle signup click - show passcode modal
  const handleSignupClick = (e) => {
    e.preventDefault();
    setShowPasscodeModal(true);
    setPasscode(['', '', '', '']);
    setPasscodeError('');
    // Focus first input after modal opens
    setTimeout(() => {
      const firstInput = document.getElementById('passcode-0');
      if (firstInput) firstInput.focus();
    }, 100);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 ai-gradient items-center justify-center p-12">
        <div className="max-w-md text-white">
          <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center mb-8">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-4">AISalesTask</h1>
          <p className="text-white/80 text-lg leading-relaxed">
            AI-powered sales management platform. Track leads, manage your pipeline, and close more deals.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 ai-gradient rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="text-xl font-bold">AISalesTask</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">Welcome back</h2>
            <p className="text-muted-foreground">Sign in to continue to your dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="elstar-input"
                data-testid="login-email-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="elstar-input"
                data-testid="login-password-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="elstar-btn-primary w-full h-11 flex items-center justify-center gap-2"
              data-testid="login-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <button 
              onClick={handleSignupClick} 
              className="text-primary hover:underline font-medium" 
              data-testid="register-link"
            >
              Create one
            </button>
          </p>
        </div>
      </div>

      {/* Passcode Modal */}
      {showPasscodeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" data-testid="passcode-modal">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-sm p-6 relative animate-fade-in">
            <button
              onClick={() => setShowPasscodeModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              data-testid="close-passcode-modal"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6">
              <div className="w-12 h-12 ai-gradient rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-1">Enter Access Code</h3>
              <p className="text-sm text-muted-foreground">Please enter the 4-digit passcode to continue</p>
            </div>
            
            <div className="flex justify-center gap-3 mb-4" onPaste={handlePasscodePaste}>
              {passcode.map((digit, index) => (
                <input
                  key={index}
                  id={`passcode-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePasscodeChange(index, e.target.value)}
                  onKeyDown={(e) => handlePasscodeKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-input rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-background"
                  data-testid={`passcode-input-${index}`}
                />
              ))}
            </div>
            
            {passcodeError && (
              <p className="text-red-500 text-sm text-center mb-4" data-testid="passcode-error">{passcodeError}</p>
            )}
            
            <button
              onClick={verifyPasscode}
              disabled={verifyingPasscode || passcode.some(d => !d)}
              className="elstar-btn-primary w-full h-11 flex items-center justify-center gap-2"
              data-testid="verify-passcode-btn"
            >
              {verifyingPasscode ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Continue to Sign Up'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
