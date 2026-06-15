import { useState, useRef, useEffect } from 'react';
import api from '../api';
import ToastContainer, { toast } from '../components/Toast';

// Canvas Confetti particle emitter
function ConfettiCanvas({ active }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#3b82f6', '#8b5cf6', '#60a5fa', '#a78bfa', '#10b981', '#f59e0b', '#ec4899'];
    const particles = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height - 20,
      r: Math.random() * 6 + 4,
      d: Math.random() * canvas.height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.08 + 0.03,
      tiltAngle: 0
    }));

    let animationId;
    let frames = 0;
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, index) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 1.8;
        p.x += Math.sin(p.tiltAngle) * 2;
        p.tilt = Math.sin(p.tiltAngle - index / 3) * 12;

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();
      });

      frames++;
      // Stop after 250 frames or when all leave screen
      if (frames < 250 && particles.some(p => p.y < canvas.height)) {
        animationId = requestAnimationFrame(draw);
      }
    };
    
    draw();
    return () => cancelAnimationFrame(animationId);
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999,
        width: '100vw', height: '100vh'
      }}
    />
  );
}

export default function Upload() {
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const inputRef = useRef(null);

  const addFile = file => {
    if (!file || file.type !== 'application/pdf') { 
      toast('Only PDF files are supported', 'error'); 
      return; 
    }
    if (file.size > 20 * 1024 * 1024) { 
      toast('File must be under 20 MB', 'error'); 
      return; 
    }
    
    const totalChunks = Math.max(12, Math.min(48, Math.ceil(file.size / 102400))); // estimate chunk count
    const entry = { 
      file, 
      id: Date.now(), 
      name: file.name, 
      size: file.size, 
      status: 'pending', 
      progress: 0, 
      totalChunks,
      eta: null,
      error: null 
    };
    
    setFiles(f => [entry, ...f]);
    uploadFile(entry);
  };

  const uploadFile = async entry => {
    setFiles(f => f.map(x => x.id === entry.id ? { ...x, status: 'uploading', progress: 5 } : x));
    
    // Simulate ETA and progress chunks
    let currentProgress = 5;
    const interval = setInterval(() => {
      currentProgress = Math.min(currentProgress + 8, 85);
      // Calculate mock ETA (processing is roughly 300ms per 8% progress)
      const remainingSteps = (100 - currentProgress) / 8;
      const etaSeconds = Math.ceil(remainingSteps * 0.3);
      
      setFiles(f => f.map(x => x.id === entry.id ? { 
        ...x, 
        progress: currentProgress,
        eta: `${etaSeconds}s remaining`
      } : x));
    }, 350);

    try {
      const form = new FormData();
      form.append('file', entry.file);
      const res = await api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      
      clearInterval(interval);
      
      // Update success
      setFiles(f => f.map(x => x.id === entry.id ? { 
        ...x, 
        status: 'done', 
        progress: 100,
        eta: 'Completed',
        chunks: res.data.chunks || entry.totalChunks 
      } : x));

      // Fire confetti splash
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);

      toast(`"${entry.name}" uploaded & indexed`, 'success');
    } catch (err) {
      clearInterval(interval);
      const msg = err.response?.data?.detail || 'Upload failed';
      setFiles(f => f.map(x => x.id === entry.id ? { ...x, status: 'error', error: msg, progress: 0, eta: null } : x));
      toast(msg, 'error');
    }
  };

  const fmt = b => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;

  const TYPES = ['📚 Syllabus', '📝 Lecture Notes', '📋 Assignments', '❓ Exam Papers', '📖 Manuals', '📌 References'];

  const STEPS = [
    { icon: '📄', text: 'PDF is analyzed and split into individual logical text nodes' },
    { icon: '🔢', text: 'Each chunk is vectorized using Gemini AI embeddings model' },
    { icon: '💾', text: 'Embeddings index is committed to ChromaDB vector store' },
    { icon: '💬', text: 'Ask questions or predict exam parameters instantly' },
  ];

  return (
    <div className="fade-in">
      <ToastContainer />
      <ConfettiCanvas active={showConfetti} />

      <div className="page-header">
        <div>
          <div className="page-eyebrow">Knowledge Storage</div>
          <h1 className="page-title">Upload Documents</h1>
          <p className="page-subtitle">Add university documents to your premium AI vector database</p>
        </div>
      </div>

      <div className="page-body">
        <div style={{ maxWidth: 680 }}>
          {/* Pulsing Upload Zone */}
          <div className={`drop-zone ${dragging ? 'drag-over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); Array.from(e.dataTransfer.files).forEach(addFile); }}
            onClick={() => inputRef.current?.click()}>
            <input ref={inputRef} type="file" accept=".pdf" multiple
              onChange={e => { Array.from(e.target.files).forEach(addFile); e.target.value = ''; }}
              style={{ display: 'none' }} />
            
            <div className="pulsing-upload-ring">
              {dragging ? '📂' : '📄'}
            </div>
            
            <h3>{dragging ? 'Drop files now' : 'Drag & drop study PDFs here'}</h3>
            <p style={{ marginBottom: 16, fontSize: '0.85rem' }}>or click to browse local files · Max 20 MB per file</p>
            <span className="badge badge-gold">PDF Files Only</span>
          </div>

          {/* Supported types */}
          <div className="type-pills" style={{ marginTop: 20 }}>
            {TYPES.map(t => (
              <span key={t} className="type-pill">{t}</span>
            ))}
          </div>

          {/* Upload Progress & Previews */}
          {files.length > 0 && (
            <div className="file-list" style={{ marginTop: 24 }}>
              {files.map(f => {
                // Determine nodes completed
                const completedNodes = Math.floor((f.progress / 100) * f.totalChunks);
                return (
                  <div key={f.id} className="file-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 10,
                        background: f.status === 'done' ? 'var(--success-dim)' : f.status === 'error' ? 'var(--error-dim)' : 'rgba(59, 130, 246, 0.1)',
                        border: `1px solid ${f.status === 'done' ? 'rgba(16, 185, 129, 0.25)' : f.status === 'error' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(59, 130, 246, 0.25)'}`,
                        display: 'flex', alignItems: 'center', justifycontent: 'center', fontSize: '1.2rem', flexShrink: 0,
                        alignItems: 'center', justifyContent: 'center'
                      }}>
                        {f.status === 'done' ? '✅' : f.status === 'error' ? '❌' : f.status === 'uploading' ? '⏳' : '📄'}
                      </div>
                      
                      <div className="file-info">
                        <div className="file-name" style={{ fontSize: '.9rem', fontWeight: 700 }}>{f.name}</div>
                        <div style={{ display: 'flex', gap: 8, fontSize: '.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          <span>Size: {fmt(f.size)}</span>
                          {f.eta && <span>· ETA: {f.eta}</span>}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                        {f.status === 'done' && <span className="badge badge-success">Vectorized</span>}
                        {f.status === 'uploading' && <span className="badge badge-gold">{Math.round(f.progress)}%</span>}
                        {f.status === 'error' && <button className="btn btn-sm btn-secondary" onClick={() => uploadFile(f)}>Retry</button>}
                        {f.status !== 'uploading' && (
                          <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setFiles(p => p.filter(x => x.id !== f.id))}>✕</button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {f.status === 'uploading' && (
                      <div className="progress-bar" style={{ height: 6 }}>
                        <div className="progress-fill" style={{ width: `${f.progress}%` }} />
                      </div>
                    )}

                    {/* Chunk Matrix Grid Visualizer */}
                    {f.status === 'uploading' && (
                      <div className="chunk-visualizer">
                        <div className="chunk-visualizer-title">Indexing vector nodes ({completedNodes} / {f.totalChunks})</div>
                        <div className="chunk-grid">
                          {Array.from({ length: f.totalChunks }).map((_, nodeIdx) => {
                            let nodeStatus = 'pending';
                            if (nodeIdx < completedNodes) nodeStatus = 'done';
                            else if (nodeIdx === completedNodes) nodeStatus = 'processing';
                            
                            return (
                              <div
                                key={nodeIdx}
                                className={`chunk-node ${nodeStatus}`}
                                title={`Chunk node ${nodeIdx + 1}: ${nodeStatus}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {f.error && <div className="form-error" style={{ marginTop: 4 }}>{f.error}</div>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Workflow details */}
          <div className="how-it-works" style={{ marginTop: 32 }}>
            <div className="how-it-works-title">Processing Pipeline</div>
            {STEPS.map((s, i) => (
              <div key={i} className="how-step">
                <div className="how-step-num">{i + 1}</div>
                <span style={{ fontSize: '.84rem' }}>{s.icon} {s.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
