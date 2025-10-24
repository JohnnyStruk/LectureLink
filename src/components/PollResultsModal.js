import React, { useMemo } from 'react';

export default function PollResultsModal({ poll, onClose }) {
  const total = useMemo(() => (poll?.options || []).reduce((s, o) => s + (o.votes || 0), 0), [poll]);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
      <div style={{ width: 520, maxWidth: '95%', background: '#fff', borderRadius: 8, border: '2px solid #0066CC', padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Poll Results</h2>
        <div style={{ fontWeight: 'bold', marginBottom: 10 }}>{poll?.question}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(poll?.options || []).map((opt, i) => {
            const count = opt.votes || 0;
            const pct = total ? Math.round((count / total) * 100) : 0;
            return (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <div>{opt.text}</div>
                  <div>{count} ({pct}%)</div>
                </div>
                <div style={{ height: 10, background: '#eee', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: '#3498db' }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
          <button onClick={() => onClose && onClose()} style={{ background: '#e0e0e0', border: '1px solid #bbb', padding: '8px 12px', borderRadius: 4, cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    </div>
  );
}


