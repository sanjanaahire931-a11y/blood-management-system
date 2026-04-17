import './Topbar.css';

const views = [
  { id:'global', label:'Global View', page:'mission-control' },
  { id:'analytics', label:'Analytics', page:'blood-inventory' },
  { id:'system-health', label:'System Health', page:'cold-chain-iot' },
];

const placeholders = {
  'mission-control': 'Global system search...',
  'blood-inventory': 'Search inventory...',
  'logistics-track': 'Track shipment...',
  'hospital-network': 'Search facilities...',
  'cold-chain-iot': 'Search IoT Nodes...',
};

export default function Topbar({ activePage, onNavigate, onNotif }) {
  const activeView = views.find(v => v.page === activePage)?.id || 'global';
  return (
    <header className="topbar">
      <div className="topbar-search">
        <span>🔍</span>
        <input className="search-input" placeholder={placeholders[activePage] || 'Search...'} />
      </div>

      <nav className="topbar-nav">
        {views.map(v => (
          <button
            key={v.id}
            className={`topbar-link${activeView === v.id ? ' active' : ''}`}
            onClick={() => onNavigate(v.page)}
          >
            {v.label}
          </button>
        ))}
      </nav>

      <div className="topbar-actions">
        <button className="icon-btn" onClick={onNotif} title="Notifications">
          🔔 <span className="notif-dot" />
        </button>
        <button className="icon-btn" title="Settings">⚙</button>
        <button className="icon-btn" title="Help">?</button>
        <div className="topbar-user">
          <div>
            <div className="user-name">Dr. Arjun Varma</div>
            <div className="user-role">CHIEF ADMINISTRATOR</div>
          </div>
          <div className="user-avatar">AV</div>
        </div>
      </div>
    </header>
  );
}
