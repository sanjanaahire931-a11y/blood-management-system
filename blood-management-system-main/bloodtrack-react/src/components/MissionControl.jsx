import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, BarElement, Filler, Tooltip
} from 'chart.js';
import './MissionControl.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip);

const chartOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { backgroundColor:'#1a2235', borderColor:'rgba(255,255,255,.08)', borderWidth:1 } },
  scales: {
    x: { grid:{ color:'rgba(255,255,255,.04)' }, ticks:{ color:'#55607a', font:{ size:10 } }, border:{ display:false } },
    y: { grid:{ color:'rgba(255,255,255,.04)' }, ticks:{ color:'#55607a', font:{ size:10 } }, border:{ display:false } },
  }
};

const hours  = ['08:00','10:00','12:00','14:00','16:00','18:00','20:00'];
const supply = [420, 400, 370, 330, 360, 420, 480];
const demand = [380, 360, 390, 410, 380, 350, 320];

const demandData = {
  labels: hours,
  datasets: [
    { label:'Supply', data:supply, borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,.06)', borderWidth:2, tension:.4, fill:true, pointRadius:0 },
    { label:'Demand', data:demand, borderColor:'#ef4444', backgroundColor:'rgba(239,68,68,.04)', borderWidth:2, tension:.4, fill:true, pointRadius:0, borderDash:[4,4] },
  ]
};

const invData = {
  labels: ['A+','A–','B+','B–','O–','O+','AB+'],
  datasets:[{
    data:[42,18,35,8,14,52,27],
    backgroundColor:['rgba(59,130,246,.7)','rgba(59,130,246,.5)','rgba(6,182,212,.7)','rgba(6,182,212,.5)','rgba(239,68,68,.8)','rgba(34,197,94,.7)','rgba(168,85,247,.7)'],
    borderRadius:4, borderSkipped:false,
  }]
};

export default function MissionControl({ isEmergency }) {
  const [alerts, setAlerts] = useState([]);
  const [totalUnits, setTotalUnits] = useState(0);
  const [mapFilter, setMapFilter] = useState('ALL');
  
  // Real-time calculated states
  const [hospitalsOnline, setHospitalsOnline] = useState({});
  const [invData, setInvData] = useState({
    labels: ['A+','A–','B+','B–','O–','O+','AB+','AB-'],
    datasets:[{ data: [0,0,0,0,0,0,0,0], backgroundColor: 'rgba(59,130,246,.7)', borderRadius: 4 }]
  });
  
  const [demandData, setDemandData] = useState({
    labels: ['08:00','10:00','12:00','14:00','16:00','18:00','20:00'],
    datasets: [
      { label:'Supply', data:[0,0,0,0,0,0,0], borderColor:'#3b82f6', backgroundColor:'rgba(59,130,246,.06)', borderWidth:2, tension:.4, fill:true, pointRadius:0 },
      { label:'Demand', data:[0,0,0,0,0,0,0], borderColor:'#ef4444', backgroundColor:'rgba(239,68,68,.04)', borderWidth:2, tension:.4, fill:true, pointRadius:0, borderDash:[4,4] }
    ]
  });

  useEffect(() => {
    // 1. Fetch Alerts
    fetch('http://localhost:5000/api/alerts')
      .then(res => res.json())
      .then(res => {
        if (res.alerts && res.alerts.length > 0) {
          setAlerts(res.alerts.map(a => ({ type: a.type === 'EMERGENCY' ? 'critical' : 'system', time: 'JUST NOW', title: a.title || a.type, text: a.message })));
        } else {
          setAlerts([{ type:'system', time:'JUST NOW', title:'SYSTEM ONLINE', text:'All facilities reporting normal parameters.' }]);
        }
      }).catch(console.error);

    // 2. Fetch Inventory and Compute Distribution
    fetch('http://localhost:5000/api/inventory')
      .then(r => r.json())
      .then(r => {
        if (r.units) {
          setTotalUnits(r.units.length * 5); // Dummy multiplier for demo scale if few items
          
          const types = ['A+','A-','B+','B-','O-','O+','AB+','AB-'];
          const counts = Array(8).fill(0);
          r.units.forEach(u => {
            let idx = types.indexOf(u.bloodType);
            if (idx === -1 && u.bloodType === 'A–') idx = 1; // Handing '–' vs '-' char issues
            else if (idx === -1 && u.bloodType === 'B–') idx = 3;
            else if (idx === -1 && u.bloodType === 'O–') idx = 4;
            if (idx > -1) counts[idx] += parseInt(u.quantity || 1);
          });
          
          setInvData(prev => {
            const next = {...prev};
            next.datasets[0].data = counts;
            // Generate vibrant colors per grouping
            next.datasets[0].backgroundColor = counts.map((_, i) => ['rgba(59,130,246,.7)','rgba(59,130,246,.5)','rgba(6,182,212,.7)','rgba(6,182,212,.5)','rgba(239,68,68,.8)','rgba(34,197,94,.7)','rgba(168,85,247,.7)','rgba(168,85,247,.5)'][i]);
            return next;
          });
          
          // Compute Mock Time-Series based on total volume (simulating real-time curve)
          const baseVol = r.units.length * 2;
          setDemandData(prev => {
            const next = {...prev};
            next.datasets[0].data = hours.map((_,i) => baseVol + Math.sin(i)*15 + Math.random()*20); // Supply
            next.datasets[1].data = hours.map((_,i) => baseVol + Math.cos(i)*20 + Math.random()*25); // Demand
            return next;
          });
        }
      }).catch(console.error);
      
    // 3. Fetch Precise Hospitals Database
    fetch('http://localhost:5000/api/hospitals')
      .then(r => r.json())
      .then(r => {
        if (r.hospitals && r.hospitals.length > 0) {
          const hopsMap = {};
          r.hospitals.forEach(h => {
             // Assuming location array [lat, lng] is sent
             hopsMap[h._id || h.name] = { pos: h.location, name: h.name };
          });
          setHospitalsOnline(hopsMap);
        }
      }).catch(console.error);

  }, []);

  return (
    <div className="page-enter">
      {/* Stat Cards */}
      <div className="stat-grid">
        <StatCard accent="blue"  label="TOTAL UNITS AVAILABLE"  value={totalUnits} sub={<span className="badge badge-green">LIVE</span>} />
        <StatCard accent="muted" label="ACTIVE REQUESTS"        value={Math.round(totalUnits * 0.15)}   sub={<span className="stat-sub-text">Standard Processing</span>} />
        <StatCard accent="red"   label="EMERGENCY REQUESTS"     value={isEmergency ? (alerts.length > 1 ? alerts.length + 1 : 4) : (alerts.length > 1 ? alerts.length : 3)} sub={<span className="stat-sub-text">📡 Priority</span>} />
        <StatCard accent="amber" label="UNITS NEAR EXPIRY"      value={Math.round(totalUnits * 0.08)}    sub={<span className="badge badge-amber">&lt; 48 HOURS</span>} />
      </div>

      {/* Map + Alerts */}
      <div className="map-alerts-row">
        <div className="card map-card">
          <div className="card-header">
            <span className="card-title">LIVE DEPLOYMENT MAP – INDIA</span>
            <div style={{display:'flex',gap:6, alignItems: 'center'}}>
              <select className="input-select" value={mapFilter} onChange={(e) => setMapFilter(e.target.value)} style={{padding: '4px 22px 4px 8px', fontSize: '10px'}}>
                <option value="ALL">Show All Facilities</option>
                <option value="ACTIVE">Active Transports Only</option>
                <option value="IOT_NODES">Show IoT Sensor Mesh</option>
              </select>
              <span className={`badge ${isEmergency ? 'badge-red' : 'badge-blue'}`}>{isEmergency ? 'CRITICAL TELEMETRY' : 'LIVE TELEMETRY'}</span>
            </div>
          </div>
          <IndiaMap mapFilter={mapFilter} dynamicHospitals={hospitalsOnline} isEmergency={isEmergency} />
        </div>
        <div className="card alerts-card">
          <div className="card-header">
            <span className="card-title">⚡ REAL-TIME ALERTS</span>
          </div>
          <div className="alerts-list">
            {isEmergency && <AlertItem type="critical" time="JUST NOW" title="URGENT REDISTRIBUTION" text="Vehicles BT-104 and PRE-02 active. Bypassing standard protocols." />}
            {alerts.length ? alerts.map((a, i) => (
              <AlertItem key={i} type={a.type} time={a.time} title={a.title} text={a.text} />
            )) : <div style={{color:'var(--text-secondary)', fontSize:13}}>No active alerts. Systems normal.</div>}
          </div>
          <button className="view-logs-btn">VIEW HISTORICAL LOGS</button>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-row">
        <div className="card">
          <div className="card-header">
            <span className="card-title">DEMAND VS SUPPLY INDEX</span>
            <div className="chart-legend">
              <span className="leg-dot" style={{background:'#3b82f6'}}/>Supply
              <span className="leg-dot" style={{background:'#ef4444'}}/>Demand
            </div>
          </div>
          <div style={{height:175}}><Line data={demandData} options={chartOpts}/></div>
        </div>
        <div className="card">
          <span className="card-title">INVENTORY DISTRIBUTION BY TYPE</span>
          <div style={{height:175,marginTop:14}}>
            <Bar data={invData} options={{...chartOpts, plugins:{...chartOpts.plugins,legend:{display:false}}}}/>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ accent, label, value, sub }) {
  return (
    <div className={`stat-card stat-${accent}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value} {sub}</div>
    </div>
  );
}

function AlertItem({ type, time, title, text }) {
  return (
    <div className={`alert-item alert-${type}`}>
      <div className="alert-header">
        <span className="alert-type">{title}</span>
        <span className="alert-time">{time}</span>
      </div>
      <div className="alert-body">{text}</div>
    </div>
  );
}

import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip as LeafletTooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const defaultHospitals = {
  Delhi: { pos: [28.6139, 77.2090], name: 'AIIMS New Delhi' },
  Mumbai: { pos: [19.0760, 72.8777], name: 'Mumbai Hub' },
  Chennai: { pos: [13.0827, 80.2707], name: 'Chennai Regional' },
  Bangalore: { pos: [12.9716, 77.5946], name: 'Apollo Bangalore' },
  Pune: { pos: [18.5204, 73.8567], name: 'Pune Facility' },
  Kolkata: { pos: [22.5726, 88.3639], name: 'Kolkata Medical College' },
  Hyderabad: { pos: [17.3850, 78.4867], name: 'Osmania Hospital' },
  Ahmedabad: { pos: [23.0225, 72.5714], name: 'Civil Hospital' }
};

const defaultConvoys = [
  { path: [defaultHospitals.Mumbai.pos, defaultHospitals.Pune.pos], color: '#3b82f6', label: 'BT-092' }
];

// Generate 24 Mock IoT Nodes
const mockIoTNodes = Array.from({length: 24}).map((_, i) => ({
  id: `IOT-${i + 100}`,
  pos: [20 + Math.random() * 8, 72 + Math.random() * 10]
}));

const IndiaMap = React.memo(function IndiaMap({ mapFilter, dynamicHospitals = {}, isEmergency }) {
  const mergedHospitals = { ...defaultHospitals, ...dynamicHospitals };
  
  const activeConvoys = [...defaultConvoys];
  if (isEmergency) {
    activeConvoys.push({ path: [mergedHospitals.Delhi?.pos || defaultHospitals.Delhi.pos, mergedHospitals.Bangalore?.pos || defaultHospitals.Bangalore.pos], color: '#ff3b30', label: 'CRITICAL OVERRIDE BT-104' });
    activeConvoys.push({ path: [mergedHospitals.Mumbai?.pos || defaultHospitals.Mumbai.pos, mergedHospitals.Chennai?.pos || defaultHospitals.Chennai.pos], color: '#ff3b30', label: 'PRIORITY AIR-EVAC' });
  }

  const displayingNodes = mapFilter === 'ACTIVE'
    ? Object.entries(mergedHospitals).filter(([_, loc]) => 
        activeConvoys.some(c => c.path.some(p => p[0] === loc.pos[0] && p[1] === loc.pos[1]))
      )
    : Object.entries(mergedHospitals);

  return (
    <div style={{ height: '320px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: isEmergency ? '1px solid var(--red)' : '1px solid rgba(255,255,255,0.08)' }}>
      <MapContainer 
        center={[22.5937, 78.9629]} 
        zoom={4} 
        style={{ height: '100%', width: '100%', background: '#0a0d14' }}
        zoomControl={false}
        preferCanvas={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
        />

        {mapFilter !== 'IOT_NODES' && displayingNodes.map(([key, loc]) => (
          <CircleMarker 
            key={key} 
            center={loc.pos} 
            radius={mapFilter === 'ACTIVE' ? 6 : 4} 
            pathOptions={{ color: '#007aff', fillColor: '#007aff', fillOpacity: 0.8, weight: 1 }}
          >
            <LeafletTooltip direction="top" offset={[0, -10]} opacity={1}>
              <span style={{color: '#1a2235', fontWeight: 600}}>{loc.name}</span>
            </LeafletTooltip>
          </CircleMarker>
        ))}

        {mapFilter === 'IOT_NODES' && mockIoTNodes.map((node) => (
          <CircleMarker 
            key={node.id} 
            center={node.pos} 
            radius={3} 
            pathOptions={{ color: '#06b6d4', fillColor: '#06b6d4', fillOpacity: 1, weight: 2, className: 'pulsing-line' }}
          >
            <LeafletTooltip direction="top" opacity={0.9}>{node.id} - ACTIVE</LeafletTooltip>
          </CircleMarker>
        ))}

        {mapFilter !== 'IOT_NODES' && activeConvoys.map((convoy, idx) => (
          <Polyline 
            key={idx} 
            positions={convoy.path} 
            pathOptions={{ color: convoy.color, weight: isEmergency ? 4 : 3, dashArray: '5, 8', className: 'pulsing-line' }} 
          >
             <LeafletTooltip sticky opacity={0.9} permanent={isEmergency && idx > 0}>{convoy.label} - LIVE TRANSIT</LeafletTooltip>
          </Polyline>
        ))}
      </MapContainer>
    </div>
  );
});
