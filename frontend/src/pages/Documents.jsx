import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import ToastContainer, { toast } from '../components/Toast';

export default function Documents() {
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchDocs(); }, []);

  const fetchDocs = async () => {
    setLoading(true);
    try { const r = await api.get('/documents'); setDocs(r.data?.documents||[]); }
    catch { toast('Could not load documents','error'); }
    finally { setLoading(false); }
  };

  const deleteDoc = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/documents/${id}`);
      setDocs(d => d.filter(x => x.id!==id));
      toast(`"${name}" deleted`,'success');
    } catch { toast('Delete failed','error'); }
    finally { setDeletingId(null); }
  };

  const filtered = docs.filter(d => d.filename?.toLowerCase().includes(search.toLowerCase()));
  const fmt = b => !b ? '–' : b<1024*1024 ? `${(b/1024).toFixed(0)} KB` : `${(b/1024/1024).toFixed(1)} MB`;
  const fmtDate = s => { try { return new Date(s).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); } catch { return s; } };

  return (
    <div className="fade-in">
      <ToastContainer />
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Knowledge Base</div>
          <h1 className="page-title">My Documents</h1>
          <p className="page-subtitle">{docs.length} file{docs.length!==1?'s':''} in your knowledge base</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/upload')}>📤 Upload PDF</button>
      </div>

      <div className="page-body">
        {docs.length > 0 && (
          <div style={{marginBottom:20}}>
            <input className="form-input" style={{maxWidth:360}} type="search"
              placeholder="🔍 Search documents…" value={search}
              onChange={e => setSearch(e.target.value)}/>
          </div>
        )}

        {loading && (
          <div className="doc-grid">
            {[1,2,3].map(i=>(
              <div key={i} className="doc-card">
                <div className="skeleton" style={{width:48,height:48,borderRadius:10}}/>
                <div className="skeleton" style={{height:18,width:'80%'}}/>
                <div className="skeleton" style={{height:14,width:'50%'}}/>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="doc-grid">
            {filtered.map(doc => (
              <div key={doc.id} className="doc-card">
                <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                  <div style={{width:44,height:44,borderRadius:10,background:'var(--gold-dim)',border:'1px solid var(--border-gold)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem',flexShrink:0}}>📄</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="doc-card-title" title={doc.filename}
                      style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {doc.filename}
                    </div>
                    <span className="badge badge-gold" style={{marginTop:4}}>PDF</span>
                  </div>
                </div>
                <div className="doc-card-meta">
                  <span>📅 {fmtDate(doc.uploaded_at)}</span>
                  {doc.file_size && <span>💾 {fmt(doc.file_size)}</span>}
                  {doc.chunks && <span>🧩 {doc.chunks} chunks</span>}
                </div>
                <div className="doc-card-actions">
                  <button className="btn btn-secondary btn-sm" style={{flex:1}} onClick={() => navigate('/chat')}>💬 Ask questions</button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteDoc(doc.id, doc.filename)} disabled={deletingId===doc.id}>
                    {deletingId===doc.id ? <span className="spinner" style={{width:12,height:12}}/> : '🗑'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && docs.length>0 && filtered.length===0 && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3 className="empty-title">No results for "{search}"</h3>
            <p className="empty-desc">Try a different filename.</p>
          </div>
        )}

        {!loading && docs.length===0 && (
          <div style={{textAlign:'center',padding:'60px 20px'}}>
            <div style={{width:72,height:72,borderRadius:20,background:'var(--gold-dim)',border:'1px solid var(--border-gold)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2rem',margin:'0 auto 16px'}}>📭</div>
            <h3 style={{fontFamily:'var(--font-display)',fontSize:'1.1rem',fontWeight:700,marginBottom:8}}>No documents yet</h3>
            <p style={{color:'var(--text-secondary)',fontSize:'.875rem',marginBottom:20}}>Upload your first PDF to build your university knowledge base.</p>
            <button className="btn btn-primary" onClick={() => navigate('/upload')}>📤 Upload PDF</button>
          </div>
        )}
      </div>
    </div>
  );
}
