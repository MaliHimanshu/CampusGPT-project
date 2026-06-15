import { useState, useEffect } from 'react';
import ToastContainer, { toast } from '../components/Toast';

export default function Predictor() {
  const [animate, setAnimate] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(null);
  const [prepScore, setPrepScore] = useState(0);
  const [examConfidence, setExamConfidence] = useState(0);

  // Trigger animations on load
  useEffect(() => {
    setAnimate(true);
    // Count up scores
    const prepInterval = setInterval(() => {
      setPrepScore(prev => {
        if (prev >= 84) { clearInterval(prepInterval); return 84; }
        return prev + 1;
      });
    }, 15);

    const confidenceInterval = setInterval(() => {
      setExamConfidence(prev => {
        if (prev >= 91) { clearInterval(confidenceInterval); return 91; }
        return prev + 1;
      });
    }, 15);

    return () => {
      clearInterval(prepInterval);
      clearInterval(confidenceInterval);
    };
  }, []);

  const TOPICS = [
    { name: 'Data Structures', weight: 85, coverage: 78, frequency: 90 },
    { name: 'Algorithms', weight: 95, coverage: 85, frequency: 95 },
    { name: 'Database Systems', weight: 70, coverage: 90, frequency: 60 },
    { name: 'Computer Networks', weight: 65, coverage: 60, frequency: 70 },
    { name: 'Operating Systems', weight: 80, coverage: 72, frequency: 80 },
    { name: 'Software Engineering', weight: 55, coverage: 95, frequency: 45 },
  ];

  // Heatmap: Weeks 1-12 mapped to 6 topics
  const HEATMAP_CELLS = [
    [4, 3, 2, 0, 1, 3, 4, 2, 1, 0, 4, 3], // DS
    [3, 4, 4, 2, 3, 1, 3, 4, 4, 2, 3, 4], // Algo
    [1, 2, 0, 4, 2, 1, 0, 2, 3, 1, 2, 2], // DB
    [2, 1, 3, 1, 0, 2, 1, 3, 2, 0, 1, 3], // Network
    [3, 3, 2, 3, 2, 0, 3, 2, 1, 3, 3, 3], // OS
    [0, 1, 1, 2, 1, 4, 1, 1, 0, 1, 2, 1], // SE
  ];

  const PREDICTED_QUESTIONS = [
    {
      id: 1,
      tag: 'Algorithms · High Probability',
      question: 'Explain the difference between Dynamic Programming and Divide-and-Conquer. Provide a standard scheduling problem example.',
      answer: 'Divide-and-Conquer partitions a problem into independent subproblems, solves them recursively, and combines their solutions (e.g., Merge Sort). Dynamic Programming solves overlapping subproblems by storing their results in a table (memoization/tabulation) to avoid recomputation (e.g., Knapsack Problem, Floyd-Warshall).',
      tip: 'Exam Tip: Draw the recursion tree vs the DP table structure to secure full marks.'
    },
    {
      id: 2,
      tag: 'Data Structures · Medium Probability',
      question: 'Compare Red-Black Trees and AVL Trees in terms of rotation complexity and search operations.',
      answer: 'AVL trees are more strictly balanced than Red-Black trees, leading to faster search operations (better depth). However, Red-Black trees require fewer rotations during insertion and deletion, making them more efficient for write-intensive workloads.',
      tip: 'Exam Tip: AVL tree balance factor is absolute difference of height <= 1.'
    },
    {
      id: 3,
      tag: 'Database Systems · High Probability',
      question: 'What is 3NF (Third Normal Form) and how does it differ from BCNF (Boyce-Codd Normal Form)? Provide an anomaly scenario.',
      answer: 'A relation is in 3NF if it is in 2NF and no non-prime attribute is transitively dependent on the primary key. BCNF is stronger: for every functional dependency X -> Y, X must be a superkey. BCNF addresses cases where overlapping candidate keys cause remaining redundancies.',
      tip: 'Exam Tip: Show a table decomposition where BCNF preserves functional dependencies.'
    },
    {
      id: 4,
      tag: 'Operating Systems · Low Probability',
      question: 'Describe the four necessary conditions for Deadlock occurrence and how the Banker\'s algorithm prevents it.',
      answer: 'The four conditions are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. The Banker\'s algorithm prevents deadlock by dynamically analyzing resource allocation states, ensuring that resource requests are only granted if the resulting state remains "safe".',
      tip: 'Exam Tip: Prepare a resource allocation graph showing a deadlock cycle.'
    }
  ];

  // Radar chart mathematics
  const center = 110;
  const radius = 80;
  const totalTopics = TOPICS.length;

  const getCoordinates = (index, value) => {
    const angle = (index * 2 * Math.PI) / totalTopics - Math.PI / 2;
    const distance = (value / 100) * radius;
    const x = center + distance * Math.cos(angle);
    const y = center + distance * Math.sin(angle);
    return { x, y };
  };

  // Build radar polygon points
  const radarPoints = TOPICS.map((t, i) => {
    const val = animate ? t.coverage : 0;
    const coords = getCoordinates(i, val);
    return `${coords.x},${coords.y}`;
  }).join(' ');

  const handlePrint = () => {
    toast('Preparing print layout...', 'info');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div className="fade-in">
      <ToastContainer />
      <div className="page-header">
        <div>
          <div className="page-eyebrow">Academic Analytics</div>
          <h1 className="page-title">Question Predictor 🔮</h1>
          <p className="page-subtitle">AI-predicted exam topics and syllabus analysis based on knowledge base</p>
        </div>
        <button className="btn btn-primary" onClick={handlePrint}>
          🖨️ Export PDF Report
        </button>
      </div>

      <div className="page-body">
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
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Cross-referenced 4 major categories</span>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="predictor-grid">
          {/* Radar Chart */}
          <div className="predictor-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 style={{ alignSelf: 'flex-start', marginBottom: 16 }}>Topic Coverage Radar</h3>
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
                {TOPICS.map((_, i) => {
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
                {animate && (
                  <polygon
                    points={radarPoints}
                    className="radar-polygon"
                  />
                )}
                {/* Vertex Markers */}
                {animate && TOPICS.map((t, i) => {
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
              {TOPICS.map((t, i) => (
                <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: i % 2 === 0 ? 'var(--electric-blue)' : 'var(--neon-purple)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{t.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="predictor-card">
            <h3 style={{ marginBottom: 18 }}>Exam Weight Frequency</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {TOPICS.map(t => (
                <div key={t.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{t.name}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{t.frequency}% Weight</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: animate ? `${t.frequency}%` : '0%',
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
          <div className="heatmap-grid">
            {TOPICS.map((t, rowIdx) => (
              <div key={t.name} style={{ gridColumn: 'span 7', display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', alignItems: 'center', gap: 6 }}>
                <span style={{ gridColumn: 'span 3', fontSize: '0.75rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.name}
                </span>
                <div style={{ gridColumn: 'span 10', display: 'flex', gap: 6 }}>
                  {HEATMAP_CELLS[rowIdx].map((level, colIdx) => (
                    <div
                      key={colIdx}
                      className={`heatmap-cell level-${level}`}
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

        {/* Expandable Accordionpredicted exam questions */}
        <div className="predictor-card">
          <h3 style={{ marginBottom: 16 }}>Predicted Exam Q&A</h3>
          <div className="accordion">
            {PREDICTED_QUESTIONS.map(q => {
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
      </div>
    </div>
  );
}
