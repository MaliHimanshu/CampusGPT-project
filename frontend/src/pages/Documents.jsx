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
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'size' | 'chunks' | 'name'
  const [isGridView, setIsGridView] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteModal, setDeleteModal] = useState(null); // Document object or 'bulk'
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => { fetchDocs(); }, []);

  const fetchDocs = async () => {
    setLoading(true);
    try { 
      const r = await api.get('/documents'); 
      setDocs(r.data?.documents || []); 
    }
    catch { 
      toast('Could not load documents', 'error'); 
    }
    finally { 
      setLoading(false); 
    }
  };

  const handleSelectToggle = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(d => d.id));
    }
  };

  const confirmDelete = (doc) => {
    setDeleteModal(doc);
  };

  const confirmBulkDelete = () => {
    setDeleteModal('bulk');
  };

  const deleteDoc = async () => {
    if (!deleteModal) return;

    if (deleteModal === 'bulk') {
      setDeleteModal(null);
      setBulkDeleting(true);
      toast(`Deleting ${selectedIds.length} files...`, 'info');
      try {
        // Run parallel delete calls
        await Promise.all(selectedIds.map(id => api.delete(`/documents/${id}`)));
        setDocs(d => d.filter(x => !selectedIds.includes(x.id)));
        toast('Selected files deleted', 'success');
        setSelectedIds([]);
      } catch {
        toast('Some files failed to delete', 'error');
      } finally {
        setBulkDeleting(false);
      }
      return;
    }

    const { id, filename } = deleteModal;
    setDeleteModal(null);
    setDeletingId(id);
    try {
      await api.delete(`/documents/${id}`);
      setDocs(d => d.filter(x => x.id !== id));
      setSelectedIds(prev => prev.filter(x => x !== id));
      toast(`"${filename}" deleted`, 'success');
    } catch { 
      toast('Delete failed', 'error'); 
    }
    finally { 
      setDeletingId(null); 
    }
  };

  const filtered = docs.filter(d => d.filename?.toLowerCase().includes(search.toLowerCase()));

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.filename.localeCompare(b.filename);
    if (sortBy === 'size') return (a.file_size || 0) - (b.file_size || 0);
    if (sortBy === 'chunks') return (a.chunks || 0) - (b.chunks || 0);
    if (sortBy === 'date') return new Date(b.uploaded_at) - new Date(a.uploaded_at);
    return 0;
  });

  const fmt = b => !b ? '–' : b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`;
  const fmtDate = s => { 
    try { 
      return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); 
    } catch { 
      return s; 
    } 
  };

  return (
    <div className="fade-in">
      <ToastContainer />

      {/* Confirmation modal */}
      {deleteModal && (
        <div className="delete-overlay" onClick={() => setDeleteModal(null)}>
          <div className="delete-modal" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🗑️</div>
            <h3>{deleteModal === 'bulk' ? 'Bulk Delete Documents?' : 'Delete document?'}</h3>
            <p>
              {deleteModal === 'bulk' 
                ? `You are about to delete ${selectedIds.length} files from your vector index permanently.`
                : `"${deleteModal.filename}" will be permanently removed from your knowledge base.`}
            </p>
            <div className="delete-modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={deleteDoc}>Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <div className="page-eyebrow">Knowledge Base</div>
          <h1 className="page-title">My Documents 📁</h1>
          <p className="page-subtitle">{docs.length} file{docs.length !== 1 ? 's' : ''} stored in your account</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/upload')}>
          📤 Upload PDF
        </button>
      </div>

      <div className="page-body">
        {docs.length > 0 && (
          <div className="view-mode-bar">
            <div className="search-sort-box">
              {/* Search Bar */}
              <input 
                className="form-input" 
                style={{ flex: 1, minWidth: 200 }} 
                type="search"
                placeholder="🔍 Search documents by name..." 
                value={search}
                onChange={e => setSearch(e.target.value)} 
              />
              
              {/* Sort selector */}
              <select 
                className="form-input" 
                style={{ width: 150 }} 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="size">Sort by Size</option>
                <option value="chunks">Sort by Chunks</option>
              </select>
            </div>

            {/* Layout view controls */}
            <div style={{ display: 'flex', gap: 6 }}>
              {filtered.length > 0 && (
                <button className="btn btn-secondary btn-sm" onClick={handleSelectAll}>
                  {selectedIds.length === filtered.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
              <button 
                className={`btn btn-secondary btn-icon ${isGridView ? 'btn-primary' : ''}`} 
                onClick={() => setIsGridView(true)} 
                title="Grid View"
                style={isGridView ? { background: 'var(--primary-gradient)', border: 'none', color: '#fff' } : {}}
              >
                ⊞
              </button>
              <button 
                className={`btn btn-secondary btn-icon ${!isGridView ? 'btn-primary' : ''}`} 
                onClick={() => setIsGridView(false)} 
                title="List View"
                style={!isGridView ? { background: 'var(--primary-gradient)', border: 'none', color: '#fff' } : {}}
              >
                ☰
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className={isGridView ? "doc-grid" : "doc-list"}>
            {[1, 2, 3].map(i => (
              <div key={i} className="card" style={{ opacity: 1, animation: 'none', minHeight: 120 }}>
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10, marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 18, width: '80%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 14, width: '50%' }} />
              </div>
            ))}
          </div>
        )}

        {/* Documents Render */}
        {!loading && sorted.length > 0 && (
          <>
            {isGridView ? (
              <div className="doc-grid">
                {sorted.map(doc => {
                  const isSelected = selectedIds.includes(doc.id);
                  return (
                    <div key={doc.id} className="premium-border-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      
                      {/* Checkbox select overlay */}
                      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectToggle(doc.id)}
                          style={{ width: 16, height: 16, cursor: 'pointer' }}
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 10,
                          background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.4rem', flexShrink: 0
                        }}>📄</div>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: 18 }}>
                          <div className="doc-card-title" title={doc.filename} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {doc.filename}
                          </div>
                          <span className="badge badge-gold" style={{ marginTop: 6 }}>PDF Document</span>
                        </div>
                      </div>

                      {/* Tooltip detail on hover */}
                      <div className="doc-preview-tooltip">
                        <div style={{ fontWeight: 700, fontSize: '.8rem', marginBottom: 4 }}>Document Preview</div>
                        <div style={{ fontSize: '.72rem', color: 'var(--text-secondary)' }}>
                          File: {doc.filename}<br/>
                          Size: {fmt(doc.file_size)}<br/>
                          Chunks: {doc.chunks || 0}<br/>
                          Indexed: {fmtDate(doc.uploaded_at)}
                        </div>
                      </div>

                      <div className="doc-card-meta" style={{ marginTop: 'auto' }}>
                        <span>📅 {fmtDate(doc.uploaded_at)}</span>
                        {doc.file_size && <span>💾 {fmt(doc.file_size)}</span>}
                        {doc.chunks && <span>🧩 {doc.chunks} chunks</span>}
                      </div>

                      <div className="doc-card-actions" style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => navigate('/chat')}>
                          💬 Chat
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => confirmDelete(doc)} disabled={deletingId === doc.id}>
                          {deletingId === doc.id ? <span className="spinner" style={{ width: 12, height: 12 }} /> : '🗑️'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // List layout
              <div className="doc-list">
                {sorted.map(doc => {
                  const isSelected = selectedIds.includes(doc.id);
                  return (
                    <div key={doc.id} className="doc-list-row" style={{ position: 'relative' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectToggle(doc.id)}
                        style={{ width: 16, height: 16, cursor: 'pointer', marginRight: 4 }}
                      />
                      
                      <div style={{ fontSize: '1.4rem' }}>📄</div>
                      
                      <div style={{ flex: 1, minWidth: 0 }} onClick={() => navigate('/chat')}>
                        <div style={{ fontWeight: 700, fontSize: '.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {doc.filename}
                        </div>
                      </div>

                      {/* Hover stats tooltips */}
                      <div className="doc-preview-tooltip">
                        <div style={{ fontWeight: 700, fontSize: '.8rem', marginBottom: 4 }}>Document Preview</div>
                        <div style={{ fontSize: '.72rem', color: 'var(--text-secondary)' }}>
                          File: {doc.filename}<br/>
                          Size: {fmt(doc.file_size)}<br/>
                          Chunks: {doc.chunks || 0}<br/>
                          Indexed: {fmtDate(doc.uploaded_at)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 24, fontSize: '.8rem', color: 'var(--text-secondary)' }}>
                        <span>📅 {fmtDate(doc.uploaded_at)}</span>
                        <span>💾 {fmt(doc.file_size)}</span>
                        <span>🧩 {doc.chunks || 0} chunks</span>
                      </div>

                      <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
                        <button className="btn btn-danger btn-sm" onClick={() => confirmDelete(doc)} disabled={deletingId === doc.id}>
                          {deletingId === doc.id ? <span className="spinner" style={{ width: 12, height: 12 }} /> : '🗑️'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Search empty state */}
        {!loading && docs.length > 0 && filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3 className="empty-title">No search matches for "{search}"</h3>
            <p className="empty-desc">Check the spellings or try another term.</p>
          </div>
        )}

        {/* Global empty state */}
        {!loading && docs.length === 0 && (
          <div className="empty-hero">
            <div className="empty-hero-icon">📭</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>
              No uploaded documents
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '.9rem', marginBottom: 24 }}>
              Before studying or predicting exams, upload your course PDF documents.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/upload')}>
              📤 Upload PDF Syllabus/Notes
            </button>
          </div>
        )}

        {/* Floating Bulk Actions Bar */}
        <div className={`bulk-actions-panel ${selectedIds.length > 0 ? 'visible' : ''}`}>
          <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
            {selectedIds.length} item{selectedIds.length !== 1 ? 's' : ''} selected
          </span>
          <button className="btn btn-danger btn-sm" onClick={confirmBulkDelete} disabled={bulkDeleting}>
            {bulkDeleting ? <span className="spinner" style={{ width: 12, height: 12 }} /> : '🗑️ Delete Selected'}
          </button>
        </div>
      </div>
    </div>
  );
}
