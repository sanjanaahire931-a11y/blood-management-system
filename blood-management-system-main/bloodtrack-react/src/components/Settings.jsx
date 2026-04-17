import React from 'react';

export default function Settings({ theme, setTheme }) {
  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <h1 className="page-title">System Settings</h1>
          <p className="page-subtitle">Configure application behaviors, global theme, and dispatch thresholds.</p>
        </div>
      </div>
      
      <div className="card" style={{ maxWidth: 600, marginTop: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Interface Preferences</h3>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Global Theme</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Toggle between Stark Light and Sci-Fi Dark mode</div>
          </div>
          <select 
            className="input-select" 
            value={theme} 
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="dark">Sci-Fi Dark (Default)</option>
            <option value="light">Stark Light</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Real-Time Data Streaming</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Enable high-frequency WebSocket updates (requires restart)</div>
          </div>
          <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 11 }}>ENABLED</button>
        </div>
      </div>
    </div>
  );
}
