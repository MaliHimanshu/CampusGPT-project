import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="auth-page" style={{ flexDirection: 'column', gap: 24 }}>
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="auth-orb auth-orb-3" />

      <div className="auth-card" style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: '5rem', marginBottom: 16, animation: 'emptyBounce 3s ease-in-out infinite' }}>🛸</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, marginBottom: 12, background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          404 - Lost in Space
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: 28, lineHeight: 1.6 }}>
          The lecture hall or document you are looking for has drifted off into the cosmos. Let's get you back to the campus.
        </p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')} style={{ width: '100%' }}>
          ⊞ Go to Dashboard
        </button>
      </div>
    </div>
  );
}
