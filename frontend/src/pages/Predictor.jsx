import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import ToastContainer, { toast } from '../components/Toast';

export default function Predictor() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  
  // Predict data states
  const [prepScore, setPrepScore] = useState(0);
  const [examConfidence, setExamConfidence] = useState(0);
  const [topics, setTopics] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [insights, setInsights] = useState([]);
  
  // Animation states
  const [animate, setAnimate] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(null);

  // Cycle loader tips during API execution
  const [loaderTip, setLoaderTip] = useState('Parsing uploaded study notes...');
  const loaderTips = [
    'Parsing uploaded study notes...',
    'Analyzing syllabus coverage metrics...',
    'Correlating previous-year questions...',
    'Predicting upcoming exam probabilities...',
    'Synthesizing study strategy recommendations...'
  ];

  useEffect(() => {
    if (loading) {
      let index = 0;
      const interval = setInterval(() => {
        index = (index + 1) % loaderTips.length;
        setLoaderTip(loaderTips[index]);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const fetchPredictions = async (targetTopic = '') => {
    setLoading(true);
    setError(null);
    setAnimate(false);
    try {
      const res = await api.post('/predict', { topic: targetTopic });
      const data = res.data;
      
      setTopics(data.topics || []);
      setHeatmap(data.heatmap || []);
      setQuestions(data.questions || []);
      setInsights(data.insights || []);

      // Trigger count-up animation for scores
      let currentPrep = 0;
      let targetPrep = data.prepScore || 0;
      const prepInterval = setInterval(() => {
        currentPrep += 1;
        if (currentPrep >= targetPrep) {
          setPrepScore(targetPrep);
          clearInterval(prepInterval);
        } else {
          setPrepScore(currentPrep);
        }
      }, 15);

      let currentConf = 0;
      let targetConf = data.examConfidence || 0;
      const confInterval = setInterval(() => {
        currentConf += 1;
        if (currentConf >= targetConf) {
          setExamConfidence(targetConf);
          clearInterval(confInterval);
        } else {
          setExamConfidence(currentConf);
        }
      }, 15);

      setAnimate(true);
    } catch (err) {
      console.error('Error fetching prediction:', err);
      const detail = err.response?.data?.detail || 'Failed to fetch exam prediction.';
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  // Fetch general predictions on mount
  useEffect(() => {
    fetchPredictions('');
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveQuery(searchQuery);
    fetchPredictions(searchQuery);
  };

  const handleClearFilter = () => {
    setSearchQuery('');
    setActiveQuery('');
    fetchPredictions('');
  };

  const handlePrint = () => {
    toast('Preparing print layout...', 'info');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // Radar chart mathematics
  const center = 110;
  const radius = 80;
  const displayTopics = topics || [];
  const totalTopics = displayTopics.length || 1;

  const getCoordinates = (index, value) => {
    const angle = (index * 2 * Math.PI) / totalTopics - Math.PI / 2;
    const distance = (value / 100) * radius;
    const x = center + distance * Math.cos(angle);
    const y = center + distance * Math.sin(angle);
    return { x, y };
  };

  // Build radar polygon points
  const radarPoints = displayTopics.length > 0 
    ? displayTopics.map((t, i) => {
        const val = animate ? t.coverage : 0;
        const coords = getCoordinates(i, val);
        return `${coords.x},${coords.y}`;
      }).join(' ')
    : '';

  const displayHeatmap = heatmap.length > 0 ? heatmap : displayTopics.map(() => Array(12).fill(0));

  return (
    <div className="fade-in">
      <ToastContainer />
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Academic Analytics</div>
          <h1 className="page-title">Question Predictor 🔮</h1>
          <p className="page-subtitle">AI-predicted exam topics and syllabus analysis based on knowledge base</p>
        </div>
        <button className="btn btn-primary" onClick={handlePrint} disabled={loading || error}>
          🖨️ Export PDF Report
        </button>
      </div>

      <div className="page-body">
        {/* Search / filter control */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <input
            type="text"
            className="chat-textarea"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '0.9rem',
              flex: 1,
              height: '44px',
              lineHeight: '20px',
              resize: 'none'
            }}
            placeholder="Focus prediction on a specific subject, unit, or topic (e.g. 'Dynamic Programming'). Leave blank for general..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ height: '44px', whiteSpace: 'nowrap' }} disabled={loading}>
            🔍 Analyze
          </button>
          {activeQuery && (
            <button type="button" className="btn" style={{ height: '44px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)' }} onClick={handleClearFilter}>
              Clear
            </button>
          )}
        </form>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 350, gap: 16 }}>
            <div className="spinner" style={{ width: 42, height: 42, borderWidth: 4 }} />
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500, minHeight: '24px' }}>
              {loaderTip}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', gap: 20, marginTop: 16 }}>
              <div className="skeleton" style={{ height: 160, borderRadius: 12 }} />
              <div className="skeleton" style={{ height: 160, borderRadius: 12 }} />
            </div>
          </div>
        ) : error ? (
          <div className="predictor-card" style={{ textAlign: 'center', padding: '48px 24px', border: '1px solid var(--border-strong)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📂</div>
            <h3 style={{ marginBottom: 10, color: 'var(--text-primary)' }}>Prediction Not Available</h3>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto 20px', fontSize: '0.9rem', lineHeight: 1.6 }}>
              {error}
            </p>
            {error.includes('upload') ? (
              <button className="btn btn-primary" onClick={() => navigate('/upload')}>
                ↑ Upload Study Materials
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => fetchPredictions(activeQuery)}>
                Retry Analysis
              </button>
            )}
          </div>
        ) : (
          <>
            {activeQuery && (
              <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '12px 18px', borderRadius: 8, color: 'var(--electric-blue)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                <span>🎯 Focused Prediction active for topic: <strong>{activeQuery}</strong></span>
              </div>
            )}

            {/* Scores counters row */}
            <div className="stats-grid" style={{ marginBottom: 24 }}>
              <div className="stat-card-3d">
                <span className="stat-icon">📈</span>
                <span className="stat-label">Syllabus Prep Score</span>
                <span className="stat-value" style={{ color: 'var(--electric-blue)' }}>
                  {prepScore}%
                </span>
                <div className="progress-bar" style={{ marginTop: 8 }}>
                  <div className="progress-fill" style={{ width: `${prepScore}%` }} />
                </div>
              </div>
              <div className="stat-card-3d">
                <span className="stat-icon">🎯</span>
                <span className="stat-label">Exam Confidence Index</span>
                <span className="stat-value" style={{ color: 'var(--neon-purple)' }}>
                  {examConfidence}%
                </span>
                <div className="progress-bar" style={{ marginTop: 8 }}>
                  <div className="progress-fill" style={{ width: `${examConfidence}%`, background: 'var(--neon-purple)' }} />
                </div>
              </div>
              <div className="stat-card-3d">
                <span className="stat-icon">🎓</span>
                <span className="stat-label">Analyzed Materials</span>
                <span className="stat-value">Active</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Cross-referenced uploaded assets</span>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="predictor-grid">
              {/* Radar Chart */}
              <div className="predictor-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 style={{ alignSelf: 'flex-start', marginBottom: 16 }}>Topic Coverage Radar</h3>
                {displayTopics.length > 0 ? (
                  <>
                    <div style={{ position: 'relative', width: 220, height: 220 }}>
                      <svg width="220" height="220">
                        {/* Radar Grid Circles */}
                        {[20, 40, 60, 80, 100].map(val => (
                          <circle
                            key={val}
                            cx={center}
                            cy={center}
                            r={(val / 100) * radius}
                            className="radar-grid-circle"
                          />
                        ))}
                        {/* Radar Axes */}
                        {displayTopics.map((_, i) => {
                          const endCoords = getCoordinates(i, 100);
                          return (
                            <line
                              key={i}
                              x1={center}
                              y1={center}
                              x2={endCoords.x}
                              y2={endCoords.y}
                              className="radar-grid-line"
                            />
                          );
                        })}
                        {/* Radar Filled Shape */}
                        {animate && radarPoints && (
                          <polygon
                            points={radarPoints}
                            className="radar-polygon"
                          />
                        )}
                        {/* Vertex Markers */}
                        {animate && displayTopics.map((t, i) => {
                          const coords = getCoordinates(i, t.coverage);
                          return (
                            <circle
                              key={i}
                              cx={coords.x}
                              cy={coords.y}
                              r="4"
                              className="radar-marker"
                            />
                          );
                        })}
                      </svg>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 12 }}>
                      {displayTopics.map((t, i) => (
                        <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: i % 2 === 0 ? 'var(--electric-blue)' : 'var(--neon-purple)' }} />
                          <span style={{ color: 'var(--text-secondary)' }}>{t.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 80 }}>No topics available</p>
                )}
              </div>

              {/* Bar Chart */}
              <div className="predictor-card">
                <h3 style={{ marginBottom: 18 }}>Exam Probability Ranking</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {displayTopics.map(t => (
                    <div key={t.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600 }}>{t.name}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{t.probability}% Probability</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: animate ? `${t.probability}%` : '0%',
                            transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Heatmap Section */}
            <div className="predictor-card" style={{ marginBottom: 24 }}>
              <h3>Week-by-week Syllabus Focus Heatmap</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                Exam weight distribution mapped across course timeline (Weeks 1 to 12)
              </p>
              <div className="heatmap-grid" style={{ display: 'grid', gap: 10 }}>
                {displayTopics.map((t, rowIdx) => (
                  <div key={t.name} style={{ display: 'grid', gridTemplateColumns: '2fr 5fr', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                      {t.name}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {displayHeatmap[rowIdx] && displayHeatmap[rowIdx].map((level, colIdx) => (
                        <div
                          key={colIdx}
                          className={`heatmap-cell level-${level}`}
                          style={{ flex: 1, height: '24px', borderRadius: '4px' }}
                          title={`Week ${colIdx + 1} - ${t.name}: Level ${level} importance`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, fontSize: '0.7rem', marginTop: 12, color: 'var(--text-secondary)' }}>
                <span>Low Importance</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <span className="heatmap-cell level-0" style={{ width: 12, height: 12, borderRadius: 2 }} />
                  <span className="heatmap-cell level-1" style={{ width: 12, height: 12, borderRadius: 2 }} />
                  <span className="heatmap-cell level-2" style={{ width: 12, height: 12, borderRadius: 2 }} />
                  <span className="heatmap-cell level-3" style={{ width: 12, height: 12, borderRadius: 2 }} />
                  <span className="heatmap-cell level-4" style={{ width: 12, height: 12, borderRadius: 2 }} />
                </div>
                <span>High Weight</span>
              </div>
            </div>

            {/* AI Insights & predicted exam questions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
              
              {/* Predicted Q&A */}
              <div className="predictor-card">
                <h3 style={{ marginBottom: 16 }}>Predicted Exam Q&A</h3>
                <div className="accordion">
                  {questions.map(q => {
                    const isOpen = accordionOpen === q.id;
                    return (
                      <div key={q.id} className={`accordion-item ${isOpen ? 'open' : ''}`}>
                        <button className="accordion-trigger" onClick={() => setAccordionOpen(isOpen ? null : q.id)}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: q.tag.includes('High') ? 'var(--error)' : 'var(--electric-blue)', textTransform: 'uppercase' }}>
                              {q.tag}
                            </span>
                            <span>{q.question}</span>
                          </div>
                          <span className="accordion-arrow">▼</span>
                        </button>
                        <div className="accordion-content">
                          <p style={{ marginBottom: 12 }}>{q.answer}</p>
                          <div style={{ background: 'rgba(59, 130, 246, 0.05)', borderLeft: '3px solid var(--electric-blue)', padding: '8px 12px', borderRadius: 4, fontStyle: 'italic', fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                            {q.tip}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Insights */}
              <div className="predictor-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ marginBottom: 16 }}>Study Recommendations & AI Insights</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                  {insights.map((insight, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 12, background: 'rgba(255, 255, 255, 0.02)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '1.2rem' }}>💡</span>
                      <p style={{ fontSize: '0.84rem', lineHeight: 1.5, color: 'var(--text-secondary)', margin: 0 }}>
                        {insight}
                      </p>
                    </div>
                  ))}
                  {insights.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>No study recommendations generated yet.</p>
                  )}
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}
