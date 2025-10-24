import React, { useState, useEffect } from 'react';
import { voteOnPoll } from '../utils/pollsApi';

export default function StudentPollPopup({ poll, onClose }) {
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!poll) return;
    const endMs = poll.endsAt ? new Date(poll.endsAt).getTime() : Date.now() + (poll.durationSeconds || 0) * 1000;
    const tick = () => {
      const secs = Math.max(0, Math.ceil((endMs - Date.now()) / 1000));
      setRemaining(secs);
      if (secs <= 0) {
        onClose && onClose(false);
      }
    };
    const interval = setInterval(tick, 1000);
    tick();
    return () => clearInterval(interval);
  }, [poll, onClose]);

  const handleSubmit = async () => {
    if (selected == null) return;
    setBusy(true); setError('');
    try {
      await voteOnPoll(poll.id, selected);
      // Remember vote in localStorage
      try { localStorage.setItem(`poll_voted_${poll.id}`, '1'); } catch {}
      onClose && onClose(true);
    } catch (e) {
      setError(e.message || 'Failed to submit vote');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
      <div style={{ width: 480, maxWidth: '95%', background: '#fff', borderRadius: 8, border: '2px solid #0066CC', padding: 20 }}>
        <h3 style={{ marginTop: 0 }}>Poll</h3>
        {remaining != null && (
          <div style={{ marginBottom: 10, fontWeight: 'bold', color: '#e74c3c' }}>
            Time left: {Math.floor((remaining || 0) / 60)}:{String((remaining || 0) % 60).padStart(2, '0')}
          </div>
        )}
        <div style={{ fontWeight: 'bold', marginBottom: 10 }}>{poll?.question}</div>
        {error && <div style={{ background: '#ffe6e6', border: '1px solid #ffb3b3', color: '#b30000', padding: 8, borderRadius: 4, marginBottom: 10 }}>{error}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(poll?.options || []).map((opt, i) => (
            <label key={`${opt.text}-${i}`} style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
              <input type="radio" name="poll-option" checked={selected === i} onChange={() => setSelected(i)} />
              <span>{opt.text}</span>
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <button disabled={selected == null || busy} onClick={handleSubmit} style={{ background: '#3498db', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 4, cursor: 'pointer' }}>Submit</button>
          <button onClick={() => onClose && onClose(false)} style={{ marginLeft: 'auto', background: '#e0e0e0', border: '1px solid #bbb', padding: '8px 12px', borderRadius: 4, cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    </div>
  );
}


