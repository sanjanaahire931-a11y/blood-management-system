import './LogisticsTrack.css';

const shipments = [
  { id:'BT-092', type:'Convoy',    icon:'🚚', origin:'Mumbai Hub',         dest:'Pune Facility',       eta:'14:30 IST',        pct:65, status:'IN TRANSIT', statusClass:'transit' },
  { id:'BT-104', type:'Emergency', icon:'🚑', origin:'Delhi Blood Bank',   dest:'AIIMS ICU Unit',      eta:'22 km remaining',  pct:82, status:'CRITICAL',   statusClass:'crit' },
  { id:'BT-117', type:'Convoy',    icon:'🚚', origin:'Chennai Hub',        dest:'Hyderabad Medical',   eta:'16:45 IST',        pct:40, status:'IN TRANSIT', statusClass:'transit' },
  { id:'BT-128', type:'Convoy',    icon:'🚚', origin:'Bangalore Depot',    dest:'Mysore Hospital',     eta:'Depart at 18:00',  pct:5,  status:'PREPARING',  statusClass:'prep' },
];

export default function LogisticsTrack() {
  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <h1 className="page-title">Logistics Track</h1>
          <p className="page-subtitle">Real-time tracking of all blood shipments and transit vehicles across the network.</p>
        </div>
      </div>
      
      <div className="logi-grid">
        {shipments.map(s => (
          <div key={s.id} className="card logi-card">
            <div className="logi-hdr"><span className="logi-icon">{s.icon}</span> {s.type} {s.id}</div>
            <div className={`logi-status st-${s.statusClass}`}>{s.status}</div>
            <div className="logi-det"><span>Origin:</span> {s.origin}</div>
            <div className="logi-det"><span>Destination:</span> {s.dest}</div>
            <div className="logi-det"><span>ETA:</span> {s.eta}</div>
            <div className="logi-bar"><div className={`logi-fill fill-${s.statusClass}`} style={{width:`${s.pct}%`}}/></div>
            <div className="logi-pct">{s.status==='PREPARING'?'Loading ':''}{s.pct}% Complete</div>
          </div>
        ))}
      </div>
    </div>
  );
}
