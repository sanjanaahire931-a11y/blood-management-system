/* ======================================================
   BloodTrack India — app.js
   SPA routing · Charts · Interactivity
   ====================================================== */

/* ---------- SPA Page Routing ---------- */
const pages = ['mission-control','blood-inventory','logistics-track','hospital-network','cold-chain-iot'];

function navigateTo(pageId) {
  // Pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) target.classList.add('active');

  // Sidebar nav items
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.getElementById('nav-' + pageId);
  if (navItem) navItem.classList.add('active');

  // Update search placeholder
  const placeholders = {
    'mission-control': 'Global system search...',
    'blood-inventory': 'Search inventory...',
    'logistics-track': 'Track shipment...',
    'hospital-network': 'Search facilities...',
    'cold-chain-iot': 'Search IoT Nodes...'
  };
  document.getElementById('globalSearch').placeholder = placeholders[pageId] || 'Search...';

  // Lazy-init charts only when mission-control or cold-chain-iot visible
  if (pageId === 'mission-control') initMissionCharts();
  if (pageId === 'cold-chain-iot') initThermalChart();
}

// Sidebar nav clicks
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    navigateTo(item.dataset.page);
  });
});

// Hash routing
window.addEventListener('hashchange', () => {
  const hash = location.hash.replace('#', '') || 'mission-control';
  if (pages.includes(hash)) navigateTo(hash);
});

// Init on load
navigateTo('mission-control');

/* ---------- Top-bar View Switcher ---------- */
function switchView(view, el) {
  document.querySelectorAll('.topbar-link').forEach(l => l.classList.remove('active'));
  el.classList.add('active');
  // Map views to pages
  const viewMap = { global: 'mission-control', analytics: 'blood-inventory', 'system-health': 'cold-chain-iot' };
  if (viewMap[view]) navigateTo(viewMap[view]);
}

/* ---------- Blood Type Toggle ---------- */
document.querySelectorAll('.blood-type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.blood-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filterInventory();
  });
});

/* ---------- Inventory Filtering ---------- */
function filterInventory() {
  const location = document.getElementById('hospitalFilter').value;
  const status   = document.getElementById('statusFilter').value;
  const type     = document.querySelector('.blood-type-btn.active')?.dataset.type || '';

  document.querySelectorAll('.inv-row').forEach(row => {
    const rowLocation = row.querySelector('td:nth-child(4)')?.textContent.trim() || '';
    const rowStatus   = row.querySelector('.expiry-status')?.textContent.trim() || '';
    const rowType     = row.querySelector('.blood-badge')?.textContent.trim() || '';

    const locOk = location === 'All Locations' || rowLocation.includes(location.split(',')[0]);
    const stOk  = status === 'All Statuses' || rowStatus.toUpperCase().includes(status.toUpperCase());
    const tyOk  = !type || rowType === type;

    row.style.display = (locOk && stOk && tyOk) ? '' : 'none';
  });
}

document.getElementById('hospitalFilter')?.addEventListener('change', filterInventory);
document.getElementById('statusFilter')?.addEventListener('change', filterInventory);

function clearFilters() {
  document.getElementById('hospitalFilter').value = 'All Locations';
  document.getElementById('statusFilter').value = 'All Statuses';
  document.querySelectorAll('.blood-type-btn').forEach((b,i) => b.classList.toggle('active', i === 0));
  document.querySelectorAll('.inv-row').forEach(r => r.style.display = '');
}

/* ---------- Emergency Modal ---------- */
function triggerEmergency() {
  document.getElementById('emergencyModal').classList.add('visible');
}
function closeEmergency(e) {
  if (!e || e.target === document.getElementById('emergencyModal')) {
    document.getElementById('emergencyModal').classList.remove('visible');
  }
}
function confirmDispatch() {
  document.getElementById('emergencyModal').classList.remove('visible');
  showToast('🚨 Emergency dispatch initiated! 3 vehicles mobilized.');
}

/* ---------- Toast Notification ---------- */
function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('toast-show'), 10);
  setTimeout(() => { t.classList.remove('toast-show'); setTimeout(() => t.remove(), 400); }, 3500);
}

/* ---------- Notification Bell ---------- */
function showNotif() {
  showToast('📋 3 critical alerts require your attention.');
}

/* ---------- Hospital Network Run Analysis ---------- */
document.querySelector('.run-analysis-btn')?.addEventListener('click', function() {
  this.textContent = 'ANALYSING…';
  this.disabled = true;
  setTimeout(() => {
    this.textContent = 'RUN ANALYSIS';
    this.disabled = false;
    showToast('✅ Analysis complete: Optimal redistribution route found.');
  }, 2000);
});

/* ---------- Chart.js: Demand vs Supply ---------- */
let demandSupplyChart, inventoryChart, thermalChart;

function initMissionCharts() {
  if (demandSupplyChart && inventoryChart) return; // already drawn

  const ctx1 = document.getElementById('demandSupplyChart');
  const labels = ['08:00','10:00','12:00','14:00','16:00','18:00','20:00'];
  const supply = [420, 400, 370, 330, 360, 420, 480];
  const demand = [380, 360, 390, 410, 380, 350, 320];

  demandSupplyChart = new Chart(ctx1, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Supply',
          data: supply,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.05)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 0,
        },
        {
          label: 'Demand',
          data: demand,
          borderColor: '#ef4444',
          borderDash: [4, 4],
          backgroundColor: 'rgba(239,68,68,0.04)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 0,
        }
      ]
    },
    options: chartDefaults()
  });

  // Inventory Distribution Bar Chart
  const ctx2 = document.getElementById('inventoryChart');
  inventoryChart = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: ['A+','A–','B+','B–','O–','O+','AB+'],
      datasets: [{
        data: [42, 18, 35, 8, 14, 52, 27],
        backgroundColor: [
          'rgba(59,130,246,0.7)',
          'rgba(59,130,246,0.5)',
          'rgba(6,182,212,0.7)',
          'rgba(6,182,212,0.5)',
          'rgba(239,68,68,0.8)',
          'rgba(34,197,94,0.7)',
          'rgba(168,85,247,0.7)',
        ],
        borderRadius: 4,
        borderSkipped: false,
      }]
    },
    options: {
      ...chartDefaults(),
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
    }
  });
}

function initThermalChart() {
  if (thermalChart) return;
  const ctx = document.getElementById('thermalChart');
  const hours = Array.from({length: 24}, (_, i) => `${String(i).padStart(2,'0')}:00`);
  const temps = hours.map(() => 2.5 + Math.random() * 1.8);

  thermalChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: hours,
      datasets: [{
        label: 'Temperature °C',
        data: temps,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6,182,212,0.06)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 0,
      }]
    },
    options: {
      ...chartDefaults(),
      scales: {
        x: {
          ...chartDefaults().scales.x,
          ticks: { ...chartDefaults().scales.x.ticks, maxTicksLimit: 8 }
        },
        y: {
          ...chartDefaults().scales.y,
          min: 0,
          max: 8,
          ticks: {
            ...chartDefaults().scales.y.ticks,
            callback: v => v + '°C'
          }
        }
      },
      plugins: {
        legend: { display: false },
        annotation: {
          annotations: {
            upper: {
              type: 'line', yMin: 6, yMax: 6,
              borderColor: 'rgba(239,68,68,0.4)', borderWidth: 1, borderDash: [4,4]
            },
            lower: {
              type: 'line', yMin: 2, yMax: 2,
              borderColor: 'rgba(59,130,246,0.4)', borderWidth: 1, borderDash: [4,4]
            }
          }
        }
      }
    }
  });
}

function chartDefaults() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a2235',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        titleFont: { family: 'Inter' },
        bodyFont: { family: 'Inter' },
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#55607a', font: { size: 10, family: 'Inter' } },
        border: { display: false }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#55607a', font: { size: 10, family: 'Inter' } },
        border: { display: false }
      }
    }
  };
}

/* ---------- Live Clock in Stat Card ---------- */
(function liveData() {
  // Simulate live request count fluctuation
  const reqEl = document.querySelector('.stat-card.stat-neutral .stat-value');
  setInterval(() => {
    if (reqEl) {
      const v = 340 + Math.floor(Math.random() * 8);
      reqEl.innerHTML = v + ' <span class="stat-sub">Standard Processing</span>';
    }
  }, 4000);
})();

/* ---------- Toast CSS injection ---------- */
const toastStyle = document.createElement('style');
toastStyle.textContent = `
  .toast {
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    background: #1a2235; border: 1px solid rgba(255,255,255,0.12);
    color: #e8eaf2; padding: 12px 20px; border-radius: 10px;
    font-size: 13px; font-family: 'Inter', sans-serif;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    transform: translateY(20px); opacity: 0;
    transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1);
    max-width: 340px;
  }
  .toast-show { transform: translateY(0); opacity: 1; }
`;
document.head.appendChild(toastStyle);
