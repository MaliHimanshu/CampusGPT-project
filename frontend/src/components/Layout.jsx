import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';

const NAV = [
  { path: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { path: '/chat',      icon: '💬', label: 'Chat Assistant' },
  { path: '/upload',    icon: '↑',  label: 'Upload PDF' },
  { path: '/documents', icon: '📄', label: 'My Documents' },
  { path: '/profile',   icon: '👤', label: 'Profile' },
];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = (user.name || user.email || 'U').slice(0, 2).toUpperCase();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
    }, 300);
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">🎓</div>
          <span className="sidebar-logo-text">CampusGPT</span>
        </div>
        <nav className="sidebar-nav">
          <span className="sidebar-section-label">Menu</span>
          {NAV.map(item => (
            <button
              key={item.path}
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
          <span className="sidebar-section-label" style={{ marginTop: 12 }}>Account</span>
          <button className="sidebar-item" onClick={handleLogout} style={{ opacity: loggingOut ? 0.5 : 1 }}>
            <span className="sidebar-item-icon">🚪</span>
            Logout
          </button>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={() => navigate('/profile')}>
            <div className="sidebar-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-username">{user.name || 'Student'}</div>
              <div className="sidebar-useremail">{user.email || ''}</div>
            </div>
          </div>
        </div>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}