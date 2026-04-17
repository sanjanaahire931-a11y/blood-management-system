import { useEffect, useRef } from 'react';
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

export default function MissionControl() {
  return (
    <div className="page-enter">
      {/* Stat Cards */}
      <div className="stat-grid">
        <StatCard accent="blue"  label="TOTAL UNITS AVAILABLE"  value="14,208" sub={<span className="badge badge-green">▲12%</span>} />
        <StatCard accent="muted" label="ACTIVE REQUESTS"        value="342"   sub={<span className="stat-sub-text">Standard Processing</span>} />
        <StatCard accent="red"   label="EMERGENCY REQUESTS"     value="18"    sub={<span className="stat-sub-text">📡 Priority</span>} />
        <StatCard accent="amber" label="UNITS NEAR EXPIRY"      value="84"    sub={<span className="badge badge-amber">&lt; 48 HOURS</span>} />
      </div>

      {/* Map + Alerts */}
      <div className="map-alerts-row">
        <div className="card map-card">
          <div className="card-header">
            <span className="card-title">LIVE DEPLOYMENT MAP – INDIA</span>
            <div style={{display:'flex',gap:6}}>
              <span className="badge badge-blue">LIVE TELEMETRY</span>
              <span className="badge badge-outline">24 REGIONS</span>
            </div>
          </div>
          <IndiaMap />
        </div>
        <div className="card alerts-card">
          <div className="card-header">
            <span className="card-title">⚡ REAL-TIME ALERTS</span>
          </div>
          <div className="alerts-list">
            <AlertItem type="critical"  time="2M AGO"  title="CRITICAL SHORTAGE" text="O– Negative needed at Apollo Hospital, Bangalore. Request priority: Level 1." />
            <AlertItem type="dispatch"  time="12M AGO" title="DISPATCH TRANSIT"  text="Convoy BT-092 departed Mumbai Hub. ETA Pune Facility: 14:30 IST." />
            <AlertItem type="system"    time="45M AGO" title="SYSTEM UPDATE"     text="Cold chain IoT sensors online in Hyderabad Zone. Precision monitoring active." />
            <AlertItem type="weather"   time="1H AGO"  title="WEATHER ALERT"    text="Heavy rain in Chennai area. Rerouting emergency logistics through Route B." />
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

function IndiaMap() {
  return (
    <div className="india-map-wrap">
      <svg viewBox="0 0 500 560" className="india-svg">
        <path className="india-path" d="M200,20 L230,18 L260,22 L280,35 L295,50 L310,65 L330,70 L350,60 L370,55 L385,45 L395,55 L400,70 L395,90 L380,105 L370,120 L365,140 L370,160 L380,175 L390,190 L395,210 L390,230 L380,245 L375,265 L380,285 L385,305 L380,325 L370,340 L360,358 L345,375 L330,390 L315,400 L305,415 L295,430 L285,445 L275,460 L265,475 L255,490 L245,505 L235,520 L230,535 L220,540 L215,530 L210,515 L205,500 L200,485 L195,470 L190,455 L195,440 L200,425 L205,410 L200,395 L190,380 L180,365 L170,350 L160,335 L155,318 L150,300 L145,282 L140,265 L135,248 L130,230 L135,212 L140,195 L135,178 L128,160 L125,142 L120,125 L115,108 L110,90 L108,72 L115,56 L125,42 L140,32 L158,25 L178,21 Z"/>
        <path className="india-path" d="M200,20 L190,15 L178,10 L165,8 L152,12 L142,20 L135,30 L140,32 Z"/>
        <path className="india-path" d="M395,55 L410,50 L425,52 L435,60 L440,75 L430,85 L415,88 L400,82 L395,70 Z"/>
        <ellipse cx="430" cy="380" rx="8" ry="20" className="india-path" opacity=".5"/>
        {/* pulse marker - Delhi */}
        <circle cx="250" cy="180" r="14" fill="none" stroke="#ef4444" strokeWidth="1" className="pulse-ring"/>
        <circle cx="250" cy="180" r="5" fill="#ef4444"/>
        {/* Mumbai */}
        <circle cx="210" cy="390" r="5" fill="#3b82f6"/>
        {/* Chennai */}
        <circle cx="310" cy="460" r="5" fill="#f59e0b"/>
        <text x="238" y="168" className="map-label">Delhi</text>
        <text x="193" y="410" className="map-label">Mumbai</text>
        <text x="296" y="475" className="map-label">Chennai</text>
      </svg>
    </div>
  );
}
