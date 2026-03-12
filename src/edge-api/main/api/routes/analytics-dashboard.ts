import { Hono } from "hono";
import type { Env, Variables } from "../../core-logic/env.js";

const analyticsDashboard = new Hono<{ Bindings: Env; Variables: Variables }>();

function renderAnalyticsDashboard(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>spike.land analytics</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Rubik:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#06100c;
  --surface-1:rgba(14,28,22,.92);
  --surface-2:rgba(18,36,28,.88);
  --surface-3:rgba(10,20,16,.95);
  --border:rgba(130,249,200,.1);
  --border-hover:rgba(130,249,200,.22);
  --text:#e9f8ef;
  --text-2:#c4ddd0;
  --muted:#7a9e8e;
  --accent:#82f9c8;
  --accent-dim:rgba(130,249,200,.15);
  --warn:#f7c86a;
  --danger:#ff7b72;
  --radius:20px;
  --radius-sm:14px;
  --radius-xs:10px;
}
*{box-sizing:border-box;margin:0}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes fade-up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
html{
  background:var(--bg);
  background-image:
    radial-gradient(ellipse 80% 60% at 20% 0%, rgba(130,249,200,.07) 0%, transparent 60%),
    radial-gradient(ellipse 60% 50% at 80% 5%, rgba(102,173,255,.05) 0%, transparent 50%);
  background-attachment:fixed;
}
body{
  min-height:100vh;
  color:var(--text);
  font-family:"Rubik",system-ui,sans-serif;
  -webkit-font-smoothing:antialiased;
}
a{color:inherit;text-decoration:none}

.shell{max-width:1320px;margin:0 auto;padding:0 24px 80px}

/* Top bar */
.topbar{
  position:sticky;top:0;z-index:100;
  display:flex;align-items:center;justify-content:space-between;gap:16px;
  padding:16px 24px;
  background:rgba(6,16,12,.85);
  backdrop-filter:blur(20px) saturate(1.4);
  border-bottom:1px solid var(--border);
}
.topbar-brand{display:flex;align-items:center;gap:12px;font-weight:700;font-size:.95rem;letter-spacing:-.01em}
.topbar-brand svg{width:22px;height:22px;fill:var(--accent)}
.topbar-right{display:flex;align-items:center;gap:12px}
.topbar-range{display:flex;gap:4px;background:rgba(255,255,255,.04);border-radius:999px;padding:3px}
.range-pill{
  padding:6px 13px;border-radius:999px;border:none;
  color:var(--muted);font-size:.78rem;font-weight:600;font-family:inherit;
  background:transparent;cursor:pointer;transition:all .2s;
}
.range-pill:hover{color:var(--text-2)}
.range-pill.active{background:var(--accent-dim);color:var(--text)}
.topbar-link{
  padding:6px 12px;border-radius:999px;border:1px solid var(--border);
  color:var(--muted);font-family:"JetBrains Mono",monospace;font-size:.72rem;font-weight:600;
  transition:all .2s;
}
.topbar-link:hover{border-color:var(--border-hover);color:var(--text-2)}

/* Tabs */
.tab-row{
  display:flex;gap:4px;padding:20px 0 0;
  border-bottom:1px solid var(--border);
  margin-bottom:20px;
  animation:fade-up .6s ease-out;
}
.tab{
  padding:10px 18px;border:none;background:none;
  color:var(--muted);font-family:inherit;font-size:.85rem;font-weight:600;
  cursor:pointer;border-bottom:2px solid transparent;
  transition:all .2s;margin-bottom:-1px;
}
.tab:hover{color:var(--text-2)}
.tab.active{color:var(--accent);border-bottom-color:var(--accent)}

/* Hero */
.hero{padding:48px 0 32px;text-align:center;animation:fade-up .6s ease-out}
.hero-value{
  font-size:clamp(3.5rem,9vw,7rem);font-weight:900;letter-spacing:-.06em;line-height:.88;
  background:linear-gradient(180deg, var(--text) 30%, var(--accent) 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.hero-label{color:var(--muted);font-size:1rem;margin-top:12px}

/* Bento */
.bento{
  display:grid;grid-template-columns:repeat(4,1fr);gap:12px;
  margin-bottom:16px;animation:fade-up .6s ease-out .1s both;
}
.bento-card{
  background:var(--surface-1);border:1px solid var(--border);border-radius:var(--radius);
  padding:20px;position:relative;overflow:hidden;transition:border-color .25s;
}
.bento-card:hover{border-color:var(--border-hover)}
.bento-card::after{
  content:"";position:absolute;inset:0;border-radius:inherit;
  background:linear-gradient(180deg, rgba(130,249,200,.03) 0%, transparent 50%);pointer-events:none;
}
.bento-label{display:block;color:var(--muted);font-size:.72rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;margin-bottom:12px}
.bento-value{display:block;font-size:1.7rem;font-weight:800;letter-spacing:-.04em;line-height:1}
.bento-hint{display:block;margin-top:8px;color:var(--muted);font-size:.82rem}

/* Data rows */
.section-title{
  font-size:.72rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
  color:var(--muted);margin:24px 0 12px;
}
.data-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:12px;margin-bottom:16px}
.data-card{
  background:var(--surface-1);border:1px solid var(--border);border-radius:var(--radius);
  padding:20px;transition:border-color .25s;
}
.data-card:hover{border-color:var(--border-hover)}
.data-card h3{font-size:.95rem;font-weight:700;margin-bottom:14px;letter-spacing:-.01em}
.data-row{
  display:flex;justify-content:space-between;align-items:center;
  padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04);
  font-size:.85rem;
}
.data-row:last-child{border-bottom:none}
.data-row-label{color:var(--text-2)}
.data-row-value{font-weight:700;font-family:"JetBrains Mono",monospace;font-size:.82rem}
.data-bar{
  height:4px;border-radius:2px;background:var(--accent-dim);margin-top:4px;
  position:relative;overflow:hidden;
}
.data-bar-fill{height:100%;border-radius:2px;background:var(--accent);transition:width .4s ease-out}

/* Chart area */
.chart-card{
  background:var(--surface-1);border:1px solid var(--border);border-radius:var(--radius);
  padding:20px;margin-bottom:16px;animation:fade-up .6s ease-out .15s both;
}
.chart-card h3{font-size:.95rem;font-weight:700;margin-bottom:14px;letter-spacing:-.01em}
.chart-container{height:200px;position:relative}
.chart-svg{width:100%;height:100%;display:block}

/* Realtime indicator */
.realtime-dot{
  display:inline-block;width:8px;height:8px;border-radius:999px;
  background:var(--accent);animation:pulse 2s ease-in-out infinite;margin-right:6px;
}

/* Loading */
.loading{display:flex;align-items:center;justify-content:center;padding:80px 0;gap:12px;color:var(--muted)}
.spinner{width:20px;height:20px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:999px;animation:spin .8s linear infinite}

/* Auth gate */
.auth-gate{
  text-align:center;padding:120px 24px;animation:fade-up .6s ease-out;
}
.auth-gate h2{font-size:1.4rem;font-weight:700;margin-bottom:12px}
.auth-gate p{color:var(--muted);font-size:.95rem;max-width:400px;margin:0 auto 24px}
.auth-gate a{
  display:inline-flex;align-items:center;gap:8px;
  padding:12px 24px;border-radius:999px;
  background:var(--accent);color:var(--bg);font-weight:700;font-size:.9rem;
  transition:opacity .2s;
}
.auth-gate a:hover{opacity:.85}

/* Footer */
.footer{
  margin-top:32px;padding-top:20px;border-top:1px solid var(--border);
  color:var(--muted);font-size:.78rem;display:flex;flex-wrap:wrap;
  justify-content:space-between;gap:12px;
}
.footer a{color:var(--accent);font-weight:600}
.footer a:hover{text-decoration:underline}

/* Empty state */
.empty{text-align:center;padding:48px 0;color:var(--muted);font-size:.9rem}

@media (max-width:1080px){.bento{grid-template-columns:repeat(2,1fr)}}
@media (max-width:720px){
  .shell{padding:0 14px 56px}
  .topbar{padding:12px 14px;flex-wrap:wrap}
  .hero{padding:32px 0 24px}
  .bento{grid-template-columns:1fr 1fr}
  .data-grid{grid-template-columns:1fr}
  .tab{padding:8px 12px;font-size:.78rem}
}
@media (max-width:420px){
  .bento{grid-template-columns:1fr}
  .topbar-range{display:none}
}
</style>
</head>
<body>
  <nav class="topbar">
    <div class="topbar-brand">
      <svg viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor"/></svg>
      <span>spike.land analytics</span>
    </div>
    <div class="topbar-right">
      <div class="topbar-range" id="range-selector"></div>
      <a class="topbar-link" href="https://status.spike.land">status</a>
      <a class="topbar-link" href="https://spike.land">spike.land</a>
    </div>
  </nav>

  <main class="shell">
    <div id="app">
      <div class="loading"><div class="spinner"></div><span>Loading analytics...</span></div>
    </div>
    <footer class="footer">
      <span>Founder-only dashboard · Data from GA4 + D1</span>
      <a href="/analytics/ga4/overview?range=24h">JSON API</a>
    </footer>
  </main>

<script>
(function(){
  const RANGES = ['1h','6h','24h','7d','30d','3mo','6mo','1y'];
  const REALTIME = new Set(['1m','5m','15m']);
  const TABS = ['overview','acquisition','audience','content','platform'];
  let currentRange = new URLSearchParams(location.search).get('range') || '24h';
  let currentTab = 'overview';
  let data = {};

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  function fmt(n, d=0) { return n == null ? '—' : Number(n).toLocaleString(undefined, {maximumFractionDigits:d}); }
  function pct(n) { return n == null ? '—' : (Number(n)*100).toFixed(1)+'%'; }
  function dur(s) { return s == null ? '—' : s < 60 ? s.toFixed(0)+'s' : (s/60).toFixed(1)+'m'; }

  function buildRangeSelector() {
    const el = $('#range-selector');
    el.innerHTML = RANGES.map(r =>
      '<button class="range-pill'+(r===currentRange?' active':'')+'" data-range="'+r+'">'+r+'</button>'
    ).join('');
    el.querySelectorAll('.range-pill').forEach(btn => {
      btn.onclick = () => { currentRange = btn.dataset.range; history.replaceState(null,'','?range='+currentRange); init(); };
    });
  }

  function buildTabs() {
    return '<div class="tab-row">'+TABS.map(t =>
      '<button class="tab'+(t===currentTab?' active':'')+'" data-tab="'+t+'">'+t.charAt(0).toUpperCase()+t.slice(1)+'</button>'
    ).join('')+'</div>';
  }

  // Always fetch from spike.land origin so auth cookies are sent
  const API_ORIGIN = location.hostname === 'analytics.spike.land' ? 'https://spike.land' : '';

  async function fetchJson(path) {
    const sep = path.includes('?') ? '&' : '?';
    const res = await fetch(API_ORIGIN+path+sep+'range='+currentRange, {credentials:'include'});
    if (res.status === 401 || res.status === 403) throw new Error('auth');
    if (!res.ok) throw new Error('HTTP '+res.status);
    return res.json();
  }

  function renderAuthGate() {
    $('#app').innerHTML = '<div class="auth-gate"><h2>Authentication Required</h2><p>This dashboard is restricted to the platform founder. Sign in with your spike.land account to continue.</p><a href="https://spike.land/login?redirect='+encodeURIComponent(location.href)+'">Sign in</a></div>';
  }

  function renderOverview(ov, dashboard) {
    const isRt = ov.isRealtime;
    let heroVal = isRt ? fmt(ov.activeUsers) : fmt(ov.sessions);
    let heroLabel = isRt ? '<span class="realtime-dot"></span>Active users right now' : 'Sessions over '+currentRange;

    let html = '<section class="hero"><div class="hero-value">'+heroVal+'</div><p class="hero-label">'+heroLabel+'</p></section>';

    if (!isRt) {
      html += '<section class="bento">';
      html += card('Sessions', fmt(ov.sessions), currentRange);
      html += card('Users', fmt(ov.activeUsers), 'active');
      html += card('Page Views', fmt(ov.pageViews), 'total');
      html += card('Bounce Rate', pct(ov.bounceRate), 'engagement '+pct(ov.engagementRate));
      html += '</section>';

      // Time series chart
      if (ov.timeSeries && ov.timeSeries.length > 1) {
        html += renderTimeSeriesChart(ov.timeSeries);
      }
    } else {
      html += '<section class="bento">';
      html += card('Active Now', fmt(ov.activeUsers), 'real-time');
      const topPages = ov.topPages || [];
      html += card('Top Page', topPages.length > 0 ? topPages[0].dimensionValues[0].value : '—', 'most active');
      html += card('Pages Tracked', fmt(topPages.length), 'with active users');
      html += card('Range', currentRange, 'realtime window');
      html += '</section>';
    }

    // D1 dashboard data
    if (dashboard) {
      html += '<p class="section-title">Platform Events (D1)</p>';
      html += '<section class="bento">';
      html += card('Total Events', fmt(dashboard.summary?.totalEvents), currentRange);
      html += card('Unique Users', fmt(dashboard.summary?.uniqueUsers), 'distinct clients');
      html += card('Active (5m)', dashboard.activeUsers != null ? fmt(dashboard.activeUsers) : '—', 'last 5 minutes');
      html += card('Earliest Event', dashboard.meta?.earliestEvent ? new Date(dashboard.meta.earliestEvent).toLocaleDateString() : '—', 'data start');
      html += '</section>';

      if (dashboard.summary?.eventsByType?.length) {
        html += renderListCard('Events by Type', dashboard.summary.eventsByType, 'event_type', 'count');
      }
      if (dashboard.summary?.toolUsage?.length) {
        html += renderListCard('Top Tools', dashboard.summary.toolUsage, 'tool_name', 'count');
      }
    }

    return html;
  }

  function renderAcquisition(acq) {
    if (!acq) return '<div class="empty">No acquisition data for this range</div>';
    let html = '';
    if (acq.channels?.length) html += renderListCard('Traffic Channels', acq.channels, 'channel', 'sessions');
    if (acq.sources?.length) html += renderSourcesCard(acq.sources);
    if (acq.landingPages?.length) html += renderListCard('Landing Pages', acq.landingPages, 'page', 'sessions');
    return html || '<div class="empty">No acquisition data</div>';
  }

  function renderAudience(geo, devices, retention) {
    let html = '<section class="data-grid">';
    if (geo?.countries?.length) html += renderListCardInner('Countries', geo.countries, 'country', 'users');
    if (geo?.cities?.length) html += renderListCardInner('Cities', geo.cities, 'city', 'users');
    if (devices?.categories?.length) html += renderListCardInner('Devices', devices.categories, 'category', 'users');
    if (devices?.browsers?.length) html += renderListCardInner('Browsers', devices.browsers, 'browser', 'users');
    if (devices?.os?.length) html += renderListCardInner('Operating Systems', devices.os, 'os', 'users');
    if (retention?.newVsReturning?.length) html += renderListCardInner('New vs Returning', retention.newVsReturning, 'type', 'users');
    if (geo?.languages?.length) html += renderListCardInner('Languages', geo.languages, 'language', 'users');
    html += '</section>';
    return html;
  }

  function renderContent(content) {
    if (!content) return '<div class="empty">No content data for this range</div>';
    let html = '';
    if (content.engagement) {
      html += '<section class="bento">';
      html += card('Pages/Session', content.engagement.pagesPerSession?.toFixed(1) || '—', 'depth');
      html += card('Engagement', pct(content.engagement.engagementRate), 'rate');
      html += card('Avg Duration', dur(content.engagement.avgSessionDuration), 'per session');
      html += card('Top Pages', fmt(content.pages?.length || 0), 'tracked');
      html += '</section>';
    }
    if (content.pages?.length) {
      html += renderContentPages(content.pages);
    }
    return html || '<div class="empty">No content data</div>';
  }

  function renderPlatform(dashboard) {
    if (!dashboard) return '<div class="empty">No platform data</div>';
    let html = '';
    if (dashboard.summary?.toolUsage?.length) html += renderListCard('MCP Tool Usage', dashboard.summary.toolUsage, 'tool_name', 'count');
    if (dashboard.summary?.blogViews?.length) html += renderListCard('Blog Views', dashboard.summary.blogViews, 'slug', 'count');
    if (dashboard.funnel?.length) html += renderFunnel(dashboard.funnel);
    if (dashboard.recentEvents?.length) html += renderRecentEvents(dashboard.recentEvents);
    return html || '<div class="empty">No platform data</div>';
  }

  function card(label, value, hint) {
    return '<div class="bento-card"><span class="bento-label">'+label+'</span><strong class="bento-value">'+value+'</strong><span class="bento-hint">'+hint+'</span></div>';
  }

  function renderListCard(title, items, labelKey, valueKey) {
    return '<section class="data-grid"><div class="data-card">'+renderListInner(title, items, labelKey, valueKey)+'</div></section>';
  }

  function renderListCardInner(title, items, labelKey, valueKey) {
    return '<div class="data-card">'+renderListInner(title, items, labelKey, valueKey)+'</div>';
  }

  function renderListInner(title, items, labelKey, valueKey) {
    const max = Math.max(1, ...items.map(i => Number(i[valueKey]) || 0));
    return '<h3>'+title+'</h3>'+items.slice(0,15).map(item => {
      const val = Number(item[valueKey]) || 0;
      const w = Math.max(2, (val/max)*100);
      return '<div class="data-row"><span class="data-row-label">'+esc(String(item[labelKey] || '(unknown)'))+'</span><span class="data-row-value">'+fmt(val)+'</span></div><div class="data-bar"><div class="data-bar-fill" style="width:'+w.toFixed(1)+'%"></div></div>';
    }).join('');
  }

  function renderSourcesCard(sources) {
    const max = Math.max(1, ...sources.map(s => s.sessions || 0));
    let html = '<section class="data-grid"><div class="data-card"><h3>Traffic Sources</h3>';
    html += sources.slice(0,15).map(s => {
      const w = Math.max(2, ((s.sessions||0)/max)*100);
      return '<div class="data-row"><span class="data-row-label">'+esc(s.source)+' / '+esc(s.medium)+'</span><span class="data-row-value">'+fmt(s.sessions)+'</span></div><div class="data-bar"><div class="data-bar-fill" style="width:'+w.toFixed(1)+'%"></div></div>';
    }).join('');
    html += '</div></section>';
    return html;
  }

  function renderContentPages(pages) {
    const max = Math.max(1, ...pages.map(p => p.views || 0));
    let html = '<section class="data-grid"><div class="data-card"><h3>Page Views</h3>';
    html += pages.slice(0,20).map(p => {
      const w = Math.max(2, ((p.views||0)/max)*100);
      return '<div class="data-row"><span class="data-row-label">'+esc(p.path)+'</span><span class="data-row-value">'+fmt(p.views)+'</span></div><div class="data-bar"><div class="data-bar-fill" style="width:'+w.toFixed(1)+'%"></div></div>';
    }).join('');
    html += '</div></section>';
    return html;
  }

  function renderFunnel(funnel) {
    let html = '<p class="section-title">Conversion Funnel</p><section class="bento">';
    funnel.forEach(step => {
      html += card(step.event_type.replace(/_/g,' '), fmt(step.unique_users), fmt(step.count)+' events');
    });
    html += '</section>';
    return html;
  }

  function renderRecentEvents(events) {
    let html = '<p class="section-title">Recent Events</p><section class="data-grid"><div class="data-card"><h3>Last '+events.length+' events</h3>';
    html += events.slice(0,20).map(e => {
      const ts = new Date(e.created_at).toLocaleTimeString();
      return '<div class="data-row"><span class="data-row-label">'+esc(e.event_type)+' <span style="color:var(--muted);font-size:.75rem">'+esc(e.source)+'</span></span><span class="data-row-value" style="font-size:.75rem">'+ts+'</span></div>';
    }).join('');
    html += '</div></section>';
    return html;
  }

  function renderTimeSeriesChart(series) {
    if (!series.length) return '';
    const w = 800, h = 180, pad = 30;
    const maxSessions = Math.max(1, ...series.map(p => p.sessions));
    const pts = series.map((p,i) => {
      const x = pad + (i/(series.length-1||1)) * (w-pad*2);
      const y = h - pad - (p.sessions/maxSessions) * (h-pad*2);
      return x.toFixed(1)+','+y.toFixed(1);
    });
    const area = pad+','+(h-pad)+' '+pts.join(' ')+' '+(w-pad)+','+(h-pad);
    const gradId = 'ts-grad';
    let svg = '<svg class="chart-svg" viewBox="0 0 '+w+' '+h+'">';
    svg += '<defs><linearGradient id="'+gradId+'" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="rgba(130,249,200,.3)"/><stop offset="100%" stop-color="rgba(130,249,200,.02)"/></linearGradient></defs>';
    svg += '<polygon points="'+area+'" fill="url(#'+gradId+')"/>';
    svg += '<polyline points="'+pts.join(' ')+'" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>';
    // Y axis labels
    svg += '<text x="'+pad+'" y="'+(pad-6)+'" fill="var(--muted)" font-size="11" font-family="JetBrains Mono">'+fmt(maxSessions)+'</text>';
    svg += '<text x="'+pad+'" y="'+(h-pad+14)+'" fill="var(--muted)" font-size="11" font-family="JetBrains Mono">0</text>';
    // X axis labels
    if (series.length > 1) {
      svg += '<text x="'+pad+'" y="'+(h-6)+'" fill="var(--muted)" font-size="10" font-family="JetBrains Mono">'+series[0].date+'</text>';
      svg += '<text x="'+(w-pad)+'" y="'+(h-6)+'" fill="var(--muted)" font-size="10" font-family="JetBrains Mono" text-anchor="end">'+series[series.length-1].date+'</text>';
    }
    svg += '</svg>';
    return '<div class="chart-card"><h3>Sessions Over Time</h3><div class="chart-container">'+svg+'</div></div>';
  }

  function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function attachTabListeners() {
    $$('.tab').forEach(btn => {
      btn.onclick = () => { currentTab = btn.dataset.tab; render(); };
    });
  }

  function render() {
    let html = buildTabs();
    switch (currentTab) {
      case 'overview': html += renderOverview(data.overview || {}, data.dashboard); break;
      case 'acquisition': html += renderAcquisition(data.acquisition); break;
      case 'audience': html += renderAudience(data.geo, data.devices, data.retention); break;
      case 'content': html += renderContent(data.content); break;
      case 'platform': html += renderPlatform(data.dashboard); break;
    }
    $('#app').innerHTML = html;
    attachTabListeners();
  }

  async function init() {
    buildRangeSelector();
    $('#app').innerHTML = '<div class="loading"><div class="spinner"></div><span>Loading analytics...</span></div>';
    data = {};
    try {
      // Load overview + dashboard in parallel
      const [overview, dashboard] = await Promise.all([
        fetchJson('/analytics/ga4/overview'),
        fetchJson('/analytics/dashboard').catch(() => null),
      ]);
      data.overview = overview;
      data.dashboard = dashboard;
      render();

      // Load remaining tabs in background
      Promise.all([
        fetchJson('/analytics/ga4/acquisition').then(d => { data.acquisition = d; }),
        fetchJson('/analytics/ga4/geo').then(d => { data.geo = d; }),
        fetchJson('/analytics/ga4/devices').then(d => { data.devices = d; }),
        fetchJson('/analytics/ga4/retention').then(d => { data.retention = d; }),
        fetchJson('/analytics/ga4/content').then(d => { data.content = d; }),
      ]).then(() => { if (currentTab !== 'overview') render(); }).catch(() => {});
    } catch (e) {
      if (e.message === 'auth') { renderAuthGate(); return; }
      $('#app').innerHTML = '<div class="empty">Failed to load analytics: '+esc(e.message)+'</div>';
    }
  }

  init();
})();
</script>
</body>
</html>`;
}

analyticsDashboard.get("/analytics", (c) => {
  return c.html(renderAnalyticsDashboard());
});

export { analyticsDashboard };
