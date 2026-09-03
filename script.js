/* ═══════════════════════════════════════════════════════════════
   MVIKAS LOGISTICS — Organic Pebble Tablet Studio Engine
   Inspired by Dribbble Ron Design Neumorphic / Soft Minimalist UI
   ═══════════════════════════════════════════════════════════════ */

// Palette: Warm Stone, Soft Porcelain, Electric Orange, Amber Yellow & Slate
const C = {
  orange: '#f58220',
  orangeSoft: 'rgba(245, 130, 32, 0.15)',
  yellow: '#f5be18',
  slate: '#25272b',
  slateSoft: '#e5e3dc',
  stone: '#d2cfc4',
  textDark: '#1e2024',
  textMuted: '#7b7e87',
  cardBg: '#ffffff',
  grid: 'rgba(0, 0, 0, 0.05)'
};
const orangeA = (a) => `rgba(245, 130, 32, ${a})`;

const $ = id => document.getElementById(id);

// Animated counter (count up from 0)
function animateCounter(el, toVal, duration = 900, isFloat = false) {
  if (!el) return;
  const startTime = performance.now();
  const from = 0;
  const tick = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out quart
    const ease = 1 - Math.pow(1 - progress, 4);
    const current = from + (toVal - from) * ease;
    el.textContent = isFloat
      ? current.toFixed(1).toLocaleString('en-IN')
      : Math.round(current).toLocaleString('en-IN');
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = isFloat
      ? toVal.toFixed(1).toLocaleString('en-IN')
      : Math.round(toVal).toLocaleString('en-IN');
  };
  requestAnimationFrame(tick);
}

// Safe Chart.js wrapper
function safeChart(ctx, config) {
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js not loaded — skipping chart render');
    return null;
  }
  if (!ctx) return null;
  try {
    return new Chart(ctx, config);
  } catch (e) {
    console.error('Chart render failed:', e);
    return null;
  }
}

// Chart defaults (Clean Soft Minimalist Palette)
if (typeof Chart !== 'undefined') {
  const CD = Chart.defaults;
  CD.color = C.textMuted;
  CD.font.family = 'Plus Jakarta Sans, -apple-system, sans-serif';
  CD.font.size = 11;
  CD.plugins.tooltip.backgroundColor = C.slate;
  CD.plugins.tooltip.borderColor = 'rgba(255, 255, 255, 0.1)';
  CD.plugins.tooltip.borderWidth = 1;
  CD.plugins.tooltip.padding = 10;
  CD.plugins.tooltip.cornerRadius = 8;
  CD.plugins.tooltip.titleColor = C.orange;
  CD.plugins.tooltip.titleFont = { size: 11, weight: '700' };
  CD.plugins.tooltip.bodyColor = '#ffffff';
  CD.plugins.tooltip.bodyFont = { size: 12, weight: '500' };
  CD.plugins.tooltip.displayColors = false;
  CD.scale.grid.color = C.grid;
  CD.scale.grid.drawBorder = false;
  CD.scale.ticks.color = C.textMuted;
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

// Tab Switching (4 core operational panels)
function switchTab(id, btn) {
  document.querySelectorAll('.pill-tab').forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
  });
  document.querySelectorAll('.studio-panel').forEach(p => p.classList.remove('active'));

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
const CF = { size: 11, weight: '600' };

// Global Data State
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

// Main Dashboard Render
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

  // Enrich clients
  clients.forEach(c => {
    c.pct = c.target > 0 ? Math.round(c.achieved / c.target * 100) : (c.achieved > 0 ? 999 : 0);
    c.avgDay = c.activeDays > 0 ? Math.round(c.achieved / c.activeDays) : 0;
    c.remaining = Math.max((c.target || 0) - c.achieved, 0);
    c.daysNeeded = c.avgDay > 0 && c.remaining > 0 ? +(c.remaining / c.avgDay).toFixed(1) : (c.remaining === 0 ? 0 : 999);
  });

  // Header Report Date & Elapsed Days
  if ($('header-report-date') && data.metadata?.reportDate) {
    $('header-report-date').textContent = data.metadata.reportDate;
  }
  if ($('header-elapsed-days')) {
    $('header-elapsed-days').textContent = `Day ${activeDays}/${daysInMonth}`;
  }

  // Populate Executive Overview Telemetry
  if ($('kpi-open')) $('kpi-open').textContent = openTotal.toLocaleString('en-IN');
  if ($('kpi-edd')) $('kpi-edd').textContent = eddTotal.toLocaleString('en-IN');
  if ($('kpi-edd-pct')) $('kpi-edd-pct').textContent = Math.round(eddTotal / openTotal * 100) + '% of open';
  if ($('kpi-due')) $('kpi-due').textContent = dueTotal.toLocaleString('en-IN');
  if ($('kpi-booked')) $('kpi-booked').textContent = bookedTotal.toLocaleString('en-IN');
  if ($('kpi-daily-avg')) $('kpi-daily-avg').innerHTML = Math.round(dailyAverage).toLocaleString('en-IN') + ' <small>kg/day</small>';
  if ($('kpi-month-ton')) $('kpi-month-ton').innerHTML = (monthlyTotal / 1000).toFixed(1) + 'k <small>kg</small>';
  if ($('kpi-sales-money')) $('kpi-sales-money').innerHTML = '₹' + (totalSalesMoney / 100000).toFixed(2) + 'L <small>/ ' + '₹' + (totalTargetMoney / 100000).toFixed(2) + 'L</small>';

  // Tab Badge
  if ($('tab-edd-badge')) $('tab-edd-badge').textContent = eddTotal;

  // Milestone Flow Strips
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
      otb.innerHTML += `<tr>
        <td style="color:${C.textMuted};font-family:monospace;font-weight:600">${String(i + 1).padStart(2, '0')}</td>
        <td><strong>${d.name}</strong></td>
        <td>${d.count}</td>
        <td style="color:${C.orange};font-weight:700">${ec}</td>
        <td style="color:${C.textDark};font-weight:600">${dc}</td>
        <td style="color:${pct >= 50 ? C.orange : C.textDark};font-weight:700">${pct}%</td>
        <td><span class="badge ${risk[1]}">${risk[0]}</span></td>
      </tr>`;
    });
  }

  // Classification Charts
  chartInstances.statusDonut = safeChart($('statusDonut'), {
    type: 'doughnut',
    data: {
      labels: ['EDD Crossed', 'In Transit', 'Due Tomorrow', 'Booked'],
      datasets: [{
        data: [eddTotal, openTotal - eddTotal, dueTotal, bookedTotal],
        backgroundColor: [C.orange, C.slate, C.yellow, C.stone],
        borderWidth: 3, borderColor: '#ffffff', hoverOffset: 8
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '72%',
      animation: { animateRotate: true, duration: 1000, easing: 'easeOutQuart' },
      plugins: { legend: { display: false } }
    }
  });

  chartInstances.eddBarChart = safeChart($('eddBarChart'), {
    type: 'bar',
    data: {
      labels: eddData.map(d => d.name),
      datasets: [{ label: 'EDD Crossed', data: eddData.map(d => d.count), backgroundColor: C.orange, borderRadius: 6 }]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: { duration: 1000 },
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, ticks: { font: CF } }, y: { ticks: { font: CF }, grid: { display: false } } }
    }
  });

  chartInstances.dueTmrChart = safeChart($('dueTmrChart'), {
    type: 'bar',
    data: { labels: dueData.map(d => d.name), datasets: [{ label: 'Due', data: dueData.map(d => d.count), backgroundColor: C.yellow, borderRadius: 6 }] },
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: 1000 },
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { autoSkip: false, maxRotation: 30, font: CF }, grid: { display: false } }, y: { beginAtZero: true } }
    }
  });

  chartInstances.bookedChart = safeChart($('bookedChart'), {
    type: 'bar',
    data: { labels: bookedData.map(d => d.name), datasets: [{ label: 'Booked', data: bookedData.map(d => d.count), backgroundColor: C.slate, borderRadius: 6 }] },
    options: {
      responsive: true, maintainAspectRatio: false, animation: { duration: 1000 },
      plugins: { legend: { display: false } },
      scales: { x: { ticks: { autoSkip: false, maxRotation: 30, font: CF }, grid: { display: false } }, y: { beginAtZero: true } }
    }
  });

  // Tonnage Section
  renderSlabSummary(clients);
  renderForecast(totalTargetMoney, totalSalesMoney, predictedSales, predictedPct, activeDays, daysInMonth);
  renderTonnageBars();
  renderTonnageCharts();
  renderKamSummary();

  // Animate KPI counters
  setTimeout(() => {
    animateCounter($('kpi-open'), openTotal, 800);
    animateCounter($('kpi-edd'), eddTotal, 800);
    animateCounter($('kpi-due'), dueTotal, 700);
    animateCounter($('kpi-booked'), bookedTotal, 700);
  }, 100);

  // Daily Section
  renderDailyTable(clients);

  // EDD Section
  populateEddFilterOptions(eddDetail);
  renderEddRows(eddDetail);
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
      badge.textContent = 'ON TRACK'; badge.className = 'pill-tag good';
      vt.textContent = `Projected ${Math.round(predictedPct)}% — surplus ${fR(predictedSales - targetMoney)}`;
    } else if (border) {
      badge.textContent = 'BORDERLINE'; badge.className = 'pill-tag warn';
      vt.textContent = `Projected ${Math.round(predictedPct)}% — shortfall ${fR(targetMoney - predictedSales)}`;
    } else {
      badge.textContent = 'AT RISK'; badge.className = 'pill-tag bad';
      vt.textContent = `Projected ${Math.round(predictedPct)}% — shortfall ${fR(targetMoney - predictedSales)}`;
    }
  }

  const max = Math.max(targetMoney, predictedSales, 1);
  if ($('forecast-bar-fill')) $('forecast-bar-fill').style.width = Math.min(predictedSales / max * 100, 100) + '%';
  if ($('forecast-bar-target-marker')) $('forecast-bar-target-marker').style.left = Math.min(targetMoney / max * 100, 100) + '%';
  if ($('forecast-bar-target-label')) $('forecast-bar-target-label').textContent = 'Target: ' + fR(targetMoney);
  if ($('forecast-explain')) $('forecast-explain').innerHTML = `<strong>Projection Logic:</strong> (Sales ÷ ${activeDays} active days) × ${daysInMonth} total days.`;
}

// Tonnage Period Logic
const PL = { full: 'Tonnage — % Completion', first10: 'First 10 Days', mid10: 'Mid 10 Days', last10: 'Last 10 Days' };
const PS = { full: 'Full Month', first10: 'First 10 Days', mid10: 'Mid 10 Days', last10: 'Last 10 Days' };
let curPeriod = 'full';

function bucketColor(pct) {
  if (pct === null || pct === undefined) return '#c2beb4';
  if (pct >= 80) return C.orange;
  if (pct >= 50) return C.yellow;
  return '#949187';
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

// 10-Day Slab Summary Strip
function renderSlabSummary(clients) {
  const periods = ['first10', 'mid10', 'last10'];
  periods.forEach(p => {
    let totalTarget = 0, totalAchieved = 0;
    clients.forEach(c => {
      const pd = c.periods && c.periods[p];
      if (pd) {
        totalTarget += pd.target || 0;
        totalAchieved += pd.achieved || 0;
      }
    });
    const pct = totalTarget > 0 ? Math.round(totalAchieved / totalTarget * 100) : null;
    const pctText = pct !== null ? pct + '%' : '—';
    const barW = pct !== null ? Math.min(pct, 100) : 0;

    const elPct = $('slab-pct-' + p);
    const elTarget = $('slab-target-' + p);
    const elAchieved = $('slab-achieved-' + p);
    const elBar = $('slab-bar-' + p);

    if (elPct) elPct.textContent = pctText;
    if (elPct) elPct.style.color = pct !== null && pct >= 80 ? '#f58220' : pct !== null && pct >= 50 ? '#f5be18' : '#949187';
    if (elTarget) elTarget.textContent = totalTarget > 0 ? fK(Math.round(totalTarget)) + ' kg' : '—';
    if (elAchieved) elAchieved.textContent = totalAchieved > 0 ? fK(Math.round(totalAchieved)) + ' kg' : '—';

    // Animate bar fill
    if (elBar) {
      elBar.style.width = '0';
      setTimeout(() => { elBar.style.width = barW + '%'; }, 200);
    }

    // Wire click to period filter
    const slabCard = $('slab-' + p);
    if (slabCard) {
      slabCard.onclick = () => {
        const sel = $('tonnage-period-filter');
        if (sel) sel.value = p;
        setTonnagePeriod(p);
        // Highlight active slab
        document.querySelectorAll('.slab-card').forEach(c => c.classList.remove('active-slab'));
        slabCard.classList.add('active-slab');
      };
    }
  });
}
window.renderSlabSummary = renderSlabSummary;

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

  if (!wd.length) { el.innerHTML = '<div style="padding:24px;text-align:center;color:#888">No tonnage data for this period.</div>'; return; }

  el.innerHTML = wd.map(({ c, achieved, target }) => {
    const ht = target > 0, ha = achieved > 0;
    let pct = null;
    if (ht) pct = ha ? Math.round(achieved / target * 100) : 0;
    const dp = pct !== null ? Math.min(pct, 100) : 100;
    const nc = bucketColor(pct);
    const pl = pct !== null ? pct + '%' : '—';
    const nt = c.isNew ? '<span class="badge open" style="margin-left:6px;font-size:0.6rem">New</span>' : '';
    const glowClass = (pct !== null && pct >= 80) ? ' glow-bar' : '';
    let ta;
    if (ht && ha) ta = fK(achieved) + ' / ' + fK(target) + ` <span style="color:${C.textMuted}">kg</span>`;
    else if (ht && !ha) ta = '0 / ' + fK(target) + ` <span style="color:${C.textMuted}">kg</span>`;
    else ta = fK(achieved) + ` <span style="color:${C.textMuted}">kg</span>`;
    const r = rate(c.name);
    const vl = ha ? `<div class="value-badge"><span class="value-amount">${fR(achieved * r)}</span> <span style="color:${C.textMuted}">@₹${r}/kg</span></div>` : '';
    return `<div class="client-row">
      <div class="client-name" title="${c.name}"><span class="client-name-text">${c.name}</span>${nt}</div>
      <div class="client-person">${c.person}</div>
      <div class="prog-bar-wrap"><div class="prog-bar${glowClass}" style="width:${dp}%;background:${nc}"></div></div>
      <div class="pct-text" style="color:${nc}">${pl}</div>
      <div class="client-tonnage"><div>${ta}</div>${vl}</div>
    </div>`;
  }).join('');
}

const tl = $('tonnage-legend');
if (tl) tl.innerHTML = [['0–50%', '#949187'], ['50–80%', C.yellow], ['80%+', C.orange]].map(([l, c]) => `<span><span class="legend-dot" style="background:${c}"></span>${l}</span>`).join('') + '<span><span class="badge open" style="margin-left:0;font-size:0.62rem">New</span> onboarded</span>';

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
        { label: 'Target', data: top.map(r => r.target), backgroundColor: C.slate, borderRadius: 6 },
        { label: 'Achieved', data: top.map(r => r.achieved), backgroundColor: C.orange, borderRadius: 6 }
      ]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: { duration: 1000 },
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 14, font: CF, color: C.textDark } }, title: { display: true, text: 'Target vs Achieved — ' + PS[curPeriod], font: { size: 11, weight: '700' }, color: C.textMuted, padding: { bottom: 16 } } },
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
    body.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#888;padding:24px">No KAM data.</td></tr>`;
    return;
  }
  body.innerHTML = kl.map(k => {
    const p = k.tt > 0 ? Math.round(k.ta / k.tt * 100) : null;
    const pc = p === null ? C.textMuted : bucketColor(p);
    return `<tr>
      <td style="font-weight:700;color:${C.textDark}">${k.person}</td>
      <td>${k.tt > 0 ? fK(k.tt) : '—'}</td>
      <td style="color:${C.textDark};font-weight:600">${fK(k.ta)}</td>
      <td style="color:${pc};font-weight:800">${p !== null ? p + '%' : '—'}</td>
    </tr>`;
  }).join('');

  const totalTarget = kl.reduce((s, k) => s + k.tt, 0);
  const totalAchieved = kl.reduce((s, k) => s + k.ta, 0);
  const totalPct = totalTarget > 0 ? (totalAchieved / totalTarget * 100) : null;
  if ($('kam-total-target')) $('kam-total-target').textContent = fK(totalTarget);
  if ($('kam-total-achieved')) $('kam-total-achieved').textContent = fK(totalAchieved);
  if ($('kam-total-pct')) $('kam-total-pct').textContent = totalPct !== null ? totalPct.toFixed(2) + '%' : '—';
}

// Daily Table
function renderDailyTable(clients) {
  const dtb = $('daily-table-body');
  if (dtb) {
    dtb.innerHTML = '';
    clients.filter(c => c.achieved > 0).forEach(c => {
      const pct = c.target > 0 ? Math.round(c.achieved / c.target * 100) + '%' : '—';
      const pc = c.target > 0 ? (c.achieved >= c.target ? C.orange : C.textDark) : C.textMuted;
      const rem = c.target > 0 ? Math.max(c.target - c.achieved, 0).toLocaleString('en-IN') : '—';
      const df = c.target > 0 && c.avgDay > 0 && c.remaining > 0 ? +(c.remaining / c.avgDay).toFixed(1) : (c.target > 0 && c.remaining === 0 ? '✓' : '—');
      dtb.innerHTML += `<tr>
        <td style="font-weight:700;color:${C.textDark}">${c.name}</td>
        <td style="font-size:0.75rem;color:${C.textMuted}">${c.person}</td>
        <td>${c.target > 0 ? c.target.toLocaleString('en-IN') : '—'}</td>
        <td style="color:${C.textDark};font-weight:700">${c.achieved.toLocaleString('en-IN')}</td>
        <td style="color:${pc};font-weight:800">${pct}</td>
        <td>${c.activeDays}</td>
        <td>${c.avgDay.toLocaleString('en-IN')}</td>
        <td style="color:${C.textMuted}">${rem}</td>
        <td style="color:${C.orange};font-weight:800">${df}</td>
      </tr>`;
    });
  }

  const topAvg = clients.filter(c => c.avgDay > 0).sort((a, b) => b.avgDay - a.avgDay).slice(0, 10);
  chartInstances.avgDayChart = safeChart($('avgDayChart'), {
    type: 'bar',
    data: { labels: topAvg.map(c => c.name), datasets: [{ label: 'Avg kg/day', data: topAvg.map(c => c.avgDay), backgroundColor: C.orange, borderRadius: 6 }] },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: { duration: 1000 },
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, ticks: { callback: v => v.toLocaleString('en-IN'), font: CF } }, y: { ticks: { font: CF }, grid: { display: false } } }
    }
  });

  const dc = $('daysChart');
  if (dc) {
    const dd = clients.filter(c => c.target > 0 && c.avgDay > 0 && c.remaining > 0).sort((a, b) => b.daysNeeded - a.daysNeeded).slice(0, 10);
    chartInstances.daysChart = safeChart(dc, {
      type: 'bar',
      data: { labels: dd.map(c => c.name), datasets: [{ label: 'Days', data: dd.map(c => c.daysNeeded), backgroundColor: dd.map(c => c.daysNeeded > 18 ? C.orange : C.slate), borderRadius: 6 }] },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false, animation: { duration: 1000 },
        plugins: { legend: { display: false }, title: { display: true, text: 'Estimated days at current run-rate', font: { size: 11, weight: '700' }, color: C.textMuted, padding: { bottom: 16 } } },
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
    return `<div class="reason-bar-item">
      <div class="reason-bar-header"><span title="${r}">${r}</span><span>${p}% (${c})</span></div>
      <div class="reason-progress-bg"><div class="reason-progress-fill" style="width:${p}%"></div></div>
    </div>`;
  }).join('');
}

function renderEddRows(rows) {
  const tbody = $('edd-detail-body'), cnt = $('edd-detail-count');
  if (!tbody || !APP_DATA) return;
  const eddDetail = APP_DATA.eddDetail || [];
  if (cnt) cnt.textContent = rows.length + ' of ' + eddDetail.length + ' orders';
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:${C.textMuted};padding:32px">No matching orders found.</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(r => {
    const typeBadge = r.type === 'Customer' ? `<span class="cv-chip cv-chip-customer">Customer</span>`
      : r.type === 'Vendor' ? `<span class="cv-chip cv-chip-vendor">Vendor</span>`
        : `<span class="cv-chip cv-chip-unclassified">—</span>`;
    return `<tr>
      <td style="font-weight:700;font-family:monospace;font-size:0.75rem;color:${C.orange}">${r.id}</td>
      <td><strong>${r.name}</strong></td>
      <td>${typeBadge}</td>
      <td>${r.transporter || '—'}</td>
      <td style="color:${C.textDark};font-weight:600">${r.edd || '—'}</td>
      <td>${r.reason || `<span style="color:${C.textMuted};font-style:italic">Transit Delay</span>`}</td>
    </tr>`;
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
      opt.textContent = v.length > 50 ? v.slice(0, 48) + '…' : v;
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

// In-Browser Upload Modal
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

// Main Initialization: Use window.DASHBOARD_DATA (from data/latest_data.js) or fetch data/latest_data.json
async function initDashboard() {
  if (window.DASHBOARD_DATA) {
    console.log('Using window.DASHBOARD_DATA (loaded directly via script tag):', window.DASHBOARD_DATA.metadata?.reportDate);
    renderDashboard(window.DASHBOARD_DATA);
    return;
  }
  try {
    const res = await fetch('data/latest_data.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(HTTP );
    const data = await res.json();
    console.log('Live data loaded from data/latest_data.json:', data.metadata?.reportDate);
    renderDashboard(data);
  } catch (err) {
    console.warn('Could not fetch data/latest_data.json, loading embedded fallback:', err);
    loadFallbackData();
  }
}

// Embedded Fallback Data (August 31 baseline with full 10-day slabs)
function loadFallbackData() {
  if (window.DASHBOARD_DATA) {
    renderDashboard(window.DASHBOARD_DATA);
    return;
  }
  const fallback = {
  "metadata": {
    "generatedAt": "2026-09-03T16:22:45.921216",
    "sourceName": "August MVLOAD.xlsx",
    "reportDate": "August 31, 2026",
    "monthName": "August",
    "year": 2026,
    "activeDays": 25,
    "daysInMonth": 31
  },
  "kpis": {
    "openTotal": 714,
    "eddTotal": 234,
    "eddPct": 33,
    "dueTotal": 99,
    "bookedTotal": 46,
    "dailyTonnageKg": 22398.0,
    "monthlyTonnageKg": 564050.66,
    "dailyAvgKg": 22562,
    "targetRevenue": 8445000.0,
    "achievedRevenue": 7016697.18,
    "predictedRevenue": 8420036.62,
    "predictedPct": 99.7
  },
  "clients": [
    {
      "name": "Carrier Refrigeration",
      "person": "Sangeet Dhasmana",
      "target": 293073.0,
      "achieved": 317027.86,
      "activeDays": 25,
      "periods": {
        "first10": {
          "target": 80206.0,
          "achieved": 97073.34
        },
        "mid10": {
          "target": 82701.0,
          "achieved": 72784.43
        },
        "last10": {
          "target": 130166.0,
          "achieved": 147686.88
        }
      },
      "pct": 108,
      "avgDay": 12681,
      "remaining": 0,
      "daysNeeded": 0
    },
    {
      "name": "Carrier CTD",
      "person": "Deepak Sharma",
      "target": 74460.0,
      "achieved": 85335.06,
      "activeDays": 25,
      "periods": {
        "first10": {
          "target": 25101.0,
          "achieved": 26498.34
        },
        "mid10": {
          "target": 25010.0,
          "achieved": 34742.62
        },
        "last10": {
          "target": 24349.0,
          "achieved": 23524.77
        }
      },
      "pct": 115,
      "avgDay": 3413,
      "remaining": 0,
      "daysNeeded": 0
    },
    {
      "name": "Mitras Technocrafts Pvt Ltd-HR",
      "person": "Deepak Sharma",
      "target": 13501.0,
      "achieved": 2211.71,
      "activeDays": 25,
      "periods": {
        "first10": {
          "target": 3776.0,
          "achieved": 501.98
        },
        "mid10": {
          "target": 3861.0,
          "achieved": 1313.73
        },
        "last10": {
          "target": 5864.0,
          "achieved": 396.0
        }
      },
      "pct": 16,
      "avgDay": 88,
      "remaining": 11289.29,
      "daysNeeded": 128.3
    },
    {
      "name": "Paramount Surgimed Ltd",
      "person": "Deepak Sharma",
      "target": 12039.0,
      "achieved": 329.97,
      "activeDays": 25,
      "periods": {
        "first10": {
          "target": 722.0,
          "achieved": null
        },
        "mid10": {
          "target": 2366.0,
          "achieved": 329.97
        },
        "last10": {
          "target": 8951.0,
          "achieved": null
        }
      },
      "pct": 3,
      "avgDay": 13,
      "remaining": 11709.03,
      "daysNeeded": 900.7
    },
    {
      "name": "Haier CCR",
      "person": "Deepak Sharma",
      "target": 36298.0,
      "achieved": 8267.23,
      "activeDays": 25,
      "periods": {
        "first10": {
          "target": 18946.0,
          "achieved": 2910.89
        },
        "mid10": {
          "target": 8955.0,
          "achieved": 2388.67
        },
        "last10": {
          "target": 8397.0,
          "achieved": 2927.03
        }
      },
      "pct": 23,
      "avgDay": 331,
      "remaining": 28030.77,
      "daysNeeded": 84.7
    },
    {
      "name": "Bombax",
      "person": "Sangeet Dhasmana",
      "target": 97357.0,
      "achieved": 79884.77,
      "activeDays": 25,
      "periods": {
        "first10": {
          "target": 30657.0,
          "achieved": 29217.84
        },
        "mid10": {
          "target": 35146.0,
          "achieved": 19763.48
        },
        "last10": {
          "target": 31554.0,
          "achieved": 30691.51
        }
      },
      "pct": 82,
      "avgDay": 3195,
      "remaining": 17472.229999999996,
      "daysNeeded": 5.5
    },
    {
      "name": "Kumar Services",
      "person": "Deepak Sharma",
      "target": 13725.0,
      "achieved": 13763.6,
      "activeDays": 25,
      "periods": {
        "first10": {
          "target": 4345.0,
          "achieved": 128.0
        },
        "mid10": {
          "target": 5022.0,
          "achieved": 5049.14
        },
        "last10": {
          "target": 4358.0,
          "achieved": 7307.49
        }
      },
      "pct": 100,
      "avgDay": 551,
      "remaining": 0,
      "daysNeeded": 0
    },
    {
      "name": "Edusoft Healthcare Ltd",
      "person": "Deepak Sharma",
      "target": 3631.0,
      "achieved": 0.0,
      "activeDays": 25,
      "periods": {
        "first10": {
          "target": 2905.0,
          "achieved": null
        },
        "mid10": {
          "target": 726.0,
          "achieved": null
        },
        "last10": {
          "target": 0.0,
          "achieved": null
        }
      },
      "pct": 0,
      "avgDay": 0,
      "remaining": 3631.0,
      "daysNeeded": 999
    },
    {
      "name": "Oneiric Appliances Pvt Ltd",
      "person": "Deepak Sharma",
      "target": 15232.0,
      "achieved": 8256.55,
      "activeDays": 25,
      "periods": {
        "first10": {
          "target": 7019.0,
          "achieved": 564.01
        },
        "mid10": {
          "target": 3241.0,
          "achieved": 4110.89
        },
        "last10": {
          "target": 4972.0,
          "achieved": 3581.65
        }
      },
      "pct": 54,
      "avgDay": 330,
      "remaining": 6975.450000000001,
      "daysNeeded": 21.1
    },
    {
      "name": "Vaidrishi Laboratories Pvt Ltd",
      "person": "Sangeet Dhasmana",
      "target": 2357.0,
      "achieved": 2361.51,
      "activeDays": 25,
      "periods": {
        "first10": {
          "target": 534.0,
          "achieved": 1015.3
        },
        "mid10": {
          "target": 691.0,
          "achieved": 422.01
        },
        "last10": {
          "target": 1132.0,
          "achieved": 924.2
        }
      },
      "pct": 100,
      "avgDay": 94,
      "remaining": 0,
      "daysNeeded": 0
    },
    {
      "name": "Sukuga Technologies Pvt Ltd",
      "person": "Deepak Sharma",
      "target": 10142.0,
      "achieved": 11469.4,
      "activeDays": 25,
      "periods": {
        "first10": {
          "target": 1797.0,
          "achieved": 1586.86
        },
        "mid10": {
          "target": 3759.0,
          "achieved": 1564.06
        },
        "last10": {
          "target": 4586.0,
          "achieved": 8318.48
        }
      },
      "pct": 113,
      "avgDay": 459,
      "remaining": 0,
      "daysNeeded": 0
    },
    {
      "name": "Cosmos Pumps Pvt Ltd",
      "person": "Deepak Sharma",
      "target": 11398.0,
      "achieved": 8565.98,
      "activeDays": 25,
      "periods": {
        "first10": {
          "target": 4689.0,
          "achieved": 4325.0
        },
        "mid10": {
          "target": 3344.0,
          "achieved": 1195.98
        },
        "last10": {
          "target": 3365.0,
          "achieved": 3045.0
        }
      },
      "pct": 75,
      "avgDay": 343,
      "remaining": 2832.0200000000004,
      "daysNeeded": 8.3
    },
    {
      "name": "Loom Solar Pvt Ltd",
      "person": "Deepak Sharma",
      "target": 14458.0,
      "achieved": 12475.0,
      "activeDays": 25,
      "periods": {
        "first10": {
          "target": 3075.0,
          "achieved": 4035.0
        },
        "mid10": {
          "target": 5637.0,
          "achieved": 7190.0
        },
        "last10": {
          "target": 5746.0,
          "achieved": 1350.0
        }
      },
      "pct": 86,
      "avgDay": 499,
      "remaining": 1983.0,
      "daysNeeded": 4.0
    },
    {
      "name": "Medical Science",
      "person": "Sangeet Dhasmana",
      "target": 6013.75,
      "achieved": 6907.05,
      "activeDays": 25,
      "periods": {
        "first10": {
          "target": 0.0,
          "achieved": 2735.02
        },
        "mid10": {
          "target": 1324.48,
          "achieved": 526.0
        },
        "last10": {
          "target": 4689.52,
          "achieved": 3645.4
        }
      },
      "pct": 115,
      "avgDay": 276,
      "remaining": 0,
      "daysNeeded": 0
    },
    {
      "name": "Epson",
      "person": "Sangeet Dhasmana",
      "target": 3000.0,
      "achieved": 2125.8,
      "activeDays": 25,
      "periods": {
        "first10": {
          "target": 1444.0,
          "achieved": 290.0
        },
        "mid10": {
          "target": 1148.0,
          "achieved": 1797.8
        },
        "last10": {
          "target": 408.0,
          "achieved": 38.0
        }
      },
      "pct": 71,
      "avgDay": 85,
      "remaining": 874.1999999999998,
      "daysNeeded": 10.3
    },
    {
      "name": "Conficore",
      "person": "Sangeet Dhasmana",
      "target": 5000.0,
      "achieved": 2158.97,
      "activeDays": 25,
      "periods": {
        "first10": {
          "target": 5000.0,
          "achieved": 1893.0
        },
        "mid10": {
          "target": 0.0,
          "achieved": null
        },
        "last10": {
          "target": 0.0,
          "achieved": 265.97
        }
      },
      "pct": 43,
      "avgDay": 86,
      "remaining": 2841.03,
      "daysNeeded": 33.0
    },
    {
      "name": "HERCULES NUTRA",
      "person": "Sangeet Dhasmana",
      "target": 10000.0,
      "achieved": 1343.22,
      "activeDays": 25,
      "periods": {
        "first10": {
          "target": 3333.33,
          "achieved": null
        },
        "mid10": {
          "target": 3333.0,
          "achieved": 342.93
        },
        "last10": {
          "target": 3334.0,
          "achieved": 1000.29
        }
      },
      "pct": 13,
      "avgDay": 54,
      "remaining": 8656.78,
      "daysNeeded": 160.3
    },
    {
      "name": "MEDGLOBE THERAPEUTICS",
      "person": "Sangeet Dhasmana",
      "target": 10000.0,
      "achieved": 1315.98,
      "activeDays": 25,
      "periods": {
        "first10": {
          "target": 3333.33,
          "achieved": null
        },
        "mid10": {
          "target": 3333.0,
          "achieved": 420.8
        },
        "last10": {
          "target": 3334.0,
          "achieved": 895.18
        }
      },
      "pct": 13,
      "avgDay": 53,
      "remaining": 8684.02,
      "daysNeeded": 163.8
    },
    {
      "name": "Khusbhu Enterprises",
      "person": "Deepak Sharma",
      "target": 0.0,
      "achieved": 251.0,
      "activeDays": 25,
      "periods": {
        "first10": {
          "target": 0.0,
          "achieved": null
        },
        "mid10": {
          "target": 0.0,
          "achieved": null
        },
        "last10": {
          "target": 0.0,
          "achieved": 251.0
        }
      },
      "pct": 999,
      "avgDay": 10,
      "remaining": 0,
      "daysNeeded": 0
    }
  ],
  "openData": [
    {
      "name": "Carrier Refrigeration",
      "count": 304
    },
    {
      "name": "Bombax",
      "count": 252
    },
    {
      "name": "Carrier CTD",
      "count": 79
    },
    {
      "name": "Sukuga Technologies Pvt Ltd",
      "count": 18
    },
    {
      "name": "Haier CCR",
      "count": 13
    },
    {
      "name": "Medical Science",
      "count": 8
    },
    {
      "name": "Oneiric Appliances Pvt Ltd",
      "count": 7
    },
    {
      "name": "Kumar Services",
      "count": 7
    },
    {
      "name": "Loom Solar Pvt Ltd",
      "count": 6
    },
    {
      "name": "Vaidrishi Laboratories Pvt Ltd",
      "count": 4
    },
    {
      "name": "HERCULES NUTRA",
      "count": 3
    },
    {
      "name": "Cosmos Pumps Pvt Ltd",
      "count": 3
    },
    {
      "name": "MEDGLOBE THERAPEUTICS",
      "count": 3
    },
    {
      "name": "Epson",
      "count": 3
    },
    {
      "name": "Mitras Technocrafts Pvt Ltd-HR",
      "count": 2
    },
    {
      "name": "Conficore",
      "count": 1
    },
    {
      "name": "Khusbhu Enterprises",
      "count": 1
    }
  ],
  "eddData": [
    {
      "name": "Carrier Refrigeration",
      "count": 117
    },
    {
      "name": "Bombax",
      "count": 60
    },
    {
      "name": "Haier CCR",
      "count": 10
    },
    {
      "name": "Medical Science",
      "count": 7
    },
    {
      "name": "Carrier CTD",
      "count": 7
    },
    {
      "name": "Oneiric Appliances Pvt Ltd",
      "count": 6
    },
    {
      "name": "Kumar Services",
      "count": 6
    },
    {
      "name": "Loom Solar Pvt Ltd",
      "count": 5
    },
    {
      "name": "Epson",
      "count": 5
    },
    {
      "name": "HERCULES NUTRA",
      "count": 3
    },
    {
      "name": "Mitras Technocrafts Pvt Ltd-HR",
      "count": 2
    },
    {
      "name": "Cosmos Pumps Pvt Ltd",
      "count": 2
    },
    {
      "name": "MEDGLOBE THERAPEUTICS",
      "count": 2
    },
    {
      "name": "Conficore",
      "count": 1
    },
    {
      "name": "Vaidrishi Laboratories Pvt Ltd",
      "count": 1
    }
  ],
  "dueData": [
    {
      "name": "Carrier Refrigeration",
      "count": 35
    },
    {
      "name": "Bombax",
      "count": 34
    },
    {
      "name": "Carrier CTD",
      "count": 25
    },
    {
      "name": "Haier CCR",
      "count": 1
    },
    {
      "name": "Medical Science",
      "count": 1
    },
    {
      "name": "Vaidrishi Laboratories Pvt Ltd",
      "count": 1
    },
    {
      "name": "Sukuga Technologies Pvt Ltd",
      "count": 1
    },
    {
      "name": "Kumar Services",
      "count": 1
    }
  ],
  "bookedData": [
    {
      "name": "Carrier Refrigeration",
      "count": 45
    },
    {
      "name": "Khusbhu Enterprises",
      "count": 1
    }
  ],
  "dailyTonnageData": [
    {
      "name": "Carrier Refrigeration",
      "kg": 22147.0
    },
    {
      "name": "Khusbhu Enterprises",
      "kg": 251.0
    }
  ],
  "eddDetail": [
    {
      "id": "MVS/26-27/1304",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "28 Apr 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/2679",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "17 May 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/2680",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "19 May 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/2684",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "17 May 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/2694",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "19 May 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/2698",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "19 May 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/2900",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "22 May 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/3032",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "23 May 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/4080",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "02 Jun 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/6675",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "06 Jul 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/7560",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "17 Jul 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/9134",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "31 Jul 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/9141",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "29 Jul 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/9627",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "01 Aug 2026",
      "reason": "Spotlight : Heavy rain in Delhi & NCR",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/9769",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "05 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/9798",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "03 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/10006",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "05 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/10082",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "06 Aug 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/10242",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "08 Aug 2026",
      "reason": "Partial Shipment Delivery Remaining 1 Box Intransi...",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/10267",
      "name": "Mitras Technocrafts Pvt Ltd-HR",
      "transporter": "EKART",
      "edd": "04 Aug 2026",
      "reason": "Hold by consignor due to address issue",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/10337",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "08 Aug 2026",
      "reason": "Spotlight; Operational Challenges Due to Onam Traf...",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/10509",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "11 Aug 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/10513",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "11 Aug 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/10533",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "11 Aug 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/10635",
      "name": "Bombax",
      "transporter": "DP WORLD",
      "edd": "11 Aug 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/10660",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "12 Aug 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/10827",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "13 Aug 2026",
      "reason": "On Hold – DEPS",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/10833",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "13 Aug 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/10834",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "13 Aug 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/10904",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "12 Aug 2026",
      "reason": "Connection affected due to Kawad Yatra",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/10909",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "09 Aug 2026",
      "reason": "Refused by consignee",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/10932",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "12 Aug 2026",
      "reason": "Delayed - Need Contact No.",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/10938",
      "name": "Oneiric Appliances Pvt Ltd",
      "transporter": "DP WORLD",
      "edd": "11 Aug 2026",
      "reason": "On Hold – Refused By Consignee",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/10984",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "11 Aug 2026",
      "reason": "Connection Delayed from Gurugram",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/10986",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "13 Aug 2026",
      "reason": "Connection affected due to Kawad Yatra",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11053",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "15 Aug 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11080",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "14 Aug 2026",
      "reason": "Connection affected due to Kawad Yatra",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11207",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "16 Aug 2026",
      "reason": "Address Not Reachable/ Traceable",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11282",
      "name": "Oneiric Appliances Pvt Ltd",
      "transporter": "GATI",
      "edd": "17 Aug 2026",
      "reason": "Delayed - Interchange shipment",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11293",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "19 Aug 2026",
      "reason": "Delayed – Operational Backlog",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11302",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "17 Aug 2026",
      "reason": "Delayed-Required Contact/ Mall Delivery",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11303",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "17 Aug 2026",
      "reason": "Delayed-Required Contact/ Mall Delivery",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11386",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "17 Aug 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11429",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "17 Aug 2026",
      "reason": "address issue",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11512",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "21 Aug 2026",
      "reason": "Delayed – Address Verification Required",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11560",
      "name": "Loom Solar Pvt Ltd",
      "transporter": "DP World",
      "edd": "23 Aug 2026",
      "reason": "Delayed in Hub Transit",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11579",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "19 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11631",
      "name": "Bombax",
      "transporter": "DP WORLD",
      "edd": "24 Aug 2026",
      "reason": "Delayed-Required Contact/ Mall Delivery",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11632",
      "name": "Bombax",
      "transporter": "DP WORLD",
      "edd": "23 Aug 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11661",
      "name": "Haier CCR",
      "transporter": "DP WORLD",
      "edd": "22 Aug 2026",
      "reason": "Delayed – Route Diversion",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11686",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "25 Aug 2026",
      "reason": "Customer Permises is closed",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11689",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "25 Aug 2026",
      "reason": "Customer Permises is closed",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11692",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "24 Aug 2026",
      "reason": "Mathadi charges issue",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11707",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "22 Aug 2026",
      "reason": "DEPS - ON HOLD",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11712",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "21 Aug 2026",
      "reason": "Delayed in Hub Transit",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11747",
      "name": "Loom Solar Pvt Ltd",
      "transporter": "RIVIGO",
      "edd": "26 Aug 2026",
      "reason": "Delayed- Natural Calamity",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11771",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "26 Aug 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11775",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "26 Aug 2026",
      "reason": "Delayed – Operational Backlog",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11777",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "23 Aug 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11785",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "25 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11804",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "26 Aug 2026",
      "reason": "Customer Permises is closed",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11822",
      "name": "Loom Solar Pvt Ltd",
      "transporter": "RIVIGO",
      "edd": "25 Aug 2026",
      "reason": "Delayed in Hub Transit",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11856",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "27 Aug 2026",
      "reason": "Delayed-Required Contact/ Mall Delivery",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11860",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "27 Aug 2026",
      "reason": "Delayed – Operational Backlog",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11861",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "27 Aug 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11873",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "26 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11879",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "22 Aug 2026",
      "reason": "Delayed in Hub Transit",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11890",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "25 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11891",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "23 Aug 2026",
      "reason": "Delayed in Hub Transit",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11904",
      "name": "HERCULES NUTRA",
      "transporter": "DP WORLD",
      "edd": "24 Aug 2026",
      "reason": "Spotlight : Heavy rain in Delhi & NCR",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11930",
      "name": "Bombax",
      "transporter": "DP WORLD",
      "edd": "29 Aug 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11941",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "27 Aug 2026",
      "reason": "Required Invoice Copy",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11942",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "26 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11976",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "27 Aug 2026",
      "reason": "Spotlight; Operational Challenges Due to Onam",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11989",
      "name": "Carrier Refrigeration",
      "transporter": "DP WORLD",
      "edd": "26 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11991",
      "name": "Carrier Refrigeration",
      "transporter": "DP WORLD",
      "edd": "26 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/11995",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "26 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12007",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "26 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12010",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "29 Aug 2026",
      "reason": "Spotlight; Operational Challenges Due to Onam",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12024",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "28 Aug 2026",
      "reason": "Delayed – Operational Backlog",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12035",
      "name": "Bombax",
      "transporter": "DP WORLD",
      "edd": "28 Aug 2026",
      "reason": "Delayed-Required Contact/ Mall Delivery",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12043",
      "name": "Medical Science",
      "transporter": "DP WORLD",
      "edd": "24 Aug 2026",
      "reason": "Spotlight : Heavy rain in Delhi & NCR",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12044",
      "name": "Medical Science",
      "transporter": "DP WORLD",
      "edd": "27 Aug 2026",
      "reason": "Spotlight : Heavy rain in Delhi & NCR",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12051",
      "name": "Carrier Refrigeration",
      "transporter": "DP WORLD",
      "edd": "24 Aug 2026",
      "reason": "Delayed in Hub Transit",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12055",
      "name": "Cosmos Pumps Pvt Ltd",
      "transporter": "EKART",
      "edd": "26 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12068",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "28 Aug 2026",
      "reason": "Delayed-Required Contact/ Mall Delivery",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12069",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "29 Aug 2026",
      "reason": "Delayed-Required Contact/ Mall Delivery",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12072",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "28 Aug 2026",
      "reason": "Delayed-Required Contact/ Mall Delivery",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12074",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "27 Aug 2026",
      "reason": "Delayed-Required Contact/ Mall Delivery",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12079",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "30 Aug 2026",
      "reason": "Delayed-Required Contact/ Mall Delivery",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12080",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "27 Aug 2026",
      "reason": "Delayed-Required Contact/ Mall Delivery",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12086",
      "name": "Bombax",
      "transporter": "DP WORLD",
      "edd": "28 Aug 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12092",
      "name": "Bombax",
      "transporter": "DP WORLD",
      "edd": "30 Aug 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12093",
      "name": "Bombax",
      "transporter": "DP WORLD",
      "edd": "27 Aug 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12101",
      "name": "Bombax",
      "transporter": "DP WORLD",
      "edd": "30 Aug 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12103",
      "name": "Bombax",
      "transporter": "DP WORLD",
      "edd": "30 Aug 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12111",
      "name": "Carrier CTD",
      "transporter": "DP WORLD",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12112",
      "name": "Carrier CTD",
      "transporter": "DP WORLD",
      "edd": "27 Aug 2026",
      "reason": "Delayed in Hub Transit",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12115",
      "name": "Carrier CTD",
      "transporter": "DP WORLD",
      "edd": "25 Aug 2026",
      "reason": "Delayed- Invalid Contact Details",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12123",
      "name": "Cosmos Pumps Pvt Ltd",
      "transporter": "DP WORLD",
      "edd": "27 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12142",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "29 Aug 2026",
      "reason": "Spotlight; Operational Challenges Due to Onam",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12143",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12153",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "28 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12168",
      "name": "Carrier Refrigeration",
      "transporter": "DP WORLD",
      "edd": "28 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12175",
      "name": "Carrier Refrigeration",
      "transporter": "DP WORLD",
      "edd": "27 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12189",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "28 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12206",
      "name": "Mitras Technocrafts Pvt Ltd-HR",
      "transporter": "DP WORLD",
      "edd": "27 Aug 2026",
      "reason": "Delayed in Hub Transit",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12207",
      "name": "Oneiric Appliances Pvt Ltd",
      "transporter": "DP WORLD",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12212",
      "name": "Bombax",
      "transporter": "DP WORLD",
      "edd": "29 Aug 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12213",
      "name": "Loom Solar Pvt Ltd",
      "transporter": "Gati",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12216",
      "name": "Medical Science",
      "transporter": "DP WORLD",
      "edd": "28 Aug 2026",
      "reason": "Spotlight : Heavy rain in Delhi & NCR",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12217",
      "name": "Medical Science",
      "transporter": "DP WORLD",
      "edd": "26 Aug 2026",
      "reason": "Spotlight : Heavy rain in Delhi & NCR",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12221",
      "name": "Medical Science",
      "transporter": "DP WORLD",
      "edd": "26 Aug 2026",
      "reason": "Spotlight : Heavy rain in Delhi & NCR",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12222",
      "name": "Medical Science",
      "transporter": "DP WORLD",
      "edd": "28 Aug 2026",
      "reason": "Spotlight : Heavy rain in Delhi & NCR",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12225",
      "name": "Carrier Refrigeration",
      "transporter": "DP WORLD",
      "edd": "28 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12226",
      "name": "Carrier Refrigeration",
      "transporter": "DP WORLD",
      "edd": "28 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12228",
      "name": "MEDGLOBE THERAPEUTICS",
      "transporter": "DP WORLD",
      "edd": "28 Aug 2026",
      "reason": "Spotlight : Heavy rain in Delhi & NCR",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12230",
      "name": "HERCULES NUTRA",
      "transporter": "DP WORLD",
      "edd": "28 Aug 2026",
      "reason": "Spotlight : Heavy rain in Delhi & NCR",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12231",
      "name": "Conficore",
      "transporter": "DP WORLD",
      "edd": "27 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12233",
      "name": "Bombax",
      "transporter": "DP WORLD",
      "edd": "30 Aug 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12246",
      "name": "Bombax",
      "transporter": "DP WORLD",
      "edd": "30 Aug 2026",
      "reason": "Delayed- Mall Delivery Timing Restriction",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12254",
      "name": "Kumar Services",
      "transporter": "EKART",
      "edd": "28 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12258",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12262",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12267",
      "name": "Carrier Refrigeration",
      "transporter": "DP WORLD",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12279",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "29 Aug 2026",
      "reason": "Spotlight : Heavy rain in Delhi & NCR",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12280",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12283",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12284",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12287",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12290",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "27 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12291",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "27 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12292",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12293",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12294",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12298",
      "name": "Carrier CTD",
      "transporter": "DP WORLD",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12299",
      "name": "Carrier CTD",
      "transporter": "DP WORLD",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12304",
      "name": "Carrier CTD",
      "transporter": "DP WORLD",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12308",
      "name": "Kumar Services",
      "transporter": "DP WORLD",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12310",
      "name": "Kumar Services",
      "transporter": "DP WORLD",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12311",
      "name": "Bombax",
      "transporter": "DP WORLD",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12315",
      "name": "Carrier Refrigeration",
      "transporter": "OM LOGISTICS",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12322",
      "name": "Epson",
      "transporter": "DP WORLD",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12324",
      "name": "Epson",
      "transporter": "DP WORLD",
      "edd": "30 Aug 2026",
      "reason": "Connection Delayed",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12327",
      "name": "Epson",
      "transporter": "DP WORLD",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12330",
      "name": "Epson",
      "transporter": "DP WORLD",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12332",
      "name": "Epson",
      "transporter": "EKART",
      "edd": "28 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12333",
      "name": "Haier CCR",
      "transporter": "EKART",
      "edd": "28 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12347",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "30 Aug 2026",
      "reason": "Required Contact No.",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12351",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "30 Aug 2026",
      "reason": "Delayed in Hub Transit",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12355",
      "name": "Bombax",
      "transporter": "EKART",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12361",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12363",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12364",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12365",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12368",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12369",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "28 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12372",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12373",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12374",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12379",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12380",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12381",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12383",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12384",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12388",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12392",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12393",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12394",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "28 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12396",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "29 Aug 2026",
      "reason": "Delayed in Hub Transit",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12397",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "28 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12398",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12407",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12408",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12409",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12410",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12420",
      "name": "Carrier Refrigeration",
      "transporter": "DP WORLD",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12457",
      "name": "Haier CCR",
      "transporter": "DP WORLD",
      "edd": "28 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12458",
      "name": "Haier CCR",
      "transporter": "DP WORLD",
      "edd": "28 Aug 2026",
      "reason": "Delayed - Address issue",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12480",
      "name": "Oneiric Appliances Pvt Ltd",
      "transporter": "EKART",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12481",
      "name": "Oneiric Appliances Pvt Ltd",
      "transporter": "EKART",
      "edd": "27 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12482",
      "name": "Haier CCR",
      "transporter": "EKART",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12484",
      "name": "Haier CCR",
      "transporter": "XP INDIA",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12487",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12489",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12490",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12491",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12494",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12502",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12503",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12504",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "28 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12506",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "28 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12513",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "28 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12515",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12516",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12518",
      "name": "Carrier Refrigeration",
      "transporter": "DP WORLD",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12519",
      "name": "Carrier Refrigeration",
      "transporter": "DP WORLD",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12520",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "28 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12521",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "28 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12533",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12534",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12539",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12540",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "29 Aug 2026",
      "reason": "Highway Backloged",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12545",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12546",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "28 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12588",
      "name": "Carrier CTD",
      "transporter": "DP WORLD",
      "edd": "30 Aug 2026",
      "reason": "Address issue",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12601",
      "name": "Kumar Services",
      "transporter": "DP WORLD",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12602",
      "name": "Kumar Services",
      "transporter": "DP WORLD",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12603",
      "name": "Kumar Services",
      "transporter": "DP WORLD",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12604",
      "name": "Loom Solar Pvt Ltd",
      "transporter": "NULL",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12606",
      "name": "Haier CCR",
      "transporter": "XP INDIA",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12618",
      "name": "HERCULES NUTRA",
      "transporter": "DP WORLD",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12619",
      "name": "MEDGLOBE THERAPEUTICS",
      "transporter": "DP WORLD",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12620",
      "name": "Medical Science",
      "transporter": "DP WORLD",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12628",
      "name": "Bombax",
      "transporter": "DP WORLD",
      "edd": "28 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12629",
      "name": "Bombax",
      "transporter": "DP WORLD",
      "edd": "28 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12709",
      "name": "Vaidrishi Laboratories Pvt Ltd",
      "transporter": "DP WORLD",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12710",
      "name": "Haier CCR",
      "transporter": "DP WORLD",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12716",
      "name": "Haier CCR",
      "transporter": "XP INDIA",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12718",
      "name": "Haier CCR",
      "transporter": "XP INDIA",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12724",
      "name": "Oneiric Appliances Pvt Ltd",
      "transporter": "GATI",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12743",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12745",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12746",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12757",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12761",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12764",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12765",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12767",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12768",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "30 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12770",
      "name": "Carrier Refrigeration",
      "transporter": "EKART",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12773",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12775",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    },
    {
      "id": "MVS/26-27/12785",
      "name": "Carrier Refrigeration",
      "transporter": "XP INDIA",
      "edd": "29 Aug 2026",
      "reason": "Transit Delay",
      "type": "Vendor"
    }
  ],
  "delayAnalytics": {
    "totalDelayed": 234,
    "reasonCounts": {
      "Transit Delay": 131,
      "Delayed- Mall Delivery Timing Restriction": 35,
      "Spotlight : Heavy rain in Delhi & NCR": 11,
      "Delayed-Required Contact/ Mall Delivery": 11,
      "Delayed in Hub Transit": 10,
      "Delayed – Operational Backlog": 4,
      "Connection affected due to Kawad Yatra": 3,
      "Customer Permises is closed": 3,
      "Spotlight; Operational Challenges Due to Onam": 3,
      "Partial Shipment Delivery Remaining 1 Box Intransi...": 1,
      "Hold by consignor due to address issue": 1,
      "Spotlight; Operational Challenges Due to Onam Traf...": 1,
      "On Hold – DEPS": 1,
      "Refused by consignee": 1,
      "Delayed - Need Contact No.": 1,
      "On Hold – Refused By Consignee": 1,
      "Connection Delayed from Gurugram": 1,
      "Address Not Reachable/ Traceable": 1,
      "Delayed - Interchange shipment": 1,
      "address issue": 1
    },
    "carrierDelays": {
      "EKART": 87,
      "XP INDIA": 74,
      "DP WORLD": 65,
      "GATI": 2,
      "RIVIGO": 2,
      "DP World": 1,
      "Gati": 1,
      "OM LOGISTICS": 1,
      "NULL": 1
    },
    "categories": {
      "carrier": 192,
      "external": 19,
      "customer": 23
    },
    "customerVendor": {
      "Vendor": 234
    }
  }
};
  renderDashboard(fallback);
}

// Start app
document.addEventListener('DOMContentLoaded', initDashboard);
