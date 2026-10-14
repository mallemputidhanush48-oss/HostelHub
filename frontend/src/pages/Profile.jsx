import React, { useState, useContext, useEffect } from 'react';
import { User, Mail, Phone, Key, ShieldCheck, CheckCircle2, ShieldAlert } from 'lucide-react';
import { UserContext } from '../App';
import { api } from '../utils/api';

export default function Profile() {
  const { user, refreshProfile } = useContext(UserContext);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [profilePic, setProfilePic] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setProfilePic(user.profile_pic || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const payload = { full_name: fullName, email, phone };
      if (password.trim()) {
        payload.password = password;
      }
      if (profilePic.trim()) {
        payload.profile_pic = profilePic;
      }

      await api.put('/auth/profile', payload);
      
      setSuccess('Profile updated successfully!');
      setPassword(''); // Reset password input
      refreshProfile(); // Update global context
    } catch (err) {
      setError(err.message || 'Error updating profile.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="container" style={{ marginTop: '80px', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>Please sign in to view your profile page.</p>
      </div>
    );
  }

  const avatarUrl = profilePic || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150';

  return (
    <div className="container animate-fade-in" style={{ marginTop: '40px', paddingBottom: '60px', maxWidth: '600px' }}>
      
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Header Profile Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <img 
            src={avatarUrl} 
            alt={fullName} 
            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }}
          />
          <div>
            <h2 style={{ fontSize: '1.8rem' }}>{fullName}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
              <span className={`badge ${user.role === 'admin' ? 'badge-danger' : user.role === 'owner' ? 'badge-info' : 'badge-success'}`}>
                {user.role} Account
              </span>
              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                Joined {new Date(user.created_at || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

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

        {/* Update Form */}
        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
              <User size={18} color="var(--text-tertiary)" />
              <input 
                type="text" 
                className="form-input"
                placeholder="Your Name" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
              <Mail size={18} color="var(--text-tertiary)" />
              <input 
                type="email" 
                className="form-input"
                placeholder="yourname@gmail.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
              <Phone size={18} color="var(--text-tertiary)" />
              <input 
                type="tel" 
                className="form-input"
                placeholder="Phone (optional)" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Avatar URL (Profile Pic)</label>
            <input 
              type="text" 
              className="form-input"
              placeholder="e.g. https://images.unsplash.com/..." 
              value={profilePic}
              onChange={(e) => setProfilePic(e.target.value)}
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
            />
          </div>

          <div className="form-group" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <label className="form-label">New Password (Leave blank to keep unchanged)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px 14px' }}>
              <Key size={18} color="var(--text-tertiary)" />
              <input 
                type="password" 
                className="form-input"
                placeholder="Enter new password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '48px', marginTop: '10px' }} disabled={submitting}>
            {submitting ? 'Updating...' : 'Update Details'}
          </button>
        </form>
      </div>
    </div>
  );
}
