import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import './BloodInventory.css';

const bloodTypes = ['O-','A+','B+','AB-'];

export default function BloodInventory() {
  const [data, setData] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [location, setLocation] = useState('All Locations');
  const [status, setStatus] = useState('All Statuses');
  const [btype, setBtype] = useState('O-');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addForm, setAddForm] = useState({ hospitalId: '', bloodType: 'O+', quantity: 1 });

  const fetchInventory = () => {
    fetch('http://localhost:5000/api/inventory')
      .then(res => res.json())
      .then(res => {
        if (res.units) {
          const mapped = res.units.map(u => {
            const daysLeft = Math.round((new Date(u.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
            let s = 'STABLE', sClass = 'stable';
            if (daysLeft < 3) { s = 'CRITICAL'; sClass = 'critical'; }
            else if (daysLeft < 7) { s = 'LOW STOCK'; sClass = 'lowstock'; }
            
            return {
              id: u._id.slice(-8).toUpperCase(),
              badge: u.bloodType,
              badgeClass: u.bloodType.replace('+','pos').replace('-','neg').toLowerCase(),
              name: 'Blood Unit',
              qty: u.quantity || 1,
              status: s,
              statusClass: sClass,
              time: `${Math.max(0, daysLeft)} Days Left`,
              pct: Math.max(10, 100 - (daysLeft * 2)),
              loc: u.location
            };
          });
          setData(mapped);
        }
      })
      .catch(err => console.error("Could not fetch inventory", err));
  };

  const fetchHospitals = () => {
    fetch('http://localhost:5000/api/hospitals')
      .then(res => res.json())
      .then(res => {
        if (res.hospitals) setHospitals(res.hospitals);
      }).catch(err => console.error(err));
  };

  useEffect(() => {
    fetchInventory();
    fetchHospitals();

    const socket = io('http://localhost:5000');
    socket.on('INVENTORY_UPDATE', () => {
      fetchInventory();
    });

    return () => socket.disconnect();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.hospitalId) return alert('Select a source hospital');
    setIsSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/hospitals/add-unit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm)
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchInventory(); // Reload from CSV immediately
      } else {
        alert('Failed to commit entry');
      }
    } catch(err) {
      console.error(err);
    }
    setIsSubmitting(false);
  };

  const filtered = data.filter(r => {
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
          <button className="btn btn-outline" onClick={() => fetchInventory()}>↻ Refresh</button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ Add Unit</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card filter-bar">
        <div className="filter-group">
          <label className="filter-label">HOSPITAL / BANK</label>
          <select className="input-select" value={location} onChange={e=>setLocation(e.target.value)}>
            <option>All Locations</option>
            {hospitals.map(h => <option key={h._id}>{h.name}</option>)}
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
          <span className="tbl-count">Showing <b>1–{filtered.length}</b> of <b>{data.length}</b> entries</span>
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

      {/* Add Unit Modal */}
      {showAddModal && (
        <div className="modal-overlay visible" onClick={() => setShowAddModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">✚ Register Blood Unit</div>
            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>SOURCE HOSPITAL</label>
                <select className="input-select" style={{ width: '100%' }} value={addForm.hospitalId} onChange={e => setAddForm({...addForm, hospitalId: e.target.value})}>
                  <option value="">-- Select Hospital --</option>
                  {hospitals.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>BLOOD TYPE</label>
                  <select className="input-select" style={{ width: '100%' }} value={addForm.bloodType} onChange={e => setAddForm({...addForm, bloodType: e.target.value})}>
                    {bloodTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    {['A-', 'B-', 'AB+', 'AB-'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>QUANTITY (UNITS)</label>
                  <input type="number" className="input-select" style={{ width: '100%', background: 'rgba(255,255,255,.05)' }} min="1" max="100" value={addForm.quantity} onChange={e => setAddForm({...addForm, quantity: e.target.value})} required/>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>DATE OF ENTRY</label>
                <input type="date" className="input-select" style={{ width: '100%' }} value={new Date().toISOString().split('T')[0]} readOnly disabled />
              </div>
              
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={isSubmitting}>
                  {isSubmitting ? 'PROCESSING...' : 'COMMIT LEDGER ENTRY'}
                </button>
                <button type="button" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowAddModal(false)}>CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
