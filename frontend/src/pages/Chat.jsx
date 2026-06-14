import { useState, useRef, useEffect } from 'react';
import api from '../api';
import ToastContainer, { toast } from '../components/Toast';

const SUGGESTIONS = [
  'Summarize my uploaded syllabus',
  'What topics are covered in my notes?',
  'Explain key concepts from my PDF',
  'What are the important exam topics?',
];

function renderText(text) {
  return text
    .replace(/```([\s\S]*?)```/g,'<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
    .replace(/\n/g,'<br/>');
}

export default function Chat() {
  const [sessions, setSessions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('chat_sessions')||'[]'); } catch { return []; }
  });
  const [activeIdx, setActiveIdx] = useState(0);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const messages = sessions[activeIdx]?.messages || [];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, loading]);
  useEffect(() => {
    localStorage.setItem('chat_sessions', JSON.stringify(sessions));
    localStorage.setItem('chat_count', sessions.length.toString());
  }, [sessions]);

  const newChat = () => {
    const s = { id:Date.now(), title:'New chat', messages:[], createdAt:new Date().toISOString() };
    setSessions(prev => [s,...prev]);
    setActiveIdx(0);
  };

  const deleteSession = (idx, e) => {
    e.stopPropagation();
    setSessions(prev => prev.filter((_,i) => i!==idx));
    setActiveIdx(0);
  };

  const sendMessage = async (text) => {
    const q = (text||input).trim();
    if (!q || loading) return;
    setInput('');

    let idx = activeIdx;
    let updated = [...sessions];
    if (!updated[idx]) {
      const s = { id:Date.now(), title:q.slice(0,40), messages:[], createdAt:new Date().toISOString() };
      updated = [s,...updated]; idx=0;
      setSessions(updated); setActiveIdx(0);
    }

    const time = new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
    updated[idx] = {
      ...updated[idx],
      title: updated[idx].messages.length===0 ? q.slice(0,40) : updated[idx].title,
      messages: [...updated[idx].messages, { role:'user', content:q, time }],
    };
    setSessions([...updated]);
    setLoading(true);

    try {
      const res = await api.post('/chat', { question:q });
      updated[idx] = { ...updated[idx], messages:[...updated[idx].messages,
        { role:'ai', content:res.data.answer||'No answer returned.', time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) }
      ]};
      setSessions([...updated]);
    } catch (err) {
      updated[idx] = { ...updated[idx], messages:[...updated[idx].messages,
        { role:'ai', content:err.response?.data?.detail||'Something went wrong. Please try again.', time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}), isError:true }
      ]};
      setSessions([...updated]);
      toast('Failed to get answer','error');
    } finally { setLoading(false); }
  };

  const handleKeyDown = e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const autoResize = e => { e.target.style.height='auto'; e.target.style.height=Math.min(e.target.scrollHeight,140)+'px'; };

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <ToastContainer />
      <div className="chat-layout" style={{flex:1,minHeight:0}}>

        {/* Chat sidebar */}
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <button className="btn btn-primary btn-full btn-sm" onClick={newChat}>+ New chat</button>
          </div>
          <div className="chat-history">
            {sessions.length===0 && (
              <p style={{fontSize:'.78rem',color:'var(--text-muted)',padding:'12px 10px'}}>No chats yet</p>
            )}
            {sessions.map((s,i) => (
              <div key={s.id}
                className={`chat-history-item ${i===activeIdx?'active':''}`}
                onClick={() => setActiveIdx(i)}>
                <span style={{overflow:'hidden',textOverflow:'ellipsis',flex:1}}>
                  {s.title||'New chat'}
                </span>
                <button onClick={e=>deleteSession(i,e)}
                  style={{background:'transparent',border:'none',cursor:'pointer',color:'var(--text-muted)',fontSize:'.75rem',flexShrink:0,padding:'2px 4px',borderRadius:4}}
                >✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* Main chat */}
        <div className="chat-main">
          <div className="chat-header">
            <div style={{width:36,height:36,borderRadius:10,background:'var(--gold-dim)',border:'1px solid var(--border-gold)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem'}}>🤖</div>
            <div>
              <div style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:'.95rem'}}>
                {sessions[activeIdx]?.title || 'Chat Assistant'}
              </div>
              <div style={{fontSize:'.72rem',color:'var(--text-muted)',display:'flex',alignItems:'center',gap:5}}>
                <span className="chat-header-dot"/>Gemini + RAG · Ready
              </div>
            </div>
          </div>

          <div className="chat-messages">
            {messages.length===0 && (
              <div className="chat-empty">
                <div className="chat-empty-icon">🎓</div>
                <h3>Ask anything about your documents</h3>
                <p>Upload a PDF first, then ask questions about your syllabus, notes, or assignments.</p>
                <div className="chat-suggestions">
                  {SUGGESTIONS.map(s => (
                    <button key={s} className="chat-suggestion" onClick={() => sendMessage(s)}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg,i) => (
              <div key={i} className={`message ${msg.role==='user'?'user':'ai'} fade-in`}>
                <div className="message-avatar">{msg.role==='user'?'👤':'🤖'}</div>
                <div>
                  <div className={`message-bubble`}
                    style={msg.isError?{borderColor:'rgba(248,113,113,0.3)',color:'var(--error)'}:{}}
                    dangerouslySetInnerHTML={{__html:renderText(msg.content)}}/>
                  <div className="message-time">{msg.time}</div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="message ai fade-in">
                <div className="message-avatar">🤖</div>
                <div className="message-bubble"><div className="dot-pulse"><span/><span/><span/></div></div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          <div className="chat-input-area">
            <div className="chat-input-box">
              <textarea className="chat-textarea"
                placeholder="Ask a question about your documents…"
                value={input}
                onChange={e=>{setInput(e.target.value);autoResize(e);}}
                onKeyDown={handleKeyDown} rows={1}/>
              <button className="chat-send-btn" onClick={()=>sendMessage()} disabled={!input.trim()||loading}>
                {loading ? <span className="spinner" style={{width:14,height:14,borderWidth:2}}/> : '↑'}
              </button>
            </div>
            <p className="chat-hint">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      </div>
    </div>
  );
}
