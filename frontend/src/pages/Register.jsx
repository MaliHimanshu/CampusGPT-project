import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import ToastContainer, { toast } from '../components/Toast';

function getStrength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const LABELS  = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const CLASSES = ['', 'weak', 'fair', 'good', 'strong'];

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const strength = getStrength(form.password);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true); setErrors({});
    try {
      await api.post('/register', { name: form.name, email: form.email, password: form.password });
      toast('Account created! Navigating to login portal.', 'success');
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed';
      setErrors({ general: msg });
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <ToastContainer />
      <div className="auth-card" style={{ maxWidth: 460 }}>
        {/* Branding header */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🎓</div>
          <div>
            <span className="auth-logo-text">CampusGPT</span>
            <span className="auth-logo-badge">Premium</span>
          </div>
        </div>

        <div className="auth-eyebrow">Get Started Free</div>
        <h1 className="auth-title" style={{ background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Create Account
        </h1>
        <p className="auth-subtitle">Get AI exam predictions and search tools</p>

        {errors.general && (
          <div className="auth-error-banner">
            ⚠ {errors.general}
          </div>
        )}

        <div className="auth-form">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input 
              className={`form-input ${errors.name ? 'error' : ''}`} 
              type="text"
              placeholder="Your full name" 
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">University Email</label>
            <input 
              className={`form-input ${errors.email ? 'error' : ''}`} 
              type="email"
              placeholder="name@university.edu" 
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              className={`form-input ${errors.password ? 'error' : ''}`} 
              type="password"
              placeholder="Min. 6 characters" 
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} 
            />
            {form.password && (
              <>
                <div className="strength-bar">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`strength-seg ${i <= strength ? CLASSES[strength] : ''}`} />
                  ))}
                </div>
                <span className="strength-label" style={{ color: strength >= 3 ? 'var(--success)' : strength === 2 ? '#f59e0b' : 'var(--error)' }}>
                  {LABELS[strength]} password strength
                </span>
              </>
            )}
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input 
              className={`form-input ${errors.confirm ? 'error' : ''}`} 
              type="password"
              placeholder="Repeat password" 
              value={form.confirm}
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} 
            />
            {errors.confirm && <span className="form-error">{errors.confirm}</span>}
          </div>

          <button className="btn btn-primary btn-lg btn-full" onClick={handleSubmit} disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <><span className="spinner" />Registering Account…</> : '→ Initiate Access'}
          </button>
        </div>

        <p className="auth-footer" style={{ marginTop: 24 }}>
          Already registered? <Link to="/" style={{ color: 'var(--electric-blue)', fontWeight: 600 }}>Sign in →</Link>
        </p>
      </div>
    </div>
  );
}
