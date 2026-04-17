import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Filler, Tooltip
} from 'chart.js';
import './ColdChainIoT.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const hours24 = Array.from({length:24}, (_,i) => `${String(i).padStart(2,'0')}:00`);
const temps   = [3.1,3.0,2.9,3.2,3.4,3.3,3.0,2.8,3.1,3.5,3.8,3.6,3.4,3.2,3.0,2.9,3.1,3.4,3.7,3.5,3.2,3.0,2.8,3.1];

const chartData = {
  labels: hours24,
  datasets:[{ label:'Temp °C', data:temps, borderColor:'#06b6d4', backgroundColor:'rgba(6,182,212,.06)', borderWidth:2, tension:.4, fill:true, pointRadius:0 }]
};
const chartOpts = {
  responsive:true, maintainAspectRatio:false,
  plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'#1a2235', borderColor:'rgba(255,255,255,.08)', borderWidth:1 } },
  scales:{
    x:{ grid:{color:'rgba(255,255,255,.04)'}, ticks:{color:'#55607a',font:{size:9},maxTicksLimit:8}, border:{display:false} },
    y:{ min:0, max:8, grid:{color:'rgba(255,255,255,.04)'}, ticks:{color:'#55607a',font:{size:9},callback:v=>v+'°C'}, border:{display:false} }
  }
};

const nodes = [
  { id:'Sensor-N12', loc:'MAIN REFRIGERATOR A', temp:'3.4°C', status:'green' },
  { id:'Sensor-T88', loc:'CRYO-VAULT 04',       temp:'0.1°C', status:'red'   },
  { id:'Sensor-P41', loc:'PLASMA UNIT RACK',    temp:'4.0°C', status:'green' },
  { id:'OFFLINE-X09',loc:'BACKUP UNIT 2',        temp:'N/A',   status:'gray'  },
];

export default function ColdChainIoT() {
  return (
    <div className="page-enter">
      {/* Stat cards */}
      <div className="iot-stat-grid">
        <div className="card iot-card">
          <div className="iot-icon-badge iot-blue">📡</div>
          <div className="iot-lbl">ACTIVE SENSORS</div>
          <div className="iot-val">1,248</div>
          <div className="iot-sub"><span className="live-dot"/>99.8% Operational Uptime</div>
        </div>
        <div className="card iot-card">
          <div className="iot-icon-badge iot-cyan">❄</div>
          <div className="iot-lbl">STABLE UNITS</div>
          <div className="iot-val">852</div>
          <div className="iot-sub">Nominal Range: 2°C – 6°C</div>
        </div>
        <div className="card iot-card">
          <div className="iot-icon-badge iot-red">⚠</div>
          <div className="iot-lbl">CRITICAL ALERTS</div>
          <div className="iot-val" style={{color:'var(--red)'}}>03</div>
          <div className="iot-sub"><span className="live-dot live-dot-red"/>Action Required: Transit Hub 4</div>
        </div>
      </div>

      {/* Chart + Node Health */}
      <div className="iot-main-row">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title" style={{marginBottom:2}}>Thermal Stability Index</div>
              <div style={{fontSize:11,color:'var(--text-muted)'}}>Real-time aggregate across all storage sectors</div>
            </div>
            <div style={{display:'flex',gap:6}}>
              <span className="badge badge-blue">LIVE FEED</span>
              <span className="badge badge-outline">HOSPITAL_NETWORK_A</span>
            </div>
          </div>
          <div style={{height:220}}><Line data={chartData} options={chartOpts}/></div>
        </div>

        <div className="card iot-nodes-card">
          <div className="card-title" style={{marginBottom:4}}>IoT Node Health</div>
          <div className="node-sub">LIVE DEVICE REGISTRY</div>
          <div className="node-list">
            {nodes.map(n=>(
              <div key={n.id} className={`node-item${n.status==='gray'?' node-offline':''}`}>
                <span className={`node-ind ind-${n.status}`}/>
                <div className="node-info">
                  <span className="node-name">{n.id}</span>
                  <span className="node-loc">{n.loc}</span>
                </div>
                <span className={`node-temp${n.status==='red'?' temp-red':n.status==='gray'?' temp-gray':''}`}>{n.temp}</span>
                <span className="node-icons">🔋📶</span>
              </div>
            ))}
          </div>
          <button className="diag-btn">DIAGNOSTICS REPORT</button>

          {/* Radar */}
          <div className="radar-wrap">
            <div className="radar-hdr">
              <span className="radar-lbl">LIVE RADAR</span>
              <span className="radar-scan"><span className="live-dot"/>SCANNING</span>
            </div>
            <div className="radar-disc">
              <div className="r-circle r-c1"/><div className="r-circle r-c2"/><div className="r-circle r-c3"/>
              <div className="r-sweep"/>
              <div className="r-center"/>
            </div>
            <div className="radar-foot">LOCATING LOGISTICS 04-B</div>
          </div>
        </div>
      </div>

      {/* Transit containers */}
      <div className="transit-row">
        <div className="card transit-card">
          <div className="tc-hdr"><span>🚚</span> Transit Container #BT-992</div>
          <div className="tc-temp">4.2°C</div>
          <div className="tc-status"><span className="live-dot"/>NOMINAL</div>
          <div className="tc-detail">BATTERY <div className="tc-bar"><div className="tc-fill tc-green" style={{width:'88%'}}/></div> 88%</div>
        </div>
        <div className="card transit-card tc-critical">
          <div className="tc-hdr"><span>🚑</span> Transit Container #BT-104</div>
          <div className="tc-temp" style={{color:'var(--red)'}}>7.8°C</div>
          <div className="tc-status"><span className="live-dot live-dot-red"/>CRITICAL SPIKE</div>
          <div className="tc-detail">ROUTE PROGRESS <div className="tc-bar"><div className="tc-fill tc-red" style={{width:'75%'}}/></div> 22 km to Dest.</div>
        </div>
      </div>

      {/* Status bar */}
      <div className="iot-status-bar">
        <span><span className="live-dot"/>BLOCKCHAIN LEDGER VERIFIED</span>
        <span><span className="live-dot"/>IoT MESH NETWORK ACTIVE</span>
        <span className="sb-right">LATENCY: 42MS &nbsp;|&nbsp; LAST SYNC: 0.4S AGO &nbsp;|&nbsp; V4.8.0-ULTRA</span>
      </div>
    </div>
  );
}
