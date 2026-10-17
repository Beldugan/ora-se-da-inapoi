/* ==========================================================================
   globe.js — Pământul 3D (three.js r147, fără module, merge și din file://)
   Două scene: „De aproape” (globul) și „Pe orbită” (Soarele + drumul anual).
   Sistemul de coordonate al scenei = ecliptica: planul orbitei e orizontal,
   +X spre punctul vernal, +Y spre polul nord al eclipticii.
   ========================================================================== */
(function () {
  'use strict';
  const T = window.THREE, A = window.Astro, D2R = Math.PI / 180;

  /* ---------------- texturi ---------------- */
  function loadTex(src, cb) {
    const tex = new T.Texture();
    const img = new Image();
    img.onload = function () { tex.image = img; tex.needsUpdate = true; if (cb) cb(); };
    img.src = src;
    tex.anisotropy = 8;
    tex.wrapS = T.RepeatWrapping;
    tex.minFilter = T.LinearMipmapLinearFilter;
    return tex;
  }
  function glowTexture(inner, outer) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, inner); gr.addColorStop(0.18, inner); gr.addColorStop(0.35, outer); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    const t = new T.CanvasTexture(c); return t;
  }

  /* ---------------- shadere ---------------- */
  const earthVS = `
    varying vec2 vUv; varying vec3 vN; varying vec3 vE; varying vec3 vNo; varying vec3 vPos;
    void main(){
      vUv = uv;
      vec3 n = normalize(normal);
      vec3 e = normalize(vec3(n.z, 0.0, -n.x) + vec3(1e-6, 0.0, 0.0));
      vec3 no = cross(n, e);
      mat3 m = mat3(modelMatrix);
      vN = normalize(m * n); vE = normalize(m * e); vNo = normalize(m * no);
      vec4 wp = modelMatrix * vec4(position, 1.0); vPos = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`;
  const earthFS = `
    uniform sampler2D dayMap, nightMap, waterMap, topoMap, cloudMap;
    uniform vec3 sunDir; uniform float cloudShift, lights, bumpK, twilightW, cloudsOn;
    varying vec2 vUv; varying vec3 vN; varying vec3 vE; varying vec3 vNo; varying vec3 vPos;
    void main(){
      vec3 N0 = normalize(vN);
      // relief din harta de altitudine (diferențe finite în spațiul texturii)
      float h  = texture2D(topoMap, vUv).r;
      float hx = texture2D(topoMap, vUv + vec2(1.0/2048.0, 0.0)).r - h;
      float hy = texture2D(topoMap, vUv + vec2(0.0, 1.0/1024.0)).r - h;
      vec3 N = normalize(N0 - bumpK * (hx * normalize(vE) + hy * normalize(vNo)));
      float ndlG = dot(N0, sunDir);               // linia zi/noapte (geometrică)
      float ndl  = dot(N, sunDir);                 // cu relief
      float dayF = smoothstep(-twilightW, twilightW, ndlG);
      vec3 day = texture2D(dayMap, vUv).rgb;
      // umbrele norilor
      float cs = texture2D(cloudMap, vUv + vec2(cloudShift - 0.0015, 0.0012)).r * cloudsOn;
      day *= 1.0 - 0.35 * cs;
      float lit = clamp(0.16 + ndl * 1.05, 0.0, 1.0) * smoothstep(-0.12, 0.02, ndlG);
      // lumina de apus: roșiatică lângă terminator
      vec3 sunset = mix(vec3(1.0, 0.45, 0.18), vec3(1.0), smoothstep(0.0, 0.35, ndlG));
      vec3 col = day * lit * sunset * 1.08;
      // luciul oceanului
      vec3 V = normalize(cameraPosition - vPos);
      vec3 R = reflect(-sunDir, N0);
      float water = texture2D(waterMap, vUv).r;
      float spec = pow(max(dot(R, V), 0.0), 38.0) * water * 0.75;
      col += vec3(1.0, 0.93, 0.8) * spec * dayF;
      // noaptea: luminile orașelor
      vec3 night = texture2D(nightMap, vUv).rgb;
      vec3 cityL = max(night - vec3(0.06, 0.08, 0.12), 0.0) * vec3(1.6, 1.25, 0.8) * 2.4 * lights;
      vec3 nightC = night * 0.18 + cityL * (1.0 - cs * 0.8);
      col = mix(nightC, col, dayF);
      // atmosfera văzută din lateral (Fresnel)
      float fr = pow(1.0 - max(dot(N0, V), 0.0), 3.0);
      float atmLit = smoothstep(-0.25, 0.45, ndlG);
      col += mix(vec3(0.9, 0.4, 0.15), vec3(0.32, 0.58, 1.0), smoothstep(0.0, 0.35, ndlG)) * fr * atmLit * 0.9;
      gl_FragColor = vec4(col, 1.0);
    }`;
  const cloudFS = `
    uniform sampler2D cloudMap; uniform vec3 sunDir; uniform float cloudShift, cloudsOn;
    varying vec2 vUv; varying vec3 vN; varying vec3 vE; varying vec3 vNo; varying vec3 vPos;
    void main(){
      float a = texture2D(cloudMap, vUv + vec2(cloudShift, 0.0)).r;
      float ndl = dot(normalize(vN), sunDir);
      float lit = smoothstep(-0.12, 0.3, ndl);
      vec3 c = mix(vec3(1.0, 0.55, 0.3), vec3(1.0), smoothstep(0.0, 0.3, ndl)) * lit;
      gl_FragColor = vec4(c, a * 0.92 * cloudsOn);
    }`;
  const atmoVS = `
    varying vec3 vN; varying vec3 vPos;
    void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 wp = modelMatrix * vec4(position,1.0); vPos = wp.xyz;
      gl_Position = projectionMatrix * viewMatrix * wp; }`;
  const atmoFS = `
    uniform vec3 sunDir; varying vec3 vN; varying vec3 vPos;
    void main(){
      vec3 V = normalize(cameraPosition - vPos);
      float rim = pow(clamp(1.0 - abs(dot(normalize(vN), V)) , 0.0, 1.0), 2.2);
      float inner = smoothstep(0.0, 0.35, abs(dot(normalize(vN), V)));
      float lit = smoothstep(-0.35, 0.5, dot(normalize(vN), sunDir));
      vec3 c = mix(vec3(1.0, 0.42, 0.12), vec3(0.35, 0.62, 1.0), smoothstep(-0.05, 0.4, dot(normalize(vN), sunDir)));
      float a = (1.0 - inner) * lit * 1.3;
      gl_FragColor = vec4(c * a, a);
    }`;
  const sunFS = `
    uniform float time; varying vec3 vN; varying vec3 vPos;
    float hash(vec3 p){ p = fract(p*0.3183099 + .1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
    float noise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
      return mix(mix(mix(hash(i+vec3(0,0,0)),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
                 mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z); }
    void main(){
      vec3 p = normalize(vN) * 6.0;
      float n = noise(p + time*0.15)*0.5 + noise(p*2.1 - time*0.1)*0.3 + noise(p*4.3 + time*0.2)*0.2;
      vec3 V = normalize(cameraPosition - vPos);
      float limb = pow(max(dot(normalize(vN), V), 0.0), 0.45);
      vec3 c = mix(vec3(1.0, 0.45, 0.05), vec3(1.0, 0.95, 0.7), n) * (0.55 + 0.6*limb);
      gl_FragColor = vec4(c, 1.0);
    }`;

  /* ---------------- control al camerei (fără dependențe) ---------------- */
  function Orbit(cam, el, opt) {
    this.cam = cam; this.el = el;
    this.theta = opt.theta; this.phi = opt.phi; this.dist = opt.dist;
    this.min = opt.min; this.max = opt.max; this.target = new T.Vector3();
    this.vt = 0; this.vp = 0; this.enabled = true;
    const self = this; let down = false, lx = 0, ly = 0, pinch = 0;
    const pts = new Map();
    el.addEventListener('pointerdown', e => { if (!self.enabled) return; pts.set(e.pointerId, [e.clientX, e.clientY]); down = true; lx = e.clientX; ly = e.clientY; el.setPointerCapture(e.pointerId); self.onUser && self.onUser(); });
    el.addEventListener('pointermove', e => {
      if (!self.enabled || !pts.has(e.pointerId)) return;
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) {
        const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (pinch) self.zoom(pinch / d); pinch = d; return;
      }
      if (!down) return;
      self.vt = -(e.clientX - lx) * 0.006; self.vp = -(e.clientY - ly) * 0.006;
      self.theta += self.vt; self.phi += self.vp; lx = e.clientX; ly = e.clientY; self.clamp();
    });
    const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = 0; if (!pts.size) down = false; };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', e => { if (!self.enabled) return; e.preventDefault(); self.zoom(Math.exp(e.deltaY * 0.0012)); }, { passive: false });
  }
  Orbit.prototype.zoom = function (k) { this.dist = Math.max(this.min, Math.min(this.max, this.dist * k)); };
  Orbit.prototype.clamp = function () { this.phi = Math.max(0.05, Math.min(Math.PI - 0.05, this.phi)); };
  Orbit.prototype.update = function () {
    this.theta += this.vt * 0.0; // inerția e oprită intenționat: copiii „pierd” globul altfel
    const s = Math.sin(this.phi);
    this.cam.position.set(
      this.target.x + this.dist * s * Math.sin(this.theta),
      this.target.y + this.dist * Math.cos(this.phi),
      this.target.z + this.dist * s * Math.cos(this.theta));
    this.cam.lookAt(this.target);
  };
  Orbit.prototype.lookFrom = function (dir, dist) {   // așază camera pe o direcție dată
    const d = dir.clone().normalize();
    this.phi = Math.acos(Math.max(-1, Math.min(1, d.y)));
    this.theta = Math.atan2(d.x, d.z);
    if (dist) this.dist = dist; this.clamp();
  };

  /* ---------------- Pământul (un grup reutilizabil) ---------------- */
  function makeEarth(mats, segs) {
    const root = new T.Group();       // poziția
    const tilt = new T.Group();       // înclinarea axei
    const spin = new T.Group();       // rotația zilnică
    root.add(tilt); tilt.add(spin);
    const geo = new T.SphereGeometry(1, segs, segs / 2);
    const body = new T.Mesh(geo, mats.earth); spin.add(body);
    const clouds = new T.Mesh(new T.SphereGeometry(1.008, segs, segs / 2), mats.clouds); spin.add(clouds);
    const atmo = new T.Mesh(new T.SphereGeometry(1.045, segs, segs / 2), mats.atmo); tilt.add(atmo);
    // axa de rotație
    const axGeo = new T.BufferGeometry().setFromPoints([new T.Vector3(0, -1.55, 0), new T.Vector3(0, 1.55, 0)]);
    const axis = new T.Line(axGeo, new T.LineBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0.95 }));
    tilt.add(axis);
    const nTip = new T.Mesh(new T.ConeGeometry(0.045, 0.14, 16), new T.MeshBasicMaterial({ color: 0xffd34d }));
    nTip.position.y = 1.6; tilt.add(nTip);
    return { root, tilt, spin, body, clouds, atmo, axis, nTip };
  }
  function latLonVec(lat, lon, r) {
    const f = lat * D2R, l = lon * D2R;
    return new T.Vector3(r * Math.cos(f) * Math.cos(l), r * Math.sin(f), -r * Math.cos(f) * Math.sin(l));
  }
  function circleLine(lat, color, op) {
    const pts = []; for (let i = 0; i <= 180; i++) pts.push(latLonVec(lat, i * 2, 1.004));
    return new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color, transparent: true, opacity: op }));
  }

  /* ==========================================================================
     Globe
     ========================================================================== */
  function Globe(container, onReady) {
    this.el = container;
    this.renderer = new T.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.setClearColor(0x000005);
    container.appendChild(this.renderer.domElement);
    this.canvas = this.renderer.domElement;
    this.view = 'near';
    this.opts = { clouds: true, lights: true, axis: true, grid: true, moon: true, follow: 'free', labels: true };

    let pending = 6; const done = () => { if (--pending === 0 && onReady) onReady(); };
    const X = window.TEX;
    const tex = { day: loadTex(X.day, done), night: loadTex(X.night, done), water: loadTex(X.water, done),
      topo: loadTex(X.topo, done), clouds: loadTex(X.clouds, done), moon: loadTex(X.moon, done) };
    this.tex = tex;

    const uni = this.uni = {
      dayMap: { value: tex.day }, nightMap: { value: tex.night }, waterMap: { value: tex.water },
      topoMap: { value: tex.topo }, cloudMap: { value: tex.clouds }, sunDir: { value: new T.Vector3(1, 0, 0) },
      cloudShift: { value: 0 }, lights: { value: 1 }, bumpK: { value: 2.2 }, twilightW: { value: 0.06 }, cloudsOn: { value: 1 }
    };
    const mats = {
      earth: new T.ShaderMaterial({ uniforms: uni, vertexShader: earthVS, fragmentShader: earthFS }),
      clouds: new T.ShaderMaterial({ uniforms: uni, vertexShader: earthVS, fragmentShader: cloudFS, transparent: true, depthWrite: false }),
      atmo: new T.ShaderMaterial({ uniforms: { sunDir: uni.sunDir }, vertexShader: atmoVS, fragmentShader: atmoFS,
        side: T.BackSide, transparent: true, blending: T.AdditiveBlending, depthWrite: false })
    };
    this.mats = mats;

    /* ----- scena „de aproape” ----- */
    const S = this.near = new T.Scene();
    this.camN = new T.PerspectiveCamera(38, 1, 0.05, 2000);
    this.ctlN = new Orbit(this.camN, this.canvas, { theta: 0.6, phi: 1.25, dist: 4.2, min: 1.35, max: 16 });
    S.add(this.makeStars(700, 4000));
    this.E = makeEarth(mats, 128); S.add(this.E.root);
    // linii: ecuatorul, tropicele, cercurile polare și paralela orașului
    this.grid = new T.Group();
    this.grid.add(circleLine(0, 0xffffff, 0.35));
    this.trop = [circleLine(23.44, 0xffb84d, 0.35), circleLine(-23.44, 0xffb84d, 0.35), circleLine(66.56, 0x8fd3ff, 0.35), circleLine(-66.56, 0x8fd3ff, 0.35)];
    this.trop.forEach(l => this.grid.add(l));
    this.cityLine = circleLine(51.5, 0xff4d6d, 0.8); this.grid.add(this.cityLine);
    this.E.spin.add(this.grid);
    // markerul orașului
    this.pin = new T.Group();
    const pinHead = new T.Mesh(new T.SphereGeometry(0.022, 16, 12), new T.MeshBasicMaterial({ color: 0xff3355 }));
    pinHead.position.y = 0.06;
    const pinStick = new T.Mesh(new T.CylinderGeometry(0.004, 0.004, 0.06, 6), new T.MeshBasicMaterial({ color: 0xffffff }));
    pinStick.position.y = 0.03;
    this.pin.add(pinHead, pinStick); this.E.spin.add(this.pin);
    this.pinHead = pinHead;
    // Soarele văzut de pe Pământ (o strălucire foarte departe)
    this.sunSprite = new T.Sprite(new T.SpriteMaterial({ map: glowTexture('rgba(255,250,235,1)', 'rgba(255,190,90,0.35)'),
      blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
    this.sunSprite.scale.set(40, 40, 1); S.add(this.sunSprite);
    // Luna (distanța e micșorată de ~7 ori ca să încapă pe ecran)
    this.moon = new T.Mesh(new T.SphereGeometry(0.2727, 64, 32), new T.MeshStandardMaterial({ map: tex.moon, roughness: 1, metalness: 0 }));
    S.add(this.moon);
    this.sunLight = new T.DirectionalLight(0xffffff, 1.6); S.add(this.sunLight); S.add(this.sunLight.target);
    S.add(new T.AmbientLight(0x111122, 0.25));

    /* ----- scena „pe orbită” ----- */
    const O = this.orbit = new T.Scene();
    this.camO = new T.PerspectiveCamera(40, 1, 0.1, 3000);
    this.ctlO = new Orbit(this.camO, this.canvas, { theta: 0.4, phi: 1.05, dist: 30, min: 8, max: 80 });
    this.ctlO.enabled = false;
    O.add(this.makeStars(900, 5000));
    this.sunMat = new T.ShaderMaterial({ uniforms: { time: { value: 0 } }, vertexShader: atmoVS, fragmentShader: sunFS });
    this.sunBall = new T.Mesh(new T.SphereGeometry(1.6, 64, 32), this.sunMat); O.add(this.sunBall);
    const sg = new T.Sprite(new T.SpriteMaterial({ map: glowTexture('rgba(255,230,160,0.9)', 'rgba(255,140,40,0.25)'),
      blending: T.AdditiveBlending, depthWrite: false, transparent: true }));
    sg.scale.set(12, 12, 1); O.add(sg);
    this.EO = makeEarth(mats, 64); this.EO.root.scale.setScalar(0.7); O.add(this.EO.root);
    this.orbitLine = null; this.orbitMarks = new T.Group(); O.add(this.orbitMarks);
    this.eclPlane = new T.Mesh(new T.RingGeometry(1.8, 16, 96), new T.MeshBasicMaterial({ color: 0x3a6dff, transparent: true, opacity: 0.06, side: T.DoubleSide }));
    this.eclPlane.rotation.x = -Math.PI / 2; O.add(this.eclPlane);
    this.ray = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3()]),
      new T.LineDashedMaterial({ color: 0xffd34d, dashSize: 0.3, gapSize: 0.2, transparent: true, opacity: 0.7 }));
    O.add(this.ray);
    this.orbitKey = '';
    this.labels = [];   // etichete HTML pentru scena pe orbită

    this.resize();
    window.addEventListener('resize', () => this.resize());
    if (window.ResizeObserver) new ResizeObserver(() => this.resize()).observe(container);
  }

  Globe.prototype.makeStars = function (R, n) {
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const tint = [[0.62, 0.72, 1], [0.8, 0.85, 1], [1, 1, 1], [1, 0.95, 0.82], [1, 0.82, 0.6], [1, 0.68, 0.5]];
    for (let i = 0; i < n; i++) {
      const u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, s = Math.sqrt(1 - u * u);
      // mai multe stele aproape de un „brâu” (Calea Lactee, aproximativ)
      let y = u; if (rnd() < 0.35) y *= 0.18;
      const ss = Math.sqrt(1 - y * y);
      pos.set([R * ss * Math.cos(th), R * y, R * ss * Math.sin(th)], i * 3);
      const b = Math.pow(rnd(), 3.2) * 0.9 + 0.1, c = tint[Math.floor(rnd() * tint.length)];
      col.set([c[0] * b, c[1] * b, c[2] * b], i * 3);
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3));
    return new T.Points(g, new T.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, depthWrite: false }));
  };

  Globe.prototype.resize = function () {
    const w = this.el.clientWidth || 800, h = this.el.clientHeight || 500;
    this.renderer.setSize(w, h, false);
    this.canvas.style.width = '100%'; this.canvas.style.height = '100%';
    this.camN.aspect = this.camO.aspect = w / h;
    this.camN.updateProjectionMatrix(); this.camO.updateProjectionMatrix();
  };

  Globe.prototype.setView = function (v) {
    this.view = v; this.ctlN.enabled = v === 'near'; this.ctlO.enabled = v === 'orbit';
  };

  /* drumul orbitei se redesenează doar când se schimbă forma ei */
  Globe.prototype.buildOrbit = function (model, sun) {
    const e = model.p.ecc, a = 11, peri = sun.peri;
    const key = e.toFixed(4) + '|' + peri.toFixed(2) + '|' + (this._precDeg || 0).toFixed(1) + '|' + model.p.tilt.toFixed(2) + '|' + model.isEarth();
    if (key === this.orbitKey) return; this.orbitKey = key;
    if (this.orbitLine) this.orbit.remove(this.orbitLine);
    const pts = [];
    for (let i = 0; i <= 360; i++) {
      const nu = i * D2R, r = a * (1 - e * e) / (1 + e * Math.cos(nu)), L = nu + (peri + 180) * D2R;
      pts.push(new T.Vector3(r * Math.cos(L), 0, -r * Math.sin(L)));
    }
    this.orbitLine = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x9fb7ff, transparent: true, opacity: 0.7 }));
    this.orbit.add(this.orbitLine);
    // anotimpurile: unde e Pământul când Soarele are longitudinea 0°, 90°, 180°, 270°
    while (this.orbitMarks.children.length) this.orbitMarks.remove(this.orbitMarks.children[0]);
    this.seasonPts = [];
    const pd = this._precDeg || 0;
    [0, 90, 180, 270].forEach((lam, i) => {
      const L = (lam - pd + 180), nu = (L - (peri + 180)) * D2R, r = a * (1 - e * e) / (1 + e * Math.cos(nu));
      const p = new T.Vector3(r * Math.cos(L * D2R), 0, -r * Math.sin(L * D2R));
      const m = new T.Mesh(new T.SphereGeometry(0.16, 16, 12), new T.MeshBasicMaterial({ color: [0x7CFC9A, 0xffd34d, 0xff9a4d, 0x8fd3ff][i] }));
      m.position.copy(p); this.orbitMarks.add(m); this.seasonPts.push(p);
    });
    // periheliu / afeliu
    const rp = a * (1 - e), ra = a * (1 + e), Lp = (peri + 180) * D2R;
    this.periPt = new T.Vector3(rp * Math.cos(Lp), 0, -rp * Math.sin(Lp));
    this.apPt = new T.Vector3(-ra * Math.cos(Lp), 0, ra * Math.sin(Lp));
    const pm = new T.Mesh(new T.SphereGeometry(0.09, 12, 8), new T.MeshBasicMaterial({ color: 0xffffff }));
    pm.position.copy(this.periPt); this.orbitMarks.add(pm);
    const am = pm.clone(); am.position.copy(this.apPt); this.orbitMarks.add(am);
    // lunile anului (doar pentru Pământul real)
    this.monthPts = [];
    if (model.isEarth()) {
      const y = new Date().getUTCFullYear();
      for (let mth = 0; mth < 12; mth++) {
        const s = model.sun(Date.UTC(2026, mth, 1, 12)), lf = (s.lam - (s.peri - model.p.peri)) * D2R;
        const p = new T.Vector3(-s.r * a * Math.cos(lf), 0, s.r * a * Math.sin(lf));
        const tk = new T.Mesh(new T.SphereGeometry(0.06, 8, 6), new T.MeshBasicMaterial({ color: 0xc8d4ff }));
        tk.position.copy(p); this.orbitMarks.add(tk); this.monthPts.push(p);
      }
    }
  };

  /* ---------------- actualizarea fiecărui cadru ---------------- */
  Globe.prototype.update = function (model, t, city, dtReal) {
    const s = model.sun(t);
    // cadrul scenei e fix față de stele; precesia mută echinocțiul, deci și axa
    const precDeg = s.peri - model.p.peri, precAng = precDeg * D2R;
    this._precDeg = precDeg;
    const lam = (s.lam - precDeg) * D2R;
    const sunDir = new T.Vector3(Math.cos(lam), 0, -Math.sin(lam));
    this.uni.sunDir.value.copy(sunDir);
    this.uni.cloudShift.value = ((t / A.DAY) * 0.004) % 1;   // norii se mișcă încet față de sol
    this.uni.cloudsOn.value = this.opts.clouds ? 1 : 0;
    this.uni.lights.value = this.opts.lights ? 1 : 0;
    const tiltRad = -model.p.tilt * D2R, theta = s.theta * D2R;
    [this.E, this.EO].forEach(E => {
      E.tilt.rotation.set(0, 0, 0);
      E.tilt.rotateY(-precAng); E.tilt.rotateX(tiltRad);
      E.spin.rotation.y = theta;
      E.axis.visible = E.nTip.visible = this.opts.axis;
    });
    this.grid.visible = this.opts.grid;
    // tropicele și cercurile polare urmează înclinarea aleasă
    const tt = model.p.tilt > 90 ? 180 - model.p.tilt : model.p.tilt;
    const setLat = (line, lat) => { const pos = line.geometry.attributes.position; for (let i = 0; i <= 180; i++) { const v = latLonVec(lat, i * 2, 1.004); pos.setXYZ(i, v.x, v.y, v.z); } pos.needsUpdate = true; };
    if (this._tt !== tt) { setLat(this.trop[0], tt); setLat(this.trop[1], -tt); setLat(this.trop[2], 90 - tt); setLat(this.trop[3], -(90 - tt)); this._tt = tt; }
    if (this._cityKey !== city.lat + ',' + city.lon) {
      this._cityKey = city.lat + ',' + city.lon;
      setLat(this.cityLine, city.lat);
      const p = latLonVec(city.lat, city.lon, 1.0);
      this.pin.position.copy(p); this.pin.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), p.clone().normalize());
    }
    const pulse = 1 + 0.25 * Math.sin(performance.now() / 260);
    this.pinHead.scale.setScalar(pulse);

    if (this.view === 'near') {
      this.sunSprite.position.copy(sunDir).multiplyScalar(300);
      this.sunLight.position.copy(sunDir).multiplyScalar(50);
      // Luna
      const showMoon = this.opts.moon && model.isEarth();
      this.moon.visible = showMoon;
      if (showMoon) {
        const mp = A.moonPos(t), L = mp.lam * D2R, B = mp.beta * D2R, R = 8.5;
        this.moon.position.set(R * Math.cos(B) * Math.cos(L), R * Math.sin(B), -R * Math.cos(B) * Math.sin(L));
        this.moon.lookAt(0, 0, 0); this.moon.rotateY(Math.PI);
      }
      // camera
      const f = this.opts.follow;
      this.scene().updateMatrixWorld(true);
      if (f === 'sun') this.ctlN.lookFrom(sunDir.clone().add(new T.Vector3(0, 0.25, 0)));
      else if (f === 'city') {
        const w = new T.Vector3(); this.pin.getWorldPosition(w);
        this.ctlN.lookFrom(w.clone().add(new T.Vector3(0, 0.15, 0)));
      }
      this.ctlN.update();
      this.renderer.render(this.near, this.camN);
    } else {
      this.buildOrbit(model, { peri: model.p.peri });
      const a = 11, r = s.r * a;
      const ep = new T.Vector3(-r * Math.cos(lam), 0, r * Math.sin(lam));
      this.EO.root.position.copy(ep);
      this.ray.geometry.setFromPoints([new T.Vector3(), ep]); this.ray.computeLineDistances();
      this.sunMat.uniforms.time.value = performance.now() / 1000;
      if (this.opts.follow === 'city') { this.ctlO.target.lerp(ep, 0.15); } else { this.ctlO.target.lerp(new T.Vector3(), 0.15); }
      this.ctlO.update();
      this.renderer.render(this.orbit, this.camO);
    }
    return { sun: s, sunDir };
  };
  Globe.prototype.scene = function () { return this.view === 'near' ? this.near : this.orbit; };
  Globe.prototype.cam = function () { return this.view === 'near' ? this.camN : this.camO; };

  /** proiectează un punct 3D pe ecran (px, relativ la canvas) */
  Globe.prototype.project = function (v) {
    const p = v.clone().project(this.cam());
    return { x: (p.x + 1) / 2 * this.el.clientWidth, y: (1 - p.y) / 2 * this.el.clientHeight, behind: p.z > 1 };
  };
  /** e orașul pe partea văzută a globului? */
  Globe.prototype.cityScreen = function () {
    const w = new T.Vector3(); this.pinHead.getWorldPosition(w);
    const camDir = this.camN.position.clone().sub(w).normalize();
    const n = w.clone().normalize();
    const visible = n.dot(camDir) > 0.05;
    return Object.assign(this.project(w), { visible });
  };
  Globe.prototype.snapshot = function () { return this.canvas.toDataURL('image/png'); };

  window.Globe = Globe;
})();
