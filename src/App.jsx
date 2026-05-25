import { useState, useEffect, useRef, useCallback } from 'react';

const SUPABASE_URL = 'https://zjayscnrdspobchjwega.supabase.co';
const SUPABASE_KEY = 'sb_publishable_NsMAt_80qMkfjnP8NsSxJw_7pjngkwo';
const STRAVA_CLIENT_ID = '250749';
const STRAVA_PROXY = `${SUPABASE_URL}/functions/v1/strava-proxy`;
const STRAVA_REDIRECT = 'https://domina-virid.vercel.app';

const sb = {
  from: (table) => ({
    select: async (cols = '*', opts = {}) => {
      let url = `${SUPABASE_URL}/rest/v1/${table}?select=${cols}`;
      if (opts.eq) Object.entries(opts.eq).forEach(([k, v]) => { url += `&${k}=eq.${encodeURIComponent(v)}`; });
      if (opts.order) url += `&order=${opts.order}`;
      if (opts.limit) url += `&limit=${opts.limit}`;
      const r = await fetch(url, { headers: headers() });
      return r.json();
    },
    insert: async (data) => {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: { ...headers(), 'Prefer': 'return=representation' },
        body: JSON.stringify(data),
      });
      return r.json();
    },
    update: async (data, match) => {
      let url = `${SUPABASE_URL}/rest/v1/${table}?`;
      Object.entries(match).forEach(([k, v]) => { url += `${k}=eq.${v}&`; });
      const r = await fetch(url, {
        method: 'PATCH',
        headers: { ...headers(), 'Prefer': 'return=representation' },
        body: JSON.stringify(data),
      });
      return r.json();
    },
    delete: async (match) => {
      let url = `${SUPABASE_URL}/rest/v1/${table}?`;
      Object.entries(match).forEach(([k, v]) => { url += `${k}=eq.${v}&`; });
      const r = await fetch(url, { method: 'DELETE', headers: headers() });
      return r.ok;
    },
  }),
};

const headers = () => ({
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
});

const USER_COLORS = ['#FF4D00','#00C2FF','#00E676','#FFD600','#C62828','#7C4DFF','#AD1457','#00838F'];
const getInitials = (n = '') => n.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase();
const formatTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const timeAgo = (ts) => {
  const d = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (d < 60) return 'agora';
  if (d < 3600) return `${Math.floor(d / 60)}min atrás`;
  if (d < 86400) return `${Math.floor(d / 3600)}h atrás`;
  return `${Math.floor(d / 86400)}d atrás`;
};

function Icon({ name, size = 20 }) {
  const icons = {
    map:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="3,6 9,3 15,6 21,3 21,18 15,21 9,18 3,21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>,
    trophy:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8,21 12,21 16,21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="M7,4H17V11a5,5,0,0,1-10,0Z"/><path d="M5,6H7V11"/><path d="M19,6H17V11"/></svg>,
    chat:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21,15a2,2,0,0,1-2,2H7L3,21V5a2,2,0,0,1,2-2H19a2,2,0,0,1,2,2Z"/></svg>,
    user:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20,21V19a4,4,0,0,0-4-4H8a4,4,0,0,0-4,4V21"/><circle cx="12" cy="7" r="4"/></svg>,
    shield:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12,22S4,16,4,10V5L12,2L20,5V10C20,16,12,22,12,22Z"/></svg>,
    play:    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21 5,3"/></svg>,
    stop:    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>,
    run:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="13" cy="4" r="2"/><path d="M7,22L10,12L13,15L16,10L19,22"/><path d="M5,10L10,12L13,15"/></svg>,
    bike:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15,6H12L9.5,14H18.5L15,6Z"/><path d="M5.5,14H9.5L12,6H15"/><line x1="5.5" y1="14" x2="5.5" y2="17.5"/></svg>,
    location:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21,10C21,17,12,23,12,23S3,17,3,10A9,9,0,0,1,21,10Z"/><circle cx="12" cy="10" r="3"/></svg>,
    heart:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84,4.61a5.5,5.5,0,0,0-7.78,0L12,5.67,10.94,4.61a5.5,5.5,0,0,0-7.78,7.78l1.06,1.06L12,21.23l7.78-7.78,1.06-1.06A5.5,5.5,0,0,0,20.84,4.61Z"/></svg>,
    heartF:  <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF4D6D" stroke="#FF4D6D" strokeWidth="2"><path d="M20.84,4.61a5.5,5.5,0,0,0-7.78,0L12,5.67,10.94,4.61a5.5,5.5,0,0,0-7.78,7.78l1.06,1.06L12,21.23l7.78-7.78,1.06-1.06A5.5,5.5,0,0,0,20.84,4.61Z"/></svg>,
    camera:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23,19a2,2,0,0,1-2,2H3a2,2,0,0,1-2-2V8A2,2,0,0,1,3,6H7L9,3H15L17,6H21a2,2,0,0,1,2,2Z"/><circle cx="12" cy="13" r="4"/></svg>,
    close:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    check:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>,
    send:    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9 22,2"/></svg>,
    comment: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21,15a2,2,0,0,1-2,2H7L3,21V5a2,2,0,0,1,2-2H19a2,2,0,0,1,2,2Z"/></svg>,
    logout:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9,21H5a2,2,0,0,1-2-2V5A2,2,0,0,1,5,3H9"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    gps:     <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12,2v3M12,19v3M2,12h3M19,12h3"/><circle cx="12" cy="12" r="8"/></svg>,
    spinner: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation:'spin 1s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
  };
  return icons[name] || null;
}

const css = `
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes slideup{from{transform:translateY(18px);opacity:0}to{transform:translateY(0);opacity:1}}
  @keyframes notifin{from{transform:translateX(-50%) translateY(-16px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}
  @keyframes runpulse{0%,100%{box-shadow:0 8px 32px rgba(0,0,0,.6),0 0 20px rgba(255,77,0,.1)}50%{box-shadow:0 8px 32px rgba(0,0,0,.6),0 0 40px rgba(255,77,0,.25)}}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
  @keyframes gpspulse{0%,100%{opacity:1}50%{opacity:.3}}

  :root{
    --bg:#090910;--surface:#111119;--surface2:#181824;
    --border:rgba(255,255,255,0.07);--text:#EEEEF8;--muted:rgba(238,238,248,0.42);
    --accent:#FF4D00;--accent2:#FF8C00;--green:#00E676;--yellow:#FFD600;
    --radius:14px;--font-display:'Bebas Neue',sans-serif;--font-body:'DM Sans',sans-serif;
    --bottom-nav:64px;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html,body,#root{height:100%;overflow:hidden}
  body{background:var(--bg);color:var(--text);font-family:var(--font-body)}
  ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}

  /* ── LAYOUT ── */
  .app{display:flex;height:100vh;width:100vw;overflow:hidden}

  /* DESKTOP SIDEBAR */
  .sidebar{width:220px;min-width:220px;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;padding:24px 0;z-index:50}
  .sidebar-logo{padding:0 20px 26px;border-bottom:1px solid var(--border);margin-bottom:18px}
  .logo-title{font-family:var(--font-display);font-size:32px;letter-spacing:4px;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1}
  .logo-sub{font-size:9px;color:var(--muted);letter-spacing:3px;text-transform:uppercase;margin-top:3px}
  .nav-item{display:flex;align-items:center;gap:12px;padding:12px 20px;cursor:pointer;transition:all .18s;font-size:14px;font-weight:500;color:var(--muted);position:relative;border:none;background:none;width:100%;text-align:left}
  .nav-item:hover{color:var(--text);background:rgba(255,255,255,.03)}
  .nav-item.active{color:var(--accent);background:rgba(255,77,0,.08)}
  .nav-item.active::before{content:'';position:absolute;left:0;top:5px;bottom:5px;width:3px;background:var(--accent);border-radius:0 3px 3px 0}
  .sidebar-bottom{margin-top:auto;padding:16px;border-top:1px solid var(--border)}
  .user-chip{display:flex;align-items:center;gap:10px;padding:10px;background:var(--surface2);border-radius:10px;cursor:pointer;transition:background .2s}
  .user-chip:hover{background:rgba(255,255,255,.06)}
  .user-chip-name{font-size:13px;font-weight:600}
  .user-chip-role{font-size:11px;color:var(--muted)}

  /* MOBILE BOTTOM NAV */
  .bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;height:var(--bottom-nav);background:var(--surface);border-top:1px solid var(--border);z-index:100;padding:0 4px;padding-bottom:env(safe-area-inset-bottom)}
  .bottom-nav-inner{display:flex;align-items:center;justify-content:space-around;height:100%}
  .bottom-nav-item{display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 12px;cursor:pointer;border:none;background:none;color:var(--muted);transition:all .18s;flex:1;border-radius:10px}
  .bottom-nav-item.active{color:var(--accent)}
  .bottom-nav-item span{font-size:10px;font-weight:600;letter-spacing:.3px}

  /* MOBILE TOP BAR */
  .top-bar{display:none;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--surface);border-bottom:1px solid var(--border);z-index:50;flex-shrink:0}
  .top-bar-logo{font-family:var(--font-display);font-size:24px;letter-spacing:3px;background:linear-gradient(135deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .top-bar-avatar{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:14px;cursor:pointer;flex-shrink:0}

  /* RESPONSIVE */
  @media(max-width:768px){
    .sidebar{display:none}
    .bottom-nav{display:flex}
    .top-bar{display:flex}
    .main{padding-bottom:var(--bottom-nav)}
    .start-panel{bottom:calc(var(--bottom-nav) + 24px)!important;min-width:unset!important;width:calc(100% - 32px)!important;left:16px!important;right:16px!important;transform:none!important}
    .run-panel{bottom:calc(var(--bottom-nav) + 24px)!important;min-width:unset!important;width:calc(100% - 32px)!important;left:16px!important;right:16px!important;transform:none!important;gap:12px!important;padding:14px 12px!important}
    .run-stat-value{font-size:22px}
    .map-overlay-top{top:70px;right:12px;min-width:140px;padding:10px 12px}
    .gps-status{top:70px;left:12px}
    .gps-center-btn{bottom:calc(var(--bottom-nav) + 90px)}
    .page{padding:16px}
    .page-title{font-size:28px}
    .profile-header{flex-direction:column;text-align:center;gap:14px}
    .profile-stats{grid-template-columns:repeat(3,1fr);gap:8px}
    .stat-card{padding:14px 8px}
    .stat-card-value{font-size:24px}
    .rank-tabs{flex-wrap:wrap;width:100%}
    .rank-tab{font-size:11px;padding:6px 10px}
    .finish-stats{gap:8px}
    .modal{padding:22px;margin:16px}
    .form-row{grid-template-columns:1fr}
  }

  /* AVATAR */
  .avatar{border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);flex-shrink:0}

  /* MAIN */
  .main{flex:1;overflow:hidden;display:flex;flex-direction:column;position:relative;min-width:0}

  /* MAP */
  .map-wrap{flex:1;position:relative;overflow:hidden}
  #domina-map{width:100%;height:100%;z-index:1}
  .leaflet-container{background:#0D0D14!important;font-family:var(--font-body)}
  .leaflet-tile{filter:brightness(.55) saturate(.6) hue-rotate(200deg)}
  .leaflet-control-zoom{border:1px solid var(--border)!important;background:var(--surface)!important}
  .leaflet-control-zoom a{color:var(--text)!important;background:var(--surface)!important;border-bottom:1px solid var(--border)!important}
  .leaflet-control-zoom a:hover{background:var(--surface2)!important}
  .leaflet-control-attribution{background:rgba(9,9,16,.7)!important;color:var(--muted)!important;font-size:9px!important}
  .map-overlay-top{position:absolute;top:16px;right:16px;z-index:10;background:rgba(9,9,16,.9);border:1px solid var(--border);border-radius:14px;padding:12px 16px;min-width:160px;backdrop-filter:blur(12px)}
  .legend-title{font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:2px;margin-bottom:10px}
  .legend-item{display:flex;align-items:center;gap:8px;font-size:12px;margin-bottom:6px}
  .legend-line{height:3px;width:20px;border-radius:2px;flex-shrink:0}
  .gps-status{position:absolute;top:16px;left:16px;z-index:10;display:flex;align-items:center;gap:6px;background:rgba(9,9,16,.9);border:1px solid var(--border);border-radius:20px;padding:6px 12px;font-size:11px;color:var(--muted);backdrop-filter:blur(12px)}
  .gps-dot{width:7px;height:7px;border-radius:50%;background:var(--muted);flex-shrink:0}
  .gps-dot.ok{background:var(--green);animation:gpspulse 1.5s infinite}
  .gps-dot.searching{background:var(--yellow);animation:gpspulse .8s infinite}
  .gps-center-btn{position:absolute;bottom:120px;right:16px;z-index:10;width:42px;height:42px;border-radius:12px;background:var(--surface);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--muted);transition:all .2s}
  .gps-center-btn:hover,.gps-center-btn.active{color:var(--accent);border-color:rgba(255,77,0,.4);background:rgba(255,77,0,.08)}

  /* START / RUN PANEL */
  .start-panel{position:absolute;bottom:24px;left:50%;transform:translateX(-50%);background:rgba(17,17,25,.95);border:1px solid var(--border);border-radius:20px;padding:14px 18px;display:flex;align-items:center;gap:14px;box-shadow:0 20px 60px rgba(0,0,0,.6);min-width:300px;backdrop-filter:blur(16px);z-index:10}
  .activity-toggle{display:flex;background:var(--surface2);border-radius:10px;padding:3px;gap:2px}
  .activity-btn{display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;border:none;transition:all .2s;color:var(--muted);background:none}
  .activity-btn.active{background:var(--accent);color:white}
  .start-btn{flex:1;padding:13px;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;border-radius:12px;color:white;font-family:var(--font-display);font-size:20px;letter-spacing:2px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .2s;box-shadow:0 4px 24px rgba(255,77,0,.35)}
  .run-panel{position:absolute;bottom:24px;left:50%;transform:translateX(-50%);background:rgba(17,17,25,.96);border:1px solid rgba(255,77,0,.4);border-radius:20px;padding:18px 22px;display:flex;align-items:center;gap:22px;min-width:380px;backdrop-filter:blur(16px);z-index:10;animation:runpulse 2.5s infinite}
  .live-badge{display:flex;align-items:center;gap:5px;flex-shrink:0}
  .live-dot{width:7px;height:7px;border-radius:50%;background:#FF1744;animation:blink 1s infinite;flex-shrink:0}
  .live-text{font-size:10px;color:#FF1744;font-weight:700;letter-spacing:1px}
  .run-stat{text-align:center}
  .run-stat-value{font-family:var(--font-display);font-size:28px;color:var(--text);line-height:1}
  .run-stat-label{font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-top:2px}
  .run-divider{width:1px;height:36px;background:var(--border);flex-shrink:0}
  .stop-btn{width:50px;height:50px;border-radius:50%;background:#FF1744;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;color:white;transition:all .2s;flex-shrink:0}
  .stop-btn:hover{transform:scale(1.1)}

  /* PAGES */
  .page{flex:1;overflow-y:auto;padding:28px}
  .page-title{font-family:var(--font-display);font-size:34px;letter-spacing:2px;margin-bottom:4px}
  .page-sub{color:var(--muted);font-size:13px;margin-bottom:26px}
  .card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px}

  /* RANKING */
  .rank-tabs{display:flex;gap:4px;background:var(--surface);padding:4px;border-radius:12px;margin-bottom:20px;border:1px solid var(--border);width:fit-content}
  .rank-tab{padding:7px 14px;border-radius:9px;font-size:12px;font-weight:500;cursor:pointer;transition:all .18s;color:var(--muted);border:none;background:none}
  .rank-tab.active{background:var(--accent);color:white}
  .rank-item{display:flex;align-items:center;gap:14px;padding:14px 18px;background:var(--surface);border:1px solid var(--border);border-radius:12px;margin-bottom:8px;transition:all .18s}
  .rank-item:hover{border-color:rgba(255,77,0,.25)}
  .rank-number{font-family:var(--font-display);font-size:22px;color:var(--muted);width:32px;flex-shrink:0}
  .rank-number.gold{color:#FFD600}.rank-number.silver{color:#B0BEC5}.rank-number.bronze{color:#FF8C00}
  .rank-info{flex:1;min-width:0}
  .rank-name{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .rank-city{font-size:11px;color:var(--muted);margin-top:2px}
  .rank-value{font-family:var(--font-display);font-size:22px}
  .rank-unit{font-size:10px;color:var(--muted)}

  /* POSTS */
  .post-compose{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:18px}
  .post-textarea{width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:12px;color:var(--text);font-family:var(--font-body);font-size:14px;resize:none;min-height:76px;outline:none;margin-bottom:12px;transition:border-color .2s}
  .post-textarea:focus{border-color:rgba(255,77,0,.4)}
  .post-textarea::placeholder{color:var(--muted)}
  .post-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
  .city-filter{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted)}
  .city-select{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:5px 8px;color:var(--text);font-size:12px;outline:none}
  .loc-badge{display:flex;align-items:center;gap:4px;font-size:11px;color:var(--accent);background:rgba(255,77,0,.1);padding:4px 10px;border-radius:20px;border:1px solid rgba(255,77,0,.25)}
  .btn-primary{padding:9px 18px;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;border-radius:9px;color:white;font-weight:600;font-size:13px;cursor:pointer;transition:all .18s;display:flex;align-items:center;gap:6px}
  .btn-primary:disabled{opacity:.5;cursor:not-allowed}
  .post-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:18px;margin-bottom:12px}
  .post-header{display:flex;align-items:center;gap:10px;margin-bottom:12px}
  .post-name{font-size:14px;font-weight:600}
  .post-meta{font-size:11px;color:var(--muted);display:flex;align-items:center;gap:3px}
  .post-time{font-size:11px;color:var(--muted);margin-left:auto;white-space:nowrap}
  .post-text{font-size:14px;line-height:1.65;color:rgba(238,238,248,.82)}
  .post-footer{display:flex;align-items:center;gap:16px;margin-top:14px;padding-top:12px;border-top:1px solid var(--border)}
  .post-action-btn{display:flex;align-items:center;gap:5px;color:var(--muted);font-size:13px;cursor:pointer;border:none;background:none;padding:0;transition:color .18s}
  .post-action-btn:hover{color:var(--text)}
  .post-action-btn.liked{color:#FF4D6D}
  .post-action-btn.commented{color:#00C2FF}
  .comments-section{margin-top:14px;padding-top:14px;border-top:1px solid var(--border)}
  .comment{display:flex;gap:10px;margin-bottom:12px}
  .comment-body{flex:1;background:var(--surface2);border-radius:10px;padding:10px 12px}
  .comment-author{font-size:12px;font-weight:600;margin-bottom:3px}
  .comment-text{font-size:13px;color:rgba(238,238,248,.75);line-height:1.5}
  .comment-time{font-size:10px;color:var(--muted);margin-top:4px}
  .comment-input-row{display:flex;gap:8px;align-items:center;margin-top:10px}
  .comment-input{flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:20px;padding:8px 14px;color:var(--text);font-family:var(--font-body);font-size:13px;outline:none;transition:border-color .2s}
  .comment-input:focus{border-color:rgba(0,194,255,.4)}
  .comment-input::placeholder{color:var(--muted)}
  .send-btn{width:34px;height:34px;border-radius:50%;background:var(--surface2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--muted);transition:all .18s;flex-shrink:0}
  .send-btn:hover{background:var(--accent);border-color:var(--accent);color:white}

  /* PROFILE */
  .profile-header{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:26px;display:flex;align-items:center;gap:22px;margin-bottom:18px}
  .profile-info{flex:1}
  .profile-name{font-family:var(--font-display);font-size:30px;letter-spacing:1px}
  .profile-loc{display:flex;align-items:center;gap:4px;color:var(--muted);font-size:13px;margin-top:4px}
  .admin-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;background:rgba(255,77,0,.12);border:1px solid rgba(255,77,0,.3);border-radius:6px;font-size:10px;color:var(--accent);font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-top:6px}
  .profile-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}
  .stat-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px;text-align:center}
  .stat-card-value{font-family:var(--font-display);font-size:30px}
  .stat-card-label{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-top:4px}
  .timeline-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
  .timeline-item{aspect-ratio:1;background:var(--surface2);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--muted);border:1px solid var(--border)}

  /* MODAL */
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;z-index:200;backdrop-filter:blur(6px);padding:16px}
  .modal{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:30px;width:100%;max-width:420px;animation:slideup .22s ease}
  .modal-title{font-family:var(--font-display);font-size:26px;letter-spacing:1px;margin-bottom:4px}
  .modal-sub{color:var(--muted);font-size:13px;margin-bottom:22px}
  .modal-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px}
  .form-group{margin-bottom:14px}
  .form-label{font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:5px}
  .form-input{width:100%;background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:11px 13px;color:var(--text);font-family:var(--font-body);font-size:14px;outline:none;transition:border-color .2s}
  .form-input:focus{border-color:rgba(255,77,0,.45)}
  .form-input::placeholder{color:var(--muted)}
  .form-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .btn-full{width:100%;padding:13px;background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;border-radius:12px;color:white;font-family:var(--font-display);font-size:19px;letter-spacing:2px;cursor:pointer;transition:all .18s;margin-top:8px;box-shadow:0 4px 20px rgba(255,77,0,.28);display:flex;align-items:center;justify-content:center;gap:8px}
  .btn-full:disabled{opacity:.6;cursor:not-allowed}
  .btn-ghost{width:100%;padding:12px;background:transparent;border:1px solid var(--border);border-radius:12px;color:var(--muted);font-size:14px;cursor:pointer;transition:all .18s;margin-top:8px}
  .btn-ghost:hover{border-color:rgba(255,255,255,.18);color:var(--text)}
  .error-msg{background:rgba(255,23,68,.1);border:1px solid rgba(255,23,68,.3);border-radius:8px;padding:9px 12px;font-size:13px;color:#FF5252;margin-bottom:14px}
  .success-msg{background:rgba(0,230,118,.1);border:1px solid rgba(0,230,118,.3);border-radius:8px;padding:9px 12px;font-size:13px;color:var(--green);margin-bottom:14px}

  /* LANDING */
  .landing{min-height:100vh;background:var(--bg);display:flex;align-items:center;justify-content:center;flex-direction:column;position:relative;overflow:hidden}
  .landing-bg{position:absolute;inset:0;background:radial-gradient(ellipse at 25% 55%,rgba(255,77,0,.13) 0%,transparent 60%),radial-gradient(ellipse at 75% 25%,rgba(0,194,255,.07) 0%,transparent 50%);pointer-events:none}
  .landing-grid{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(255,255,255,.013) 0px,transparent 1px,transparent 59px,rgba(255,255,255,.013) 60px),repeating-linear-gradient(90deg,rgba(255,255,255,.013) 0px,transparent 1px,transparent 59px,rgba(255,255,255,.013) 60px);pointer-events:none}
  .landing-content{position:relative;z-index:1;text-align:center;max-width:420px;width:100%;padding:0 20px}
  .landing-logo{font-family:var(--font-display);font-size:88px;letter-spacing:10px;background:linear-gradient(135deg,var(--accent),var(--accent2),var(--yellow));-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1;margin-bottom:4px}
  .landing-tagline{font-size:11px;letter-spacing:4px;text-transform:uppercase;color:var(--muted);margin-bottom:44px}
  .landing-box{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:30px}

  /* FINISH */
  .finish-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px 0}
  .finish-stat{background:var(--surface2);border-radius:10px;padding:14px;text-align:center}
  .finish-stat-val{font-family:var(--font-display);font-size:24px}
  .finish-stat-lbl{font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:1px}
  .photo-area{border:2px dashed var(--border);border-radius:12px;padding:22px;text-align:center;cursor:pointer;color:var(--muted);font-size:13px}

  /* ADMIN */
  .admin-section{margin-bottom:28px}
  .admin-section-title{font-family:var(--font-display);font-size:20px;letter-spacing:1px;color:var(--accent);margin-bottom:14px}
  .admin-table{width:100%;border-collapse:collapse}
  .admin-table th{text-align:left;padding:10px 14px;font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid var(--border)}
  .admin-table td{padding:11px 14px;font-size:13px;border-bottom:1px solid rgba(255,255,255,.03)}
  .admin-table tr:hover td{background:var(--surface2)}
  .badge{display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700}
  .badge-admin{background:rgba(255,77,0,.15);color:var(--accent)}
  .badge-user{background:rgba(255,255,255,.07);color:var(--muted)}
  .color-dot{width:10px;height:10px;border-radius:50%;display:inline-block;margin-right:6px;vertical-align:middle}

  /* NOTIF */
  .notif{position:fixed;top:20px;left:50%;transform:translateX(-50%);background:var(--surface);border:1px solid var(--green);border-radius:12px;padding:11px 18px;display:flex;align-items:center;gap:9px;font-size:13px;color:var(--green);z-index:300;animation:notifin .25s ease;box-shadow:0 10px 40px rgba(0,0,0,.4);white-space:nowrap}
`;

function LiveMap({ currentUser, running, onTrailUpdate, savedTrails }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const trailLayerRef = useRef(null);
  const trailPointsRef = useRef([]);
  const markerRef = useRef(null);
  const accuracyCircRef = useRef(null);
  const watchIdRef = useRef(null);
  const trailsDrawnRef = useRef(false);
  const [gpsState, setGpsState] = useState('idle');

  useEffect(() => {
    if (mapInstanceRef.current) return;
    const tryInit = () => {
      const L = window.L;
      if (!L || !mapRef.current) return;
      const map = L.map(mapRef.current, { center: [-23.5505, -46.6333], zoom: 14 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(map);
      mapInstanceRef.current = map;
    };
    if (window.L) tryInit();
    else { const t = setInterval(() => { if (window.L) { tryInit(); clearInterval(t); } }, 200); return () => clearInterval(t); }
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, []);

  useEffect(() => {
    const L = window.L;
    const map = mapInstanceRef.current;
    if (!L || !map || trailsDrawnRef.current || savedTrails.length === 0) return;
    trailsDrawnRef.current = true;
    savedTrails.forEach(trail => {
      if (trail.points?.length > 1) L.polyline(trail.points, { color: trail.color, weight: 5, opacity: 0.75 }).addTo(map);
    });
  }, [savedTrails]);

  useEffect(() => {
    const L = window.L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;
    if (running) {
      trailPointsRef.current = [];
      setGpsState('searching');
      if (trailLayerRef.current) trailLayerRef.current.remove();
      const trail = L.polyline([], { color: currentUser.color, weight: 5, opacity: 0.95 }).addTo(map);
      trailLayerRef.current = trail;
      const markerHtml = `<div style="width:16px;height:16px;border-radius:50%;background:${currentUser.color};border:3px solid white;box-shadow:0 0 0 5px ${currentUser.color}44;"></div>`;
      const icon = L.divIcon({ html: markerHtml, className: '', iconSize: [16, 16], iconAnchor: [8, 8] });
      const distMeters = (a, b) => {
        const R = 6371000, dLat = (b[0]-a[0])*Math.PI/180, dLng = (b[1]-a[1])*Math.PI/180;
        const s = Math.sin(dLat/2)**2 + Math.cos(a[0]*Math.PI/180)*Math.cos(b[0]*Math.PI/180)*Math.sin(dLng/2)**2;
        return R*2*Math.atan2(Math.sqrt(s),Math.sqrt(1-s));
      };
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude: lat, longitude: lng, accuracy } = pos.coords;
          setGpsState('ok');
          const newPt = [lat, lng];
          const pts = trailPointsRef.current;
          // Skip GPS jumps > 80m (screen unlock artifact)
          if (pts.length > 0 && distMeters(pts[pts.length - 1], newPt) > 80) return;
          pts.push(newPt);
          trail.setLatLngs(pts);
          if (!markerRef.current) markerRef.current = L.marker(newPt, { icon }).addTo(map);
          else markerRef.current.setLatLng(newPt);
          if (accuracyCircRef.current) accuracyCircRef.current.remove();
          accuracyCircRef.current = L.circle(newPt, { radius: accuracy, color: currentUser.color, fillColor: currentUser.color, fillOpacity: 0.07, weight: 1, opacity: 0.4 }).addTo(map);
          map.panTo(newPt);
          if (onTrailUpdate) onTrailUpdate([...pts]);
        },
        () => setGpsState('denied'),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      if (watchIdRef.current) { navigator.geolocation.clearWatch(watchIdRef.current); watchIdRef.current = null; }
      if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
      if (accuracyCircRef.current) { accuracyCircRef.current.remove(); accuracyCircRef.current = null; }
      if (trailLayerRef.current) { trailLayerRef.current.remove(); trailLayerRef.current = null; }
      setGpsState('idle');
    }
    return () => { if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, [running]);

  const centerOnMe = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    setGpsState('searching');
    navigator.geolocation.getCurrentPosition(
      pos => { map.setView([pos.coords.latitude, pos.coords.longitude], 16); setGpsState('ok'); },
      () => setGpsState('denied'),
      { enableHighAccuracy: true }
    );
  };

  const labels = { idle: 'GPS inativo', searching: 'Buscando...', ok: 'GPS ativo', denied: 'GPS bloqueado' };
  return (
    <div className="map-wrap">
      <div id="domina-map" ref={mapRef} />
      <div className="gps-status">
        <div className={`gps-dot ${gpsState === 'ok' ? 'ok' : gpsState === 'searching' ? 'searching' : ''}`} />
        <span>{labels[gpsState]}</span>
      </div>
      <div className="map-overlay-top">
        <div className="legend-title">Territórios</div>
        {Object.values(savedTrails.reduce((acc, t) => {
          const k = t.user_id || t.user_name;
          if (!acc[k]) acc[k] = { user_name: t.user_name, color: t.color, km: 0 };
          acc[k].km += Number(t.km || 0);
          return acc;
        }, {})).sort((a,b) => b.km - a.km).slice(0, 5).map((t, i) => (
          <div key={i} className="legend-item">
            <div className="legend-line" style={{ background: t.color }} />
            <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.user_name}</span>
            <span style={{ color: 'var(--muted)', marginLeft: 'auto', fontSize: 11, flexShrink:0 }}>{t.km.toFixed(1)}km</span>
          </div>
        ))}
      </div>
      <button className={`gps-center-btn ${gpsState === 'ok' ? 'active' : ''}`} onClick={centerOnMe}>
        <Icon name="gps" size={18} />
      </button>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => { try { const u = localStorage.getItem('domina_user'); return u ? JSON.parse(u) : null; } catch { return null; } });
  const [screen, setScreen] = useState(() => { try { return localStorage.getItem('domina_user') ? 'app' : 'landing'; } catch { return 'landing'; } });
  const [authMode, setAuthMode] = useState(null);
  const [page, setPage] = useState('map');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notif, setNotif] = useState(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [regData, setRegData] = useState({ name: '', age: '', city: '', email: '', password: '' });
  const [running, setRunning] = useState(false);
  const [activityType, setActivityType] = useState('run');
  const [runTime, setRunTime] = useState(0);
  const [runDist, setRunDist] = useState(0);
  const [currentTrail, setCurrentTrail] = useState([]);
  const [savedTrails, setSavedTrails] = useState([]);
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [postText, setPostText] = useState('');
  const [commentTexts, setCommentTexts] = useState({});
  const [openComments, setOpenComments] = useState(new Set());
  const [cityFilter, setCityFilter] = useState('all');
  const [rankTab, setRankTab] = useState('distance');
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [modal, setModal] = useState(null);
  const [finishData, setFinishData] = useState(null);
  const [stravaCode, setStravaCode] = useState(null);
  const [stravaToken, setStravaToken] = useState(() => localStorage.getItem('strava_token') || null);
  const [stravaActivities, setStravaActivities] = useState([]);
  const [stravaLoading, setStravaLoading] = useState(false);
  const [showStravaModal, setShowStravaModal] = useState(false);
  const timerRef = useRef(null);

  const showNotif = useCallback((msg) => { setNotif(msg); setTimeout(() => setNotif(null), 3200); }, []);

  useEffect(() => {
    if (window.L) return;
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    document.head.appendChild(s);
  }, []);

  // Handle Strava OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const scope = params.get('scope');
    if (code && scope) {
      window.history.replaceState({}, '', '/');
      setStravaCode(code);
      // If user is already saved in localStorage, go straight to app
      try {
        const saved = localStorage.getItem('domina_user');
        if (saved) {
          setCurrentUser(JSON.parse(saved));
          setScreen('app');
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (screen !== 'app') return;
    loadTrails(); loadPosts(); loadUsers();
  }, [screen]);

  // Exchange Strava code for token after login
  useEffect(() => {
    if (!stravaCode || !currentUser) return;
    exchangeStravaToken(stravaCode);
    setStravaCode(null);
  }, [stravaCode, currentUser]);

  const loadTrails = async () => {
    const data = await sb.from('trails').select('*', { order: 'created_at.desc', limit: 100 });
    if (Array.isArray(data)) setSavedTrails(data);
  };
  const loadPosts = async () => {
    const data = await sb.from('posts').select('*', { order: 'created_at.desc', limit: 50 });
    if (!Array.isArray(data)) return;
    const withComments = await Promise.all(data.map(async p => {
      const comments = await sb.from('comments').select('*', { eq: { post_id: p.id }, order: 'created_at.asc' });
      return { ...p, comments: Array.isArray(comments) ? comments : [] };
    }));
    setPosts(withComments);
  };
  const loadUsers = async () => {
    const data = await sb.from('users').select('*', { order: 'total_distance.desc' });
    if (Array.isArray(data)) setUsers(data);
  };

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setRunTime(t => t + 1);
        setRunDist(d => d + (activityType === 'run' ? 0.0028 : 0.0065));
      }, 1000);
    } else { clearInterval(timerRef.current); }
    return () => clearInterval(timerRef.current);
  }, [running, activityType]);

  const connectStrava = () => {
    const scope = 'read,activity:read_all';
    const url = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${STRAVA_REDIRECT}&response_type=code&scope=${scope}`;
    window.location.href = url;
  };

  const exchangeStravaToken = async (code) => {
    setStravaLoading(true);
    try {
      const res = await fetch(`${STRAVA_PROXY}?action=token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem('strava_token', data.access_token);
        setStravaToken(data.access_token);
        showNotif('Strava conectado! ✅');
      }
    } catch (e) { console.error(e); }
    setStravaLoading(false);
  };

  const importFromStrava = async () => {
    if (!stravaToken) return;
    setStravaLoading(true);
    try {
      const res = await fetch(`${STRAVA_PROXY}?action=activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY },
        body: JSON.stringify({ access_token: stravaToken }),
      });
      const activities = await res.json();
      if (!Array.isArray(activities)) { showNotif('Erro ao buscar atividades.'); setStravaLoading(false); return; }
      const valid = activities.filter(a => (a.type === 'Run' || a.type === 'Ride') && a.map?.summary_polyline);
      setStravaActivities(valid);
      setShowStravaModal(true);
    } catch (e) { console.error(e); }
    setStravaLoading(false);
  };

  const importActivity = async (activity) => {
    // Decode Google polyline
    const decode = (str) => {
      let idx = 0, lat = 0, lng = 0, pts = [];
      while (idx < str.length) {
        let b, shift = 0, result = 0;
        do { b = str.charCodeAt(idx++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        lat += (result & 1) ? ~(result >> 1) : result >> 1;
        shift = 0; result = 0;
        do { b = str.charCodeAt(idx++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
        lng += (result & 1) ? ~(result >> 1) : result >> 1;
        pts.push([lat / 1e5, lng / 1e5]);
      }
      return pts;
    };
    const points = decode(activity.map.summary_polyline);
    const km = activity.distance / 1000;
    await sb.from('trails').insert({
      user_id: currentUser.id, user_name: currentUser.name.split(' ')[0],
      color: currentUser.color, km, activity_type: activity.type === 'Run' ? 'run' : 'bike', points,
    });
    const newTotal = (currentUser.total_distance || 0) + km;
    const newDom = (currentUser.dominated_distance || 0) + km * 0.6;
    await sb.from('users').update({ total_distance: newTotal, dominated_distance: newDom }, { id: currentUser.id });
    setCurrentUser(prev => {
      const updated = { ...prev, total_distance: newTotal, dominated_distance: newDom };
      localStorage.setItem('domina_user', JSON.stringify(updated));
      return updated;
    });
    setStravaActivities(prev => prev.filter(a => a.id !== activity.id));
    loadTrails(); loadUsers();
    showNotif(`"${activity.name}" importada! 🔥`);
  };

  const handleLogin = async () => {
    setError(''); setLoading(true);
    const data = await sb.from('users').select('*', { eq: { email: loginData.email } });
    setLoading(false);
    if (!Array.isArray(data) || data.length === 0) { setError('Email não encontrado.'); return; }
    const u = data[0];
    if (u.password !== loginData.password) { setError('Senha incorreta.'); return; }
    localStorage.setItem('domina_user', JSON.stringify(u)); setCurrentUser(u); setAuthMode(null); setScreen('app');
    showNotif(`Bem-vindo, ${u.name.split(' ')[0]}! 🔥`);
  };

  const handleRegister = async () => {
    setError(''); setLoading(true);
    const { name, age, city, email, password } = regData;
    if (!name || !age || !city || !email || !password) { setError('Preencha todos os campos.'); setLoading(false); return; }
    const existing = await sb.from('users').select('id', { eq: { email } });
    if (Array.isArray(existing) && existing.length > 0) { setError('Email já cadastrado.'); setLoading(false); return; }
    const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
    const result = await sb.from('users').insert({ name, email, password, age: parseInt(age), city, color, is_admin: false });
    setLoading(false);
    if (Array.isArray(result) && result.length > 0) {
      setSuccess('Conta criada! Faça login.');
      setTimeout(() => { setAuthMode('login'); setSuccess(''); setLoginData({ email, password: '' }); }, 2000);
    } else { setError('Erro ao criar conta.'); }
  };

  const startRun = () => { setRunTime(0); setRunDist(0); setCurrentTrail([]); setRunning(true); showNotif(`${activityType === 'run' ? 'Corrida' : 'Bike'} iniciada! 🚀`); };
  const stopRun = () => { setRunning(false); setFinishData({ time: runTime, dist: runDist, type: activityType, trail: currentTrail }); setModal('finish'); };

  const handleFinish = async () => {
    const km = runDist; setLoading(true);
    if (currentTrail.length > 1) {
      await sb.from('trails').insert({ user_id: currentUser.id, user_name: currentUser.name.split(' ')[0], color: currentUser.color, km, activity_type: activityType, points: currentTrail });
    }
    const newTotal = (currentUser.total_distance || 0) + km;
    const newDom = (currentUser.dominated_distance || 0) + km * 0.6;
    await sb.from('users').update({ total_distance: newTotal, dominated_distance: newDom }, { id: currentUser.id });
    setCurrentUser(prev => ({ ...prev, total_distance: newTotal, dominated_distance: newDom }));
    setLoading(false); setModal(null); setFinishData(null);
    loadTrails(); loadUsers();
    showNotif(`+${(km * 0.6).toFixed(2)}km dominados! 🏆`);
  };

  const handlePost = async () => {
    if (!postText.trim()) return;
    setLoading(true);
    const result = await sb.from('posts').insert({ user_id: currentUser.id, user_name: currentUser.name, user_color: currentUser.color, city: currentUser.city, text: postText });
    setLoading(false);
    if (Array.isArray(result) && result.length > 0) { setPostText(''); loadPosts(); showNotif('Publicado! ✅'); }
  };

  const handleComment = async (postId) => {
    const text = (commentTexts[postId] || '').trim();
    if (!text) return;
    await sb.from('comments').insert({ post_id: postId, user_id: currentUser.id, user_name: currentUser.name, user_color: currentUser.color, text });
    setCommentTexts(prev => ({ ...prev, [postId]: '' }));
    loadPosts();
  };

  const toggleLike = async (postId) => {
    const isLiked = likedPosts.has(postId);
    setLikedPosts(prev => { const next = new Set(prev); isLiked ? next.delete(postId) : next.add(postId); return next; });
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    if (isLiked) {
      await sb.from('likes').delete({ post_id: postId, user_id: currentUser.id });
      await sb.from('posts').update({ likes: Math.max(0, (post.likes || 0) - 1) }, { id: postId });
    } else {
      await sb.from('likes').insert({ post_id: postId, user_id: currentUser.id });
      await sb.from('posts').update({ likes: (post.likes || 0) + 1 }, { id: postId });
    }
    loadPosts();
  };

  const toggleComments = (postId) => {
    setOpenComments(prev => { const next = new Set(prev); next.has(postId) ? next.delete(postId) : next.add(postId); return next; });
  };

  const cities = [...new Set(posts.map(p => p.city).filter(Boolean))];
  const filteredPosts = cityFilter === 'all' ? posts : posts.filter(p => p.city === cityFilter);
  const getRanking = () => {
    const s = [...users];
    if (rankTab === 'distance') s.sort((a, b) => (b.total_distance || 0) - (a.total_distance || 0));
    else if (rankTab === 'dominated') s.sort((a, b) => (b.dominated_distance || 0) - (a.dominated_distance || 0));
    else s.sort((a, b) => (b.dominated_area || 0) - (a.dominated_area || 0));
    return s;
  };
  const pace = runDist > 0 ? (runTime / 60) / runDist : 0;
  const paceStr = pace > 0 ? `${Math.floor(pace)}'${String(Math.round((pace % 1) * 60)).padStart(2, '0')}"` : `--'--"`;

  const navItems = [
    { id: 'map', icon: 'map', label: 'Mapa' },
    { id: 'ranking', icon: 'trophy', label: 'Ranking' },
    { id: 'discuss', icon: 'chat', label: 'Feed' },
    { id: 'profile', icon: 'user', label: 'Perfil' },
    ...(currentUser?.is_admin ? [{ id: 'admin', icon: 'shield', label: 'Admin' }] : []),
  ];

  const logout = () => { setCurrentUser(null); setScreen('landing'); setAuthMode(null); setRunning(false); setPosts([]); setUsers([]); setSavedTrails([]); };

  if (screen === 'landing') return (
    <>
      <style>{css}</style>
      <div className="landing">
        <div className="landing-bg" /><div className="landing-grid" />
        <div className="landing-content">
          <div className="landing-logo">DOMINA</div>
          <div className="landing-tagline">Conquiste as ruas. Domine o mapa.</div>
          <div className="landing-box">
            {!authMode && (<>
              <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 22, lineHeight: 1.7 }}>Corra, pedale e marque seu território no mapa real.</p>
              <button className="btn-full" onClick={() => { setAuthMode('login'); setError(''); }}>ENTRAR</button>
              <button className="btn-ghost" onClick={() => { setAuthMode('register'); setError(''); setSuccess(''); }}>Criar conta grátis</button>
            </>)}
            {authMode === 'login' && (<>
              <div className="modal-title">ENTRAR</div>
              <div className="modal-sub">Retome seu território.</div>
              {error && <div className="error-msg">{error}</div>}
              <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" placeholder="seu@email.com" value={loginData.email} onChange={e => setLoginData(p => ({ ...p, email: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Senha</label><input className="form-input" type="password" placeholder="••••••••" value={loginData.password} onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleLogin()} /></div>
              <button className="btn-full" onClick={handleLogin} disabled={loading}>{loading ? <Icon name="spinner" size={18} /> : 'ENTRAR'}</button>
              <button className="btn-ghost" onClick={() => { setAuthMode('register'); setError(''); }}>Criar conta</button>
              <button className="btn-ghost" style={{ marginTop: 4 }} onClick={() => setAuthMode(null)}>← Voltar</button>
            </>)}
            {authMode === 'register' && (<>
              <div className="modal-title">CADASTRO</div>
              <div className="modal-sub">Junte-se à disputa.</div>
              {error && <div className="error-msg">{error}</div>}
              {success && <div className="success-msg">{success}</div>}
              <div className="form-row">
                <div className="form-group"><label className="form-label">Nome</label><input className="form-input" placeholder="Seu nome" value={regData.name} onChange={e => setRegData(p => ({ ...p, name: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Idade</label><input className="form-input" type="number" placeholder="25" value={regData.age} onChange={e => setRegData(p => ({ ...p, age: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label className="form-label">Cidade</label><input className="form-input" placeholder="São Paulo" value={regData.city} onChange={e => setRegData(p => ({ ...p, city: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" placeholder="seu@email.com" value={regData.email} onChange={e => setRegData(p => ({ ...p, email: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Senha</label><input className="form-input" type="password" placeholder="Mínimo 6 caracteres" value={regData.password} onChange={e => setRegData(p => ({ ...p, password: e.target.value }))} /></div>
              <button className="btn-full" onClick={handleRegister} disabled={loading}>{loading ? <Icon name="spinner" size={18} /> : 'CRIAR CONTA'}</button>
              <button className="btn-ghost" onClick={() => { setAuthMode('login'); setError(''); setSuccess(''); }}>Já tenho conta</button>
            </>)}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      {notif && <div className="notif"><Icon name="check" size={15} />{notif}</div>}
      <div className="app">
        {/* DESKTOP SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-logo"><div className="logo-title">DOMINA</div><div className="logo-sub">Domine as ruas</div></div>
          {navItems.map(item => (
            <button key={item.id} className={`nav-item${page === item.id ? ' active' : ''}`} onClick={() => setPage(item.id)}>
              <Icon name={item.icon} size={18} />{item.label}
            </button>
          ))}
          <div className="sidebar-bottom">
            <div className="user-chip" onClick={() => setPage('profile')}>
              <div className="avatar" style={{ width: 34, height: 34, fontSize: 14, background: (currentUser?.color || '#FF4D00') + '28', color: currentUser?.color || '#FF4D00' }}>{getInitials(currentUser?.name)}</div>
              <div><div className="user-chip-name">{currentUser?.name?.split(' ')[0]}</div><div className="user-chip-role">{currentUser?.is_admin ? 'Admin' : 'Corredor'}</div></div>
            </div>
            <button className="nav-item" style={{ marginTop: 6 }} onClick={logout}><Icon name="logout" size={18} />Sair</button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="main">
          {/* MOBILE TOP BAR */}
          <div className="top-bar">
            <div className="top-bar-logo">DOMINA</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="top-bar-avatar" style={{ background: (currentUser?.color || '#FF4D00') + '28', color: currentUser?.color || '#FF4D00' }} onClick={() => setPage('profile')}>
                {getInitials(currentUser?.name)}
              </div>
              <button onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4 }}>
                <Icon name="logout" size={18} />
              </button>
            </div>
          </div>

          {/* MAP */}
          {page === 'map' && (<>
            <LiveMap currentUser={currentUser} running={running} onTrailUpdate={pts => setCurrentTrail(pts)} savedTrails={savedTrails} />
            {!running ? (
              <div className="start-panel">
                <div className="activity-toggle">
                  <button className={`activity-btn${activityType === 'run' ? ' active' : ''}`} onClick={() => setActivityType('run')}><Icon name="run" size={13} /> Corrida</button>
                  <button className={`activity-btn${activityType === 'bike' ? ' active' : ''}`} onClick={() => setActivityType('bike')}><Icon name="bike" size={13} /> Bike</button>
                </div>
                <button className="start-btn" onClick={startRun}><Icon name="play" size={16} /> START</button>
              </div>
            ) : (
              <div className="run-panel">
                <div className="live-badge"><div className="live-dot" /><span className="live-text">LIVE</span></div>
                <div className="run-stat"><div className="run-stat-value">{formatTime(runTime)}</div><div className="run-stat-label">Tempo</div></div>
                <div className="run-divider" />
                <div className="run-stat"><div className="run-stat-value">{runDist.toFixed(2)}</div><div className="run-stat-label">km</div></div>
                <div className="run-divider" />
                <div className="run-stat"><div className="run-stat-value">{paceStr}</div><div className="run-stat-label">Ritmo</div></div>
                <div className="run-divider" />
                <button className="stop-btn" onClick={stopRun}><Icon name="stop" size={18} /></button>
              </div>
            )}
          </>)}

          {/* RANKING */}
          {page === 'ranking' && (
            <div className="page">
              <div className="page-title">RANKING</div>
              <div className="page-sub">Os maiores conquistadores</div>
              <div className="rank-tabs">
                <button className={`rank-tab${rankTab === 'distance' ? ' active' : ''}`} onClick={() => setRankTab('distance')}>Distância</button>
                <button className={`rank-tab${rankTab === 'dominated' ? ' active' : ''}`} onClick={() => setRankTab('dominated')}>Dominado</button>
                <button className={`rank-tab${rankTab === 'area' ? ' active' : ''}`} onClick={() => setRankTab('area')}>Área</button>
              </div>
              {getRanking().map((u, i) => (
                <div key={u.id} className="rank-item">
                  <div className={`rank-number${i === 0 ? ' gold' : i === 1 ? ' silver' : i === 2 ? ' bronze' : ''}`}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</div>
                  <div className="avatar" style={{ width: 36, height: 36, fontSize: 14, background: (u.color || '#888') + '25', color: u.color || '#888' }}>{getInitials(u.name)}</div>
                  <div className="rank-info">
                    <div className="rank-name">{u.name}{u.id === currentUser.id && <span style={{ fontSize: 10, color: 'var(--accent)', marginLeft: 4 }}>você</span>}</div>
                    <div className="rank-city">{u.city}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="rank-value" style={{ color: u.color || '#888' }}>{rankTab === 'distance' ? Number(u.total_distance || 0).toFixed(1) : rankTab === 'dominated' ? Number(u.dominated_distance || 0).toFixed(1) : Number(u.dominated_area || 0).toFixed(2)}</div>
                    <div className="rank-unit">{rankTab === 'area' ? 'km²' : 'km'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* DISCUSSION */}
          {page === 'discuss' && (
            <div className="page">
              <div className="page-title">DISCUSSÃO</div>
              <div className="page-sub">Fale com a comunidade</div>
              <div className="post-compose">
                <textarea className="post-textarea" placeholder="Compartilhe sua conquista, desafio ou dica..." value={postText} onChange={e => setPostText(e.target.value)} />
                <div className="post-actions">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div className="loc-badge"><Icon name="location" size={11} />{currentUser.city}</div>
                    <div className="city-filter">Filtrar: <select className="city-select" value={cityFilter} onChange={e => setCityFilter(e.target.value)}><option value="all">Todas</option>{cities.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  </div>
                  <button className="btn-primary" onClick={handlePost} disabled={loading}>{loading ? <Icon name="spinner" size={14} /> : null}Publicar</button>
                </div>
              </div>
              {filteredPosts.map(post => (
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <div className="avatar" style={{ width: 34, height: 34, fontSize: 13, background: (post.user_color || '#888') + '25', color: post.user_color || '#888' }}>{getInitials(post.user_name)}</div>
                    <div><div className="post-name">{post.user_name}</div><div className="post-meta"><Icon name="location" size={10} />{post.city}</div></div>
                    <div className="post-time">{timeAgo(post.created_at)}</div>
                  </div>
                  <div className="post-text">{post.text}</div>
                  <div className="post-footer">
                    <button className={`post-action-btn${likedPosts.has(post.id) ? ' liked' : ''}`} onClick={() => toggleLike(post.id)}><Icon name={likedPosts.has(post.id) ? 'heartF' : 'heart'} size={15} />{post.likes || 0}</button>
                    <button className={`post-action-btn${openComments.has(post.id) ? ' commented' : ''}`} onClick={() => toggleComments(post.id)}><Icon name="comment" size={15} />{(post.comments || []).length}</button>
                  </div>
                  {openComments.has(post.id) && (
                    <div className="comments-section">
                      {(post.comments || []).length === 0 && <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>Seja o primeiro a comentar.</p>}
                      {(post.comments || []).map(c => (
                        <div key={c.id} className="comment">
                          <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, background: (c.user_color || '#888') + '25', color: c.user_color || '#888', flexShrink: 0 }}>{getInitials(c.user_name)}</div>
                          <div className="comment-body"><div className="comment-author" style={{ color: c.user_color || '#888' }}>{c.user_name}</div><div className="comment-text">{c.text}</div><div className="comment-time">{timeAgo(c.created_at)}</div></div>
                        </div>
                      ))}
                      <div className="comment-input-row">
                        <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, background: currentUser.color + '25', color: currentUser.color, flexShrink: 0 }}>{getInitials(currentUser.name)}</div>
                        <input className="comment-input" placeholder="Comentar..." value={commentTexts[post.id] || ''} onChange={e => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleComment(post.id)} />
                        <button className="send-btn" onClick={() => handleComment(post.id)}><Icon name="send" size={13} /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* PROFILE */}
          {page === 'profile' && (
            <div className="page">
              <div className="page-title">PERFIL</div>
              <div className="profile-header">
                <div className="avatar" style={{ width: 76, height: 76, fontSize: 30, background: currentUser.color + '28', color: currentUser.color }}>{getInitials(currentUser.name)}</div>
                <div className="profile-info">
                  <div className="profile-name">{currentUser.name}</div>
                  <div className="profile-loc"><Icon name="location" size={13} />{currentUser.city} · {currentUser.age} anos</div>
                  {currentUser.is_admin && <div className="admin-badge"><Icon name="shield" size={10} /> ADMIN</div>}
                </div>
              </div>
              <div className="profile-stats">
                <div className="stat-card"><div className="stat-card-value" style={{ color: currentUser.color }}>{Number(currentUser.total_distance || 0).toFixed(1)}</div><div className="stat-card-label">km corridos</div></div>
                <div className="stat-card"><div className="stat-card-value" style={{ color: currentUser.color }}>{Number(currentUser.dominated_distance || 0).toFixed(1)}</div><div className="stat-card-label">km dominados</div></div>
                <div className="stat-card"><div className="stat-card-value" style={{ color: currentUser.color }}>{Number(currentUser.dominated_area || 0).toFixed(2)}</div><div className="stat-card-label">km² área</div></div>
              </div>
              <div className="card" style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Strava</div>
                {!stravaToken ? (
                  <button onClick={connectStrava} style={{ width: '100%', padding: '12px', background: '#FC4C02', border: 'none', borderRadius: 12, color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/></svg>
                    Conectar com Strava
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--green)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#00E676"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/></svg>
                      Strava conectado
                    </div>
                    <button onClick={importFromStrava} disabled={stravaLoading} style={{ width: '100%', padding: '11px', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', border: 'none', borderRadius: 12, color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: stravaLoading ? 0.6 : 1 }}>
                      {stravaLoading ? 'Buscando...' : 'Importar atividades do Strava'}
                    </button>
                    <button onClick={() => { localStorage.removeItem('strava_token'); setStravaToken(null); }} style={{ width: '100%', padding: '9px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--muted)', fontSize: 13, cursor: 'pointer' }}>
                      Desconectar Strava
                    </button>
                  </div>
                )}
              </div>
              <div className="card">
                <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Linha do tempo</div>
                <div className="timeline-grid">{Array.from({ length: 9 }).map((_, i) => <div key={i} className="timeline-item"><Icon name="camera" size={18} /></div>)}</div>
                <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginTop: 14 }}>Fotos aparecerão aqui</p>
              </div>
            </div>
          )}

          {/* ADMIN */}
          {page === 'admin' && currentUser?.is_admin && (
            <div className="page">
              <div className="page-title">ADMIN</div>
              <div className="page-sub">{users.length} usuários · {posts.length} posts</div>
              <div className="admin-section">
                <div className="admin-section-title">USUÁRIOS</div>
                <div className="card" style={{ padding: 0, overflow: 'auto' }}>
                  <table className="admin-table">
                    <thead><tr><th>Cor</th><th>Nome</th><th>Email</th><th>Cidade</th><th>km</th><th>Dom.</th><th>Tipo</th></tr></thead>
                    <tbody>{users.map(u => <tr key={u.id}><td><span className="color-dot" style={{ background: u.color }} /></td><td style={{ fontWeight: 600 }}>{u.name}</td><td style={{ color: 'var(--muted)', fontSize: 12 }}>{u.email}</td><td>{u.city}</td><td>{Number(u.total_distance || 0).toFixed(1)}</td><td>{Number(u.dominated_distance || 0).toFixed(1)}</td><td><span className={`badge ${u.is_admin ? 'badge-admin' : 'badge-user'}`}>{u.is_admin ? 'Admin' : 'User'}</span></td></tr>)}</tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* MOBILE BOTTOM NAV */}
        <nav className="bottom-nav">
          <div className="bottom-nav-inner">
            {navItems.map(item => (
              <button key={item.id} className={`bottom-nav-item${page === item.id ? ' active' : ''}`} onClick={() => setPage(item.id)}>
                <Icon name={item.icon} size={22} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>

      {/* STRAVA IMPORT MODAL */}
      {showStravaModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <div>
                <div className="modal-title">IMPORTAR DO STRAVA</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{stravaActivities.length} atividades disponíveis</div>
              </div>
              <button onClick={() => setShowStravaModal(false)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><Icon name="close" size={20} /></button>
            </div>
            {stravaActivities.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>Todas as atividades já foram importadas! ✅</p>
            ) : (
              <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stravaActivities.map(a => (
                  <div key={a.id} style={{ background: 'var(--surface2)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 20 }}>{a.type === 'Run' ? '🏃' : '🚴'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{(a.distance / 1000).toFixed(2)}km · {Math.floor(a.moving_time / 60)}min · {new Date(a.start_date).toLocaleDateString('pt-BR')}</div>
                    </div>
                    <button onClick={() => importActivity(a)} style={{ padding: '7px 14px', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', border: 'none', borderRadius: 9, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                      Importar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FINISH MODAL */}
      {modal === 'finish' && finishData && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <div><div className="modal-title">CONCLUÍDA</div><div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{finishData.type === 'run' ? '🏃 Corrida' : '🚴 Bike'}</div></div>
              <button onClick={() => { setModal(null); setFinishData(null); }} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}><Icon name="close" size={20} /></button>
            </div>
            <div className="finish-stats">
              <div className="finish-stat"><div className="finish-stat-val">{formatTime(finishData.time)}</div><div className="finish-stat-lbl">Tempo</div></div>
              <div className="finish-stat"><div className="finish-stat-val">{finishData.dist.toFixed(2)}</div><div className="finish-stat-lbl">km</div></div>
              <div className="finish-stat"><div className="finish-stat-val" style={{ color: 'var(--accent)' }}>{(finishData.dist * 0.6).toFixed(2)}</div><div className="finish-stat-lbl">km dom.</div></div>
            </div>
            <div className="photo-area"><Icon name="camera" size={22} /><div style={{ marginTop: 8 }}>Adicionar foto (opcional)</div></div>
            <button className="btn-full" style={{ marginTop: 16 }} onClick={handleFinish} disabled={loading}>{loading ? <Icon name="spinner" size={18} /> : 'SALVAR ATIVIDADE'}</button>
          </div>
        </div>
      )}
    </>
  );
}
