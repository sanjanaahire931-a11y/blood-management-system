import React from 'react';

export default function Notifications() {
  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <h1 className="page-title">System Notifications</h1>
          <p className="page-subtitle">Historical archive of all telemetry alerts and network warnings.</p>
        </div>
        <button className="btn btn-outline">MARK ALL AS READ</button>
      </div>

      <div className="card" style={{ marginTop: 24, padding: 0, overflow: 'hidden' }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: i === 1 ? 'rgba(0,122,255,0.05)' : 'transparent' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Cold Chain Fluctuation Detected</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Sensor N12 reported a 0.5°C drop in sector 4.</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{i * 12} mins ago</div>
          </div>
        ))}
      </div>
    </div>
  );
}
