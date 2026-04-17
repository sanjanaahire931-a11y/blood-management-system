import { useState } from 'react';
import './BloodInventory.css';

const rows = [
  { badge:'O-',  badgeClass:'oneg', name:'Universal Donor',    id:'BT-00129-X', qty:14, status:'CRITICAL',  statusClass:'critical', time:'48 Hours Left', pct:15,  loc:'AIIMS, New Delhi' },
  { badge:'A+',  badgeClass:'apos', name:'Type A Positive',    id:'BT-00142-Y', qty:42, status:'STABLE',    statusClass:'stable',   time:'14 Days Left',  pct:70,  loc:'Apollo Regional' },
  { badge:'B-',  badgeClass:'bneg', name:'Type B Negative',    id:'BT-00155-Z', qty:8,  status:'LOW STOCK', statusClass:'lowstock', time:'5 Days Left',   pct:30,  loc:'Fortis Memorial' },
  { badge:'AB+', badgeClass:'abpos',name:'Universal Recipient',id:'BT-00168-W', qty:27, status:'STABLE',    statusClass:'stable',   time:'22 Days Left',  pct:85,  loc:'Apollo Regional' },
];

const bloodTypes = ['O-','A+','B+','AB-'];

export default function BloodInventory() {
  const [location, setLocation] = useState('All Locations');
  const [status, setStatus] = useState('All Statuses');
  const [btype, setBtype] = useState('O-');

  const filtered = rows.filter(r => {
    const locOk = location === 'All Locations' || r.loc.includes(location.split(',')[0]);
    const stOk  = status === 'All Statuses' || r.status === status.toUpperCase();
    const tyOk  = !btype || r.badge === btype;
    return locOk && stOk && tyOk;
  });

  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <h1 className="page-title">Blood Inventory</h1>
          <p className="page-subtitle">Real-time telemetry of available blood units across the regional network. Precision tracking for life-critical logistics.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-outline">⇄ Transfer</button>
          <button className="btn btn-danger">🗑 Discard</button>
          <button className="btn btn-primary">+ Add Unit</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card filter-bar">
        <div className="filter-group">
          <label className="filter-label">HOSPITAL / BANK</label>
          <select className="input-select" value={location} onChange={e=>setLocation(e.target.value)}>
            <option>All Locations</option>
            <option>AIIMS, New Delhi</option>
            <option>Apollo Regional</option>
            <option>Fortis Memorial</option>
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-label">BLOOD TYPE</label>
          <div className="bt-toggles">
            {bloodTypes.map(t=>(
              <button key={t} className={`bt-btn${btype===t?' active':''}`} onClick={()=>setBtype(t)}>{t}</button>
            ))}
          </div>
        </div>
        <div className="filter-group">
          <label className="filter-label">STATUS LEVEL</label>
          <select className="input-select" value={status} onChange={e=>setStatus(e.target.value)}>
            <option>All Statuses</option>
            <option>Critical</option>
            <option>Low Stock</option>
            <option>Stable</option>
          </select>
        </div>
        <button className="clear-btn" onClick={()=>{setLocation('All Locations');setStatus('All Statuses');setBtype('O-');}}>CLEAR ALL FILTERS</button>
      </div>

      {/* Table */}
      <div className="card inv-table-card">
        <table className="inv-table">
          <thead>
            <tr>
              <th>BLOOD TYPE</th><th>QUANTITY</th><th>EXPIRY STATUS</th><th>FACILITY LOCATION</th><th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r=>(
              <tr key={r.id} className="inv-row">
                <td>
                  <div className="bt-cell">
                    <span className={`bt-badge bt-${r.badgeClass}`}>{r.badge}</span>
                    <div><div className="bt-name">{r.name}</div><div className="bt-id">{r.id}</div></div>
                  </div>
                </td>
                <td><span className="qty-val">{String(r.qty).padStart(2,'0')}</span> <span className="qty-unit">Units</span></td>
                <td>
                  <div className="exp-cell">
                    <span className={`exp-status exp-${r.statusClass}`}>{r.status}</span>
                    <span className="exp-time">{r.time}</span>
                    <div className="exp-bar"><div className={`exp-fill fill-${r.statusClass}`} style={{width:`${r.pct}%`}}/></div>
                  </div>
                </td>
                <td>📍 {r.loc}</td>
                <td><button className="action-dots">⋮</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">
          <span className="tbl-count">Showing <b>1–{filtered.length}</b> of <b>128</b> entries</span>
          <div className="pagination">
            {['‹','1','2','3','›'].map((p,i)=><button key={i} className={`pg-btn${p==='1'?' pg-active':''}`}>{p}</button>)}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="inv-bottom">
        <div className="card volatility-card">
          <div className="vol-ring-wrap">
            <svg viewBox="0 0 80 80" width="80" height="80" style={{transform:'rotate(-90deg)'}}>
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="6"/>
              <circle cx="40" cy="40" r="34" fill="none" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" strokeDasharray="38 178"/>
            </svg>
            <div className="vol-val">12%</div>
          </div>
          <div>
            <div className="vol-title">Stock Volatility Alert</div>
            <p className="vol-desc">Regional demand for O– Negative has increased by 12% in the last 6 hours. Current inventory levels at AIIMS are reaching critical safety thresholds.</p>
          </div>
        </div>
        <div className="card ships-card">
          <div className="ships-header">📦 ACTIVE SHIPMENTS</div>
          <div className="ships-val">08 <span className="ships-sub">In Transit</span></div>
          {['BT-092 · ETA 14:30','BT-104 · CRITICAL','BT-117 · ETA 16:45'].map((s,i)=>(
            <div key={i} className="ship-row">
              <span>🚚 {s.split('·')[0]}</span>
              <span className={s.includes('CRITICAL')?'ship-crit':'ship-ok'}>{s.split('·')[1].trim()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
