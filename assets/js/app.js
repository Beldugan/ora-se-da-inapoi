/* ==========================================================================
   app.js — interfața: timpul, ceasurile, cerul, laboratorul planetei,
   povestea nopții schimbării, graficul anului și testul.
   ========================================================================== */
(function () {
  'use strict';
  const A = window.Astro, L = window.I18N, t_ = L.t, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const H = 3600000, MIN = 60000, DAY = A.DAY;

  /* ---------------- starea aplicației ---------------- */
  const CITIES = {
    london:    { lat: 51.5074, lon: -0.1278, zone: 'uk', ro: 'Londra', en: 'London' },
    edinburgh: { lat: 55.9533, lon: -3.1883, zone: 'uk', ro: 'Edinburgh', en: 'Edinburgh' },
    lerwick:   { lat: 60.1550, lon: -1.1450, zone: 'uk', ro: 'Lerwick (Shetland)', en: 'Lerwick (Shetland)' },
    penzance:  { lat: 50.1180, lon: -5.5370, zone: 'uk', ro: 'Penzance (Cornwall)', en: 'Penzance (Cornwall)' },
    bucuresti: { lat: 44.4268, lon: 26.1025, zone: 'ro', ro: 'București', en: 'Bucharest' }
  };
  const SPEEDS = [['real', 1], ['m', 60], ['10m', 600], ['h', 3600], ['6h', 21600], ['d', 86400], ['w', 604800], ['mo', 2629800]];
  const st = {
    model: new A.Model(), t: Date.now(), playing: true, speed: 600,
    cityKey: 'london', city: Object.assign({}, CITIES.london),
    tab: 'planet', rule: 'eu', yearRule: 'eu', storyIdx: 0, precAnim: false
  };
  const cityName = () => (st.city.customLat !== undefined ? (L.lang === 'en' ? 'City' : 'Orașul') + ' ' + st.city.lat.toFixed(1) + '°' : CITIES[st.cityKey][L.lang]);
  const pad = n => String(n).padStart(2, '0');
  const months = () => t_('months').split(','), days = () => t_('days').split(',');
  function fmtWall(t, withSec) { const w = A.wall(t, st.city.zone, st.rule); return pad(w.h) + ':' + pad(w.m) + (withSec ? ':' + pad(w.s) : ''); }
  function fmtWallZ(t) { const w = A.wall(t, st.city.zone, st.rule); return pad(w.h) + ':' + pad(w.m) + ' ' + w.name; }
  function fmtDate(t, long) { const w = A.wall(t, st.city.zone, st.rule); return (long ? days()[w.wd] + ', ' : '') + w.day + ' ' + months()[w.mo] + ' ' + w.y; }
  function fmtDur(min) { if (!isFinite(min)) return '∞'; const h = Math.floor(min / 60), m = Math.round(min % 60); return h + ' h ' + pad(m) + ' min'; }

  /* ---------------- globul ---------------- */
  let globe = null, ready = false;
  try {
    globe = new window.Globe($('#stagePlanet'), () => { ready = true; $('#loading').classList.add('hidden'); });
  } catch (e) {
    $('#loading').innerHTML = '<span>WebGL nu este disponibil în acest browser. / WebGL is not available.</span>';
    console.error(e);
  }

  /* ---------------- toast ---------------- */
  let toastTimer = 0;
  function toast(html, ms) {
    $$('.toast').forEach(el => { el.innerHTML = html; el.classList.add('show'); });
    clearTimeout(toastTimer); toastTimer = setTimeout(() => $$('.toast').forEach(el => el.classList.remove('show')), ms || 3200);
  }

  /* ==========================================================================
     Ceasuri analogice
     ========================================================================== */
  function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#000'; }
  function drawClock(cv, hours, opt) {
    const g = cv.getContext('2d'), W = cv.width, R = W / 2 - 6, c = W / 2;
    opt = opt || {};
    g.clearRect(0, 0, W, W);
    const face = css('--clock-face'), ink = css('--clock-ink');
    // fundal: zi/noapte după Soare
    const grd = g.createRadialGradient(c, c, R * 0.2, c, c, R);
    grd.addColorStop(0, face); grd.addColorStop(1, opt.ring || face);
    g.fillStyle = grd; g.beginPath(); g.arc(c, c, R, 0, Math.PI * 2); g.fill();
    g.lineWidth = W * 0.035; g.strokeStyle = opt.rim || '#1f6feb'; g.stroke();
    // gradații
    for (let i = 0; i < 60; i++) {
      const a = i / 60 * Math.PI * 2, big = i % 5 === 0;
      g.strokeStyle = ink; g.lineWidth = big ? W * 0.014 : W * 0.005;
      g.beginPath(); g.moveTo(c + Math.sin(a) * R * (big ? 0.8 : 0.86), c - Math.cos(a) * R * (big ? 0.8 : 0.86));
      g.lineTo(c + Math.sin(a) * R * 0.92, c - Math.cos(a) * R * 0.92); g.stroke();
    }
    g.fillStyle = ink; g.font = `600 ${W * 0.085}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2; g.fillText(i, c + Math.sin(a) * R * 0.66, c - Math.cos(a) * R * 0.66); }
    if (opt.badge) {
      g.font = `700 ${W * 0.07}px system-ui, sans-serif`;
      const bw = g.measureText(opt.badge).width + W * 0.06;
      g.fillStyle = opt.badgeBg || '#5aa0ff'; roundRect(g, c - bw / 2, c + R * 0.28, bw, W * 0.1, W * 0.05); g.fill();
      g.fillStyle = opt.badgeInk || '#001a3a'; g.fillText(opt.badge, c, c + R * 0.28 + W * 0.052);
    }
    if (opt.icon) { g.font = `${W * 0.1}px system-ui`; g.fillText(opt.icon, c, c - R * 0.33); }
    const h12 = ((hours % 12) + 12) % 12, mins = ((hours * 60) % 60 + 60) % 60, secs = ((hours * 3600) % 60 + 60) % 60;
    hand(g, c, h12 / 12, R * 0.5, W * 0.035, ink);
    hand(g, c, mins / 60, R * 0.76, W * 0.022, ink);
    if (opt.sec) hand(g, c, secs / 60, R * 0.82, W * 0.008, '#e5484d');
    g.fillStyle = opt.rim || '#1f6feb'; g.beginPath(); g.arc(c, c, W * 0.03, 0, Math.PI * 2); g.fill();
  }
  function hand(g, c, f, len, w, col) {
    const a = f * Math.PI * 2; g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round';
    g.beginPath(); g.moveTo(c - Math.sin(a) * len * 0.12, c + Math.cos(a) * len * 0.12); g.lineTo(c + Math.sin(a) * len, c - Math.cos(a) * len); g.stroke();
  }
  function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

  /* ==========================================================================
     Cerul deasupra orașului
     ========================================================================== */
  let dayPathCache = { key: '', pts: [] };
  function drawSky(cv, alt, az) {
    const g = cv.getContext('2d'), W = cv.width, Hh = cv.height, hor = Hh * 0.78;
    // culoarea cerului după înălțimea Soarelui
    const k = Math.max(-1, Math.min(1, alt / 12));
    let top, bot;
    if (alt > 6) { top = '#2f7fe0'; bot = '#a9d4ff'; }
    else if (alt > -1) { top = '#3d5fa8'; bot = '#ffb36b'; }
    else if (alt > -12) { top = '#1b2350'; bot = '#7a4b7a'; }
    else { top = '#050816'; bot = '#141a3a'; }
    const gr = g.createLinearGradient(0, 0, 0, hor); gr.addColorStop(0, top); gr.addColorStop(1, bot);
    g.fillStyle = gr; g.fillRect(0, 0, W, hor);
    if (alt < -6) { g.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 40; i++) { const x = (i * 97) % W, y = (i * 53) % (hor - 10); g.fillRect(x, y, 1.5, 1.5); } }
    g.fillStyle = '#2f5d2f'; g.fillRect(0, hor, W, Hh - hor);
    g.fillStyle = '#244a24'; for (let x = 0; x < W; x += 22) { g.beginPath(); g.arc(x + 8, hor + 2, 9, Math.PI, 0); g.fill(); }
    const X = a => ((a % 360) + 360) % 360 / 360 * W;           // N(0) … E(90) … S(180) … V(270) … N(360)
    const Y = h => hor - (h / 90) * (hor - 10);
    // drumul Soarelui în ziua curentă
    const key = dayKey() + '|' + st.cityKey + st.city.lat;
    if (dayPathCache.key !== key) {
      const t0 = A.localMidnight(st.t, st.city.zone, st.rule), pts = [];
      for (let i = 0; i <= 144; i++) { const p = st.model.sunAltAz(t0 + i * 10 * MIN, st.city.lat, st.city.lon); pts.push(p); }
      dayPathCache = { key, pts };
    }
    g.setLineDash([4, 4]); g.strokeStyle = 'rgba(255,230,140,.75)'; g.lineWidth = 1.5; g.beginPath();
    let prevX = null;
    dayPathCache.pts.forEach(p => { const x = X(p.az), y = Y(p.alt); if (prevX === null || Math.abs(x - prevX) > W / 2) g.moveTo(x, y); else g.lineTo(x, y); prevX = x; });
    g.stroke(); g.setLineDash([]);
    // punctele cardinale
    g.fillStyle = '#fff'; g.font = '600 13px system-ui'; g.textAlign = 'center';
    [['N', 0], ['E', 90], ['S', 180], ['W', 270]].forEach(([d, a]) => g.fillText(t_('sky.' + d), X(a) || 10, Hh - 6));
    g.fillText(t_('sky.N'), W - 8, Hh - 6);
    // Soarele
    const sx = X(az), sy = Y(Math.max(alt, -8));
    const sg = g.createRadialGradient(sx, sy, 0, sx, sy, 26); sg.addColorStop(0, 'rgba(255,240,180,1)'); sg.addColorStop(0.35, 'rgba(255,200,80,.9)'); sg.addColorStop(1, 'rgba(255,160,40,0)');
    g.save(); g.beginPath(); g.rect(0, 0, W, hor); g.clip(); g.fillStyle = sg; g.beginPath(); g.arc(sx, sy, 26, 0, Math.PI * 2); g.fill(); g.restore();
    g.fillStyle = 'rgba(255,255,255,.9)'; g.font = '12px system-ui'; g.textAlign = 'left'; g.fillText(t_('sky.title'), 8, 16);
  }
  function dayKey() { const w = A.wall(st.t, st.city.zone, st.rule); return w.y + '-' + w.mo + '-' + w.day + '|' + paramKey(); }
  function paramKey() { const p = st.model.p; return [p.tilt, p.rotH, p.dir, p.yearD, p.ecc, st.model.precOffset.toFixed(1), st.city.lat, st.city.lon, st.rule].join(','); }

  /* ==========================================================================
     Fapte (răsărit, apus…) — recalculate doar când se schimbă ziua
     ========================================================================== */
  let factCache = { key: '', rs: null };
  function compass(az) { const d = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']; return t_('dir.' + d[Math.round(az / 45) % 8]); }
  function seasonOf(s) {
    if (st.model.p.tilt < 3 || st.model.p.tilt > 177) return t_('season.none');
    return t_('season.' + Math.floor(A.norm360(s.lam) / 90));
  }
  function updateFacts(s, aa) {
    const key = dayKey();
    if (factCache.key !== key) {
      const t0 = A.localMidnight(st.t, st.city.zone, st.rule);
      factCache = { key, rs: st.model.riseSet(t0, st.city.lat, st.city.lon, DAY) };
    }
    const rs = factCache.rs;
    let rise = rs.rise ? fmtWall(rs.rise) : (rs.daylightMin > 700 ? t_('f.polarDay') : t_('f.polarNight'));
    let set = rs.set ? fmtWall(rs.set) : (rs.daylightMin > 700 ? t_('f.polarDay') : t_('f.polarNight'));
    if (!rs.rise && !rs.set) { rise = set = rs.daylightMin > 700 ? t_('f.polarDay') : t_('f.polarNight'); }
    const solar = st.model.solarTime(st.t, st.city.lon, s);
    const w = A.wall(st.t, st.city.zone, st.rule), wallH = w.h + w.m / 60 + w.s / 3600;
    let diff = (wallH - solar) * 60; diff = ((diff + 720) % 1440 + 1440) % 1440 - 720;
    const sign = diff >= 0 ? '+' : '−', ad = Math.abs(diff);
    $('#facts').innerHTML = [
      ['f.alt', aa.alt.toFixed(1) + '°' + (aa.alt > 0 ? ' ☀️' : aa.alt > -6 ? ' 🌆' : ' 🌙')],
      ['f.az', Math.round(aa.az) + '° ' + compass(aa.az)],
      ['f.rise', rise], ['f.set', set], ['f.len', fmtDur(rs.daylightMin)],
      ['f.diff', sign + (ad >= 59.5 ? Math.floor(Math.round(ad) / 60) + ' h ' + pad(Math.round(ad) % 60) : Math.round(ad)) + ' min'],
      ['f.dist', t_('mkm', { v: (s.r * 149.6).toFixed(1).replace('.', L.lang === 'ro' ? ',' : '.') })],
      ['f.season', seasonOf(s)]
    ].map(([k, v]) => `<dt>${t_(k)}</dt><dd>${v}</dd>`).join('');
  }

  /* ==========================================================================
     Bara timpului
     ========================================================================== */
  function buildTimebar() {
    $('#speeds').innerHTML = SPEEDS.map(([k, v]) => `<button class="chip${st.speed === v ? ' on' : ''}" data-sp="${v}">${t_('speed.' + k)}</button>`).join('');
    $$('#speeds .chip').forEach(b => b.onclick = () => { st.speed = +b.dataset.sp; st.playing = true; syncPlay(); buildTimebar(); });
    const J = [
      ['now', () => { st.t = Date.now(); st.speed = 1; }],
      ['change', () => { st.t = Date.UTC(2026, 9, 25, 0, 55); st.speed = 60; st.playing = true; }],
      ['hall', () => { st.t = Date.UTC(2026, 9, 31, 17, 0); st.speed = 600; }],
      ['win', () => { st.t = Date.UTC(2026, 11, 21, 12, 0); }],
      ['sum', () => { st.t = Date.UTC(2026, 5, 21, 11, 0); }],
      ['eq', () => { st.t = Date.UTC(2026, 2, 20, 12, 0); }],
      ['spring', () => { st.t = Date.UTC(2026, 2, 29, 0, 55); st.speed = 60; st.playing = true; }]
    ];
    $('#jumps').innerHTML = J.map(([k], i) => `<button class="chip" data-j="${i}">${t_('jump.' + k)}</button>`).join('');
    $$('#jumps .chip').forEach(b => b.onclick = () => { J[+b.dataset.j][1](); lastSummer = A.euSummer(st.t); syncPlay(); buildTimebar(); });
  }
  function syncPlay() { $('#playBtn').textContent = st.playing ? '⏸' : '▶'; }
  $('#playBtn').onclick = () => { st.playing = !st.playing; syncPlay(); };
  $('#dtInput').addEventListener('change', e => {
    const v = e.target.value; if (!v) return;
    const [d, tm] = v.split('T'), [y, mo, da] = d.split('-').map(Number), [hh, mi] = tm.split(':').map(Number);
    let guess = Date.UTC(y, mo - 1, da, hh, mi);
    const off = A.zoneOffset(guess - 3 * H, st.city.zone, st.rule).off;   // prima apariție, dacă ora se repetă
    st.t = guess - off * H; lastSummer = A.euSummer(st.t);
  });
  $('#yearScrub').addEventListener('input', e => {
    const y = new Date(st.t).getUTCFullYear(), w = A.wall(st.t, st.city.zone, st.rule);
    const base = Date.UTC(y, 0, 1) + (+e.target.value) * DAY;
    st.t = base; lastSummer = A.euSummer(st.t); scrubbing = true;
  });
  $('#yearScrub').addEventListener('change', () => { scrubbing = false; });
  let scrubbing = false;

  /* ==========================================================================
     Orașul
     ========================================================================== */
  function buildCities() {
    $('#citySel').innerHTML = Object.keys(CITIES).map(k => `<option value="${k}"${k === st.cityKey ? ' selected' : ''}>${CITIES[k][L.lang]}</option>`).join('');
  }
  $('#citySel').onchange = e => { st.cityKey = e.target.value; st.city = Object.assign({}, CITIES[st.cityKey]); buildLab(); invalidate(); };
  function invalidate() { factCache.key = ''; dayPathCache.key = ''; yearCache.key = ''; }

  /* ==========================================================================
     Laboratorul planetei
     ========================================================================== */
  const logMap = (min, max) => ({ to: v => Math.log(v / min) / Math.log(max / min), from: s => min * Math.pow(max / min, s) });
  const ROT = logMap(2, 2400), YEAR = logMap(20, 3000);
  function fmtNum(v, d) { return v.toFixed(d).replace('.', L.lang === 'ro' ? ',' : '.'); }
  function fmtHours(h) { if (h < 48) { const tm = Math.round(h * 60), hh = Math.floor(tm / 60), mm = tm % 60; return hh + ' h ' + pad(mm) + ' min'; } return fmtNum(h / 24, 1) + (L.lang === 'ro' ? ' zile' : ' days'); }
  function buildLab() {
    const p = st.model.p;
    $('#presets').innerHTML = ['earth', 'flat', 'uranus', 'mars', 'd30', 'retro', 'egg'].map(k => `<button class="chip" data-pre="${k}">${t_('pre.' + k)}</button>`).join('');
    $$('#presets .chip').forEach(b => b.onclick = () => preset(b.dataset.pre));
    $('#labCtl').innerHTML = `
      <div class="row"><span>${t_('lab.tilt')}</span><output id="oTilt"></output>
        <input type="range" id="sTilt" min="0" max="180" step="0.1" value="${p.tilt}"><span class="hint">${t_('lab.tilt.h')}</span></div>
      <div class="row"><span>${t_('lab.rot')}</span><output id="oRot"></output>
        <input type="range" id="sRot" min="0" max="1" step="0.0005" value="${ROT.to(p.rotH)}"><span class="hint">${t_('lab.rot.h')}</span></div>
      <div class="row"><span>${t_('lab.dir')}</span><span></span>
        <div class="toggles2" style="grid-column:1/-1"><button class="chip${p.dir > 0 ? ' on' : ''}" data-dir="1">${t_('lab.dir.n')}</button><button class="chip${p.dir < 0 ? ' on' : ''}" data-dir="-1">${t_('lab.dir.r')}</button></div></div>
      <div class="row"><span>${t_('lab.year')}</span><output id="oYear"></output>
        <input type="range" id="sYear" min="0" max="1" step="0.0005" value="${YEAR.to(p.yearD)}"><span class="hint">${t_('lab.year.h')}</span></div>
      <div class="row"><span>${t_('lab.ecc')}</span><output id="oEcc"></output>
        <input type="range" id="sEcc" min="0" max="0.7" step="0.001" value="${p.ecc}"><span class="hint">${t_('lab.ecc.h')}</span></div>
      <div class="row"><span>${t_('lab.prec')}</span><output id="oPrec"></output>
        <input type="range" id="sPrec" min="-180" max="180" step="0.5" value="${A.norm180(st.model.precOffset)}"><span class="hint">${t_('lab.prec.h')}</span>
        <label class="small" style="grid-column:1/-1"><input type="checkbox" id="cPrec"${st.precAnim ? ' checked' : ''}> ${t_('lab.precAnim')}</label></div>
      <div class="row"><span>${t_('lab.lat')}</span><output id="oLat"></output>
        <input type="range" id="sLat" min="-89" max="89" step="0.1" value="${st.city.lat}"><span class="hint">${t_('lab.lat.h')}</span></div>
      <button class="btn" id="labReset">${t_('lab.reset')}</button>`;
    const on = (id, fn) => $(id).addEventListener('input', e => { fn(+e.target.value); outputs(); invalidate(); });
    on('#sTilt', v => st.model.set(st.t, { tilt: v }));
    on('#sRot', v => st.model.set(st.t, { rotH: ROT.from(v) }));
    on('#sYear', v => st.model.set(st.t, { yearD: YEAR.from(v) }));
    on('#sEcc', v => st.model.set(st.t, { ecc: v }));
    on('#sPrec', v => { st.model.precOffset = v; });
    on('#sLat', v => { st.city.lat = v; st.city.customLat = true; });
    $('#cPrec').onchange = e => { st.precAnim = e.target.checked; };
    $$('[data-dir]').forEach(b => b.onclick = () => { st.model.set(st.t, { dir: +b.dataset.dir }); buildLab(); invalidate(); });
    $('#labReset').onclick = () => preset('earth');
    $('#challenges').innerHTML = [1, 2, 3, 4, 5, 6].map(i => `<button data-ch="${i}">${t_('ch.' + i)}</button>`).join('');
    $$('[data-ch]').forEach(b => b.onclick = () => challenge(+b.dataset.ch));
    outputs();
  }
  function outputs() {
    const p = st.model.p;
    $('#oTilt').textContent = fmtNum(p.tilt, 1) + '°';
    $('#oRot').textContent = fmtHours(p.rotH);
    $('#oYear').textContent = fmtNum(p.yearD, p.yearD < 100 ? 1 : 0) + (L.lang === 'ro' ? ' zile' : ' days');
    $('#oEcc').textContent = fmtNum(p.ecc, 3);
    $('#oPrec').textContent = fmtNum(A.norm180(st.model.precOffset), 0) + '°';
    $('#oLat').textContent = fmtNum(st.city.lat, 1) + '°';
    derived();
  }
  function derived() {
    const p = st.model.p, sd = st.model.solarDayH();
    const w = p.dir / p.rotH - 1 / (p.yearD * 24);
    const tilt = p.tilt > 90 ? 180 - p.tilt : p.tilt;
    const seas = tilt < 3 ? t_('der.no') : (tilt > 54 ? t_('der.extreme') : t_('der.yes'));
    $('#derived').innerHTML = [
      t_('der.solar', { v: isFinite(sd) ? fmtHours(sd) : t_('der.infinite') }),
      t_('der.perYear', { v: isFinite(sd) ? fmtNum(p.yearD * 24 / sd, 1) : '0' }),
      t_('der.risesIn', { v: w >= 0 ? t_('der.east') : t_('der.west') }),
      t_('der.seasons', { v: seas }),
      `<span class="${st.model.isEarth() ? '' : 'warn'}">${st.model.isEarth() ? t_('der.earth') : t_('der.notEarth')}</span>`
    ].map(x => `<div>${x}</div>`).join('');
  }
  function preset(k) {
    const E = A.EARTH, m = st.model;
    if (k === 'earth') { m.p = Object.assign({}, E); m.precOffset = 0; m.resetAnchor(); st.precAnim = false; if (st.city.customLat) st.city = Object.assign({}, CITIES[st.cityKey]); }
    else if (k === 'flat') m.set(st.t, { tilt: 0 });
    else if (k === 'uranus') m.set(st.t, { tilt: 97.8 });
    else if (k === 'mars') m.set(st.t, { tilt: 25.19, rotH: 24.623, yearD: 686.98, ecc: 0.0934, dir: 1 });
    else if (k === 'd30') m.set(st.t, { rotH: 1 / (1 / 30 + 1 / (m.p.yearD * 24)), dir: 1 });
    else if (k === 'retro') m.set(st.t, { dir: -1 });
    else if (k === 'egg') m.set(st.t, { ecc: 0.45 });
    buildLab(); invalidate();
  }
  function setView(v) { globe && globe.setView(v); $$('#viewSeg button').forEach(b => b.classList.toggle('on', b.dataset.view === v)); st.view = v; labelFollow(); }
  function setFollow(f) { if (globe) globe.opts.follow = f; $$('#followSeg button').forEach(b => b.classList.toggle('on', b.dataset.follow === f)); }
  function challenge(i) {
    preset('earth');
    if (i === 1) { preset('flat'); toast('⏸ 0° → 📊 ' + t_('tab.year'), 3500); }
    if (i === 2) { preset('uranus'); st.t = Date.UTC(2026, 5, 21, 0, 0); st.speed = 3600; st.playing = true; setView('near'); setFollow('city'); }
    if (i === 3) { preset('d30'); st.t = Date.UTC(2026, 9, 25, 12, 0); st.speed = 86400; st.playing = true; setFollow('city'); }
    if (i === 4) { preset('retro'); st.t = Date.UTC(2026, 9, 26, 5, 30); st.speed = 600; st.playing = true; setView('near'); setFollow('city'); }
    if (i === 5) { preset('egg'); setView('orbit'); st.speed = 604800; st.playing = true; }
    if (i === 6) { st.city.lat = 70; st.city.customLat = true; st.t = Date.UTC(2026, 11, 21, 9, 0); st.speed = 600; st.playing = true; buildLab(); setFollow('city'); }
    lastSummer = A.euSummer(st.t); syncPlay(); buildTimebar(); invalidate();
  }
  $$('#viewSeg button').forEach(b => b.onclick = () => setView(b.dataset.view));
  $$('#followSeg button').forEach(b => b.onclick = () => setFollow(b.dataset.follow));
  function labelFollow() { const b = $('#followSeg [data-follow="city"]'); if (b) b.innerHTML = t_(st.view === 'orbit' ? 'follow.earth' : 'follow.city'); const s = $('#followSeg [data-follow="sun"]'); if (s) s.style.display = st.view === 'orbit' ? 'none' : ''; }
  $$('#toggles input').forEach(c => c.onchange = () => { if (globe) globe.opts[c.dataset.opt] = c.checked; });

  /* ==========================================================================
     Etichete pe ecran
     ========================================================================== */
  function updateLabels(s) {
    if (!globe) return;
    const tag = $('#cityTag'), ol = $('#orbitLabels');
    if (globe.view === 'near' && globe.el.id === 'stagePlanet') {
      const p = globe.cityScreen(), aa = st.model.sunAltAz(st.t, st.city.lat, st.city.lon, s);
      if (p.visible) {
        tag.style.display = ''; tag.style.left = p.x + 'px'; tag.style.top = p.y + 'px';
        tag.innerHTML = '📍 ' + cityName() + ' · ' + fmtWall(st.t) + ' ' + (aa.alt > 0 ? '☀️' : aa.alt > -6 ? '🌆' : '🌙');
      } else tag.style.display = 'none';
      ol.innerHTML = '';
    } else {
      tag.style.display = 'none';
      if (globe.view !== 'orbit' || !globe.seasonPts) { ol.innerHTML = ''; return; }
      const items = [[new THREE.Vector3(0, 2.2, 0), t_('ol.sun'), '']];
      ['ol.eq0', 'ol.sol1', 'ol.eq2', 'ol.sol3'].forEach((k, i) => items.push([globe.seasonPts[i], t_(k), '']));
      if (st.model.p.ecc > 0.03) { items.push([globe.periPt, t_('ol.peri'), '']); items.push([globe.apPt, t_('ol.ap'), '']); }
      const ep = globe.EO.root.position.clone(); ep.y += 1.3;
      items.push([ep, t_('ol.earth', { d: fmtDate(st.t) }), 'earth']);
      ol.innerHTML = items.map(([v, txt, cls]) => { const p = globe.project(v); return p.behind ? '' : `<div class="ol ${cls}" style="left:${p.x}px;top:${p.y}px">${txt}</div>`; }).join('');
    }
  }

  /* ==========================================================================
     Bucla principală
     ========================================================================== */
  let lastFrame = performance.now(), lastSummer = A.euSummer(st.t), lastUI = 0, lastHL = 0, prevT = st.t;
  const wallAnim = { disp: null };   // pentru acele ceasului mare care se întorc animat
  function frame(now) {
    const dt = Math.min(0.1, (now - lastFrame) / 1000); lastFrame = now;
    if (st.playing && !scrubbing) st.t += dt * 1000 * st.speed;
    if (st.precAnim) { st.model.precOffset = A.norm180(st.model.precOffset + dt * 18); const sp = $('#sPrec'); if (sp) sp.value = st.model.precOffset; if (now - lastUI > 200) { outputs(); invalidate(); } }
    // detectăm schimbarea orei (doar regula reală)
    const sm = A.euSummer(st.t);
    if (sm !== lastSummer) {
      // doar când timpul curge normal (nu la salturi de dată sau la deschiderea simulatorului de eclipse)
      if (st.speed <= 21600 && Math.abs(st.t - prevT) < 6 * H && !(window.Eclipse && window.Eclipse.state.open)) toast(t_(sm ? 'toast.fwd' : 'toast.back'), 4200);
      lastSummer = sm;
    }
    prevT = st.t;
    const s = st.model.sun(st.t);
    if (globe && ready && (st.tab === 'planet' || st.tab === 'story')) {
      globe.update(st.model, st.t, st.city, dt);
      updateLabels(s);
    }
    if (st.tab === 'planet' && now - lastUI > 66) { uiPlanet(s); lastUI = now; }
    if (st.tab === 'story' && now - lastHL > 50) { uiStory(dt); lastHL = now; }
    requestAnimationFrame(frame);
  }

  function uiPlanet(s) {
    const w = A.wall(st.t, st.city.zone, st.rule), aa = st.model.sunAltAz(st.t, st.city.lat, st.city.lon, s);
    const solar = st.model.solarTime(st.t, st.city.lon, s);
    const night = aa.alt < -6, dusk = aa.alt < 0;
    drawClock($('#clockWall'), w.h + w.m / 60 + w.s / 3600, { sec: st.speed <= 60, badge: w.name,
      badgeBg: w.summer ? '#f5b301' : '#5aa0ff', badgeInk: w.summer ? '#2a1c00' : '#001a3a', rim: '#1f6feb' });
    drawClock($('#clockSun'), solar, { rim: '#f59e0b', icon: night ? '🌙' : dusk ? '🌆' : '☀️', ring: night ? '#1b2140' : dusk ? '#ffd2a8' : '#fff4c2' });
    $('#capWall').innerHTML = t_('clock.wall', { c: cityName(), z: w.name + ' (UTC' + (w.off >= 0 ? '+' : '') + w.off + ')' });
    $('#capSun').innerHTML = t_('clock.sun', { c: cityName() });
    const u = new Date(st.t);
    $('#utcLine').textContent = t_('utc', { t: pad(u.getUTCHours()) + ':' + pad(u.getUTCMinutes()) + ':' + pad(u.getUTCSeconds()), d: Math.floor((st.t - Date.UTC(u.getUTCFullYear(), 0, 1)) / DAY) + 1 });
    $('#hudClock').innerHTML = `<div class="big">${pad(w.h)}:${pad(w.m)}<span class="tz ${w.summer ? 'bst' : 'gmt'}">${w.name}</span></div>
      <div>${fmtDate(st.t, true)}</div><div class="small">${t_('hud.solar', { t: pad(Math.floor(solar)) + ':' + pad(Math.floor((solar % 1) * 60)) })}</div>`;
    drawSky($('#skyDome'), aa.alt, aa.az);
    updateFacts(s, aa);
    // câmpurile de timp (doar dacă utilizatorul nu scrie în ele)
    if (document.activeElement !== $('#dtInput')) $('#dtInput').value = `${w.y}-${pad(w.mo + 1)}-${pad(w.day)}T${pad(w.h)}:${pad(w.m)}`;
    $('#tzHint').textContent = t_('tz.local', { c: cityName() });
    if (!scrubbing) { const y0 = Date.UTC(u.getUTCFullYear(), 0, 1); $('#yearScrub').value = (st.t - y0) / DAY; }
  }

  /* ==========================================================================
     Povestea nopții schimbării
     ========================================================================== */
  const earthOnly = new A.Model();
  function sunTimes() {
    const f = (tt) => { const w = A.wall(tt, 'uk', 'eu'); return pad(w.h) + ':' + pad(w.m) + ' ' + w.name; };
    const lat = CITIES.london.lat, lon = CITIES.london.lon;
    const d24 = earthOnly.riseSet(A.localMidnight(Date.UTC(2026, 9, 24, 12), 'uk', 'eu'), lat, lon);
    const d25 = earthOnly.riseSet(A.localMidnight(Date.UTC(2026, 9, 25, 12), 'uk', 'eu'), lat, lon);
    const d31 = earthOnly.riseSet(A.localMidnight(Date.UTC(2026, 9, 31, 12), 'uk', 'eu'), lat, lon);
    const dec = earthOnly.riseSet(A.localMidnight(Date.UTC(2026, 11, 30, 12), 'uk', 'eu'), lat, lon);
    const jun = earthOnly.riseSet(A.localMidnight(Date.UTC(2026, 5, 21, 12), 'uk', 'eu'), lat, lon);
    const wd = A.wall(dec.rise, 'uk', 'dst');
    return { r1: f(d24.rise), r2: f(d25.rise), s1: f(d24.set), s2: f(d25.set), s3: f(d31.set), rise24: d24.rise, rise25: d25.rise, set24: d24.set, set25: d25.set,
      rDecBST: pad(wd.h) + ':' + pad(wd.m) + ' BST', sJun: f(jun.set) };
  }
  let ST = null;
  const STORY_ACTS = [
    () => { st.t = Date.UTC(2026, 9, 24, 20, 0); st.speed = 60; st.playing = true; setFollow('city'); },
    () => { st.t = Date.UTC(2026, 9, 25, 0, 59, 0); st.speed = 10; st.playing = true; setFollow('city'); },
    () => { st.t = Date.UTC(2026, 9, 25, 0, 59, 50); st.speed = 2; st.playing = true; },
    () => { st.t = Date.UTC(2026, 9, 25, 0, 30); st.speed = 120; st.playing = true; setFollow('free'); },
    () => { st.t = ST.rise25 - 25 * MIN; st.speed = 60; st.playing = true; setFollow('city'); },
    () => { st.t = ST.set25 - 25 * MIN; st.speed = 60; st.playing = true; setFollow('city'); },
    () => { st.t = Date.UTC(2027, 2, 28, 0, 59, 0); st.speed = 10; st.playing = true; setFollow('city'); }
  ];
  function buildStory() {
    ST = sunTimes();
    const steps = t_('st');
    $('#steps').innerHTML = steps.map((s, i) => `<button class="${i === st.storyIdx ? 'on' : (i < st.storyIdx ? 'done' : '')}" data-s="${i}">${i + 1}</button>`).join('');
    $$('#steps button').forEach(b => b.onclick = () => { st.storyIdx = +b.dataset.s; buildStory(); });
    const s = steps[st.storyIdx];
    const fill = x => x.replace(/\{(\w+)\}/g, (m, k) => ST[k] !== undefined ? ST[k] : m);
    $('#storyCard').innerHTML = `<div class="when">${s.when}</div><h3>${s.h}</h3><p>${fill(s.p)}</p>
      <div class="act"><button class="btn primary" id="stAct">▶ ${s.act}</button></div>
      <div class="teacher">👩‍🏫 ${fill(s.t)}</div>`;
    $('#stAct').onclick = () => { STORY_ACTS[st.storyIdx](); lastSummer = A.euSummer(st.t); wallAnim.disp = null; syncPlay(); };
    $('#stPrev').disabled = st.storyIdx === 0; $('#stNext').disabled = st.storyIdx === steps.length - 1;
    $('#whyGrid').innerHTML = t_('why').map(w => `<div class="why"><div class="ic">${w.ic}</div><h4>${w.h}</h4><p>${w.p.replace('{r}', ST.rDecBST).replace('{s}', ST.sJun)}</p></div>`).join('');
  }
  $('#stPrev').onclick = () => { if (st.storyIdx > 0) { st.storyIdx--; buildStory(); STORY_ACTS[st.storyIdx](); wallAnim.disp = null; } };
  $('#stNext').onclick = () => { if (st.storyIdx < 6) { st.storyIdx++; buildStory(); STORY_ACTS[st.storyIdx](); wallAnim.disp = null; } };

  function uiStory(dt) {
    const w = A.wall(st.t, 'uk', 'eu');
    const target = w.h * 60 + w.m + w.s / 60;
    if (wallAnim.disp === null) wallAnim.disp = target;
    let diff = target - wallAnim.disp;
    if (diff > 720) diff -= 1440; if (diff < -720) diff += 1440;
    if (Math.abs(diff) > 150) wallAnim.disp = target;                 // salt mare (navigare) → fără animație
    else if (Math.abs(diff) > 3) wallAnim.disp += Math.sign(diff) * Math.min(Math.abs(diff), 40 * 0.05 * 20); // ~40 min/s
    else wallAnim.disp = target;
    const animating = Math.abs(target - wallAnim.disp) > 3;
    drawClock($('#bigWall'), wallAnim.disp / 60, { sec: !animating, badge: animating ? '↺' : w.name,
      badgeBg: w.summer ? '#f5b301' : '#5aa0ff', badgeInk: w.summer ? '#2a1c00' : '#001a3a', rim: animating ? '#f97316' : '#1f6feb' });
    $('#capBig').innerHTML = t_('story.wall', { z: w.name }) + '<br><span class="muted">' + fmtDate(st.t, true) + '</span>';
    drawHourline();
  }
  function drawHourline() {
    // fereastra: 00:00–03:00 UTC, 25 oct 2026 (sau 28 mar 2027)
    const spring = st.t > Date.UTC(2027, 0, 1);
    const t0 = spring ? Date.UTC(2027, 2, 27, 23, 30) : Date.UTC(2026, 9, 24, 23, 30), t1 = t0 + 3 * H;
    const W = 560, x = tt => 40 + (tt - t0) / (t1 - t0) * (W - 80), ch = spring ? Date.UTC(2027, 2, 28, 1) : Date.UTC(2026, 9, 25, 1);
    let svg = `<svg viewBox="0 0 ${W} 120" width="100%" height="120" font-family="system-ui" font-size="11">`;
    svg += `<text x="20" y="14" fill="currentColor" opacity=".75">${t_('hl.real')}</text>`;
    svg += `<line x1="20" y1="30" x2="${W - 20}" y2="30" stroke="#8aa" stroke-width="3"/>`;
    for (let k = 0; k <= 6; k++) { const tt = t0 + k * 30 * MIN, xx = x(tt), u = new Date(tt); svg += `<line x1="${xx}" y1="25" x2="${xx}" y2="35" stroke="#8aa"/><text x="${xx}" y="47" text-anchor="middle" fill="currentColor" opacity=".7">${pad(u.getUTCHours())}:${pad(u.getUTCMinutes())} UTC</text>`; }
    svg += `<text x="20" y="72" fill="currentColor" opacity=".75">${t_('hl.wall')}</text>`;
    const xc = x(ch);
    if (!spring) {
      svg += `<rect x="${x(ch - H)}" y="80" width="${xc - x(ch - H)}" height="14" rx="4" fill="#f5b301"/><rect x="${xc}" y="80" width="${x(ch + H) - xc}" height="14" rx="4" fill="#5aa0ff"/>`;
      svg += `<rect x="${20}" y="80" width="${x(ch - H) - 20}" height="14" rx="4" fill="#f5b301" opacity=".45"/><rect x="${x(ch + H)}" y="80" width="${W - 20 - x(ch + H)}" height="14" rx="4" fill="#5aa0ff" opacity=".45"/>`;
    } else {
      svg += `<rect x="20" y="80" width="${xc - 20}" height="14" rx="4" fill="#5aa0ff"/><rect x="${xc}" y="80" width="${W - 20 - xc}" height="14" rx="4" fill="#f5b301"/>`;
    }
    for (let k = 0; k <= 6; k++) {
      const tt = t0 + k * 30 * MIN, w = A.wall(tt, 'uk', 'eu');
      svg += `<text x="${x(tt)}" y="110" text-anchor="middle" fill="currentColor" font-weight="700">${pad(w.h)}:${pad(w.m)}</text>`;
    }
    svg += `<path d="M${xc} 76 v22" stroke="#e5484d" stroke-width="2"/>`;
    if (st.t >= t0 && st.t <= t1) svg += `<circle cx="${x(st.t)}" cy="30" r="7" fill="#e5484d"/><circle cx="${x(st.t)}" cy="87" r="7" fill="#e5484d" stroke="#fff" stroke-width="2"/>`;
    svg += '</svg>';
    $('#hourline').innerHTML = svg;
  }

  /* ==========================================================================
     Lumina anului
     ========================================================================== */
  let yearCache = { key: '' };
  function buildRules() {
    $('#rules').innerHTML = ['eu', 'std', 'dst', 'double'].map(r => `<button class="chip${st.yearRule === r ? ' on' : ''}" data-r="${r}">${t_('rule.' + r)}</button>`).join('');
    $$('#rules .chip').forEach(b => b.onclick = () => { st.yearRule = b.dataset.r; buildRules(); drawYear(); });
  }
  function altColor(a) {
    const stops = [[-90, [8, 12, 30]], [-18, [10, 16, 40]], [-12, [24, 36, 82]], [-6, [62, 64, 128]], [-0.83, [190, 110, 90]], [0, [245, 160, 70]], [8, [255, 205, 95]], [35, [255, 235, 150]], [90, [255, 248, 210]]];
    for (let i = 1; i < stops.length; i++) if (a <= stops[i][0]) {
      const [a0, c0] = stops[i - 1], [a1, c1] = stops[i], k = (a - a0) / (a1 - a0);
      return [0, 1, 2].map(j => Math.round(c0[j] + (c1[j] - c0[j]) * k));
    }
    return stops[stops.length - 1][1];
  }
  function drawYear() {
    const cv = $('#yearChart'), g = cv.getContext('2d'), W = cv.width, Hh = cv.height;
    const m = { l: 56, r: 14, t: 14, b: 36 }, pw = W - m.l - m.r, ph = Hh - m.t - m.b;
    const year = new Date(st.t).getUTCFullYear(), zone = st.city.zone, rule = st.yearRule;
    const nd = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / DAY;
    const key = [year, rule, paramKey(), zone, st.city.lat, st.city.lon].join('|');
    if (yearCache.key !== key) {
      const img = new ImageData(nd, 144), rows = [];
      for (let d = 0; d < nd; d++) {
        const mid = Date.UTC(year, 0, 1 + d);
        for (let k = 0; k < 144; k++) {
          const wallT = mid + k * 10 * MIN + 5 * MIN;
          const off = A.zoneOffset(wallT - 2 * H, zone, rule).off;
          const tt = wallT - off * H;
          const a = st.model.sunAltAz(tt, st.city.lat, st.city.lon).alt;
          const c = altColor(a), i = ((143 - k) * nd + d) * 4;
          img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255;
        }
        // răsărit/apus în ora de perete
        const off0 = A.zoneOffset(mid + 12 * H, zone, rule).off;
        const t0 = mid - A.zoneOffset(mid - 2 * H, zone, rule).off * H;
        const rs = st.model.riseSet(t0, st.city.lat, st.city.lon, DAY);
        const toWall = tt => { const o = A.zoneOffset(tt, zone, rule).off; return ((tt + o * H - mid) / H); };
        rows.push({ d, mid, rise: rs.rise ? toWall(rs.rise) : null, set: rs.set ? toWall(rs.set) : null, len: rs.daylightMin, wd: new Date(mid).getUTCDay() });
      }
      const off = document.createElement('canvas'); off.width = nd; off.height = 144; off.getContext('2d').putImageData(img, 0, 0);
      yearCache = { key, off, rows, nd, year };
    }
    const Y = yearCache, X = d => m.l + d / Y.nd * pw, Yh = h => m.t + ph - h / 24 * ph;
    g.clearRect(0, 0, W, Hh);
    g.fillStyle = css('--panel'); g.fillRect(0, 0, W, Hh);
    g.imageSmoothingEnabled = true; g.drawImage(Y.off, m.l, m.t, pw, ph);
    // banda școlii (luni–vineri)
    Y.rows.forEach(r => { g.fillStyle = (r.wd >= 1 && r.wd <= 5) ? 'rgba(22,163,74,.20)' : 'rgba(22,163,74,.07)'; g.fillRect(X(r.d), Yh(15.5), pw / Y.nd + 0.6, Yh(8.5) - Yh(15.5)); });
    g.strokeStyle = 'rgba(22,163,74,.9)'; g.lineWidth = 1.2; g.setLineDash([5, 4]);
    [8.5, 15.5].forEach(h => { g.beginPath(); g.moveTo(m.l, Yh(h)); g.lineTo(m.l + pw, Yh(h)); g.stroke(); });
    g.setLineDash([]);
    // curbele de răsărit / apus
    const curve = (key, col) => { g.strokeStyle = col; g.lineWidth = 2.4; g.beginPath(); let started = false, prev = null;
      Y.rows.forEach(r => { const v = r[key]; if (v === null) { started = false; return; } const x = X(r.d + 0.5), y = Yh(v);
        if (!started || (prev !== null && Math.abs(v - prev) > 0.6)) { g.moveTo(x, y); started = true; } else g.lineTo(x, y); prev = v; }); g.stroke(); };
    curve('rise', '#ff7a1a'); curve('set', '#c026d3');
    // grila orelor
    g.fillStyle = css('--ink'); g.font = '12px system-ui'; g.textAlign = 'right'; g.textBaseline = 'middle';
    for (let h = 0; h <= 24; h += 3) { g.fillText(pad(h) + ':00', m.l - 6, Yh(h)); g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1; g.beginPath(); g.moveTo(m.l, Yh(h)); g.lineTo(m.l + pw, Yh(h)); g.stroke(); }
    // lunile
    g.textAlign = 'center'; g.textBaseline = 'top';
    const mn = months();
    for (let i = 0; i < 12; i++) { const d0 = (Date.UTC(year, i, 1) - Date.UTC(year, 0, 1)) / DAY, d1 = (Date.UTC(year, i + 1, 1) - Date.UTC(year, 0, 1)) / DAY;
      g.fillStyle = css('--ink'); g.fillText(mn[i], X((d0 + d1) / 2), m.t + ph + 6);
      g.strokeStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(X(d0), m.t); g.lineTo(X(d0), m.t + ph); g.stroke(); }
    // zilele schimbării orei
    if (rule === 'eu' || rule === 'double') {
      const c = A.changeDates(year);
      [c.spring, c.autumn].forEach(tt => { const d = (tt - Date.UTC(year, 0, 1)) / DAY; g.strokeStyle = '#e5484d'; g.lineWidth = 2; g.setLineDash([6, 4]);
        g.beginPath(); g.moveTo(X(d), m.t); g.lineTo(X(d), m.t + ph); g.stroke(); g.setLineDash([]);
        g.fillStyle = '#e5484d'; g.font = '600 12px system-ui'; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText('🕐 ' + t_('ch.change'), X(d) + 4, m.t + 4); });
    }
    // azi
    const dn = (st.t - Date.UTC(year, 0, 1)) / DAY;
    g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(X(dn), m.t); g.lineTo(X(dn), m.t + ph); g.stroke();
    g.fillStyle = '#fff'; g.font = '700 12px system-ui'; g.textAlign = 'center'; g.fillText('▼ ' + t_('ch.now'), X(dn), m.t + 18);
    g.fillStyle = 'rgba(22,163,74,1)'; g.textAlign = 'left'; g.fillText(t_('ch.school'), m.l + 4, Yh(15.5) + 3);
    // statistici
    let dark = 0, late = 0, lr = null, es = null, lo = null, sh = null;
    Y.rows.forEach(r => {
      if (r.rise !== null && r.wd >= 1 && r.wd <= 5 && r.rise > 8) dark++;
      if (r.set !== null && r.set > 21) late++;
      if (r.rise !== null && (!lr || r.rise > lr.rise)) lr = r;
      if (r.set !== null && (!es || r.set < es.set)) es = r;
      if (!lo || r.len > lo.len) lo = r; if (!sh || r.len < sh.len) sh = r;
    });
    const hm = h => h === null ? '—' : pad(Math.floor(h)) + ':' + pad(Math.floor((h % 1) * 60));
    const dd = r => { const d = new Date(r.mid); return d.getUTCDate() + ' ' + mn[d.getUTCMonth()]; };
    $('#yearStats').innerHTML = [
      [t_('ys.dark'), dark, t_('ys.dark.s')], [t_('ys.late'), late, t_('ys.late.s')],
      [t_('ys.lrise'), lr ? hm(lr.rise) : '—', lr ? dd(lr) : ''], [t_('ys.esets'), es ? hm(es.set) : '—', es ? dd(es) : ''],
      [t_('ys.long'), fmtDur(lo.len), dd(lo)], [t_('ys.short'), fmtDur(sh.len), dd(sh)]
    ].map(([k, v, s]) => `<div class="stat"><div class="k">${k}</div><div class="v">${v}</div><div class="s">${s}</div></div>`).join('');
    yearGeom = { m, pw, ph, X, Yh, nd: Y.nd };
  }
  let yearGeom = null;
  $('#yearChart').addEventListener('mousemove', e => {
    if (!yearGeom || !yearCache.rows) return;
    const cv = e.target, r = cv.getBoundingClientRect(), sx = cv.width / r.width;
    const x = (e.clientX - r.left) * sx, d = Math.floor((x - yearGeom.m.l) / yearGeom.pw * yearGeom.nd);
    const tip = $('#yearTip');
    if (d < 0 || d >= yearGeom.nd) { tip.style.opacity = 0; return; }
    const row = yearCache.rows[d], dt = new Date(row.mid), hm = h => h === null ? '—' : pad(Math.floor(h)) + ':' + pad(Math.floor((h % 1) * 60));
    tip.innerHTML = t_('tip.day', { d: days()[dt.getUTCDay()] + ', ' + dt.getUTCDate() + ' ' + months()[dt.getUTCMonth()], r: hm(row.rise), s: hm(row.set), l: fmtDur(row.len) });
    tip.style.opacity = 1; tip.style.left = Math.min(r.width - 190, e.clientX - r.left + 12) + 'px'; tip.style.top = (e.clientY - r.top + 12) + 'px';
  });
  $('#yearChart').addEventListener('mouseleave', () => { $('#yearTip').style.opacity = 0; });
  $('#yearChart').addEventListener('click', e => {
    if (!yearGeom) return; const cv = e.target, r = cv.getBoundingClientRect(), sx = cv.width / r.width;
    const d = (e.clientX - r.left) * sx - yearGeom.m.l; const day = d / yearGeom.pw * yearGeom.nd;
    const y = (e.clientY - r.top) * sx, h = (yearGeom.m.t + yearGeom.ph - y) / yearGeom.ph * 24;
    if (day < 0 || day > yearGeom.nd || h < 0 || h > 24) return;
    const year = new Date(st.t).getUTCFullYear(), mid = Date.UTC(year, 0, 1 + Math.floor(day));
    st.t = mid + h * H - A.zoneOffset(mid + h * H, st.city.zone, st.rule).off * H; lastSummer = A.euSummer(st.t);
    st.playing = false; syncPlay(); switchTab('planet');
  });

  /* ==========================================================================
     Testul
     ========================================================================== */
  let quizState = null;
  function buildQuiz() {
    const Q = t_('quiz');
    quizState = { ans: {}, order: Q.map(q => shuffle(q.o.map((o, i) => i))) };
    renderQuiz();
  }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function renderQuiz() {
    const Q = t_('quiz'), done = Object.keys(quizState.ans).length, good = Object.values(quizState.ans).filter(Boolean).length;
    $('#quiz').innerHTML = `<h2>${t_('quiz.h')}</h2><p class="score">${t_('quiz.score', { a: good, b: Q.length })}</p>` +
      Q.map((q, qi) => `<div class="q"><p class="qt">${qi + 1}. ${q.q}</p><div class="opts">${quizState.order[qi].map(oi => {
        const a = quizState.ans[qi], cls = a === undefined ? '' : (oi === q.a ? 'ok' : (quizState.pick && quizState.pick[qi] === oi ? 'no' : ''));
        return `<button data-q="${qi}" data-o="${oi}" class="${cls}"${a !== undefined ? ' disabled' : ''}>${q.o[oi]}</button>`; }).join('')}</div>
        <div class="fb">${quizState.ans[qi] !== undefined ? (quizState.ans[qi] ? '✅ ' : '❌ ') + q.e : ''}</div></div>`).join('') +
      (done === Q.length ? `<button class="btn primary" id="qAgain">${t_('quiz.again')}</button>` : '');
    $$('#quiz .opts button').forEach(b => b.onclick = () => {
      const qi = +b.dataset.q, oi = +b.dataset.o; quizState.pick = quizState.pick || {}; quizState.pick[qi] = oi;
      quizState.ans[qi] = oi === Q[qi].a; renderQuiz();
    });
    const ag = $('#qAgain'); if (ag) ag.onclick = buildQuiz;
  }

  /* ==========================================================================
     File, limbă, temă
     ========================================================================== */
  function switchTab(tab) {
    st.tab = tab;
    $$('#tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === tab));
    ['planet', 'story', 'year', 'witch', 'quiz'].forEach(k => $('#p-' + k).classList.toggle('hidden', k !== tab));
    if (globe) {
      const host = tab === 'story' ? $('#stageStory') : $('#stagePlanet');
      if (globe.canvas.parentNode !== host) { host.appendChild(globe.canvas); globe.el = host;
        if (tab === 'story') { setView('near'); setFollow('city'); globe.ctlN.dist = 3.2; }
        else { globe.ctlN.dist = 4.2; }
        globe.resize(); }
    }
    if (tab === 'story') buildStory();
    if (tab === 'year') { buildRules(); drawYear(); }
    if (tab === 'witch' && window.Witch) window.Witch.show();
  }
  $$('#tabs button').forEach(b => b.onclick = () => switchTab(b.dataset.tab));

  function relang() {
    L.set(L.lang);
    $('#langRo').setAttribute('aria-pressed', L.lang === 'ro'); $('#langEn').setAttribute('aria-pressed', L.lang === 'en');
    buildTimebar(); buildCities(); buildLab(); labelFollow(); buildQuiz();
    if (st.tab === 'story') buildStory();
    if (st.tab === 'year') { buildRules(); drawYear(); }
    if (window.Witch) window.Witch.relang();
    if (window.Eclipse) window.Eclipse.relang();
    invalidate();
  }
  $('#langRo').onclick = () => { L.set('ro'); relang(); };
  $('#langEn').onclick = () => { L.set('en'); relang(); };
  const root = document.documentElement;
  try { root.dataset.theme = localStorage.getItem('osdi-theme') || ''; } catch (e) {}
  $('#themeBtn').onclick = () => {
    const dark = root.dataset.theme === 'dark' || (root.dataset.theme === '' && matchMedia('(prefers-color-scheme: dark)').matches);
    root.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('osdi-theme', root.dataset.theme); } catch (e) {}
    if (st.tab === 'year') drawYear();
  };

  // pornire: timpul curent, accelerat de 600 de ori, ca să se vadă rotația
  relang();
  syncPlay();
  // parametri din adresă, utili la lecție: ?t=2026-10-25T00:55Z&speed=60&tab=story
  try {
    const q = new URLSearchParams(location.search);
    if (q.get('t')) { const v = Date.parse(q.get('t')); if (!isNaN(v)) st.t = v; }
    if (q.get('speed')) st.speed = +q.get('speed');
    if (q.get('pause')) st.playing = false;
    if (q.get('view') === 'orbit') setView('orbit');
    if (q.get('tab')) switchTab(q.get('tab'));
    lastSummer = A.euSummer(st.t); buildTimebar(); syncPlay();
  } catch (e) {}
  window.APP = { st, switchTab, setView, setFollow, preset, challenge, globe };
  $('#eclBtn').onclick = () => window.Eclipse && window.Eclipse.open();
  if (window.Eclipse) window.Eclipse.relang();
  requestAnimationFrame(frame);
})();
