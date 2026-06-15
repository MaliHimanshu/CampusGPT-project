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
      toast('Welcome back to CampusGPT!', 'success');
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid email or password';
      setErrors({ general: msg });
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const FEATURES = [
    { icon: '📄', title: 'Upload Course PDFs & Syllabi', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)' },
    { icon: '💬', title: 'Vector RAG Chat Q&A Sessions', bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.2)' },
    { icon: '🔮', title: 'Exam Question Predictor Insights', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)' },
  ];

  return (
    <div className="auth-page">
      <ToastContainer />
      <div className="auth-card">
        {/* Branding header */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🎓</div>
          <div>
            <span className="auth-logo-text">CampusGPT</span>
            <span className="auth-logo-badge">Premium</span>
          </div>
        </div>

        <div className="auth-eyebrow">Secure Portal</div>
        <h1 className="auth-title" style={{ background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Welcome Back
        </h1>
        <p className="auth-subtitle">Sign in to study your documents with AI</p>

        {errors.general && (
          <div className="auth-error-banner">
            ⚠ {errors.general}
          </div>
        )}

        <div className="auth-form">
          <div className="form-group">
            <label className="form-label">University Email</label>
            <input 
              className={`form-input ${errors.email ? 'error' : ''}`} 
              type="email"
              placeholder="name@university.edu" 
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} 
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              className={`form-input ${errors.password ? 'error' : ''}`} 
              type="password"
              placeholder="••••••••" 
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} 
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <button className="btn btn-primary btn-lg btn-full" onClick={handleSubmit} disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <><span className="spinner" />Entering Campus…</> : '→ Connect Portal'}
          </button>
        </div>

        {/* Feature list detail */}
        <div className="auth-features" style={{ marginTop: 24, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-md)', padding: 16 }}>
          <div className="auth-features-title" style={{ fontSize: '.68rem', letterSpacing: '.06em', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>
            Features Included
          </div>
          {FEATURES.map(f => (
            <div key={f.title} className="auth-feature-item" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: '.84rem', color: 'var(--text-secondary)' }}>
              <div className="auth-feature-icon" style={{ background: f.bg, border: `1px solid ${f.border}`, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {f.icon}
              </div>
              <span>{f.title}</span>
            </div>
          ))}
        </div>

        <p className="auth-footer" style={{ marginTop: 20 }}>
          New student? <Link to="/register" style={{ color: 'var(--electric-blue)', fontWeight: 600 }}>Create account →</Link>
        </p>
      </div>
    </div>
  );
}
