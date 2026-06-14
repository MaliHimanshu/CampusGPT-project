import { useState, useCallback } from 'react';

let _addToast = null;

export function toast(msg, type = 'success') {
  if (_addToast) _addToast(msg, type);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  _addToast = useCallback((msg, type) => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span className="toast-icon">{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
