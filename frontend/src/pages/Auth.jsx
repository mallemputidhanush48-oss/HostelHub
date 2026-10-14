import React, { useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Key, Mail, User, Phone, CheckCircle2, ShieldAlert } from 'lucide-react';
import { UserContext } from '../App';
import { api } from '../utils/api';

export default function Auth() {
  const { login } = useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('guest'); // 'guest' or 'owner'
  const [authMethod, setAuthMethod] = useState('email'); // 'email' or 'phone'

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  // OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // UI States
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const redirectPath = location.state?.from?.pathname || `/dashboard/${role}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (isLogin) {
        if (authMethod === 'email') {
          // Email Login
          const response = await api.post('/auth/login', { email, password });
          login(response.token, response.user);
          setSuccess('Login successful!');
          setTimeout(() => navigate(`/dashboard/${response.user.role}`), 1000);
        } else {
          // Phone OTP request/verify
          if (!otpSent) {
            const response = await api.post('/auth/phone/otp-request', { phone });
            setOtpSent(true);
            setSuccess(`Mock OTP sent! Use: ${response.otp} to verify.`);
          } else {
            // Verify
            const response = await api.post('/auth/phone/otp-verify', {
              phone,
              otp: otpCode,
              role
            });
            login(response.token, response.user);
            setSuccess('OTP login successful!');
            setTimeout(() => navigate(`/dashboard/${response.user.role}`), 1000);
          }
        }
      } else {
        // Register (always email/password)
        const response = await api.post('/auth/register', {
          email,
          phone: phone || null,
          password,
          full_name: fullName,
          role
        });
        login(response.token, response.user);
        setSuccess('Registration successful! Welcome.');
        setTimeout(() => navigate(`/dashboard/${response.user.role}`), 1000);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setSubmitting(false);
    }
  };

  // Simulated Google Sign-In
  const handleGoogleSignIn = () => {
    setError('');
    setSuccess('');
    setSubmitting(true);

    // Simulate popup loading
    setTimeout(async () => {
      try {
        const mockGoogleId = `google_id_${Math.floor(Math.random() * 10000000)}`;
        const mockName = isLogin ? 'Amit Patel' : fullName || 'Google User';
        const mockEmail = isLogin ? 'guest@hostelhub.com' : `g_user_${Date.now()}@gmail.com`;
        
        const response = await api.post('/auth/google', {
          google_id: mockGoogleId,
          email: mockEmail,
          full_name: mockName,
          profile_pic: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'
        });

        login(response.token, response.user);
        setSuccess('Google Login successful!');
        setTimeout(() => navigate(`/dashboard/${response.user.role}`), 1000);
      } catch (err) {
        setError(err.message || 'Google authentication failed.');
        setSubmitting(false);
      }
    }, 1200);
  };

  return (
    <div className="animate-fade-in" style={{
      maxWidth: '460px', margin: '60px auto', padding: '0 20px'
    }}>
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem' }}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '5px' }}>
            {isLogin ? 'Login to search and manage your PG rooms.' : 'Register to start booking accommodations.'}
          </p>
        </div>

        {/* Success/Error Alerts */}
        {error && (
          <div className="badge badge-danger" style={{ display: 'flex', gap: '8px', padding: '12px', borderRadius: 'var(--radius-sm)', width: '100%', textTransform: 'none' }}>
            <ShieldAlert size={18} /> <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="badge badge-success" style={{ display: 'flex', gap: '8px', padding: '12px', borderRadius: 'var(--radius-sm)', width: '100%', textTransform: 'none' }}>
            <CheckCircle2 size={18} /> <span>{success}</span>
          </div>
        )}

        {/* Tab Switch Login / Register */}
        <div style={{ display: 'flex', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: '4px' }}>
          <button 
            type="button" 
            onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
            style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontWeight: 600, background: isLogin ? 'var(--bg-secondary)' : 'transparent', boxShadow: isLogin ? 'var(--card-shadow)' : 'none' }}
          >
            Sign In
          </button>
          <button 
            type="button" 
            onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
            style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontWeight: 600, background: !isLogin ? 'var(--bg-secondary)' : 'transparent', boxShadow: !isLogin ? 'var(--card-shadow)' : 'none' }}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Sign Up Specific: Name */}
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
                <User size={18} color="var(--text-tertiary)" />
                <input 
                  type="text" 
                  placeholder="John Doe" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ width: '100%' }}
                  required
                />
              </div>
            </div>
          )}

          {/* Role selector for Registration or OTP signup */}
          {(!isLogin || (isLogin && authMethod === 'phone')) && (
            <div className="form-group">
              <label className="form-label">Are you a Guest or Hostel Owner?</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setRole('guest')}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                    background: role === 'guest' ? 'var(--primary-light)' : 'transparent',
                    borderColor: role === 'guest' ? 'var(--primary)' : 'var(--border-color)',
                    color: role === 'guest' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: 600
                  }}
                >
                  Guest User
                </button>
                <button
                  type="button"
                  onClick={() => setRole('owner')}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                    background: role === 'owner' ? 'var(--primary-light)' : 'transparent',
                    borderColor: role === 'owner' ? 'var(--primary)' : 'var(--border-color)',
                    color: role === 'owner' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: 600
                  }}
                >
                  Hostel Owner
                </button>
              </div>
            </div>
          )}

          {/* Auth Method (Email / Phone OTP) Toggles (Only during Login) */}
          {isLogin && (
            <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem' }}>
              <button 
                type="button" 
                onClick={() => { setAuthMethod('email'); setOtpSent(false); setError(''); }}
                style={{ color: authMethod === 'email' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: authMethod === 'email' ? 600 : 400 }}
              >
                Use Email Account
              </button>
              <span style={{ color: 'var(--text-tertiary)' }}>|</span>
              <button 
                type="button" 
                onClick={() => { setAuthMethod('phone'); setError(''); }}
                style={{ color: authMethod === 'phone' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: authMethod === 'phone' ? 600 : 400 }}
              >
                Use Phone + OTP Code
              </button>
            </div>
          )}

          {/* Render inputs based on active logic */}
          {authMethod === 'email' || !isLogin ? (
            <>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
                  <Mail size={18} color="var(--text-tertiary)" />
                  <input 
                    type="email" 
                    placeholder="john@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%' }}
                    required
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="form-group">
                  <label className="form-label">Phone (Optional)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
                    <Phone size={18} color="var(--text-tertiary)" />
                    <input 
                      type="tel" 
                      placeholder="9876543210" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
                  <Key size={18} color="var(--text-tertiary)" />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%' }}
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            // Phone Auth Section
            <>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
                  <Phone size={18} color="var(--text-tertiary)" />
                  <input 
                    type="tel" 
                    placeholder="9876543210" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ width: '100%' }}
                    disabled={otpSent}
                    required
                  />
                </div>
              </div>

              {otpSent && (
                <div className="form-group">
                  <label className="form-label">One-Time Password (OTP)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
                    <Key size={18} color="var(--text-tertiary)" />
                    <input 
                      type="text" 
                      placeholder="Enter verification code (123456)" 
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      style={{ width: '100%' }}
                      required
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={submitting}
            style={{ width: '100%', marginTop: '10px', minHeight: '48px' }}
          >
            {submitting ? 'Authenticating...' : isLogin ? (otpSent ? 'Verify OTP & Login' : (authMethod === 'phone' ? 'Request OTP Code' : 'Sign In')) : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          <span style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>OR CONTINUE WITH</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
        </div>

        {/* Google Sign In */}
        <button 
          onClick={handleGoogleSignIn}
          className="btn btn-secondary" 
          disabled={submitting}
          style={{ width: '100%', display: 'flex', justifySelf: 'center', gap: '10px' }}
        >
          <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google Account
        </button>
      </div>
    </div>
  );
}
