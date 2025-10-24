import React, { useState, useMemo } from 'react';
import { createPoll, listPolls, loadSavedPolls, saveSavedPolls, activatePoll } from '../utils/pollsApi';

const DURATIONS = [30, 60, 90, 120];

export default function PollModal({ instructorId, lectureCode, onClose }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [duration, setDuration] = useState(60);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(loadSavedPolls(instructorId));
  const isValid = useMemo(() => question.trim() && options.filter(o => o.trim()).length >= 2, [question, options]);

  const addOption = () => setOptions(prev => [...prev, '']);
  const updateOption = (i, v) => setOptions(prev => prev.map((o, idx) => idx === i ? v : o));
  const removeOption = (i) => setOptions(prev => prev.filter((_, idx) => idx !== i));

  const handleSaveLocal = () => {
    const poll = { id: Date.now(), question, options: options.filter(Boolean), durationSeconds: duration };
    const next = [poll, ...saved];
    setSaved(next);
    saveSavedPolls(instructorId, next);
  };

  const handleDeleteLocal = (id) => {
    const next = saved.filter(p => p.id !== id);
    setSaved(next);
    saveSavedPolls(instructorId, next);
  };

  const handleLoadLocal = (p) => {
    setQuestion(p.question);
    setOptions(p.options);
    setDuration(p.durationSeconds);
  };

  const handleCreateAndSend = async () => {
    if (!isValid) return;
    setBusy(true); setError('');
    try {
      const created = await createPoll({ instructorId, lectureCode, question, options: options.filter(Boolean), durationSeconds: duration });
      // Activate sets endsAt on the backend
      await activatePoll(created.id);
      onClose && onClose(true);
    } catch (e) {
      setError(e.message || 'Failed to create poll');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
      <div style={{ width: 520, maxWidth: '95%', background: '#fff', borderRadius: 8, border: '2px solid #0066CC', padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Create Poll</h2>
        {error && <div style={{ background: '#ffe6e6', border: '1px solid #ffb3b3', color: '#b30000', padding: 8, borderRadius: 4, marginBottom: 10 }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontWeight: 'bold' }}>Question</label>
          <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Type your question" style={{ padding: 10, border: '1px solid #ccc', borderRadius: 4 }} />

          <label style={{ fontWeight: 'bold', marginTop: 6 }}>Options</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {options.map((opt, i) => (
              <div key={i} style={{ display: 'flex', gap: 8 }}>
                <input value={opt} onChange={e => updateOption(i, e.target.value)} placeholder={`Option ${i + 1}`} style={{ flex: 1, padding: 10, border: '1px solid #ccc', borderRadius: 4 }} />
                {options.length > 2 && (
                  <button onClick={() => removeOption(i)} style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '0 10px', borderRadius: 4, cursor: 'pointer' }}>X</button>
                )}
              </div>
            ))}
            <button onClick={addOption} style={{ alignSelf: 'flex-start', background: '#ADD8E6', border: '2px solid #87CEEB', padding: '6px 10px', borderRadius: 4, cursor: 'pointer' }}>Add Option</button>
          </div>

          <label style={{ fontWeight: 'bold', marginTop: 6 }}>Duration</label>
          <select value={duration} onChange={e => setDuration(Number(e.target.value))} style={{ padding: 10, border: '1px solid #ccc', borderRadius: 4, width: 140 }}>
            {DURATIONS.map(d => <option key={d} value={d}>{d} seconds</option>)}
          </select>

          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button disabled={!isValid || busy} onClick={handleCreateAndSend} style={{ background: '#3498db', color: '#fff', border: 'none', padding: '10px 14px', borderRadius: 4, cursor: 'pointer' }}>Create & Send</button>
            <button onClick={handleSaveLocal} disabled={!isValid || busy} style={{ background: '#ADD8E6', border: '2px solid #87CEEB', padding: '8px 12px', borderRadius: 4, cursor: 'pointer' }}>Save</button>
            <button onClick={() => onClose && onClose(false)} style={{ marginLeft: 'auto', background: '#e0e0e0', border: '1px solid #bbb', padding: '8px 12px', borderRadius: 4, cursor: 'pointer' }}>Close</button>
          </div>

          <div style={{ marginTop: 20, borderTop: '1px solid #eee', paddingTop: 10 }}>
            <h3 style={{ margin: '10px 0' }}>Saved Polls</h3>
            {saved.length === 0 ? (
              <div style={{ color: '#777' }}>No saved polls</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {saved.map(p => (
                  <div key={p.id} style={{ border: '1px solid #ddd', borderRadius: 6, padding: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold' }}>{p.question}</div>
                      <div style={{ fontSize: 12, color: '#555' }}>{p.options.join(', ')}</div>
                      <div style={{ fontSize: 12, color: '#777' }}>Duration: {p.durationSeconds}s</div>
                    </div>
                    <button onClick={() => handleLoadLocal(p)} style={{ background: '#fff', border: '1px solid #3498db', color: '#3498db', padding: '6px 10px', borderRadius: 4, cursor: 'pointer' }}>Load</button>
                    <button onClick={() => handleDeleteLocal(p.id)} style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 4, cursor: 'pointer' }}>Delete</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


