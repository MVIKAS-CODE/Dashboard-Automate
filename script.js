/* ═══════════════════════════════════════════════════════════════
   MVIKAS LOGISTICS — Executive Operations Dashboard
   Automated Daily Google Sheets Pipeline & Interactive Dashboard
   ═══════════════════════════════════════════════════════════════ */

// Palette — dark base + signature MVIKAS orange
const C = {
  orange: '#f58220',
  orangeDim: '#d96d10',
  bg: '#0a0a0a',
  s1: '#141414',
  s2: '#1a1a1a',
  s3: '#202020',
  s4: '#262626',
  border: '#2a2a2a',
  divider: '#3a3a3a',
  text: '#f5f5f5',
  text2: '#b8b8b8',
  text3: '#8b8b8b',
  text4: '#5a5a5a',
  grid: '#252525'
};
const orangeA = (a) => `rgba(245,130,32,${a})`;

const $ = id => document.getElementById(id);

// Safe Chart.js wrapper
function safeChart(ctx, config) {
  if (typeof Chart === 'undefined') { console.warn('Chart.js not loaded — skipping chart render'); return null; }
  if (!ctx) return null;
  try { return new Chart(ctx, config); }
  catch (e) { console.error('Chart render failed:', e); return null; }
}

// Chart defaults (Dark theme)
if (typeof Chart !== 'undefined') {
  const CD = Chart.defaults;
  CD.color = C.text3;
  CD.font.family = 'Inter, -apple-system, system-ui, sans-serif';
  CD.font.size = 11;
  CD.plugins.tooltip.backgroundColor = C.s3;
  CD.plugins.tooltip.borderColor = C.border;
  CD.plugins.tooltip.borderWidth = 1;
  CD.plugins.tooltip.padding = 12;
  CD.plugins.tooltip.cornerRadius = 8;
  CD.plugins.tooltip.titleColor = C.orange;
  CD.plugins.tooltip.titleFont = { size: 11, weight: '700' };
  CD.plugins.tooltip.bodyColor = C.text;
  CD.plugins.tooltip.bodyFont = { size: 12, weight: '500' };
  CD.plugins.tooltip.displayColors = false;
  CD.scale.grid.color = C.grid;
  CD.scale.grid.drawBorder = false;
  CD.scale.ticks.color = C.text3;
}

// Global Chart Instances
let chartInstances = {};

function destroyCharts() {
  Object.values(chartInstances).forEach(c => {
    if (c && typeof c.destroy === 'function') {
      try { c.destroy(); } catch (e) {}
    }
  });
  chartInstances = {};
}

// Counter Animation
function animateCounters() {
  document.querySelectorAll('.counter').forEach(el => {
    const t = +el.dataset.target, dec = +(el.dataset.decimals || 0), dur = 1600, st = performance.now();
    (function tick(now) {
      const p = Math.min((now - st) / dur, 1);
      const v = t * (1 - Math.pow(1 - p, 3));
      el.textContent = dec > 0 ? v.toFixed(dec) : Math.round(v).toLocaleString('en-IN');
      if (p < 1) requestAnimationFrame(tick);
    })(st);
  });
}

// Tab Switching (Only the 5 past panels)
function switchTab(id, btn) {
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
  });
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));

  const targetPanel = $('tab-' + id);
  if (targetPanel) targetPanel.classList.add('active');

  if (btn) {
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
  } else {
    const defaultBtn = $('tab-btn-' + id);
    if (defaultBtn) {
      defaultBtn.classList.add('active');
      defaultBtn.setAttribute('aria-selected', 'true');
    }
  }
}
window.switchTab = switchTab;

function goToEddDetail() {
  const btn = $('tab-btn-edd');
  if (btn) switchTab('edd', btn);
  $('tab-edd')?.scrollIntoView({ behavior: 'smooth' });
}
window.goToEddDetail = goToEddDetail;

// Formatters
const fR = v => '₹' + (v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const fK = v => (v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const CF = { size: 11, weight: '500' };

// Active Dashboard Data State
let APP_DATA = null;

// Rates & Calculations
const RATES = {
  'Bombax': 14.38, 'Carrier Refrigeration': 11.26, 'Carrier CTD': 13.43,
  'Cosmos Pumps Pvt Ltd': 13.16, 'Edusoft Healthcare Ltd': 13.77,
  'Haier CCR': 16.53, 'Kumar Services': 10.20,
  'Loom Solar Pvt Ltd': 20.75, 'Medical Science': 11.64,
  'Mitras Technocrafts Pvt Ltd-HR': 11.11, 'Oneiric Appliances Pvt Ltd': 13.13,
  'Sukuga Technologies Pvt Ltd': 14.79, 'Vaidrishi Laboratories Pvt Ltd': 12.73
};
const DR = 10.0;
const rate = n => RATES[n] || DR;
const FIXED_TARGET_MONEY = 8445000;

// Main Render Function
function renderDashboard(data) {
  APP_DATA = data;
  destroyCharts();

  const clients = data.clients || [];
  const openData = data.openData || [];
  const eddData = data.eddData || [];
  const dueData = data.dueData || [];
  const bookedData = data.bookedData || [];
  const dailyTonnageData = data.dailyTonnageData || [];
  const eddDetail = data.eddDetail || [];

  const openTotal = data.kpis?.openTotal || openData.reduce((a, b) => a + (b.count || 0), 0) || 714;
  const eddTotal = data.kpis?.eddTotal || eddData.reduce((a, b) => a + (b.count || 0), 0) || eddDetail.length || 234;
  const dueTotal = data.kpis?.dueTotal || dueData.reduce((a, b) => a + (b.count || 0), 0) || 69;
  const bookedTotal = data.kpis?.bookedTotal || bookedData.reduce((a, b) => a + (b.count || 0), 0) || 46;
  const dailyTotal = data.kpis?.dailyTonnageKg || dailyTonnageData.reduce((a, b) => a + (b.kg || 0), 0) || 22398;
  const monthlyTotal = data.kpis?.monthlyTonnageKg || clients.reduce((a, c) => a + (c.achieved || 0), 0) || 534400;

  const activeDays = data.metadata?.activeDays || 25;
  const daysInMonth = data.metadata?.daysInMonth || 31;
  const dailyAverage = activeDays > 0 ? (monthlyTotal / activeDays) : 0;

  const totalTargetMoney = data.kpis?.targetRevenue || FIXED_TARGET_MONEY;
  const totalSalesMoney = data.kpis?.achievedRevenue || clients.reduce((s, c) => s + (c.achieved || 0) * rate(c.name), 0);
  const dailyMoneyRate = activeDays > 0 ? (totalSalesMoney / activeDays) : 0;
  const predictedSales = dailyMoneyRate * daysInMonth;
  const predictedPct = totalTargetMoney > 0 ? (predictedSales / totalTargetMoney * 100) : 0;

  // Enrich clients with calculated metrics
  clients.forEach(c => {
    c.pct = c.target > 0 ? Math.round(c.achieved / c.target * 100) : (c.achieved > 0 ? 999 : 0);
    c.avgDay = c.activeDays > 0 ? Math.round(c.achieved / c.activeDays) : 0;
    c.remaining = Math.max((c.target || 0) - c.achieved, 0);
    c.daysNeeded = c.avgDay > 0 && c.remaining > 0 ? +(c.remaining / c.avgDay).toFixed(1) : (c.remaining === 0 ? 0 : 999);
  });

  // Header badges
  if ($('header-report-date') && data.metadata?.reportDate) {
    $('header-report-date').textContent = data.metadata.reportDate;
  }
  if ($('header-elapsed-days')) {
    $('header-elapsed-days').textContent = `Day ${activeDays}/${daysInMonth}`;
  }
  if ($('header-prog-ring')) {
    const ringPct = Math.round((activeDays / daysInMonth) * 100);
    $('header-prog-ring').setAttribute('stroke-dasharray', `${ringPct}, 100`);
  }

  // Hero Section Counters
  if ($('hero-open-val')) $('hero-open-val').dataset.target = openTotal;
  if ($('hero-edd-val')) $('hero-edd-val').dataset.target = eddTotal;
  if ($('hero-weight-val')) $('hero-weight-val').dataset.target = (monthlyTotal / 1000).toFixed(2);
  if ($('hero-revenue-val')) $('hero-revenue-val').dataset.target = (totalSalesMoney / 100000).toFixed(2);

  // Main KPI Cards
  if ($('kpi-open')) $('kpi-open').textContent = openTotal.toLocaleString('en-IN');
  if ($('kpi-edd')) $('kpi-edd').textContent = eddTotal.toLocaleString('en-IN');
  if ($('kpi-edd-pct')) $('kpi-edd-pct').textContent = Math.round(eddTotal / openTotal * 100) + '% of open';
  if ($('kpi-due')) $('kpi-due').textContent = dueTotal.toLocaleString('en-IN');
  if ($('kpi-booked')) $('kpi-booked').textContent = bookedTotal.toLocaleString('en-IN');
  if ($('kpi-daily-ton')) $('kpi-daily-ton').innerHTML = dailyTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 }) + ' <span style="font-size:.75rem;font-weight:500;color:' + C.text3 + '">kg</span>';
  if ($('kpi-month-ton')) $('kpi-month-ton').innerHTML = monthlyTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 }) + ' <span style="font-size:.75rem;font-weight:500;color:' + C.text3 + '">kg</span>';
  if ($('kpi-daily-avg')) $('kpi-daily-avg').innerHTML = Math.round(dailyAverage).toLocaleString('en-IN') + ' <span style="font-size:.75rem;font-weight:500;color:' + C.text3 + '">kg/day</span>';
  if ($('kpi-target-money')) $('kpi-target-money').textContent = fR(totalTargetMoney);
  if ($('kpi-sales-money')) $('kpi-sales-money').textContent = fR(totalSalesMoney);

  // Tab Badges
  if ($('tab-edd-badge')) $('tab-edd-badge').textContent = eddTotal;
  if ($('tab-reasons-badge')) $('tab-reasons-badge').textContent = eddTotal;

  // Classification Strips & Donut Legends
  ['strip-edd', 'dl-edd'].forEach(id => { const e = $(id); if (e) e.textContent = eddTotal });
  ['strip-transit', 'dl-transit'].forEach(id => { const e = $(id); if (e) e.textContent = openTotal - eddTotal });
  ['strip-due', 'dl-due'].forEach(id => { const e = $(id); if (e) e.textContent = dueTotal });
  ['strip-booked', 'dl-booked'].forEach(id => { const e = $(id); if (e) e.textContent = bookedTotal });

  // Open Shipments Table
  const otb = $('open-table-body');
  if (otb) {
    otb.innerHTML = '';
    openData.forEach((d, i) => {
      const ec = (eddData.find(e => e.name === d.name) || {}).count || 0;
      const dc = (dueData.find(e => e.name === d.name) || {}).count || 0;
      const pct = d.count > 0 ? Math.round(ec / d.count * 100) : 0;
      const risk = pct >= 70 ? ['Critical', 'delayed'] : pct >= 40 ? ['High', 'delayed'] : pct >= 20 ? ['Medium', 'open'] : ['Low', 'due'];
      otb.innerHTML += `<tr><td style="color:${C.text4};font-size:.78rem">${String(i + 1).padStart(2, '0')}</td><td><strong>${d.name}</strong></td><td>${d.count}</td><td style="color:${C.orange};font-weight:600">${ec}</td><td style="color:${C.text2};font-weight:500">${dc}</td><td style="color:${pct >= 50 ? C.orange : C.text2};font-weight:600">${pct}%</td><td><span class="badge ${risk[1]}">${risk[0]}</span></td></tr>`;
    });
  }

  // Classification Charts
  chartInstances.statusDonut = safeChart($('statusDonut'), {
    type: 'doughnut',
    data: {
      labels: ['EDD Crossed', 'In Transit', 'Due Tomorrow', 'Booked'],
      datasets: [{
        data: [eddTotal, openTotal - eddTotal, dueTotal, bookedTotal],
        backgroundColor: [C.orange, '#8b8b8b', '#5a5a5a', '#3a3a3a'],
        borderWidth: 2, borderColor: C.s2, hoverOffset: 10
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '70%',
      animation: { animateRotate: true, animateScale: true, duration: 1200, easing: 'easeOutQuart' },
      plugins: { legend: { display: false } }
    }
  });

  chartInstances.eddBarChart = safeChart($('eddBarChart'), {
    type: 'bar',
    data: {
      labels: eddData.map(d => d.name),
      datasets: [{ label: 'EDD Crossed', data: eddData.map(d => d.count), backgroundColor: C.orange, borderRadius: 4 }]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: { duration: 1100 },
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, ticks: { font: CF } }, y: { ticks: { font: CF }, grid: { display: false } } }
    }
  });

  chartInstances.dueTmrChart = safeChart($('dueTmrChart'), {
    type: 'bar',
    data: { labels: dueData.map(d => d.name), datasets: [{ label: 'Due', data: dueData.map(d => d.count), backgroundColor: orangeA(.6), borderRadius: 4 }] },
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: 1100 },
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { autoSkip: false, maxRotation: 30, font: CF }, grid: { display: false } }, y: { beginAtZero: true } }
    }
  });

  chartInstances.bookedChart = safeChart($('bookedChart'), {
    type: 'bar',
    data: { labels: bookedData.map(d => d.name), datasets: [{ label: 'Booked', data: bookedData.map(d => d.count), backgroundColor: '#8b8b8b', borderRadius: 4 }] },
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: 1100 },
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { autoSkip: false, maxRotation: 30, font: CF }, grid: { display: false } }, y: { beginAtZero: true } }
    }
  });

  // Tonnage Section
  renderForecast(totalTargetMoney, totalSalesMoney, predictedSales, predictedPct, activeDays, daysInMonth);
  renderTonnageBars();
  renderTonnageCharts();
  renderKamSummary();

  // Daily Section
  renderDailyTable(clients);

  // EDD Filterable Table
  populateEddFilterOptions(eddDetail);
  renderEddRows(eddDetail);

  // Delay Reasons Section
  renderDelayPanel(eddDetail);

  animateCounters();
}

// Forecast Rendering
function renderForecast(targetMoney, salesMoney, predictedSales, predictedPct, activeDays, daysInMonth) {
  if ($('forecast-sales-money')) $('forecast-sales-money').textContent = fR(salesMoney);
  if ($('forecast-predicted-money')) $('forecast-predicted-money').textContent = fR(predictedSales);
  if ($('forecast-target-money')) $('forecast-target-money').textContent = fR(targetMoney);

  const badge = $('forecast-badge');
  const vt = $('forecast-verdict-text');
  const will = predictedPct >= 100;
  const border = predictedPct >= 90 && predictedPct < 100;

  if (badge && vt) {
    if (will) {
      badge.textContent = 'ON TRACK'; badge.className = 'fbadge good';
      vt.textContent = `Projected ${Math.round(predictedPct)}% — surplus ${fR(predictedSales - targetMoney)}.`;
    } else if (border) {
      badge.textContent = 'BORDERLINE'; badge.className = 'fbadge warn';
      vt.textContent = `Projected ${Math.round(predictedPct)}% — shortfall ${fR(targetMoney - predictedSales)}.`;
    } else {
      badge.textContent = 'AT RISK'; badge.className = 'fbadge bad';
      vt.textContent = `Projected ${Math.round(predictedPct)}% — shortfall ${fR(targetMoney - predictedSales)}.`;
    }
  }

  const max = Math.max(targetMoney, predictedSales, 1);
  if ($('forecast-bar-fill')) $('forecast-bar-fill').style.width = Math.min(predictedSales / max * 100, 100) + '%';
  if ($('forecast-bar-target-marker')) $('forecast-bar-target-marker').style.left = Math.min(targetMoney / max * 100, 100) + '%';
  if ($('forecast-bar-target-label')) $('forecast-bar-target-label').textContent = 'Target: ' + fR(targetMoney);
  if ($('forecast-explain')) $('forecast-explain').innerHTML = `<strong style="color:${C.text}">Method:</strong> Predicted = (Sales ÷ ${activeDays} active days) × ${daysInMonth}. Straight-line projection.`;
}

// Tonnage Period Logic
const PL = { full: 'Tonnage — % Completion', first10: 'First 10 Days', mid10: 'Mid 10 Days', last10: 'Last 10 Days' };
const PS = { full: 'Full Month', first10: 'First 10 Days', mid10: 'Mid 10 Days', last10: 'Last 10 Days' };
let curPeriod = 'full';

function bucketColor(pct) {
  if (pct === null || pct === undefined) return C.text4;
  if (pct >= 80) return C.orange;
  if (pct >= 50) return C.text2;
  return C.text3;
}

function getPStats(c, p) {
  if (p === 'full') return { achieved: c.achieved, target: c.target };
  const d = c.periods && c.periods[p];
  return { achieved: d ? d.achieved : null, target: d ? d.target : null };
}

function setTonnagePeriod(p) {
  curPeriod = p;
  renderTonnageBars();
  renderTonnageCharts();
  renderKamSummary();
}
window.setTonnagePeriod = setTonnagePeriod;

function renderTonnageBars() {
  const el = $('tonnage-bars'); if (!el || !APP_DATA) return;
  const clients = APP_DATA.clients || [];
  const ti = $('tonnage-panel-title'); if (ti) ti.textContent = PL[curPeriod];

  const wd = clients.map(c => { const { achieved, target } = getPStats(c, curPeriod); return { c, achieved, target } }).filter(r => (r.achieved > 0) || (r.target > 0));
  const tier = item => {
    const ht = item.target > 0, ha = item.achieved > 0;
    if (!ht) return 3; if (!ha) return 4;
    const p = Math.round(item.achieved / item.target * 100);
    return p >= 80 ? 1 : p >= 50 ? 2 : 4;
  };
  wd.sort((a, b) => {
    const d = tier(a) - tier(b); if (d) return d;
    const pA = a.target && a.achieved ? a.achieved / a.target : 0;
    const pB = b.target && b.achieved ? b.achieved / b.target : 0;
    return pB - pA || (b.achieved || 0) - (a.achieved || 0);
  });

  if (!wd.length) { el.innerHTML = '<div class="tonnage-empty" style="padding:24px;text-align:center;color:#888">No tonnage data for this period.</div>'; return; }

  el.innerHTML = wd.map(({ c, achieved, target }) => {
    const ht = target > 0, ha = achieved > 0;
    let pct = null;
    if (ht) pct = ha ? Math.round(achieved / target * 100) : 0;
    const dp = pct !== null ? Math.min(pct, 100) : 100;
    const nc = bucketColor(pct);
    const pl = pct !== null ? pct + '%' : '—';
    const nt = c.isNew ? '<span class="new-tag">New</span>' : '';
    let ta;
    if (ht && ha) ta = fK(achieved) + ' / ' + fK(target) + ` <span style="color:${C.text4}">kg</span>`;
    else if (ht && !ha) ta = '0 / ' + fK(target) + ` <span style="color:${C.text4}">kg</span>`;
    else ta = fK(achieved) + ` <span style="color:${C.text4}">kg</span>`;
    const r = rate(c.name);
    const vl = ha ? `<div class="value-badge"><span class="value-amount">${fR(achieved * r)}</span><span class="value-rate">@₹${r}/kg</span></div>` : '';
    return `<div class="client-row"><div class="client-name" title="${c.name}"><span class="client-name-text" style="color:${C.text};font-weight:600">${c.name}</span>${nt}</div><div class="client-person">${c.person}</div><div class="prog-bar-wrap"><div class="prog-bar" style="width:${dp}%;background:${nc}"></div></div><div class="pct-text" style="color:${nc}">${pl}</div><div class="client-tonnage"><div>${ta}</div>${vl}</div></div>`;
  }).join('');
}

const tl = $('tonnage-legend');
if (tl) tl.innerHTML = [['0–50%', C.text3], ['50–80%', C.text2], ['80%+', C.orange]].map(([l, c]) => `<span><span class="legend-dot" style="background:${c}"></span>${l}</span>`).join('') + '<span><span class="new-tag" style="margin-left:0">New</span> onboarded</span>';

function renderTonnageCharts() {
  if (!APP_DATA) return;
  const clients = APP_DATA.clients || [];
  const top = clients.map(c => { const { achieved, target } = getPStats(c, curPeriod); return { name: c.name, achieved: achieved || 0, target: target || 0 } }).filter(r => r.achieved > 0 || r.target > 0).sort((a, b) => (b.achieved || b.target) - (a.achieved || a.target)).slice(0, 8);

  if (chartInstances.targetChart) chartInstances.targetChart.destroy();
  chartInstances.targetChart = safeChart($('targetChart'), {
    type: 'bar',
    data: {
      labels: top.map(r => r.name),
      datasets: [
        { label: 'Target', data: top.map(r => r.target), backgroundColor: '#3a3a3a', borderRadius: 4 },
        { label: 'Achieved', data: top.map(r => r.achieved), backgroundColor: C.orange, borderRadius: 4 }
      ]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: { duration: 1100 },
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14, font: CF, color: C.text2 } }, title: { display: true, text: 'Target vs Achieved — ' + PS[curPeriod], font: { size: 11, weight: '500' }, color: C.text3, padding: { bottom: 16 } } },
      scales: { x: { beginAtZero: true, ticks: { callback: v => (v / 1000).toFixed(0) + 'k', font: CF } }, y: { ticks: { font: CF }, grid: { display: false } } }
    }
  });
}

// KAM Summary
function renderKamSummary() {
  const body = $('kam-summary-body'); if (!body || !APP_DATA) return;
  const clients = APP_DATA.clients || [];
  const km = {};
  clients.forEach(c => {
    const { achieved, target } = getPStats(c, curPeriod);
    if (!achieved && !target) return;
    if (!km[c.person]) km[c.person] = { person: c.person, tt: 0, ta: 0 };
    km[c.person].tt += (target || 0);
    km[c.person].ta += (achieved || 0);
  });
  const kl = Object.values(km).sort((a, b) => b.ta - a.ta);
  if (!kl.length) {
    body.innerHTML = `<tr><td colspan="4" style="text-align:center;color:${C.text3};padding:24px">No KAM data.</td></tr>`;
    return;
  }
  body.innerHTML = kl.map(k => {
    const p = k.tt > 0 ? Math.round(k.ta / k.tt * 100) : null;
    const pc = p === null ? C.text4 : bucketColor(p);
    return `<tr><td style="font-weight:600">${k.person}</td><td>${k.tt > 0 ? fK(k.tt) : '—'}</td><td>${fK(k.ta)}</td><td style="color:${pc};font-weight:600">${p !== null ? p + '%' : '—'}</td></tr>`;
  }).join('');

  const totalTarget = kl.reduce((s, k) => s + k.tt, 0);
  const totalAchieved = kl.reduce((s, k) => s + k.ta, 0);
  const totalPct = totalTarget > 0 ? (totalAchieved / totalTarget * 100) : null;
  if ($('kam-total-target')) $('kam-total-target').textContent = fK(totalTarget);
  if ($('kam-total-achieved')) $('kam-total-achieved').textContent = fK(totalAchieved);
  if ($('kam-total-pct')) $('kam-total-pct').textContent = totalPct !== null ? totalPct.toFixed(2) : '—';
}

// Daily Table
function renderDailyTable(clients) {
  const dtb = $('daily-table-body');
  if (dtb) {
    dtb.innerHTML = '';
    clients.filter(c => c.achieved > 0).forEach(c => {
      const pct = c.target > 0 ? Math.round(c.achieved / c.target * 100) + '%' : '—';
      const pc = c.target > 0 ? (c.achieved >= c.target ? C.orange : C.text2) : C.text4;
      const rem = c.target > 0 ? Math.max(c.target - c.achieved, 0).toLocaleString('en-IN') : '—';
      const df = c.target > 0 && c.avgDay > 0 && c.remaining > 0 ? +(c.remaining / c.avgDay).toFixed(1) : (c.target > 0 && c.remaining === 0 ? '✓' : '—');
      dtb.innerHTML += `<tr><td style="font-weight:600">${c.name}</td><td style="font-size:.78rem;color:${C.text3}">${c.person}</td><td>${c.target > 0 ? c.target.toLocaleString('en-IN') : '—'}</td><td>${c.achieved.toLocaleString('en-IN')}</td><td style="color:${pc};font-weight:600">${pct}</td><td>${c.activeDays}</td><td>${c.avgDay.toLocaleString('en-IN')}</td><td style="color:${C.text2};font-weight:500">${rem}</td><td style="color:${C.orange};font-weight:600">${df}</td></tr>`;
    });
  }

  const topAvg = clients.filter(c => c.avgDay > 0).sort((a, b) => b.avgDay - a.avgDay).slice(0, 10);
  chartInstances.avgDayChart = safeChart($('avgDayChart'), {
    type: 'bar',
    data: { labels: topAvg.map(c => c.name), datasets: [{ label: 'Avg kg/day', data: topAvg.map(c => c.avgDay), backgroundColor: C.orange, borderRadius: 4 }] },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: { duration: 1100 },
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, ticks: { callback: v => v.toLocaleString('en-IN'), font: CF } }, y: { ticks: { font: CF }, grid: { display: false } } }
    }
  });

  const dc = $('daysChart');
  if (dc) {
    const dd = clients.filter(c => c.target > 0 && c.avgDay > 0 && c.remaining > 0).sort((a, b) => b.daysNeeded - a.daysNeeded).slice(0, 10);
    chartInstances.daysChart = safeChart(dc, {
      type: 'bar',
      data: { labels: dd.map(c => c.name), datasets: [{ label: 'Days', data: dd.map(c => c.daysNeeded), backgroundColor: dd.map(c => c.daysNeeded > 18 ? C.orange : '#8b8b8b'), borderRadius: 4 }] },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: { duration: 1100 },
        plugins: { legend: { display: false }, title: { display: true, text: 'Estimated days at current pace', font: { size: 11, weight: '500' }, color: C.text3, padding: { bottom: 16 } } },
        scales: { x: { beginAtZero: true, ticks: { font: CF } }, y: { ticks: { font: CF }, grid: { display: false } } }
      }
    });
  }
}

// EDD Filters & Table
function renderEddKpis(list) {
  if (!list || !list.length) return;
  const total = list.length;
  if ($('edd-total-count')) $('edd-total-count').textContent = total;
  const rc = {}, cc = {};
  list.forEach(item => {
    const r = item.reason || 'Transit Delay';
    const c = item.transporter || 'Unassigned';
    rc[r] = (rc[r] || 0) + 1; cc[c] = (cc[c] || 0) + 1;
  });
  const sr = Object.entries(rc).sort((a, b) => b[1] - a[1]);
  const sc = Object.entries(cc).sort((a, b) => b[1] - a[1]);
  if (sr[0] && $('edd-top-reason-name')) {
    $('edd-top-reason-name').textContent = sr[0][0];
    if ($('edd-top-reason-pct')) $('edd-top-reason-pct').textContent = Math.round(sr[0][1] / total * 100) + '% (' + sr[0][1] + ')';
  }
  if (sc[0] && $('edd-worst-carrier')) {
    $('edd-worst-carrier').textContent = sc[0][0];
    if ($('edd-worst-carrier-count')) $('edd-worst-carrier-count').textContent = sc[0][1] + ' delayed';
  }
  const bars = $('edd-reason-bars');
  if (bars) bars.innerHTML = sr.slice(0, 3).map(([r, c]) => {
    const p = Math.round(c / total * 100);
    return `<div class="reason-bar-item"><div class="reason-bar-header"><span class="reason-label" title="${r}">${r}</span><span class="reason-val">${p}% (${c})</span></div><div class="reason-progress-bg"><div class="reason-progress-fill" style="width:${p}%"></div></div></div>`;
  }).join('');
}

function renderEddRows(rows) {
  const tbody = $('edd-detail-body'), cnt = $('edd-detail-count');
  if (!tbody || !APP_DATA) return;
  const eddDetail = APP_DATA.eddDetail || [];
  if (cnt) cnt.textContent = rows.length + ' of ' + eddDetail.length + ' orders';
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:${C.text3};padding:32px">No matching orders found.</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(r => {
    const typeBadge = r.type === 'Customer' ? `<span class="cv-chip cv-chip-customer">Customer</span>`
      : r.type === 'Vendor' ? `<span class="cv-chip cv-chip-vendor">Vendor</span>`
        : `<span class="cv-chip cv-chip-unclassified">—</span>`;
    return `<tr><td style="font-weight:600;font-size:.76rem;color:${C.orange}">${r.id}</td><td><strong>${r.name}</strong></td><td>${typeBadge}</td><td>${r.transporter || '—'}</td><td style="color:${C.text};font-weight:500">${r.edd || '—'}</td><td>${r.reason || `<span style="color:${C.text4};font-style:italic">Transit Delay</span>`}</td></tr>`;
  }).join('');
  renderEddKpis(rows);
}

function filterEddRows() {
  if (!APP_DATA) return [];
  const eddDetail = APP_DATA.eddDetail || [];
  const q = ($('edd-search')?.value || '').trim().toLowerCase();
  const type = $('edd-filter-type')?.value || '';
  const transporter = $('edd-filter-transporter')?.value || '';
  const reason = $('edd-filter-reason')?.value || '';

  return eddDetail.filter(r => {
    if (q) {
      const hay = (r.name + ' ' + r.id + ' ' + (r.transporter || '') + ' ' + (r.reason || '')).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (type && r.type !== type) return false;
    if (transporter && (r.transporter || 'Unassigned') !== transporter) return false;
    if (reason && (r.reason || 'Transit Delay') !== reason) return false;
    return true;
  });
}

function applyEddFilters() {
  renderEddRows(filterEddRows());
}
window.applyEddFilters = applyEddFilters;

function resetEddFilters() {
  ['edd-search', 'edd-filter-type', 'edd-filter-transporter', 'edd-filter-reason'].forEach(id => {
    const el = $(id); if (el) el.value = '';
  });
  applyEddFilters();
}
window.resetEddFilters = resetEddFilters;

function populateEddFilterOptions(eddDetail) {
  const typeSel = $('edd-filter-type'), transSel = $('edd-filter-transporter'), reasonSel = $('edd-filter-reason');
  if (!typeSel || !transSel || !reasonSel) return;

  typeSel.innerHTML = '<option value="">All Types</option>';
  transSel.innerHTML = '<option value="">All Transporters</option>';
  reasonSel.innerHTML = '<option value="">All Delay Reasons</option>';

  const addOptions = (sel, values) => {
    values.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v.length > 55 ? v.slice(0, 52) + '…' : v;
      sel.appendChild(opt);
    });
  };

  const types = [...new Set(eddDetail.map(r => r.type).filter(Boolean))].sort();
  const transporters = [...new Set(eddDetail.map(r => r.transporter || 'Unassigned'))].sort();
  const reasons = [...new Set(eddDetail.map(r => r.reason || 'Transit Delay'))].sort();

  addOptions(typeSel, types);
  addOptions(transSel, transporters);
  addOptions(reasonSel, reasons);
}

// Export to Excel
function exportEddToExcel() {
  if (typeof XLSX === 'undefined') { console.warn('XLSX library not loaded — cannot export'); return; }
  const rows = filterEddRows();
  const data = rows.map(r => ({
    'Order ID': r.id, 'Customer': r.name, 'Type': r.type || '',
    'Transporter': r.transporter || '', 'EDD': r.edd || '',
    'Delay Reason': r.reason || 'Transit Delay'
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [{ wch: 18 }, { wch: 24 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 45 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'EDD Crossed');
  XLSX.writeFile(wb, 'MVIKAS_EDD_Crossed_' + new Date().toISOString().slice(0, 10) + '.xlsx');
}
window.exportEddToExcel = exportEddToExcel;

// Root-Cause Delay Analytics Panel
const REASON_CATEGORIES = {
  customer: { label: 'Customer-Related', keywords: ['customer', 'consignee', 'refused', 'hold', 'sales person', 'space issue', 'address verification', 'contact', 'closed'] },
  carrier: { label: 'Carrier / Transit', keywords: ['hub', 'transit', 'misrouted', 'missed connection', 'vendor delay', 'intransit', 'last mile', 'highway', 'traffic', 'backlog'] },
  documentation: { label: 'Documentation', keywords: ['documents', 'documentation', 'po expired', 'deps', 'incorrect', 'incomplete'] },
  external: { label: 'External Factors', keywords: ['natural calamity', 'rain', 'festival', 'strike', 'sez', 'weather', 'kawad', 'onam'] },
  location: { label: 'Location / ODA', keywords: ['oda', 'remote', 'misrouted shipment'] },
  damage: { label: 'Damage / Quality', keywords: ['damaged', 'damage'] }
};

const CATEGORY_COLORS = {
  customer: C.orange,
  carrier: '#b8b8b8',
  documentation: '#8b8b8b',
  external: '#f79c4d',
  location: '#5a5a5a',
  damage: '#3a3a3a',
  unknown: '#2a2a2a'
};

function classifyReason(reason) {
  if (!reason) return 'unknown';
  const r = reason.toLowerCase();
  for (const [cat, def] of Object.entries(REASON_CATEGORIES)) {
    if (def.keywords.some(k => r.includes(k))) return cat;
  }
  return 'carrier';
}

function analyzeDelayReasons(eddDetail) {
  const reasonCounts = {};
  const categoryCounts = { customer: 0, carrier: 0, documentation: 0, external: 0, location: 0, damage: 0, unknown: 0 };
  const transporterDelays = {};
  const customerVendorCounts = { customer: 0, vendor: 0, unclassified: 0 };

  eddDetail.forEach(item => {
    const reason = item.reason || 'Transit Delay';
    reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    const category = classifyReason(item.reason);
    if (categoryCounts[category] !== undefined) categoryCounts[category]++;
    const t = item.transporter || 'Unassigned';
    transporterDelays[t] = (transporterDelays[t] || 0) + 1;
    if (item.type === 'Customer') customerVendorCounts.customer++;
    else if (item.type === 'Vendor') customerVendorCounts.vendor++;
    else customerVendorCounts.unclassified++;
  });

  return { reasonCounts, categoryCounts, transporterDelays, customerVendorCounts, total: eddDetail.length };
}

function animateDelayCounter(el, target, duration = 1400) {
  const start = performance.now();
  (function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased);
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}

function renderDelayPanel(eddDetail) {
  const analysis = analyzeDelayReasons(eddDetail);
  const { reasonCounts, categoryCounts, transporterDelays, customerVendorCounts, total } = analysis;

  const setText = (id, val) => { const el = $(id); if (el) el.textContent = val; };
  setText('dr-total-orders', total);
  setText('dr-unique-reasons', Object.keys(reasonCounts).length);
  const controllable = categoryCounts.customer + categoryCounts.documentation + categoryCounts.carrier;
  const external = categoryCounts.external + categoryCounts.location + categoryCounts.damage;
  setText('dr-controllable-pct', (total ? Math.round(controllable / total * 100) : 0) + '%');
  setText('dr-external-pct', (total ? Math.round(external / total * 100) : 0) + '%');

  const cv = customerVendorCounts;
  const cvTotal = total || 1;
  setText('dr-customer-count', cv.customer);
  setText('dr-vendor-count', cv.vendor);
  setText('dr-unclassified-count', cv.unclassified);
  setText('dr-customer-pct', Math.round(cv.customer / cvTotal * 100) + '%');
  setText('dr-vendor-pct', Math.round(cv.vendor / cvTotal * 100) + '%');
  setText('dr-unclassified-pct', Math.round(cv.unclassified / cvTotal * 100) + '%');

  const cvCanvas = $('customerVendorDonut');
  if (cvCanvas) {
    const cvEntries = [['Customer', cv.customer, C.orange], ['Vendor', cv.vendor, '#8b8b8b'], ['Unclassified', cv.unclassified, '#3a3a3a']].filter(([, v]) => v > 0);
    chartInstances.customerVendorDonut = safeChart(cvCanvas, {
      type: 'doughnut',
      data: {
        labels: cvEntries.map(e => e[0]),
        datasets: [{
          data: cvEntries.map(e => e[1]),
          backgroundColor: cvEntries.map(e => e[2]),
          borderWidth: 2, borderColor: C.s2, hoverOffset: 8
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        animation: { animateRotate: true, duration: 1100 },
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11, weight: '500' }, padding: 12, boxWidth: 10, usePointStyle: true, color: C.text2 } }
        }
      }
    });
  }

  const catMap = {
    customer: categoryCounts.customer,
    carrier: categoryCounts.carrier,
    documentation: categoryCounts.documentation,
    external: categoryCounts.external,
    location: categoryCounts.location + categoryCounts.damage,
    unknown: categoryCounts.unknown
  };

  document.querySelectorAll('.delay-cat').forEach(card => {
    const cat = card.dataset.cat;
    const count = catMap[cat] || 0;
    const pct = total > 0 ? Math.round(count / total * 100) : 0;
    const counter = card.querySelector('.counter-dr');
    const pctEl = card.querySelector('.dc-pct');
    const barFill = card.querySelector('.dc-bar-fill');
    if (counter) {
      counter.dataset.target = count;
      setTimeout(() => animateDelayCounter(counter, count), 200);
    }
    if (pctEl) pctEl.textContent = pct + '%';
    if (barFill) setTimeout(() => { barFill.style.width = pct + '%'; }, 300);
  });

  const donutData = Object.entries(catMap).filter(([_, v]) => v > 0);
  chartInstances.delayCategoryDonut = safeChart($('delayCategoryDonut'), {
    type: 'doughnut',
    data: {
      labels: donutData.map(([k]) => REASON_CATEGORIES[k]?.label || 'Unclassified'),
      datasets: [{
        data: donutData.map(([_, v]) => v),
        backgroundColor: donutData.map(([k]) => CATEGORY_COLORS[k] || '#3a3a3a'),
        borderWidth: 2, borderColor: C.s2, hoverOffset: 10
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '62%',
      plugins: {
        legend: { position: 'right', labels: { font: { size: 11, weight: '500' }, padding: 14, boxWidth: 12, usePointStyle: true, color: C.text2 } }
      }
    }
  });

  const topReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  chartInstances.topReasonsChart = safeChart($('topReasonsChart'), {
    type: 'bar',
    data: {
      labels: topReasons.map(([r]) => r.length > 38 ? r.slice(0, 35) + '…' : r),
      datasets: [{ label: 'Occurrences', data: topReasons.map(([_, c]) => c), backgroundColor: C.orange, borderRadius: 4 }]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, ticks: { font: CF } }, y: { ticks: { font: { size: 10 } }, grid: { display: false } } }
    }
  });

  const topTransporters = Object.entries(transporterDelays).sort((a, b) => b[1] - a[1]).slice(0, 8);
  chartInstances.transporterChart = safeChart($('transporterChart'), {
    type: 'bar',
    data: {
      labels: topTransporters.map(([t]) => t),
      datasets: [{ label: 'Delays', data: topTransporters.map(([_, c]) => c), backgroundColor: topTransporters.map((_, i) => i === 0 ? C.orange : orangeA(.6)), borderRadius: 6 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { autoSkip: false, maxRotation: 30, font: CF }, grid: { display: false } }, y: { beginAtZero: true, ticks: { font: CF } } }
    }
  });

  // Reason Cards Grid
  const grid = $('reason-cards-grid');
  if (grid) {
    const sortedReasons = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);
    grid.innerHTML = sortedReasons.map(([reason, count], i) => {
      const pct = Math.round(count / total * 100);
      const cat = classifyReason(reason);
      const catLabel = REASON_CATEGORIES[cat]?.label || 'Carrier';
      const severity = pct >= 10 ? 'high' : pct >= 5 ? 'medium' : 'low';
      const sevLabel = pct >= 10 ? 'HIGH' : pct >= 5 ? 'MED' : 'LOW';
      return `
        <div class="reason-card" style="animation-delay:${i * 0.03}s">
          <div class="rc-head"><div class="rc-title">${reason}</div><span class="rc-badge ${severity}">${sevLabel}</span></div>
          <div class="rc-stats"><span><span class="rc-count">${count}</span> orders</span><span class="rc-pct">${pct}% of delays</span></div>
          <div class="rc-progress"><div class="rc-progress-fill" style="width:${Math.min(pct * 3, 100)}%"></div></div>
          <span class="rc-tag">${catLabel}</span>
        </div>
      `;
    }).join('');
  }

  // Recommended Insights
  const list = $('insights-list');
  if (list) {
    const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0];
    const topT = Object.entries(transporterDelays).sort((a, b) => b[1] - a[1])[0];
    const insights = [
      { icon: '01', title: 'Primary Root Cause Intervention', desc: `<strong>${topReason ? topReason[0] : 'Transit Delay'}</strong> accounts for highest delay volume (${topReason ? topReason[1] : 0} orders). Immediate operational priority.` },
      { icon: '02', title: 'Carrier SLA Review', desc: `<strong>${topT ? topT[0] : 'XP INDIA'}</strong> accounts for ${topT ? topT[1] : 0} delayed shipments. SLA escalation recommended.` },
      { icon: '03', title: 'Customer Timings Orchestration', desc: `Customer-side constraints (mall timing restrictions, address verification) represent substantial delay share. Automated pre-dispatch check-in recommended.` }
    ];
    list.innerHTML = insights.map((ins, i) => `
      <div class="insight" style="animation-delay:${i * 0.08}s">
        <div class="insight-icon">${ins.icon}</div>
        <div class="insight-body"><div class="insight-title">${ins.title}</div><div class="insight-desc">${ins.desc}</div></div>
      </div>
    `).join('');
  }
}

// In-Browser Excel / Sheet Uploader
function openUploadModal() {
  const m = $('upload-modal');
  if (m) m.style.display = 'flex';
}
window.openUploadModal = openUploadModal;

function closeUploadModal() {
  const m = $('upload-modal');
  if (m) m.style.display = 'none';
}
window.closeUploadModal = closeUploadModal;

function handleExcelUpload(event) {
  const file = event.target.files?.[0];
  if (!file || typeof XLSX === 'undefined') return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      alert(`Workbook loaded with ${workbook.SheetNames.length} sheets! To permanently sync daily, set your Google Sheet link in GitHub Secrets.`);
      closeUploadModal();
    } catch (err) {
      alert('Error parsing Excel file: ' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}
window.handleExcelUpload = handleExcelUpload;

// Main Initialization: Fetch data/latest_data.json with fallback
async function initDashboard() {
  try {
    const res = await fetch('data/latest_data.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log('Live data loaded from data/latest_data.json:', data.metadata?.reportDate);
    if (data.metadata?.reportDate && $('footer-sync-note')) {
      $('footer-sync-note').textContent = `Auto-synced: ${data.metadata.reportDate}`;
    }
    renderDashboard(data);
  } catch (err) {
    console.warn('Could not fetch data/latest_data.json, loading embedded fallback:', err);
    loadFallbackData();
  }
}

// Embedded Fallback Data (Complete August 31 baseline)
function loadFallbackData() {
  const fallback = {
    metadata: { reportDate: "August 31, 2026", monthName: "August", activeDays: 25, daysInMonth: 31 },
    kpis: {
      openTotal: 714, eddTotal: 234, dueTotal: 69, bookedTotal: 46,
      dailyTonnageKg: 22398.0, monthlyTonnageKg: 534400.0,
      targetRevenue: 8445000, achievedRevenue: 6639200
    },
    clients: [
      { name: "Carrier Refrigeration", person: "Sangeet Dhasmana", target: 293073.0, achieved: 303147.75, activeDays: 25 },
      { name: "Carrier CTD", person: "Deepak Sharma", target: 74460.0, achieved: 78318.92, activeDays: 25 },
      { name: "Bombax", person: "Sangeet Dhasmana", target: 97357.0, achieved: 78666.54, activeDays: 25 },
      { name: "Loom Solar Pvt Ltd", person: "Deepak Sharma", target: 14458.0, achieved: 12575.0, activeDays: 25 },
      { name: "Kumar Services", person: "Deepak Sharma", target: 13725.0, achieved: 11241.6, activeDays: 25 },
      { name: "Sukuga Technologies Pvt Ltd", person: "Deepak Sharma", target: 10142.0, achieved: 8971.87, activeDays: 25 },
      { name: "Haier CCR", person: "Deepak Sharma", target: 36298.0, achieved: 8155.23, activeDays: 25 },
      { name: "Cosmos Pumps Pvt Ltd", person: "Deepak Sharma", target: 11398.0, achieved: 7765.98, activeDays: 25 },
      { name: "Oneiric Appliances Pvt Ltd", person: "Deepak Sharma", target: 15232.0, achieved: 7286.56, activeDays: 25 },
      { name: "Medical Science", person: "Sangeet Dhasmana", target: 6013.75, achieved: 6175.01, activeDays: 25 },
      { name: "Vaidrishi Laboratories Pvt Ltd", person: "Sangeet Dhasmana", target: 2357.0, achieved: 2361.51, activeDays: 25 },
      { name: "Mitras Technocrafts Pvt Ltd-HR", person: "Deepak Sharma", target: 13501.0, achieved: 2211.71, activeDays: 25 },
      { name: "Conficore", person: "Sangeet Dhasmana", target: 5000.0, achieved: 2158.97, activeDays: 25 },
      { name: "Epson", person: "Sangeet Dhasmana", target: 3000.0, achieved: 2125.8, activeDays: 25 },
      { name: "HERCULES NUTRA", person: "Sangeet Dhasmana", target: 10000.0, achieved: 1343.22, activeDays: 25, isNew: true },
      { name: "MEDGLOBE THERAPEUTICS", person: "Sangeet Dhasmana", target: 10000.0, achieved: 1315.98, activeDays: 25, isNew: true },
      { name: "Paramount Surgimed Ltd", person: "Deepak Sharma", target: 12039.0, achieved: 329.97, activeDays: 25 },
      { name: "Khusbhu Enterprises", person: "Deepak Sharma", target: 0, achieved: 251.0, activeDays: 25, isNew: true },
      { name: "Edusoft Healthcare Ltd", person: "Deepak Sharma", target: 3631.0, achieved: 0, activeDays: 25 }
    ],
    openData: [
      { name: "Carrier Refrigeration", count: 304 },
      { name: "Bombax", count: 252 },
      { name: "Carrier CTD", count: 79 },
      { name: "Sukuga Technologies Pvt Ltd", count: 18 },
      { name: "Haier CCR", count: 13 },
      { name: "Medical Science", count: 8 },
      { name: "Oneiric Appliances Pvt Ltd", count: 7 },
      { name: "Kumar Services", count: 7 },
      { name: "Loom Solar Pvt Ltd", count: 6 },
      { name: "Vaidrishi Laboratories Pvt Ltd", count: 4 }
    ],
    eddData: [
      { name: "Carrier Refrigeration", count: 117 },
      { name: "Bombax", count: 60 },
      { name: "Haier CCR", count: 10 },
      { name: "Medical Science", count: 7 },
      { name: "Carrier CTD", count: 7 },
      { name: "Oneiric Appliances Pvt Ltd", count: 6 },
      { name: "Kumar Services", count: 6 },
      { name: "Loom Solar Pvt Ltd", count: 5 }
    ],
    dueData: [
      { name: "Carrier Refrigeration", count: 35 },
      { name: "Bombax", count: 34 },
      { name: "Carrier CTD", count: 25 },
      { name: "Haier CCR", count: 1 }
    ],
    bookedData: [
      { name: "Carrier Refrigeration", count: 45 },
      { name: "Khusbhu Enterprises", count: 1 }
    ],
    dailyTonnageData: [
      { name: "Carrier Refrigeration", kg: 22147 },
      { name: "Khusbhu Enterprises", kg: 251 }
    ],
    eddDetail: [
      { id: "MVS/26-27/12533", name: "Carrier Refrigeration", transporter: "XP INDIA", edd: "30 Aug 2026", reason: "Transit Delay", type: "Vendor" },
      { id: "MVS/26-27/12534", name: "Carrier Refrigeration", transporter: "XP INDIA", edd: "30 Aug 2026", reason: "Transit Delay", type: "Vendor" },
      { id: "MVS/26-27/11861", name: "Bombax", transporter: "EKART", edd: "27 Aug 2026", reason: "Delayed- Mall Delivery Timing Restriction", type: "Customer" },
      { id: "MVS/26-27/11661", name: "Haier CCR", transporter: "DP WORLD", edd: "22 Aug 2026", reason: "Delayed – Route Diversion", type: "Vendor" },
      { id: "MVS/26-27/11747", name: "Loom Solar Pvt Ltd", transporter: "RIVIGO", edd: "26 Aug 2026", reason: "Delayed- Natural Calamity", type: "Vendor" }
    ]
  };
  renderDashboard(fallback);
}

// Start app
document.addEventListener('DOMContentLoaded', initDashboard);
