import { useState, useRef, useEffect } from 'react';
import api from '../api';
import ToastContainer, { toast } from '../components/Toast';

const SUGGESTIONS = [
  'Summarize my uploaded syllabus',
  'What topics are covered in my notes?',
  'Explain key concepts from my PDF',
  'What are the important exam topics?',
];

function highlightCode(code) {
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\b(const|let|var|function|return|import|export|from|class|if|else|for|while|new|try|catch|finally|async|await)\b/g, '<span class="hl-keyword">$1</span>')
    .replace(/(".*?"|'.*?'|`.*?`)/g, '<span class="hl-string">$1</span>')
    .replace(/(\/\/.*)/g, '<span class="hl-comment">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="hl-number">$1</span>')
    .replace(/\b(console|log|def|print|self|public|private|static|void|int|float|double)\b/g, '<span class="hl-func">$1</span>');
}

function parseMarkdownTable(tableStr) {
  const rows = tableStr.trim().split('\n').filter(r => r.trim());
  if (rows.length < 2) return null;
  
  const parseRow = row => row.split('|').map(c => c.trim()).filter((c, i, arr) => i > 0 || c !== '');
  
  // Check if second row is a separator (---|---)
  const isSep = rows[1] && /^[\s|:-]+$/.test(rows[1]);
  if (!isSep) return null;
  
  const headers = parseRow(rows[0]);
  const dataRows = rows.slice(2).map(parseRow);
  
  let html = '<div class="chat-table-wrapper"><table class="chat-table"><thead><tr>';
  headers.forEach(h => { html += `<th>${h}</th>`; });
  html += '</tr></thead><tbody>';
  dataRows.forEach(row => {
    html += '<tr>';
    row.forEach(cell => { html += `<td>${cell}</td>`; });
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  return html;
}

function renderText(text) {
  // Step 1: Extract and replace code blocks (protect from other parsing)
  const codeBlocks = [];
  let formatted = text.replace(/```([\s\S]*?)```/g, (match, codePart) => {
    const placeholder = `%%CODEBLOCK_${codeBlocks.length}%%`;
    codeBlocks.push(`<pre class="chat-code-block"><code>${highlightCode(codePart.trim())}</code></pre>`);
    return placeholder;
  });

  // Step 2: Extract and replace markdown tables
  const tableBlocks = [];
  formatted = formatted.replace(/((?:^\|.+\|[ ]*\n){2,})/gm, (match) => {
    const parsed = parseMarkdownTable(match);
    if (parsed) {
      const placeholder = `%%TABLE_${tableBlocks.length}%%`;
      tableBlocks.push(parsed);
      return placeholder;
    }
    return match;
  });
  
  // Step 3: Inline code
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="chat-inline-code">$1</code>');
  
  // Step 4: Headings
  formatted = formatted.replace(/^##\s+(.*)$/gm, '<h2 class="chat-heading">$1</h2>');
  formatted = formatted.replace(/^###\s+(.*)$/gm, '<h3 class="chat-subheading">$1</h3>');
  
  // Step 5: Bold (before italic to avoid conflicts)
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Step 6: Italic
  formatted = formatted.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  
  // Step 7: Horizontal rules
  formatted = formatted.replace(/^---$/gm, '<hr class="chat-hr"/>');
  
  // Step 8: Numbered lists
  formatted = formatted.replace(/^(\d+)\.\s+(.*)$/gm, '<div class="chat-list-item numbered"><span class="chat-list-num">$1.</span><span class="chat-list-text">$2</span></div>');
  
  // Step 9: Bullet lists
  formatted = formatted.replace(/^\s*[-•]\s+(.*)$/gm, '<div class="chat-list-item bullet"><span class="chat-bullet">▸</span><span class="chat-list-text">$1</span></div>');
  
  // Step 10: Line breaks
  formatted = formatted.replace(/\n/g, '<br/>');
  
  // Step 11: Clean up breaks around block elements
  formatted = formatted.replace(/(<\/h[23]>)<br\/>/g, '$1');
  formatted = formatted.replace(/(<\/pre>)<br\/>/g, '$1');
  formatted = formatted.replace(/(<\/div>)<br\/>/g, '$1');
  formatted = formatted.replace(/(<hr[^>]*\/>)<br\/>/g, '$1');
  formatted = formatted.replace(/<br\/>\s*(<h[23])/g, '$1');
  formatted = formatted.replace(/<br\/>\s*(<div class="chat-list)/g, '$1');
  formatted = formatted.replace(/<br\/>\s*(%%TABLE_)/g, '$1');
  formatted = formatted.replace(/(%%)<br\/>/g, '$1');
  
  // Step 12: Restore code blocks and tables
  codeBlocks.forEach((block, i) => {
    formatted = formatted.replace(`%%CODEBLOCK_${i}%%`, block);
  });
  tableBlocks.forEach((block, i) => {
    formatted = formatted.replace(`%%TABLE_${i}%%`, block);
  });
  
  return formatted;
}

export default function Chat() {
  const [sessions, setSessions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chat_sessions') || '[]'); } catch { return []; }
  });
  const [activeIdx, setActiveIdx] = useState(0);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  
  const bottomRef = useRef(null);
  const messages = sessions[activeIdx]?.messages || [];

  // Scroll messages on new additions
  useEffect(() => { 
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); 
  }, [messages, loading, typing]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('chat_sessions', JSON.stringify(sessions));
    localStorage.setItem('chat_count', sessions.length.toString());
  }, [sessions]);

  const newChat = () => {
    const s = { id: Date.now(), title: 'New chat', messages: [], createdAt: new Date().toISOString() };
    setSessions(prev => [s, ...prev]);
    setActiveIdx(0);
  };

  const deleteSession = (idx, e) => {
    e.stopPropagation();
    setSessions(prev => {
      const filtered = prev.filter((_, i) => i !== idx);
      const nextIdx = idx >= filtered.length ? Math.max(0, filtered.length - 1) : idx;
      setActiveIdx(nextIdx);
      return filtered;
    });
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idx);
    toast('Message copied to clipboard', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReaction = (msgIdx, type) => {
    setSessions(prev => {
      const updated = [...prev];
      if (updated[activeIdx]?.messages[msgIdx]) {
        const currentReaction = updated[activeIdx].messages[msgIdx].reaction;
        updated[activeIdx].messages[msgIdx].reaction = currentReaction === type ? null : type;
      }
      return updated;
    });
  };

  // Simulate word-by-word typing effect for AI
  const simulateTyping = (fullText, sources, sessionIdx, msgIdx) => {
    setTyping(true);
    setLoading(false);
    
    let currentText = '';
    let wordIndex = 0;
    const words = fullText.split(' ');

    const timer = setInterval(() => {
      if (wordIndex >= words.length) {
        clearInterval(timer);
        setTyping(false);
        return;
      }
      currentText += (wordIndex === 0 ? '' : ' ') + words[wordIndex];
      setSessions(prev => {
        const updated = [...prev];
        if (updated[sessionIdx]?.messages[msgIdx]) {
          updated[sessionIdx].messages[msgIdx].content = currentText;
        }
        return [...updated];
      });
      wordIndex++;
    }, 25); // 25ms delay per word
  };

  const sendMessage = async (text) => {
    const q = (text || input).trim();
    if (!q || loading || typing) return;
    setInput('');

    let idx = activeIdx;
    let updated = [...sessions];
    
    // Create new session if none active
    if (!updated[idx]) {
      const s = { id: Date.now(), title: q.slice(0, 40), messages: [], createdAt: new Date().toISOString() };
      updated = [s, ...updated]; 
      idx = 0;
      setSessions(updated); 
      setActiveIdx(0);
    }

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Append user message
    updated[idx] = {
      ...updated[idx],
      title: updated[idx].messages.length === 0 ? q.slice(0, 40) : updated[idx].title,
      messages: [...updated[idx].messages, { role: 'user', content: q, time }],
    };
    setSessions([...updated]);
    setLoading(true);

    try {
      const res = await api.post('/chat', { question: q });
      const answer = res.data.answer || 'No answer returned.';
      const sources = res.data.sources || [];
      const images = res.data.images || [];
      const aiMsgIdx = updated[idx].messages.length;

      // Add empty message container for typing animation
      setSessions(prev => {
        const next = [...prev];
        next[idx].messages = [
          ...next[idx].messages,
          { role: 'ai', content: '', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), sources, images }
        ];
        return next;
      });

      simulateTyping(answer, sources, idx, aiMsgIdx);
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.detail || 'Something went wrong. Please try again.';
      
      setSessions(prev => {
        const next = [...prev];
        next[idx].messages = [
          ...next[idx].messages,
          { role: 'ai', content: msg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isError: true }
        ];
        return next;
      });
      toast('Failed to get answer', 'error');
    }
  };

  const handleKeyDown = e => { 
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      sendMessage(); 
    } 
  };

  const autoResize = e => { 
    e.target.style.height = 'auto'; 
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'; 
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ToastContainer />
      <div className="chat-layout" style={{ flex: 1, minHeight: 0 }}>

        {/* Chat sidebar history */}
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <button className="btn btn-primary btn-full btn-sm" onClick={newChat}>+ New chat</button>
          </div>
          <div className="chat-history">
            {sessions.length === 0 && (
              <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', padding: '12px 10px' }}>No chats yet</p>
            )}
            {sessions.map((s, i) => (
              <div key={s.id}
                className={`chat-history-item ${i === activeIdx ? 'active' : ''}`}
                onClick={() => { if (!loading && !typing) setActiveIdx(i); }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                  {s.title || 'New chat'}
                </span>
                <button 
                  onClick={e => deleteSession(i, e)}
                  disabled={loading || typing}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '.75rem', padding: '2px 4px' }}
                >✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Assistant */}
        <div className="chat-main">
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="chat-header-icon">🤖</div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '.95rem' }}>
                  {sessions[activeIdx]?.title || 'Chat Assistant'}
                </div>
                <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="chat-header-dot" />Gemini + Vector RAG
                </div>
              </div>
            </div>
            
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={newChat} 
              disabled={loading || typing}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>+ New Session</span>
            </button>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-empty">
                <div className="chat-empty-icon">🎓</div>
                <h3>Ask questions from your PDF materials</h3>
                <p>Upload files to your knowledge base first, then select a prompt shortcut below or write your own.</p>
                <div className="chat-suggestions">
                  {SUGGESTIONS.map(s => (
                    <button key={s} className="chat-suggestion" onClick={() => sendMessage(s)}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role === 'user' ? 'user' : 'ai'}`}>
                <div className="message-avatar">{msg.role === 'user' ? '👤' : '🤖'}</div>
                <div className="message-content-wrapper">
                  <div 
                    className="message-bubble"
                    style={msg.isError ? { borderColor: 'var(--error)', color: 'var(--error)' } : {}}
                    dangerouslySetInnerHTML={{ __html: renderText(msg.content) }} 
                  />
                  
                  {/* Diagrams / Images from PDF */}
                  {msg.role === 'ai' && msg.images && msg.images.length > 0 && (
                    <div className="chat-images-gallery">
                      <span className="chat-images-label">📊 Diagrams from your document:</span>
                      <div className="chat-images-grid">
                        {msg.images.map((img, imgIdx) => (
                          <div key={imgIdx} className="chat-image-card">
                            <img
                              src={`http://127.0.0.1:8001${img.url}`}
                              alt={`Diagram from page ${img.page}`}
                              className="chat-image"
                              onClick={() => window.open(`http://127.0.0.1:8001${img.url}`, '_blank')}
                            />
                            <span className="chat-image-caption">Page {img.page} — {img.filename}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sources display for AI answers */}
                  {msg.role === 'ai' && msg.sources && msg.sources.length > 0 && (
                    <div className="citations">
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', width: '100%' }}>
                        Sources used:
                      </span>
                      {msg.sources.map(src => (
                        <div key={src} className="citation-chip" title={src}>
                          📄 {src}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bubble action bar (Copy and reactions) */}
                  <div className="message-actions-bar">
                    <button 
                      className="msg-action-btn" 
                      onClick={() => handleCopy(msg.content, i)}
                      title="Copy to clipboard"
                    >
                      {copiedId === i ? '✅' : '📋'} {copiedId === i ? 'Copied' : 'Copy'}
                    </button>
                    {msg.role === 'ai' && !msg.isError && (
                      <>
                        <button 
                          className={`msg-action-btn ${msg.reaction === 'like' ? 'active' : ''}`}
                          onClick={() => handleReaction(i, 'like')}
                          title="Thumbs up"
                        >
                          👍
                        </button>
                        <button 
                          className={`msg-action-btn ${msg.reaction === 'dislike' ? 'active' : ''}`}
                          onClick={() => handleReaction(i, 'dislike')}
                          title="Thumbs down"
                        >
                          👎
                        </button>
                      </>
                    )}
                  </div>
                  <div className="message-time">{msg.time}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="message ai">
                <div className="message-avatar">🤖</div>
                <div className="message-content-wrapper">
                  <div className="message-bubble">
                    <div className="dot-pulse">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-area">
            <div className="chat-input-box">
              <textarea className="chat-textarea"
                placeholder="Ask a question about your documents…"
                value={input}
                onChange={e => { setInput(e.target.value); autoResize(e); }}
                onKeyDown={handleKeyDown} 
                disabled={loading || typing}
                rows={1} 
              />
              <button 
                className="chat-send-btn" 
                onClick={() => sendMessage()} 
                disabled={!input.trim() || loading || typing}
              >
                {loading ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : '↑'}
              </button>
            </div>
            <p className="chat-hint">Enter to send · Shift+Enter for newline</p>
          </div>

          {/* Floating Action Button (FAB) for New Chat */}
          <button 
            className="chat-fab" 
            onClick={newChat} 
            disabled={loading || typing}
            title="Start new chat session"
          >
            ➕
          </button>
        </div>
      </div>
    </div>
  );
}
