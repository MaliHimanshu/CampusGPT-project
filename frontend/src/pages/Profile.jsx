import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import ToastContainer, { toast } from '../components/Toast';

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pw, setPw] = useState({ current: '', newPw: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    api.get('/profile')
      .then(r => { setProfile(r.data); localStorage.setItem('user', JSON.stringify(r.data)); })
      .catch(() => setProfile(JSON.parse(localStorage.getItem('user') || '{}')))
      .finally(() => setLoading(false));
  }, []);

  const initials = (profile?.name || profile?.email || 'U').slice(0, 2).toUpperCase();
  const fmtDate = s => { try { return new Date(s).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); } catch { return s || '–'; } };

  const handlePwChange = async () => {
    const e = {};
    if (!pw.current) e.current = 'Required';
    if (!pw.newPw) e.newPw = 'Required';
    else if (pw.newPw.length < 6) e.newPw = 'Min 6 characters';
    if (pw.newPw !== pw.confirm) e.confirm = 'Passwords do not match';
    if (Object.keys(e).length) { setPwErrors(e); return; }
    setPwLoading(true); setPwErrors({});
    try {
      await api.patch('/profile/password', { current_password: pw.current, new_password: pw.newPw });
      toast('Password updated', 'success');
      setPw({ current: '', newPw: '', confirm: '' });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update password';
      setPwErrors({ general: msg });
      toast(msg, 'error');
    } finally { setPwLoading(false); }
  };

  if (loading) return (
    <div style={{ padding: 40 }}>
      <div className="skeleton" style={{ height: 28, width: 200, marginBottom: 24 }} />
      <div className="skeleton" style={{ height: 140, borderRadius: 18 }} />
    </div>
  );

  return (
    <div className="fade-in">
      <ToastContainer />
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Account</div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Your account details and security settings</p>
        </div>
      </div>

      <div className="page-body stagger-in" style={{ maxWidth: 580 }}>
        {/* Avatar card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 22, marginBottom: 18, background: 'linear-gradient(135deg, var(--glass-bg), rgba(14,21,38,0.4))' }}>
          <div style={{ position: 'relative' }}>
            <div className="profile-avatar-lg">{initials}</div>
            <div className="profile-avatar-ring" />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 900, marginBottom: 4 }}>
              {profile?.name || '–'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '.875rem', marginBottom: 10 }}>
              {profile?.email || '–'}
            </p>
            <span className="badge badge-gold">🎓 Student</span>
          </div>
        </div>

        {/* Account info */}
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="profile-section-title">Account Information</div>
          {[
            ['Full name', profile?.name || '–'],
            ['Email address', profile?.email || '–'],
            ['Member since', fmtDate(profile?.created_at)],
            ['Account ID', `#${profile?.id || '–'}`],
          ].map(([label, value]) => (
            <div key={label} className="info-row">
              <span className="info-label">{label}</span>
              <span className="info-value" style={label === 'Account ID' ? { fontFamily: 'var(--font-mono)', fontSize: '.8rem', color: 'var(--text-muted)' } : {}}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Change password */}
        <div className="card" style={{ marginBottom: 18 }}>
          <div className="profile-section-title">Change Password</div>
          {pwErrors.general && (
            <div className="auth-error-banner">
              ⚠ {pwErrors.general}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              ['Current password', 'current', 'Current password'],
              ['New password', 'newPw', 'Min 6 characters'],
              ['Confirm new password', 'confirm', 'Repeat new password'],
            ].map(([label, key, placeholder]) => (
              <div key={key} className="form-group">
                <label className="form-label">{label}</label>
                <input className={`form-input ${pwErrors[key] ? 'error' : ''}`} type="password"
                  placeholder={placeholder} value={pw[key]}
                  onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))} />
                {pwErrors[key] && <span className="form-error">{pwErrors[key]}</span>}
              </div>
            ))}
            <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={handlePwChange} disabled={pwLoading}>
              {pwLoading ? <><span className="spinner" />Updating…</> : '🔒 Update password'}
            </button>
          </div>
        </div>

        {/* Sign out */}
        <div className="card" style={{ borderColor: 'rgba(248,113,113,.15)' }}>
          <div className="profile-section-title" style={{ color: 'var(--error)' }}>Session</div>
          <p style={{ fontSize: '.875rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
            Sign out of your account on this device.
          </p>
          <button className="btn btn-danger" onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/');
          }}>
            🚪 Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
