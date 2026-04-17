import { useState } from 'react';
import './HospitalNetwork.css';

const hospitals = [
  { name:'AIIMS New Delhi',   loc:'Ansari Nagar, New Delhi',  status:'CRITICAL', statusClass:'critical', pct:12,  req:14, transit:3,  mapClass:'map-delhi',   blood: { 'A+': 5, 'O-': 2, 'B+': 10 } },
  { name:'Apollo Hospitals',  loc:'Bannerghatta, Bengaluru',  status:'NORMAL',   statusClass:'normal',   pct:88,  req:2,  transit:8,  mapClass:'map-apollo',  blood: { 'A+': 45, 'O-': 22, 'B+': 18 } },
  { name:'Fortis Memorial',   loc:'Gurugram, Haryana',        status:'NORMAL',   statusClass:'normal',   pct:64,  req:5,  transit:12, mapClass:'map-fortis',  blood: { 'A+': 30, 'O-': 12, 'B+': 20 } },
  { name:'TATA Memorial',     loc:'Parel, Mumbai',            status:'WARNING',  statusClass:'warning',  pct:35,  req:21, transit:6,  mapClass:'map-tata',    blood: { 'A+': 10, 'O-': 4, 'B+': 8 } },
];

export default function HospitalNetwork() {
  const [activeHospital, setActiveHospital] = useState(null);

  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <h1 className="page-title">Hospital Network</h1>
          <p className="page-subtitle">Real-time status and telemetry for 48 integrated facilities</p>
        </div>
        <div className="page-actions">
          <div className="filter-inline">
            <span className="fi-label">REGION:</span>
            <select className="input-select"><option>All India</option><option>North</option><option>South</option></select>
          </div>
          <div className="filter-inline">
            <span className="fi-label">STATUS:</span>
            <select className="input-select"><option>All Status</option><option>Critical</option><option>Normal</option></select>
          </div>
        </div>
      </div>

      <div className="hosp-grid">
        {hospitals.map(h => (
          <div key={h.name} className={`card hosp-card hosp-${h.statusClass}`} onClick={() => setActiveHospital(h)} style={{ cursor: 'pointer', transition: 'transform 0.2s', border: activeHospital?.name === h.name ? '1px solid var(--blue)' : '' }}>
            <div className="hosp-top">
              <div>
                <div className="hosp-name">{h.name}</div>
                <div className="hosp-loc">📍 {h.loc}</div>
              </div>
              <span className={`hosp-badge hb-${h.statusClass}`}>● {h.status}</span>
            </div>
            <div className={`hosp-map-thumb ${h.mapClass}`}/>
            <div className="hosp-stock-row">
              <span className="hs-label">PLASMA &amp; WHOLE BLOOD STOCK</span>
              <span className={`hs-pct pct-${h.statusClass}`}>{h.pct}% Remaining</span>
            </div>
            <div className="hs-bar"><div className={`hs-fill hf-${h.statusClass}`} style={{width:`${h.pct}%`}}/></div>
            <div className="hosp-stats">
              <div className="hs-stat"><div className="hss-lbl">ACTIVE REQUESTS</div><div className="hss-val">{String(h.req).padStart(2,'0')}</div></div>
              <div className="hs-stat"><div className="hss-lbl">IN-TRANSIT</div><div className="hss-val">{String(h.transit).padStart(2,'0')}</div></div>
            </div>
          </div>
        ))}

        {/* Optimization Panel */}
        <div className="card opt-card">
          <div className="hosp-top">
            <div>
              <div className="hosp-name">Intra-Network Optimization</div>
              <div className="hosp-loc">Suggested redistribution based on current demand volatility</div>
            </div>
            <button className="btn btn-outline" style={{fontSize:10,padding:'6px 12px',letterSpacing:'.8px'}}>RUN ANALYSIS</button>
          </div>
          <div className="opt-vis">
            {['●','●','●','●','●','●'].map((d,i)=>(
              <span key={i} className={`opt-node ${i%3===0?'on-crit':'on-surp'}`}>{d}</span>
            ))}
          </div>
          <div className="opt-metrics">
            <div className="opt-m"><div className="opt-ml">SHORTFALL WARNING</div><div className="opt-mv" style={{color:'var(--red)'}}>42 Units O–</div><div className="opt-ms">Expected within 4 hours</div></div>
            <div className="opt-m"><div className="opt-ml">SURPLUS AVAILABLE</div><div className="opt-mv" style={{color:'var(--green)'}}>108 Units A+</div><div className="opt-ms">St. John's Medical Hub</div></div>
            <div className="opt-m"><div className="opt-ml">ROUTE EFFICIENCY</div><div className="opt-mv">94.2%</div><div className="opt-ms">Optimal traffic conditions</div></div>
          </div>
          <div className="opt-legend">
            <span className="ol-dot" style={{background:'var(--red)'}}/>CRITICAL NODE
            <span className="ol-dot" style={{background:'var(--cyan)'}}/>SURPLUS NODE
          </div>
        </div>
      </div>

      <div className="card net-footer">
        <div className="nf-stat"><div className="nf-lbl">TOTAL NETWORK UNITS</div><div className="nf-val">2,841 <span className="nf-unit">units</span></div></div>
        <div className="nf-stat"><div className="nf-lbl">LIVE TRANSITS</div><div className="nf-val">38 <span className="nf-unit">vehicles</span></div></div>
        <div className="nf-stat"><div className="nf-lbl">AVERAGE RESPONSE</div><div className="nf-val">14:02 <span className="nf-unit">mins</span></div></div>
        <div className="nf-live"><span className="live-dot"/>SYSTEM ENCRYPTED &amp; LIVE</div>
      </div>

      {activeHospital && (
        <div className="modal-overlay visible" onClick={() => setActiveHospital(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{activeHospital.name}</h2>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>📍 {activeHospital.loc}</div>
              </div>
              <span className={`badge badge-${activeHospital.statusClass === 'critical' ? 'red' : activeHospital.statusClass === 'warning' ? 'amber' : 'green'}`}>
                {activeHospital.status} STATUS
              </span>
            </div>
            
            <div style={{ padding: '16px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', margin: '16px 0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 12 }}>AVAILABLE INVENTORY TARGETS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {activeHospital.blood && Object.entries(activeHospital.blood).map(([type, qty]) => (
                  <div key={type} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 12, textAlign: 'center', border: qty < 10 ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: qty < 10 ? 'var(--red)' : 'var(--text-primary)' }}>{type}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{qty} Units</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => alert('Initiating priority dispatch to ' + activeHospital.name)}>DISPATCH ASSETS</button>
              <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setActiveHospital(null)}>CLOSE TERMINAL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
