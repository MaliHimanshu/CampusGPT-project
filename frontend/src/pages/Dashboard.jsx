import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function AnimatedNumber({ value, duration = 600 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const num = typeof value === 'number' ? value : parseInt(value) || 0;
    if (num === 0) { setDisplay(0); return; }
    let start = 0;
    const step = num / (duration / 16);
    const tick = () => {
      start += step;
      if (start >= num) { setDisplay(num); return; }
      setDisplay(Math.floor(start));
      ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [value, duration]);
  return <>{display}</>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/documents')
      .then(r => setDocs(r.data?.documents || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const name = user.name?.split(' ')[0] || 'Student';
  const chatCount = parseInt(localStorage.getItem('chat_count') || '0');

  const STATS = [
    { icon: '📄', label: 'Documents', value: loading ? '–' : docs.length, color: 'var(--gold)' },
    { icon: '💬', label: 'Chats', value: chatCount, color: 'var(--teal)' },
    { icon: '🤖', label: 'AI Model', value: 'Gemini', isText: true, color: 'var(--gold)' },
    { icon: '🗄️', label: 'Vector DB', value: 'Chroma', isText: true, color: 'var(--teal)' },
  ];

  const ACTIONS = [
    { icon: '💬', title: 'Ask a Question', desc: 'Chat with your documents via AI', path: '/chat' },
    { icon: '📤', title: 'Upload PDF', desc: 'Add syllabus, notes or assignments', path: '/upload' },
    { icon: '📁', title: 'My Documents', desc: 'Browse and manage your files', path: '/documents' },
    { icon: '👤', title: 'Profile', desc: 'Account settings and security', path: '/profile' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Dashboard</div>
          <h1 className="page-title">{greeting}, {name} 👋</h1>
          <p className="page-subtitle">Your AI university assistant is ready</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/chat')}>
          💬 New Chat
        </button>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid stagger-in">
          {STATS.map(s => (
            <div key={s.label} className="stat-card">
              <span className="stat-icon">{s.icon}</span>
              <span className="stat-label">{s.label}</span>
              <span className="stat-value" style={{ color: s.color, fontSize: s.isText ? '1.15rem' : undefined, paddingTop: s.isText ? 4 : undefined }}>
                {s.isText ? s.value : (s.value === '–' ? '–' : <AnimatedNumber value={s.value} />)}
              </span>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="section-header" style={{ marginBottom: 16 }}>
          <span className="section-title">Quick Actions</span>
        </div>
        <div className="actions-grid stagger-in" style={{ marginBottom: 36 }}>
          {ACTIONS.map(a => (
            <div key={a.path} className="action-card" onClick={() => navigate(a.path)}>
              <span className="action-card-icon">{a.icon}</span>
              <div>
                <div className="action-title">{a.title}</div>
                <div className="action-desc">{a.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent documents */}
        {docs.length > 0 && (
          <>
            <div className="section-header">
              <span className="section-title">Recent Documents</span>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/documents')}>View all →</button>
            </div>
            <div className="stagger-in" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {docs.slice(0, 3).map(doc => (
                <div key={doc.id} className="recent-doc-row" onClick={() => navigate('/chat')}>
                  <div className="recent-doc-icon">📄</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.filename}
                    </div>
                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {new Date(doc.uploaded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {doc.chunks && ` · ${doc.chunks} chunks`}
                    </div>
                  </div>
                  <span className="badge badge-gold">Chat →</span>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && docs.length === 0 && (
          <div className="empty-hero" style={{ marginTop: 28 }}>
            <div className="empty-hero-icon">📚</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 800, marginBottom: 8 }}>
              No documents yet
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '.875rem', marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
              Upload your first PDF to start asking questions about your university materials.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/upload')}>📤 Upload your first PDF</button>
          </div>
        )}
      </div>
    </div>
  );
}
