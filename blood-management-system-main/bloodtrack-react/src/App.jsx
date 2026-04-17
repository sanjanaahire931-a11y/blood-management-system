import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import MissionControl from './components/MissionControl';
import BloodInventory from './components/BloodInventory';
import LogisticsTrack from './components/LogisticsTrack';
import HospitalNetwork from './components/HospitalNetwork';
import ColdChainIoT from './components/ColdChainIoT';

export default function App() {
  const [activePage, setActivePage] = useState('mission-control');
  const [toast, setToast] = useState('');
  const [showEmergency, setShowEmergency] = useState(false);

  // Hash routing
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (['mission-control','blood-inventory','logistics-track','hospital-network','cold-chain-iot'].includes(hash)) {
        setActivePage(hash);
      }
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigate = (page) => {
    window.location.hash = page;
    setActivePage(page);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const renderPage = () => {
    switch(activePage) {
      case 'mission-control':  return <MissionControl />;
      case 'blood-inventory':  return <BloodInventory />;
      case 'logistics-track':  return <LogisticsTrack />;
      case 'hospital-network': return <HospitalNetwork />;
      case 'cold-chain-iot':   return <ColdChainIoT />;
      default: return null;
    }
  };

  return (
    <div className="layout">
      <Sidebar 
        activePage={activePage} 
        onNavigate={navigate} 
        onEmergency={() => setShowEmergency(true)} 
      />
      <Topbar 
        activePage={activePage} 
        onNavigate={navigate} 
        onNotif={() => showToast('📋 3 critical alerts require your attention.')} 
      />
      
      <main className="main-area">
        {renderPage()}
      </main>

      {/* Emergency Modal */}
      {showEmergency && (
        <div className="modal-overlay visible" onClick={() => setShowEmergency(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">🚨 Emergency Dispatch Protocol</div>
            <div className="modal-body" style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.7,marginBottom:16}}>
              <p>Initiating priority emergency dispatch. All available logistics vehicles will be rerouted to critical zones.</p>
              <div style={{background:'rgba(239,68,68,.06)',border:'1px solid rgba(239,68,68,.2)',borderRadius:8,padding:12,marginTop:10,display:'flex',flexDirection:'column',gap:6}}>
                <div>O– Units Available: <strong style={{color:'var(--text-primary)'}}>14</strong></div>
                <div>Vehicles on standby: <strong style={{color:'var(--text-primary)'}}>3</strong></div>
                <div>Estimated mobilization: <strong style={{color:'var(--text-primary)'}}>4 mins</strong></div>
              </div>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button className="btn btn-danger" onClick={() => { setShowEmergency(false); showToast('🚨 Emergency dispatch initiated! 3 vehicles mobilized.'); }}>CONFIRM DISPATCH</button>
              <button className="btn btn-outline" onClick={() => setShowEmergency(false)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className="toast">{toast}</div>
        </div>
      )}
    </div>
  );
}
