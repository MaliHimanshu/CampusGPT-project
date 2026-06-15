import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import CommandPalette from './CommandPalette';

const NAV = [
  { path: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { path: '/chat',      icon: '💬', label: 'Chat Assistant' },
  { path: '/upload',    icon: '↑',  label: 'Upload PDF' },
  { path: '/documents', icon: '📄', label: 'My Documents' },
  { path: '/predictor', icon: '🧠', label: 'Question Predictor' },
  { path: '/profile',   icon: '👤', label: 'Profile' },
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = (user.name || user.email || 'U').slice(0, 2).toUpperCase();
  const [loggingOut, setLoggingOut] = useState(false);
  
  // Collapse sidebar states
  const [isMini, setIsMini] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });
  
  // Mobile sidebar open state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Command Palette open state
  const [isCmdOpen, setIsCmdOpen] = useState(false);

  // Theme states
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    // Apply theme on load
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Handle Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCmdOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleToggleSidebar = () => {
    setIsMini(prev => {
      localStorage.setItem('sidebar_collapsed', (!prev).toString());
      return !prev;
    });
  };

  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
    }, 300);
  };

  const handleNav = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  return (
    <div className="app-layout">
      {/* Mobile hamburger */}
      <button className="mobile-toggle" onClick={() => setSidebarOpen(true)}>
        ☰
      </button>

      {/* Sidebar overlay for mobile */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar ${isMini ? 'collapsed' : ''} ${sidebarOpen ? 'open' : ''}`} style={isMini ? { overflow: 'visible' } : {}}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-logo-icon">🎓</div>
            <span className="sidebar-logo-text sidebar-brand-text">CampusGPT</span>
          </div>
          {!isMini && (
            <button className="sidebar-collapse-btn" onClick={handleToggleSidebar} title="Collapse sidebar">
              ◀
            </button>
          )}
        </div>
        
        <nav className="sidebar-nav" style={isMini ? { overflow: 'visible' } : {}}>
          <span className="sidebar-section-label">Menu</span>
          {NAV.map(item => (
            <button
              key={item.path}
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => handleNav(item.path)}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-label">{item.label}</span>
              {isMini && <span className="sidebar-tooltip">{item.label}</span>}
            </button>
          ))}
          
          <span className="sidebar-section-label" style={{ marginTop: 12 }}>Account</span>
          <button
            className="sidebar-item"
            onClick={handleLogout}
            style={{ opacity: loggingOut ? 0.5 : 1 }}
          >
            <span className="sidebar-item-icon">🚪</span>
            <span className="sidebar-item-label">Logout</span>
            {isMini && <span className="sidebar-tooltip">Logout</span>}
          </button>
        </nav>

        <div className="sidebar-footer">
          {/* Theme switcher */}
          <button className="sidebar-item" onClick={handleToggleTheme} style={{ margin: '4px 0' }}>
            <span className="sidebar-item-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span className="sidebar-item-label">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            {isMini && <span className="sidebar-tooltip">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          {/* Expand sidebar button when collapsed */}
          {isMini && (
            <button className="sidebar-item" onClick={handleToggleSidebar} style={{ margin: '4px 0' }}>
              <span className="sidebar-item-icon">▶</span>
              <span className="sidebar-item-label">Expand</span>
              <span className="sidebar-tooltip">Expand Sidebar</span>
            </button>
          )}

          <div className="sidebar-user" onClick={() => handleNav('/profile')}>
            <div className="sidebar-avatar-container">
              <div className="sidebar-avatar-ring" />
              <div className="sidebar-avatar-img">
                <span className="sidebar-avatar-text">{initials}</span>
              </div>
            </div>
            <div className="sidebar-user-info" style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-username">{user.name || 'Student'}</div>
              <div className="sidebar-useremail">{user.email || ''}</div>
            </div>
          </div>
          <div className="sidebar-version">
            <span className="status-dot" />
            {!isMini && <span>Online · v2.0</span>}
          </div>
        </div>
      </aside>

      <main className="main-content">{children}</main>

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette 
        isOpen={isCmdOpen} 
        onClose={() => setIsCmdOpen(false)} 
        onToggleTheme={handleToggleTheme}
      />
    </div>
  );
}