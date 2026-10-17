/* ==========================================================================
   astro.js — modelul planetei: orbita, rotația, Soarele pe cer, fusele orare
   --------------------------------------------------------------------------
   Un singur model, valabil și pentru Pământul real, și pentru planetele
   „modificate” din Laboratorul planetei. Cu parametrii impliciți (Pământ)
   formulele coincid cu algoritmul NOAA / Almanahul astronomic de precizie
   mică (eroare de ~1 minut la răsărit/apus).
   ========================================================================== */
(function () {
  'use strict';
  const D2R = Math.PI / 180, R2D = 180 / Math.PI;
  const DAY = 86400000;                         // ms într-o zi
  const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0);  // epoca J2000.0

  const EARTH = {
    tilt: 23.44,          // înclinarea axei (°)
    rotH: 23.934469,      // perioada de rotație siderală (ore) = 23 h 56 min 4 s
    dir: 1,               // 1 = sens normal (spre est), -1 = invers
    yearD: 365.2564,      // perioada orbitală siderală (zile)
    ecc: 0.0167,          // excentricitatea orbitei
    peri: 282.94,         // longitudinea perigeului Soarelui (°) → periheliu pe 3–4 ianuarie
    precYears: 25772      // perioada precesiei (ani)
  };

  const norm360 = a => ((a % 360) + 360) % 360;
  const norm180 = a => { a = norm360(a); return a > 180 ? a - 360 : a; };

  /* ---------- Starea modelului: „ancoră” + viteze ----------
     Unghiurile cresc liniar în timp. Când utilizatorul schimbă un parametru,
     re-ancorăm modelul în clipa curentă, ca planeta să nu sară din loc. */
  function Model() {
    this.p = Object.assign({}, EARTH);
    this.precOffset = 0;      // deplasarea suplimentară a echinocțiului (°) — din slider
    this.precAnim = false;    // precesia animată (comprimată)
    this.resetAnchor();
  }
  Model.prototype.resetAnchor = function () {
    // valori reale la J2000
    this.a = { t: J2000, M: 357.5291, theta: 280.46061837, prec: 0 };
  };
  Model.prototype.rates = function () {
    const p = this.p;
    return {
      M: 360 / p.yearD,                       // °/zi — anomalia medie
      theta: p.dir * 360 * 24 / p.rotH,        // °/zi — rotația siderală
      prec: 360 / (p.precYears * 365.25)       // °/zi — precesia: echinocțiul alunecă înapoi, longitudinile cresc
    };
  };
  Model.prototype.angles = function (t) {
    const d = (t - this.a.t) / DAY, r = this.rates();
    return {
      M: norm360(this.a.M + r.M * d),
      theta: norm360(this.a.theta + r.theta * d),
      prec: this.a.prec + r.prec * d
    };
  };
  /** schimbă parametrii păstrând poziția planetei în clipa t */
  Model.prototype.set = function (t, changes) {
    const now = this.angles(t);
    Object.assign(this.p, changes);
    this.a = { t: t, M: now.M, theta: now.theta, prec: now.prec };
  };
  Model.prototype.isEarth = function () {
    const p = this.p, e = EARTH;
    return Math.abs(p.tilt - e.tilt) < 1e-6 && Math.abs(p.rotH - e.rotH) < 1e-6 && p.dir === 1 &&
      Math.abs(p.yearD - e.yearD) < 1e-6 && Math.abs(p.ecc - e.ecc) < 1e-6 && this.precOffset === 0;
  };

  /* ---------- Kepler ---------- */
  function kepler(Mdeg, e) {
    const M = Mdeg * D2R;
    let E = e < 0.8 ? M : Math.PI;
    for (let i = 0; i < 30; i++) {
      const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      E -= dE; if (Math.abs(dE) < 1e-10) break;
    }
    const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
    return { E: E, nu: nu * R2D, r: 1 - e * Math.cos(E) };   // r în unități de semiaxă mare
  }

  /** Tot ce trebuie despre Soare în clipa t */
  Model.prototype.sun = function (t) {
    const p = this.p, A = this.angles(t);
    const k = kepler(A.M, p.ecc);
    const peri = p.peri + this.precOffset + A.prec;          // precesia mută echinocțiul
    const lam = norm360(k.nu + peri);                       // longitudinea ecliptică a Soarelui
    const eps = p.tilt * D2R, L = lam * D2R;
    const dec = Math.asin(Math.sin(eps) * Math.sin(L)) * R2D;
    const ra = norm360(Math.atan2(Math.cos(eps) * Math.sin(L), Math.cos(L)) * R2D);
    const meanLon = norm360(A.M + peri);
    const eot = norm180(meanLon - ra);                       // ecuația timpului (°); 1° = 4 min
    return { lam: lam, dec: dec, ra: ra, eot: eot, r: k.r, M: A.M, theta: A.theta, nu: k.nu, peri: peri };
  };

  /** Înălțimea și azimutul Soarelui deasupra unui loc (lat, lon în grade, lon + spre est) */
  Model.prototype.sunAltAz = function (t, lat, lon, s) {
    s = s || this.sun(t);
    const H = norm180(s.theta + lon - s.ra) * D2R;           // unghiul orar
    const f = lat * D2R, d = s.dec * D2R;
    const sinh = Math.sin(f) * Math.sin(d) + Math.cos(f) * Math.cos(d) * Math.cos(H);
    const h = Math.asin(Math.max(-1, Math.min(1, sinh)));
    const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(f) - Math.tan(d) * Math.cos(f)) * R2D + 180;
    return { alt: h * R2D, az: norm360(az), H: H * R2D };
  };

  /** Ora solară locală (cea arătată de un ceas solar), în ore 0–24.
      Pentru o planetă modificată: fracțiunea din ziua ei solară, scalată la 24 „ore de cadran”. */
  Model.prototype.solarTime = function (t, lon, s) {
    s = s || this.sun(t);
    const H = norm180(s.theta + lon - s.ra);
    return norm360(H * this.p.dir + 180) / 15;
  };

  /** durata zilei solare (ore terestre) */
  Model.prototype.solarDayH = function () {
    const p = this.p;
    const w = p.dir / p.rotH - 1 / (p.yearD * 24);   // rotații / oră, relativ la Soare
    return Math.abs(w) < 1e-9 ? Infinity : Math.abs(1 / w);
  };

  /** Răsărit / apus în fereastra [t0, t0+24h): căutare + bisecție.
      Prag −0,833° (refracția + raza discului solar), ca la ora oficială. */
  Model.prototype.riseSet = function (t0, lat, lon, span) {
    span = span || DAY;
    const H0 = -0.833, step = 5 * 60000, out = { rise: null, set: null, events: [] };
    let tp = t0, ap = this.sunAltAz(tp, lat, lon).alt - H0;
    for (let t = t0 + step; t <= t0 + span; t += step) {
      const a = this.sunAltAz(t, lat, lon).alt - H0;
      if ((ap < 0) !== (a < 0)) {
        let lo = tp, hi = t, alo = ap;
        for (let i = 0; i < 22; i++) {
          const m = (lo + hi) / 2, am = this.sunAltAz(m, lat, lon).alt - H0;
          if ((am < 0) === (alo < 0)) { lo = m; alo = am; } else hi = m;
        }
        const te = (lo + hi) / 2, kind = ap < 0 ? 'rise' : 'set';
        out.events.push({ t: te, kind: kind });
        if (kind === 'rise' && out.rise === null) out.rise = te;
        if (kind === 'set' && out.set === null) out.set = te;
      }
      tp = t; ap = a;
    }
    // lumina totală în fereastră (minute)
    let lit = 0;
    for (let t = t0; t < t0 + span; t += step) if (this.sunAltAz(t + step / 2, lat, lon).alt > H0) lit += 5;
    out.daylightMin = lit;
    // precizie mai bună când avem exact un răsărit și un apus în fereastră
    if (out.events.length === 2 && out.rise !== null && out.set !== null && out.set > out.rise) out.daylightMin = (out.set - out.rise) / 60000;
    return out;
  };

  /** Poziția Lunii (ecliptică, precizie ~1°) — doar pentru Pământul real */
  function moonPos(t) {
    const d = (t - J2000) / DAY;
    const L = norm360(218.316 + 13.176396 * d), M = norm360(134.963 + 13.064993 * d), F = norm360(93.272 + 13.229350 * d);
    const lam = L + 6.289 * Math.sin(M * D2R), beta = 5.128 * Math.sin(F * D2R);
    return { lam: norm360(lam), beta: beta };
  }

  /* ==========================================================================
     Fusele orare și regula schimbării orei
     ========================================================================== */
  function lastSunday(year, month) {           // month 0–11 → ms UTC la 00:00 a ultimei duminici
    const last = new Date(Date.UTC(year, month + 1, 0));
    return Date.UTC(year, month, last.getUTCDate() - last.getUTCDay());
  }
  /** Regula europeană: ora de vară începe în ultima duminică din martie și se termină
      în ultima duminică din octombrie, ambele la 01:00 UTC (aceeași clipă în toată Europa). */
  function euSummer(t) {
    const y = new Date(t).getUTCFullYear();
    const start = lastSunday(y, 2) + 3600000, end = lastSunday(y, 9) + 3600000;
    return t >= start && t < end;
  }
  function changeDates(year) {
    return { spring: lastSunday(year, 2) + 3600000, autumn: lastSunday(year, 9) + 3600000 };
  }

  const ZONES = {
    uk: { std: 0, dst: 1, stdName: 'GMT', dstName: 'BST' },
    ro: { std: 2, dst: 3, stdName: 'EET', dstName: 'EEST' }
  };
  /** rule: 'eu' (cea reală) | 'std' (mereu ora de iarnă) | 'dst' (mereu ora de vară) | 'double' (vară +2 / iarnă +1) */
  function zoneOffset(t, zone, rule) {
    const z = ZONES[zone] || ZONES.uk, s = euSummer(t);
    switch (rule) {
      case 'std': return { off: z.std, name: z.stdName, summer: false };
      case 'dst': return { off: z.dst, name: z.dstName, summer: true };
      case 'double': return s ? { off: z.std + 2, name: zone === 'uk' ? 'BDST' : 'EEST+1', summer: true }
                              : { off: z.dst, name: z.dstName, summer: false };
      default: return s ? { off: z.dst, name: z.dstName, summer: true } : { off: z.std, name: z.stdName, summer: false };
    }
  }
  function wall(t, zone, rule) {                  // ceasul de pe perete
    const z = zoneOffset(t, zone, rule), d = new Date(t + z.off * 3600000);
    return { h: d.getUTCHours(), m: d.getUTCMinutes(), s: d.getUTCSeconds(), y: d.getUTCFullYear(),
      mo: d.getUTCMonth(), day: d.getUTCDate(), wd: d.getUTCDay(), off: z.off, name: z.name, summer: z.summer };
  }
  /** începutul zilei calendaristice locale (ms UTC) care conține t */
  function localMidnight(t, zone, rule) {
    const w = wall(t, zone, rule);
    let g = Date.UTC(w.y, w.mo, w.day) - w.off * 3600000;
    // dacă miezul nopții a avut alt decalaj (nu se întâmplă în UE, dar suntem prudenți)
    const w2 = wall(g, zone, rule); g -= (w2.h > 12 ? w2.h - 24 : w2.h) * 3600000;
    return g;
  }

  window.Astro = { Model, EARTH, DAY, J2000, D2R, R2D, norm360, norm180, kepler, moonPos,
    euSummer, changeDates, lastSunday, zoneOffset, wall, localMidnight, ZONES };
})();
