import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import ToastContainer, { toast } from '../components/Toast';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true); setErrors({});
    try {
      const params = new URLSearchParams();
      params.append('username', form.email);
      params.append('password', form.password);
      const res = await api.post('/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      localStorage.setItem('token', res.data.access_token);
      try {
        const me = await api.get('/profile');
        localStorage.setItem('user', JSON.stringify(me.data));
      } catch {
        localStorage.setItem('user', JSON.stringify({ email: form.email }));
      }
      toast('Welcome back!', 'success');
      setTimeout(() => navigate('/dashboard'), 300);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid email or password';
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const FEATURES = [
    { icon: '📄', title: 'Upload PDFs & Notes', bg: 'var(--gold-dim)', border: 'var(--gold-border)' },
    { icon: '💬', title: 'AI-powered Q&A', bg: 'var(--teal-dim)', border: 'var(--teal-border)' },
    { icon: '🔍', title: 'Smart document search', bg: 'var(--violet-dim)', border: 'rgba(167,139,250,0.2)' },
  ];

  return (
    <div className="auth-page">
      {/* Floating orbs */}
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      <ToastContainer />
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🎓</div>
          <div>
            <span className="auth-logo-text">CampusGPT</span>
            <span className="auth-logo-badge">Beta</span>
          </div>
        </div>

        <div className="auth-eyebrow">Student Portal</div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to access your AI university assistant</p>

        {errors.general && (
          <div className="auth-error-banner">
            ⚠ {errors.general}
          </div>
        )}

        <div className="auth-form">
          <div className="form-group">
            <label className="form-label">University Email</label>
            <input className={`form-input ${errors.email ? 'error' : ''}`} type="email"
              placeholder="you@university.edu" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input className={`form-input ${errors.password ? 'error' : ''}`} type="password"
              placeholder="••••••••" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <button className="btn btn-primary btn-lg btn-full" onClick={handleSubmit} disabled={loading}>
            {loading ? <><span className="spinner" />Signing in…</> : '→ Sign in'}
          </button>
        </div>

        <div className="auth-features">
          <div className="auth-features-title">Features</div>
          {FEATURES.map(f => (
            <div key={f.title} className="auth-feature-item">
              <div className="auth-feature-icon" style={{ background: f.bg, border: `1px solid ${f.border}` }}>
                {f.icon}
              </div>
              <span>{f.title}</span>
            </div>
          ))}
        </div>

        <p className="auth-footer">New student? <Link to="/register">Create account →</Link></p>
      </div>
    </div>
  );
}
