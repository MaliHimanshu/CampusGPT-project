import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

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

  const ACTIONS = [
    { icon:'💬', title:'Ask a Question', desc:'Chat with your documents via AI', path:'/chat', color:'var(--gold)' },
    { icon:'📤', title:'Upload PDF', desc:'Add syllabus, notes or assignments', path:'/upload', color:'var(--teal)' },
    { icon:'📁', title:'My Documents', desc:'Browse and manage your files', path:'/documents', color:'#a78bfa' },
    { icon:'👤', title:'Profile', desc:'Account settings and security', path:'/profile', color:'#f472b6' },
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
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-icon">📄</span>
            <span className="stat-label">Documents</span>
            <span className="stat-value" style={{color:'var(--gold)'}}>
              {loading ? '–' : docs.length}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">💬</span>
            <span className="stat-label">Chats</span>
            <span className="stat-value" style={{color:'var(--teal)'}}>
              {chatCount}
            </span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🤖</span>
            <span className="stat-label">AI Model</span>
            <span className="stat-value" style={{fontSize:'1.1rem',paddingTop:4,color:'var(--gold)'}}>Gemini</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🗄️</span>
            <span className="stat-label">Vector DB</span>
            <span className="stat-value" style={{fontSize:'1.1rem',paddingTop:4,color:'var(--teal)'}}>Chroma</span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="section-header" style={{marginBottom:14}}>
          <span className="section-title">Quick Actions</span>
        </div>
        <div className="actions-grid" style={{marginBottom:32}}>
          {ACTIONS.map(a => (
            <div key={a.path} className="action-card" onClick={() => navigate(a.path)}>
              <span style={{fontSize:'2rem'}}>{a.icon}</span>
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
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {docs.slice(0,3).map(doc => (
                <div key={doc.id} className="card" style={{padding:'14px 18px',display:'flex',alignItems:'center',gap:14,cursor:'pointer',transition:'border-color .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-gold)'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=''}
                  onClick={() => navigate('/chat')}>
                  <div style={{width:36,height:36,borderRadius:9,background:'var(--gold-dim)',border:'1px solid var(--border-gold)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem',flexShrink:0}}>📄</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:'.875rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{doc.filename}</div>
                    <div style={{fontSize:'.72rem',color:'var(--text-muted)',marginTop:2}}>
                      {new Date(doc.uploaded_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
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
          <div style={{marginTop:24,background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--radius-xl)',padding:'48px 32px',textAlign:'center'}}>
            <div style={{width:64,height:64,borderRadius:18,background:'var(--gold-dim)',border:'1px solid var(--border-gold)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2rem',margin:'0 auto 16px'}}>📚</div>
            <h3 style={{fontFamily:'var(--font-display)',fontSize:'1.1rem',fontWeight:700,marginBottom:8}}>No documents yet</h3>
            <p style={{color:'var(--text-secondary)',fontSize:'.875rem',marginBottom:20,maxWidth:340,margin:'0 auto 20px'}}>
              Upload your first PDF to start asking questions about your university materials.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/upload')}>📤 Upload your first PDF</button>
          </div>
        )}
      </div>
    </div>
  );
}
