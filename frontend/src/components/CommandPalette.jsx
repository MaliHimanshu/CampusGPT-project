import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CommandPalette({ isOpen, onClose, onToggleTheme }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const ITEMS = [
    { category: 'Navigation', icon: '⊞', label: 'Go to Dashboard', action: () => navigate('/dashboard') },
    { category: 'Navigation', icon: '💬', label: 'Go to Chat Assistant', action: () => navigate('/chat') },
    { category: 'Navigation', icon: '↑', label: 'Go to Upload PDF', action: () => navigate('/upload') },
    { category: 'Navigation', icon: '📄', label: 'Go to My Documents', action: () => navigate('/documents') },
    { category: 'Navigation', icon: '🧠', label: 'Go to Question Predictor', action: () => navigate('/predictor') },
    { category: 'Navigation', icon: '👤', label: 'Go to Profile', action: () => navigate('/profile') },
    { category: 'Actions', icon: '🌓', label: 'Toggle Light/Dark Mode', action: () => onToggleTheme() },
    { category: 'Actions', icon: '🗑️', label: 'Clear Chat Sessions', action: () => {
        localStorage.removeItem('chat_sessions');
        localStorage.removeItem('chat_count');
        window.location.reload();
      }
    },
    { category: 'Actions', icon: '🚪', label: 'Sign Out / Logout', action: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
      }
    }
  ];

  // Live filter results based on search input
  const filtered = ITEMS.filter(item => 
    item.label.toLowerCase().includes(search.toLowerCase()) || 
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="cmd-palette-overlay" onClick={onClose}>
      <div className="cmd-palette-box" onClick={e => e.stopPropagation()}>
        <div className="cmd-palette-search-container">
          <span className="cmd-palette-search-icon">🔍</span>
          <input
            ref={inputRef}
            className="cmd-palette-input"
            type="text"
            placeholder="Type a command or navigate..."
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedIndex(0); }}
          />
          <button className="cmd-palette-shortcut" onClick={onClose} style={{ cursor: 'pointer' }}>ESC</button>
        </div>

        <div className="cmd-palette-results">
          {filtered.length === 0 ? (
            <div style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No commands found matching "{search}"
            </div>
          ) : (
            <>
              {/* Group items by category */}
              {['Navigation', 'Actions'].map(cat => {
                const catItems = filtered.filter(item => item.category === cat);
                if (catItems.length === 0) return null;
                return (
                  <div key={cat}>
                    <div className="cmd-palette-group-label">{cat}</div>
                    {catItems.map(item => {
                      const absoluteIndex = filtered.indexOf(item);
                      const isSelected = absoluteIndex === selectedIndex;
                      return (
                        <div
                          key={item.label}
                          className={`cmd-palette-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => { item.action(); onClose(); }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: '1.05rem', minWidth: 20, textAlign: 'center' }}>{item.icon}</span>
                            <span>{item.label}</span>
                          </div>
                          {isSelected && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>press Enter ↵</span>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
