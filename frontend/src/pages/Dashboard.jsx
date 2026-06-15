import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function AnimatedNumber({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const num = typeof value === 'number' ? value : parseInt(value) || 0;
    if (num === 0) { setDisplay(0); return; }
    
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setDisplay(Math.floor(progress * num));
      if (progress < 1) {
        ref.current = requestAnimationFrame(step);
      } else {
        setDisplay(num);
      }
    };
    ref.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ref.current);
  }, [value, duration]);

  return <>{display}</>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch documents count
  useEffect(() => {
    api.get('/documents')
      .then(r => setDocs(r.data?.documents || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = currentTime.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const name = user.name?.split(' ')[0] || 'Student';
  const chatCount = parseInt(localStorage.getItem('chat_count') || '0');

  // Stats definition
  const STATS = [
    { icon: '📄', label: 'Documents Uploaded', value: loading ? 0 : docs.length, color: 'var(--electric-blue)' },
    { icon: '💬', label: 'AI Chats Active', value: chatCount, color: 'var(--neon-purple)' },
  ];

  const ACTIONS = [
    { icon: '💬', title: 'Ask a Question', desc: 'Chat with your documents via AI', path: '/chat', color: 'var(--electric-blue)' },
    { icon: '📤', title: 'Upload PDF', desc: 'Add syllabus, notes or assignments', path: '/upload', color: 'var(--neon-purple)' },
    { icon: '📁', title: 'My Documents', desc: 'Browse and manage your files', path: '/documents', color: 'var(--electric-blue)' },
    { icon: '🧠', title: 'Exam Predictor', desc: 'Get predicted exam questions', path: '/predictor', color: 'var(--neon-purple)' },
  ];

  // Document progress ring math (out of 10 limit)
  const maxDocs = 10;
  const docPercentage = Math.min((docs.length / maxDocs) * 100, 100);
  const radius = 32;
  const circumference = 2 * Math.PI * radius; // 201.06
  const strokeOffset = circumference - (circumference * docPercentage) / 100;

  // Clock formatter
  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Mock timeline activities
  const ACTIVITIES = [
    { time: 'Just now', title: 'Exam Predictor updated', desc: 'Calculated Dynamic Programming probability to 90%', type: 'info' },
    { time: '10 mins ago', title: 'New chat session', desc: 'Discussed Red-Black Tree rotation rules', type: 'chat' },
    { time: '1 hour ago', title: 'Indexed syllabus PDF', desc: `Uploaded & chunked "${docs[0]?.filename || 'Syllabus.pdf'}"`, type: 'upload' }
  ];

  return (
    <div className="fade-in">
      {/* Premium Gradient Header with Animated Wave Background */}
      <div className="page-header" style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
        padding: '40px 40px 60px',
        borderRadius: '0 0 var(--radius-xl) var(--radius-xl)',
        borderBottom: '1px solid var(--border)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated wave overlay */}
        <div className="wave-container">
          <svg className="wave-svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <defs>
              <linearGradient id="wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--electric-blue)" stopOpacity="0.1" />
                <stop offset="100%" stopColor="var(--neon-purple)" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="wave-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--electric-blue)" stopOpacity="0.05" />
                <stop offset="100%" stopColor="var(--neon-purple)" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <path className="wave-path" d="M0,60 C150,100 350,20 500,60 C650,100 850,20 1000,60 C1150,100 1350,20 1500,60 L1500,120 L0,120 Z" />
            <path className="wave-path-2" d="M0,50 C180,90 300,10 480,50 C660,90 780,10 960,50 C1140,90 1260,10 1440,50 L1440,120 L0,120 Z" />
          </svg>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="page-eyebrow">Student Center</div>
          <h1 className="page-title">{greeting}, {name} 👋</h1>
          <p className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: '0.8rem', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '2px 8px', borderRadius: 12, color: 'var(--electric-blue)', fontFamily: 'var(--font-mono)' }}>
              🕒 {formattedTime}
            </span>
            <span>Your dashboard is up to date</span>
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/chat')} style={{ position: 'relative', zIndex: 1 }}>
          💬 Start AI Session
        </button>
      </div>

      <div className="page-body">
        {/* Stats Section with 3D cards and count-ups */}
        <div className="stats-grid stagger-in">
          {STATS.map(s => (
            <div key={s.label} className="stat-card-3d">
              <span className="stat-icon">{s.icon}</span>
              <span className="stat-label">{s.label}</span>
              <span className="stat-value" style={{ color: s.color }}>
                {loading ? '–' : <AnimatedNumber value={s.value} />}
              </span>
            </div>
          ))}

          {/* SVG Progress Ring Card */}
          <div className="stat-card-3d" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <span className="stat-label" style={{ display: 'block', marginBottom: 4 }}>Storage Space</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                {docs.length} / {maxDocs}
              </span>
              <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                PDF Upload Capacity
              </span>
            </div>
            <div style={{ position: 'relative', width: 76, height: 76 }}>
              <svg width="76" height="76" style={{ transform: 'rotate(-90deg)' }}>
                {/* Underlay Circle */}
                <circle
                  cx="38"
                  cy="38"
                  r={radius}
                  fill="transparent"
                  stroke="var(--border-strong)"
                  strokeWidth="6"
                />
                {/* Foreground Progress Circle */}
                <circle
                  cx="38"
                  cy="38"
                  r={radius}
                  fill="transparent"
                  stroke="url(#ring-grad)"
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeOffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
                <defs>
                  <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--electric-blue)" />
                    <stop offset="100%" stopColor="var(--neon-purple)" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)'
              }}>
                {Math.round(docPercentage)}%
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="section-header" style={{ marginBottom: 16 }}>
          <span className="section-title">Campus Assistant Tools</span>
        </div>
        <div className="actions-grid stagger-in" style={{ marginBottom: 36 }}>
          {ACTIONS.map(a => (
            <div key={a.path} className="premium-border-card" onClick={() => navigate(a.path)} style={{ cursor: 'pointer', padding: 24 }}>
              <span className="action-card-icon" style={{ fontSize: '2rem', display: 'block', marginBottom: 12 }}>{a.icon}</span>
              <div>
                <div className="action-title">{a.title}</div>
                <div className="action-desc" style={{ marginTop: 4 }}>{a.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity & Quick View */}
        <div className="section-header" style={{ marginBottom: 16 }}>
          <span className="section-title">Recent Activity</span>
        </div>
        <div className="card" style={{ padding: '24px 30px' }}>
          <div className="timeline">
            {ACTIVITIES.map((act, idx) => (
              <div key={idx} className={`timeline-item ${idx === 0 ? 'active' : ''}`}>
                <div className="timeline-dot" />
                <div className="timeline-content">
                  <div className="timeline-time">{act.time}</div>
                  <div className="timeline-title">{act.title}</div>
                  <div className="timeline-desc">{act.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
