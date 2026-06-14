import { useState, useRef } from 'react';
import api from '../api';
import ToastContainer, { toast } from '../components/Toast';

export default function Upload() {
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const addFile = file => {
    if (!file || file.type !== 'application/pdf') { toast('Only PDF files are supported', 'error'); return; }
    if (file.size > 20 * 1024 * 1024) { toast('File must be under 20 MB', 'error'); return; }
    const entry = { file, id: Date.now(), name: file.name, size: file.size, status: 'pending', progress: 0, error: null };
    setFiles(f => [entry, ...f]);
    uploadFile(entry);
  };

  const uploadFile = async entry => {
    setFiles(f => f.map(x => x.id === entry.id ? { ...x, status: 'uploading', progress: 10 } : x));
    try {
      const form = new FormData();
      form.append('file', entry.file);
      const interval = setInterval(() => {
        setFiles(f => f.map(x => x.id === entry.id && x.progress < 80 ? { ...x, progress: x.progress + 10 } : x));
      }, 300);
      await api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      clearInterval(interval);
      setFiles(f => f.map(x => x.id === entry.id ? { ...x, status: 'done', progress: 100 } : x));
      toast(`"${entry.name}" uploaded & indexed`, 'success');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Upload failed';
      setFiles(f => f.map(x => x.id === entry.id ? { ...x, status: 'error', error: msg, progress: 0 } : x));
      toast(msg, 'error');
    }
  };

  const fmt = b => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

  const TYPES = ['📚 Syllabus', '📝 Notes', '📋 Assignments', '❓ Question Papers', '📖 Regulations', '📌 Reference Books'];

  const STEPS = [
    { icon: '📄', text: 'PDF is extracted and split into chunks' },
    { icon: '🔢', text: 'Each chunk is embedded using Gemini AI' },
    { icon: '💾', text: 'Embeddings stored in ChromaDB vector store' },
    { icon: '💬', text: 'You can now ask questions about the content' },
  ];

  return (
    <div className="fade-in">
      <ToastContainer />
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Knowledge Base</div>
          <h1 className="page-title">Upload PDF</h1>
          <p className="page-subtitle">Add university documents to your personal AI knowledge base</p>
        </div>
      </div>

      <div className="page-body">
        <div style={{ maxWidth: 660 }}>
          <div className={`drop-zone ${dragging ? 'drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); Array.from(e.dataTransfer.files).forEach(addFile); }}
            onClick={() => inputRef.current?.click()}>
            <input ref={inputRef} type="file" accept=".pdf" multiple
              onChange={e => { Array.from(e.target.files).forEach(addFile); e.target.value = ''; }}
              style={{ display: 'none' }} />
            <div className="drop-zone-icon">{dragging ? '📂' : '📄'}</div>
            <h3>{dragging ? 'Drop to upload' : 'Drag & drop PDFs here'}</h3>
            <p style={{ marginBottom: 16 }}>or click to browse · Max 20 MB per file</p>
            <span className="badge badge-gold">PDF only</span>
          </div>

          {/* Supported types */}
          <div className="type-pills">
            {TYPES.map(t => (
              <span key={t} className="type-pill">{t}</span>
            ))}
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="file-list">
              {files.map(f => (
                <div key={f.id} className="file-item">
                  <div style={{
                    width: 42, height: 42, borderRadius: 11,
                    background: f.status === 'done' ? 'var(--success-dim)' : f.status === 'error' ? 'var(--error-dim)' : 'var(--gold-dim)',
                    border: `1px solid ${f.status === 'done' ? 'rgba(52,211,153,.25)' : f.status === 'error' ? 'rgba(248,113,113,.25)' : 'var(--gold-border)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0,
                    transition: 'all 0.3s ease'
                  }}>
                    {f.status === 'done' ? '✅' : f.status === 'error' ? '❌' : f.status === 'uploading' ? '⏳' : '📄'}
                  </div>
                  <div className="file-info">
                    <div className="file-name">{f.name}</div>
                    <div className="file-size">{fmt(f.size)}</div>
                    {f.status === 'uploading' && <div className="progress-bar"><div className="progress-fill" style={{ width: `${f.progress}%` }} /></div>}
                    {f.error && <div className="form-error" style={{ marginTop: 4 }}>{f.error}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                    {f.status === 'done' && <span className="badge badge-success">Indexed</span>}
                    {f.status === 'uploading' && <span className="badge badge-gold">{f.progress}%</span>}
                    {f.status === 'error' && <button className="btn btn-sm btn-secondary" onClick={() => uploadFile(f)}>Retry</button>}
                    {f.status !== 'uploading' && (
                      <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setFiles(p => p.filter(x => x.id !== f.id))}>✕</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* How it works */}
          <div className="how-it-works">
            <div className="how-it-works-title">How it works</div>
            {STEPS.map((s, i) => (
              <div key={i} className="how-step">
                <div className="how-step-num">{i + 1}</div>
                <span>{s.icon} {s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
