import './Sidebar.css';

const navItems = [
  { id: 'mission-control',  icon: '⊞', label: 'MISSION CONTROL' },
  { id: 'blood-inventory',  icon: '🩸', label: 'BLOOD INVENTORY' },
  { id: 'logistics-track',  icon: '🚚', label: 'LOGISTICS TRACK' },
  { id: 'hospital-network', icon: '🏥', label: 'HOSPITAL NETWORK' },
  { id: 'cold-chain-iot',   icon: '❄',  label: 'COLD CHAIN IoT' },
];

export default function Sidebar({ activePage, onNavigate, onEmergency }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-mark">🩸</span>
        <div>
          <div className="logo-title">BloodTrack India</div>
          <div className="logo-sub">MISSION CONTROL ULTRA</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item${activePage === item.id ? ' active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="emergency-btn" onClick={onEmergency}>
          ✳ Emergency Dispatch
        </button>
        <div className="admin-profile">
          <div className="admin-avatar">👤</div>
          <div>
            <div className="admin-name">Chief Admin</div>
            <div className="admin-role">VERIFIED NODE 01</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
