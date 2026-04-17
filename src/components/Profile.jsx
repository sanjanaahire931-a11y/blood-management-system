import React from 'react';

export default function Profile() {
  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <h1 className="page-title">Operator Profile</h1>
          <p className="page-subtitle">Manage your credentials, dispatch clearance levels, and access logs.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: 24, marginTop: 24 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg, var(--blue), var(--cyan))', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 'bold', color: '#fff' }}>
            OA
          </div>
          <h3 style={{ marginBottom: 4 }}>Operator Alpha</h3>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Level 4 Dispatch Authority</div>
          <span className="badge badge-green">ONLINE</span>
        </div>
        
        <div className="card">
          <h3 style={{ marginBottom: 16, pb: 12, borderBottom: '1px solid var(--border)' }}>Recent Activity Logs</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>[14:48] Initiated Route BT-104 bypass protocols.</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>[14:22] Acknowledged Critical Alert at Apollo Bangalore.</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>[12:00] Shift login sequence complete.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
