/* ==========================================================================
   eclipse.js — 🌑 Simulatorul de eclipse
   7 tipuri: de Soare (totală, parțială, inelară, hibridă) și de Lună
   (totală, parțială, prin penumbră). Geometria e cea reală: razele Soarelui,
   Lunii și Pământului, distanțele (perigeu–apogeu, periheliu–afeliu).
   Trei vederi: globul 3D (umbra Lunii pe Pământ / Luna în umbra Pământului),
   „ce vezi pe cer” și schema cu conurile de umbră.
   ========================================================================== */
(function () {
  'use strict';
  const L = window.I18N, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const tr = o => (o && typeof o === 'object' && !Array.isArray(o)) ? (o[L.lang] || o.ro) : o;
  const D2R = Math.PI / 180, R2D = 180 / Math.PI;
  const RS = 696000, RM = 1737.4, RE = 6378.1, AU = 149597871;

  /* ---------------- textele ---------------- */
  const TXT = {
    btn: { ro: '🌑 Eclipse', en: '🌑 Eclipses' },
    title: { ro: '🌑 Eclipsele de Soare și de Lună', en: '🌑 Solar and lunar eclipses' },
    solar: { ro: '☀️ De Soare', en: '☀️ Solar' }, lunar: { ro: '🌕 De Lună', en: '🌕 Lunar' },
    custom: { ro: '🧪 Fă-o tu', en: '🧪 Make your own' },
    v3d: { ro: 'Pe glob', en: 'On the globe' }, vsky: { ro: 'Ce vezi pe cer', en: 'What you see in the sky' },
    vside: { ro: 'Cum se aliniază (desen, nu la scară)', en: 'How they line up (diagram, not to scale)' },
    play: { ro: '▶ Pornește eclipsa', en: '▶ Run the eclipse' }, pause: { ro: '⏸ Pauză', en: '⏸ Pause' },
    sDist: { ro: 'Distanța Pământ–Lună', en: 'Earth–Moon distance' },
    sDistH: { ro: '356 500 km (perigeu, Luna pare mare) … 406 700 km (apogeu, Luna pare mică)', en: '356,500 km (perigee, Moon looks big) … 406,700 km (apogee, Moon looks small)' },
    sOff: { ro: 'Cât de departe ești de centrul umbrei', en: 'How far you are from the centre of the shadow' },
    sOffH: { ro: '0 km = umbra trece chiar peste tine', en: '0 km = the shadow passes right over you' },
    sB: { ro: 'Cât de sus sau de jos trece Luna față de umbra Pământului', en: 'How far above or below Earth\'s shadow the Moon passes' },
    sBH: { ro: 'Orbita Lunii e înclinată cu 5°: de cele mai multe ori Luna trece pe lângă umbră.', en: 'The Moon\'s orbit is tilted by 5°: most months it misses the shadow.' },
    sSun: { ro: 'Luna anului (distanța până la Soare)', en: 'Month of the year (distance to the Sun)' },
    sSunH: { ro: 'ianuarie: Soarele e mai aproape și pare puțin mai mare · iulie: mai departe', en: 'January: the Sun is closer and looks slightly bigger · July: farther' },
    sEl: { ro: 'Cât de sus e Soarele pe cerul tău', en: 'How high the Sun is in your sky' },
    sElH: { ro: 'Soarele sus = ești mai aproape de Lună cu până la 6 378 km (raza Pământului). Asta face eclipsele hibride!', en: 'Sun high = you are up to 6,378 km (Earth\'s radius) closer to the Moon. That is what makes hybrid eclipses!' },
    res: { ro: 'Rezultat', en: 'Result' },
    none: { ro: 'nicio eclipsă: Luna trece pe lângă', en: 'no eclipse: the Moon misses' },
    t_total: { ro: 'eclipsă totală de Soare', en: 'total solar eclipse' }, t_partial: { ro: 'eclipsă parțială de Soare', en: 'partial solar eclipse' },
    t_annular: { ro: 'eclipsă inelară de Soare', en: 'annular solar eclipse' }, t_hybrid: { ro: 'eclipsă hibridă de Soare', en: 'hybrid solar eclipse' },
    t_ltotal: { ro: 'eclipsă totală de Lună', en: 'total lunar eclipse' }, t_lpartial: { ro: 'eclipsă parțială de Lună', en: 'partial lunar eclipse' },
    t_lpen: { ro: 'eclipsă de Lună prin penumbră', en: 'penumbral lunar eclipse' },
    cover: { ro: 'Soare acoperit (maxim): {v} %', en: 'Sun covered (max): {v}%' },
    dur: { ro: 'Totalitatea durează aproximativ {v}', en: 'Totality lasts about {v}' },
    ring: { ro: 'Inelul de foc durează aproximativ {v}', en: 'The ring of fire lasts about {v}' },
    ldur: { ro: 'Luna stă în umbră aproximativ {v}', en: 'The Moon stays in the umbra about {v}' },
    sizes: { ro: 'Luna pare {m}% din mărimea Soarelui', en: 'The Moon looks {m}% the size of the Sun' },
    now: { ro: 'acum: ', en: 'now: ' },
    ph_none: { ro: 'Soarele e întreg', en: 'the Sun is whole' }, ph_part: { ro: 'Luna „mușcă” din Soare', en: 'the Moon "bites" the Sun' },
    ph_tot: { ro: 'TOTALITATE: se vede coroana Soarelui!', en: 'TOTALITY: the Sun\'s corona is visible!' }, ph_ring: { ro: 'INEL DE FOC', en: 'RING OF FIRE' },
    ph_dia: { ro: '💎 inelul cu diamant', en: '💎 diamond ring' },
    lph_none: { ro: 'Luna plină, strălucitoare', en: 'bright full Moon' }, lph_pen: { ro: 'Luna e în penumbră: abia se observă', en: 'the Moon is in the penumbra: barely noticeable' },
    lph_part: { ro: 'o parte din Lună e în umbră, iar marginea umbrei e rotundă!', en: 'part of the Moon is in the umbra, and the shadow\'s edge is round!' }, lph_tot: { ro: 'LUNA SÂNGERIE: toată Luna e în umbră', en: 'BLOOD MOON: the whole Moon is in the umbra' },
    umbra: { ro: 'umbra', en: 'umbra' }, penumbra: { ro: 'penumbra', en: 'penumbra' }, antumbra: { ro: 'antumbra', en: 'antumbra' },
    sun: { ro: 'Soarele', en: 'Sun' }, moon: { ro: 'Luna', en: 'Moon' }, earth: { ro: 'Pământul', en: 'Earth' }, you: { ro: 'tu', en: 'you' },
    safety: { ro: '⚠️ Nu te uita niciodată direct la Soare, nici în timpul eclipsei! Folosește doar ochelari speciali de eclipsă. O eclipsă de Lună se poate privi fără grijă.', en: '⚠️ Never look straight at the Sun, not even during an eclipse! Only use special eclipse glasses. A lunar eclipse is completely safe to watch.' },
    real: { ro: '📅 Eclipse adevărate care urmează', en: '📅 Real eclipses coming up' },
    why: { ro: 'De ce nu avem eclipsă în fiecare lună?', en: 'Why isn\'t there an eclipse every month?' },
    whyP: { ro: 'Orbita Lunii e înclinată cu aproximativ 5° față de drumul Pământului în jurul Soarelui. De cele mai multe ori, la Lună nouă, umbra Lunii trece pe deasupra sau pe dedesubtul Pământului. La Lună plină, Luna trece pe lângă umbra Pământului. Eclipsele au loc doar când Luna e chiar pe linia Soare–Pământ, adică de 4–7 ori pe an în total.',
      en: 'The Moon\'s orbit is tilted by about 5° to the Earth\'s path around the Sun. At most new Moons, the Moon\'s shadow passes above or below the Earth. At full Moon, the Moon passes beside Earth\'s shadow. Eclipses only happen when the Moon is right on the Sun–Earth line, 4–7 times a year in total.' },
    close: { ro: '✕ Închide', en: '✕ Close' },
    ringC: { ro: 'arată pe glob conturul umbrei (roșu) și al penumbrei (portocaliu)', en: 'show the outline of the umbra (red) and penumbra (orange) on the globe' },
    teacher: { ro: 'Pentru profesor: ', en: 'For the teacher: ' }
  };
  const T = k => tr(TXT[k]);

  /* ---------------- tipurile de eclipsă (presetări) ---------------- */
  const TYPES = [
    { id: 'total', kind: 'solar', icon: '🌑', name: { ro: 'Totală', en: 'Total' }, d: 359500, off: 0, month: 7, el: 60,
      ex: { ro: 'Luna acoperă <b>tot</b> Soarele. Pentru câteva minute se face noapte în plină zi: apar stelele, păsările se liniștesc, iar în jurul Lunii negre strălucește <b>coroana</b>, atmosfera de foc a Soarelui. Soarele e de 400 de ori mai mare decât Luna, dar și de aproape 400 de ori mai departe, așa că pe cer par la fel de mari!',
            en: 'The Moon covers the <b>whole</b> Sun. For a few minutes night falls in the middle of the day: stars come out, birds go quiet, and around the black Moon the <b>corona</b>, the Sun\'s fiery atmosphere, shines. The Sun is 400 times bigger than the Moon, but also nearly 400 times farther away, so in the sky they look the same size!' },
      teach: { ro: 'Umbra (umbra propriu-zisă) are doar 100–270 km lățime pe Pământ, așa că totalitatea se vede doar pe o fâșie îngustă. Maximul posibil e de ~7,5 min. Pe glob se vede punctul negru, umbra, înconjurat de penumbra largă.', en: 'The umbra is only 100–270 km wide on Earth, so totality is seen only along a narrow strip. The maximum possible is ~7.5 min. On the globe you see the black dot (umbra) inside the wide penumbra.' } },
    { id: 'partial', kind: 'solar', icon: '🌘', name: { ro: 'Parțială', en: 'Partial' }, d: 380000, off: 1500, month: 7, el: 50,
      ex: { ro: 'Ești <b>lângă</b> umbra Lunii, în <b>penumbră</b>. De acolo vezi Luna „mușcând” doar o parte din Soare, ca dintr-un biscuit. Lumina scade puțin, dar nu se face întuneric.',
            en: 'You are <b>next to</b> the Moon\'s shadow, in the <b>penumbra</b>. From there you see the Moon "biting" only part of the Sun, like a biscuit. The light dims a little, but it doesn\'t get dark.' },
      teach: { ro: 'Mută sliderul „cât de departe ești de centrul umbrei” de la 0 la 3 000 km și urmărește cum totala devine parțială. Pe 2 august 2027, la Londra, Soarele va fi acoperit în proporție de ~42%.', en: 'Move the "how far from the centre of the shadow" slider from 0 to 3,000 km and watch total turn into partial. On 2 August 2027, London will see ~42% of the Sun covered.' } },
    { id: 'annular', kind: 'solar', icon: '💍', name: { ro: 'Inelară', en: 'Annular' }, d: 405500, off: 0, month: 1, el: 50,
      ex: { ro: 'Luna e la cel mai mare depărtare de Pământ (<b>apogeu</b>), deci pare puțin mai mică decât Soarele. Când trece prin fața lui, rămâne în jur un <b>inel de foc</b>.',
            en: 'The Moon is at its farthest from Earth (<b>apogee</b>), so it looks slightly smaller than the Sun. When it passes in front, a <b>ring of fire</b> is left around it.' },
      teach: { ro: 'Umbra nu mai ajunge la sol: vârful conului rămâne în spațiu, iar pe Pământ cade „antumbra”. Pe 26 ianuarie 2028 eclipsa va fi inelară în sudul Spaniei și al Portugaliei.', en: 'The umbra no longer reaches the ground: the tip of the cone stays in space, and the "antumbra" falls on Earth. On 26 January 2028 the eclipse will be annular in southern Spain and Portugal.' } },
    { id: 'hybrid', kind: 'solar', icon: '🔀', name: { ro: 'Hibridă', en: 'Hybrid' }, d: 375400, off: 0, month: 4, el: 85,
      ex: { ro: 'Luna pare <b>aproape exact cât</b> Soarele. Unde Soarele e sus pe cer, oamenii sunt mai aproape de Lună cu până la 6 378 km, deci Luna pare puțin mai mare și eclipsa e <b>totală</b>. La capetele drumului, unde Soarele e jos, eclipsa devine <b>inelară</b>.',
            en: 'The Moon looks <b>almost exactly the same size</b> as the Sun. Where the Sun is high in the sky, people are up to 6,378 km closer to the Moon, so the Moon looks slightly bigger and the eclipse is <b>total</b>. At the ends of the path, where the Sun is low, it becomes <b>annular</b>.' },
      teach: { ro: 'Mută sliderul „cât de sus e Soarele” de la 85° la 5°: eclipsa trece din totală în inelară. Sunt foarte rare (~4–5% din eclipsele de Soare). Următoarea: 14 noiembrie 2031 (Pacific; inelară în Panama, la apus).', en: 'Move the "how high the Sun is" slider from 85° to 5°: the eclipse turns from total to annular. Very rare (~4–5% of solar eclipses). Next: 14 November 2031 (Pacific; annular in Panama at sunset).' } },
    { id: 'ltotal', kind: 'lunar', icon: '🔴', name: { ro: 'Totală (Luna sângerie)', en: 'Total (blood Moon)' }, d: 372000, b: 0.12, month: 12,
      ex: { ro: 'Luna intră toată în <b>umbra Pământului</b>, dar nu dispare: se face <b>roșie-arămie</b>! Atmosfera Pământului îndoaie spre Lună un pic de lumină roșie, lumina tuturor răsăriturilor și apusurilor de pe Pământ în același timp.',
            en: 'The whole Moon enters <b>Earth\'s shadow</b>, but it doesn\'t vanish: it turns <b>coppery red</b>! Earth\'s atmosphere bends a little red light onto the Moon: the light of every sunrise and sunset on Earth at the same moment.' },
      teach: { ro: 'Eclipsa de Lună se vede de pe toată emisfera unde e noapte, nu doar de pe o fâșie, și se poate privi fără ochelari. Pe 31 decembrie 2028 urmează una totală, de 71 de minute.', en: 'A lunar eclipse is visible from the whole night-side hemisphere, not just a strip, and is safe to watch without glasses. A total one comes on 31 December 2028, lasting 71 minutes.' } },
    { id: 'lpartial', kind: 'lunar', icon: '🌗', name: { ro: 'Parțială', en: 'Partial' }, d: 384000, b: 0.66, month: 7,
      ex: { ro: 'Doar o parte din Lună intră în umbra Pământului. Privește marginea umbrei: e mereu <b>rotundă</b>. Așa și-a dat seama Aristotel, acum 2 300 de ani, că Pământul e rotund!',
            en: 'Only part of the Moon enters Earth\'s shadow. Look at the shadow\'s edge: it is always <b>round</b>. That\'s how Aristotle worked out, 2,300 years ago, that the Earth is round!' },
      teach: { ro: 'Bună ocazie pentru întrebarea „ce formă are umbra unei mingi? dar a unei farfurii?”. Doar o sferă face umbră rotundă din orice direcție. Următoarea: 6 iulie 2028, la răsăritul Lunii, în Europa.', en: 'A good moment to ask "what shape is a ball\'s shadow? and a plate\'s?". Only a sphere casts a round shadow from every direction. Next: 6 July 2028, at moonrise in Europe.' } },
    { id: 'lpen', kind: 'lunar', icon: '🌕', name: { ro: 'Prin penumbră', en: 'Penumbral' }, d: 390000, b: 1.08, month: 2,
      ex: { ro: 'Luna trece doar prin <b>penumbra</b> Pământului, umbra slabă de la margine. Se întunecă foarte puțin, ca și cum cineva ar fi micșorat un pic lumina. Mulți oameni nici nu observă!',
            en: 'The Moon passes only through Earth\'s <b>penumbra</b>, the faint shadow at the edge. It darkens very slightly, as if someone turned the light down a little. Many people don\'t even notice!' },
      teach: { ro: 'Din penumbră, o parte din Soare tot se vede, așa că Luna primește încă destulă lumină. Pe 20 februarie 2027, una prin penumbră va fi vizibilă complet din Europa.', en: 'From the penumbra part of the Sun is still visible, so the Moon still gets plenty of light. On 20 February 2027 a penumbral one will be fully visible from Europe.' } }
  ];
  const REAL = [
    { t: 'annular', d: { ro: '6 feb 2027', en: '6 Feb 2027' }, s: { ro: 'inelară de Soare', en: 'annular solar' } },
    { t: 'lpen', d: { ro: '20 feb 2027', en: '20 Feb 2027' }, s: { ro: 'de Lună prin penumbră · vizibilă din toată Europa', en: 'penumbral lunar · fully visible from Europe' } },
    { t: 'total', d: { ro: '2 aug 2027', en: '2 Aug 2027' }, s: { ro: 'totală de Soare, până la 6 min 23 s · Spania, Maroc, Egipt · la Londra parțială (~42%)', en: 'total solar, up to 6 min 23 s · Spain, Morocco, Egypt · partial in London (~42%)' } },
    { t: 'annular', d: { ro: '26 ian 2028', en: '26 Jan 2028' }, s: { ro: 'inelară în sudul Spaniei și Portugaliei · la Londra parțială (~50%), la apus', en: 'annular in southern Spain & Portugal · partial in London (~50%) at sunset' } },
    { t: 'lpartial', d: { ro: '6 iul 2028', en: '6 Jul 2028' }, s: { ro: 'parțială de Lună · răsare eclipsată în Europa', en: 'partial lunar · rises eclipsed in Europe' } },
    { t: 'ltotal', d: { ro: '31 dec 2028', en: '31 Dec 2028' }, s: { ro: 'totală de Lună, 71 de minute', en: 'total lunar, 71 minutes' } },
    { t: 'hybrid', d: { ro: '14 nov 2031', en: '14 Nov 2031' }, s: { ro: 'hibridă de Soare · Pacific, inelară în Panama', en: 'hybrid solar · Pacific, annular in Panama' } }
  ];

  /* ---------------- starea ---------------- */
  const E = { ring: true, open: false, type: TYPES[0], kind: 'solar', d: 359500, off: 0, b: 0.12, month: 7, el: 60, p: 0.5, playing: false, custom: false };
  let globe = null, raf = 0, prevHost = null, saved = null;

  /* ---------------- interfața (creată din JS) ---------------- */
  function buildDom() {
    const m = document.createElement('div');
    m.className = 'ecl-modal hidden'; m.id = 'eclModal';
    m.innerHTML = `<div class="ecl-box" role="dialog" aria-modal="true">
      <div class="ecl-head"><h2 id="eclTitle"></h2><button class="btn" id="eclClose"></button></div>
      <div class="ecl-types" id="eclTypes"></div>
      <div class="ecl-grid">
        <div class="ecl-left">
          <div class="ecl-cap" id="capSky"></div>
          <canvas id="eclSky" width="760" height="430"></canvas>
          <div class="ecl-ctl"><button class="btn primary" id="eclPlay"></button><input type="range" id="eclP" min="0" max="1" step="0.001" value="0.5"><span id="eclPhase" class="ecl-phase"></span></div>
          <div class="ecl-cap" id="capSide"></div>
          <canvas id="eclSide" width="760" height="250"></canvas>
        </div>
        <div class="ecl-right">
          <div class="ecl-cap" id="cap3d"></div>
          <div class="stage3d ecl3d" id="stageEcl"></div>
          <div class="ecl-result" id="eclResult"></div>
          <div class="ecl-sliders" id="eclSliders"></div>
          <div class="ecl-explain" id="eclExplain"></div>
        </div>
      </div>
      <div class="ecl-bottom">
        <div class="ecl-safety" id="eclSafety"></div>
        <div class="ecl-why"><h4 id="eclWhyH"></h4><p id="eclWhyP"></p></div>
        <div class="ecl-real"><h4 id="eclRealH"></h4><div id="eclReal"></div></div>
      </div>
    </div>`;
    document.body.appendChild(m);
    $('#eclClose').onclick = close;
    m.addEventListener('click', e => { if (e.target === m) close(); });
    document.addEventListener('keydown', e => { if (E.open && e.key === 'Escape') close(); });
    $('#eclPlay').onclick = () => { E.playing = !E.playing; if (E.playing && E.p >= 0.995) E.p = 0; labelPlay(); };
    $('#eclP').addEventListener('input', e => { E.p = +e.target.value; E.playing = false; labelPlay(); });
  }
  function labelPlay() { $('#eclPlay').textContent = E.playing ? T('pause') : T('play'); }

  function renderStatic() {
    $('#eclTitle').textContent = T('title'); $('#eclClose').textContent = T('close');
    $('#capSky').textContent = T('vsky'); $('#capSide').textContent = T('vside'); $('#cap3d').textContent = T('v3d');
    $('#eclSafety').textContent = T('safety'); $('#eclWhyH').textContent = T('why'); $('#eclWhyP').textContent = T('whyP');
    $('#eclRealH').textContent = T('real');
    const chip = t => `<button class="chip${E.type === t && !E.custom ? ' on' : ''}" data-t="${t.id}">${t.icon} ${tr(t.name)}</button>`;
    $('#eclTypes').innerHTML = `<span class="lbl">${T('solar')}</span>${TYPES.filter(t => t.kind === 'solar').map(chip).join('')}
      <span class="lbl">${T('lunar')}</span>${TYPES.filter(t => t.kind === 'lunar').map(chip).join('')}
      <button class="chip${E.custom ? ' on' : ''}" id="eclCustom">${T('custom')}</button>`;
    $$('#eclTypes [data-t]').forEach(b => b.onclick = () => pick(TYPES.find(t => t.id === b.dataset.t)));
    $('#eclCustom').onclick = () => { E.custom = true; renderStatic(); };
    $('#eclReal').innerHTML = REAL.map(r => `<button class="ecl-rl" data-t="${r.t}"><b>${tr(r.d)}</b> · ${tr(r.s)}</button>`).join('');
    $$('#eclReal [data-t]').forEach(b => b.onclick = () => pick(TYPES.find(t => t.id === b.dataset.t)));
    const t = E.type;
    $('#eclExplain').innerHTML = `<h4>${t.icon} ${tr(t.name)}</h4><p>${tr(t.ex)}</p><p class="small">👩‍🏫 <b>${T('teacher')}</b>${tr(t.teach)}</p>`;
    sliders(); labelPlay();
  }
  function sliders() {
    const months = (L.lang === 'en' ? 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec' : 'ian,feb,mar,apr,mai,iun,iul,aug,sep,oct,nov,dec').split(',');
    const row = (id, lab, hint, min, max, step, val, out) => `<div class="row"><span>${lab}</span><output id="o_${id}">${out}</output>
      <input type="range" id="s_${id}" min="${min}" max="${max}" step="${step}" value="${val}"><span class="hint">${hint}</span></div>`;
    let h = row('d', T('sDist'), T('sDistH'), 356500, 406700, 100, E.d, fmtKm(E.d));
    if (E.kind === 'solar') h += `<label class="small"><input type="checkbox" id="eclRingC"${E.ring ? ' checked' : ''}> ${T('ringC')}</label>`;
    if (E.kind === 'solar') { h += row('off', T('sOff'), T('sOffH'), 0, 4500, 50, E.off, fmtKm(E.off)); h += row('el', T('sEl'), T('sElH'), 2, 90, 1, E.el, E.el + '°'); }
    else h += row('b', T('sB'), T('sBH'), 0, 1.7, 0.01, E.b, E.b.toFixed(2) + '°');
    h += row('m', T('sSun'), T('sSunH'), 1, 12, 1, E.month, months[E.month - 1]);
    $('#eclSliders').innerHTML = `<div class="ctl">${h}</div>`;
    const rc = $('#eclRingC'); if (rc) rc.onchange = e => { E.ring = e.target.checked; if (globe) globe.uni.eclRing.value = E.ring ? 1 : 0; };
    const on = (id, fn) => { const el = $('#s_' + id); if (el) el.addEventListener('input', e => { fn(+e.target.value); E.custom = true; $$('#eclTypes .chip').forEach(c => c.classList.toggle('on', c.id === 'eclCustom')); outs(); }); };
    on('d', v => E.d = v); on('off', v => E.off = v); on('el', v => E.el = v); on('b', v => E.b = v); on('m', v => E.month = v);
    function outs() {
      const o = (id, v) => { const el = $('#o_' + id); if (el) el.textContent = v; };
      o('d', fmtKm(E.d)); o('off', fmtKm(E.off)); o('el', E.el + '°'); o('b', E.b.toFixed(2) + '°'); o('m', months[E.month - 1]);
    }
  }
  const fmtKm = v => Math.round(v).toLocaleString(L.lang === 'ro' ? 'ro-RO' : 'en-GB') + ' km';
  function pick(t) {
    E.type = t; E.kind = t.kind; E.custom = false; E.d = t.d; E.month = t.month;
    if (t.kind === 'solar') { E.off = t.off; E.el = t.el; } else E.b = t.b;
    E.p = 0.08; E.playing = true; setupGlobe(); renderStatic(); labelPlay();
  }

  /* ---------------- geometria ---------------- */
  function sunDistKm() { // distanța Pământ–Soare după lună (periheliu ~3 ian, afeliu ~4 iul)
    const M = ((E.month - 1) * 30.4 + 15 - 3) / 365.25 * 2 * Math.PI;
    return AU * (1 - 0.0167 * Math.cos(M));
  }
  const rsAng = () => Math.asin(RS / sunDistKm());           // raza unghiulară a Soarelui (rad)
  function overlap(rs, rm, d) {
    if (d >= rs + rm) return 0;
    if (d <= Math.abs(rm - rs)) return rm >= rs ? 1 : (rm * rm) / (rs * rs);
    const a1 = Math.acos(Math.max(-1, Math.min(1, (d * d + rs * rs - rm * rm) / (2 * d * rs))));
    const a2 = Math.acos(Math.max(-1, Math.min(1, (d * d + rm * rm - rs * rs) / (2 * d * rm))));
    const k = Math.sqrt(Math.max(0, (-d + rs + rm) * (d + rs - rm) * (d - rs + rm) * (d + rs + rm)));
    return (rs * rs * a1 + rm * rm * a2 - 0.5 * k) / (Math.PI * rs * rs);
  }
  // distanța topocentrică (observatorul e mai aproape de Lună când Soarele e sus)
  const dTopo = () => E.d - RE * Math.sin(E.el * D2R);
  // SOARE: în planul cerului, unghiuri în radiani; Luna parcurge ±SPAN în jurul Soarelui
  const SPAN_S = 0.0125, SPAN_L = 1.75 * D2R;
  function solarAt(p) {
    const dt = dTopo(), rm = Math.asin(RM / dt), rs = rsAng();
    const y = (E.off / dt), x = (p - 0.5) * 2 * SPAN_S;   // decalaj unghiular (rad)
    const sep = Math.hypot(x, y);
    return { x, y, sep, rm, rs, cov: overlap(rs, rm, sep) };
  }
  function lunarAt(p) {
    const rs = rsAng(), pm = Math.asin(RE / E.d), ps = 8.794 / 3600 * D2R, rm = Math.asin(RM / E.d);
    const umbra = 1.02 * (pm + ps - rs), pen = 1.02 * (pm + ps + rs);
    const x = (p - 0.5) * 2 * SPAN_L, y = E.b * D2R, sep = Math.hypot(x, y);
    return { x, y, sep, rm, umbra, pen };
  }
  function classify() {
    if (E.kind === 'solar') {
      const s = solarAt(0.5), rs = s.rs, rm = s.rm, b = Math.abs(s.y);
      let type = 'none';
      if (b < rs + rm) type = b <= Math.abs(rm - rs) ? (rm >= rs ? 'total' : 'annular') : 'partial';
      // hibridă: totală cu Soarele sus, inelară cu Soarele la orizont
      const rmLow = Math.asin(RM / E.d), rmHigh = Math.asin(RM / (E.d - RE));
      const hybridPossible = rmLow < rs && rmHigh > rs && b < Math.abs(rmHigh - rs);
      const cov = overlap(rs, rm, b);
      const relRate = 2 * SPAN_S / (4.5 * 60);                      // rad / minut (aprox., p: 0→1 ≈ 4,5 h)
      const half = Math.sqrt(Math.max(0, (rm - rs) ** 2 - b * b));
      return { type, hybridPossible, cov, mins: 2 * half / relRate, ratio: rm / rs };
    } else {
      const l = lunarAt(0.5), b = Math.abs(l.y);
      let type = 'none';
      if (b + l.rm <= l.umbra) type = 'ltotal'; else if (b - l.rm < l.umbra) type = 'lpartial'; else if (b - l.rm < l.pen) type = 'lpen';
      const v = 0.55 * D2R / 60;                                      // Luna: ~0,55°/h față de umbră
      const tot = Math.sqrt(Math.max(0, (l.umbra - l.rm) ** 2 - b * b));
      return { type, mins: 2 * tot / v, umbra: l.umbra, pen: l.pen, rm: l.rm };
    }
  }
  function fmtMin(m) { if (m < 60) { const mm = Math.floor(m), ss = Math.round((m - mm) * 60); return mm + ' min ' + String(ss).padStart(2, '0') + ' s'; } return Math.floor(m / 60) + ' h ' + Math.round(m % 60) + ' min'; }

  /* ---------------- vederea „pe cer” ---------------- */
  let moonImg = new Image(); moonImg.src = window.TEX.moon;
  function drawSky() {
    const cv = $('#eclSky'), g = cv.getContext('2d'), W = cv.width, H = cv.height, cx = W / 2, cy = H / 2 - 10;
    if (E.kind === 'solar') {
      const s = solarAt(E.p), K = 155 / s.rs;                      // Soarele are raza de 155 px
      const light = 1 - s.cov;
      const dayK = Math.min(1, Math.pow(light, 0.6) * 1.15 + (light > 0.002 ? 0.05 : 0));
      const top = mix([6, 10, 32], [52, 122, 220], dayK), bot = mix([28, 22, 52], [160, 205, 250], dayK);
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, rgb(top)); gr.addColorStop(1, rgb(bot));
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      const total = s.sep <= s.rm - s.rs;
      if (light < 0.03) { // stele și planete
        g.fillStyle = `rgba(255,255,255,${0.9 * (1 - light / 0.03)})`;
        [[90, 60], [650, 90], [140, 330], [700, 300], [400, 40], [560, 380], [60, 200]].forEach(([x, y], i) => { g.beginPath(); g.arc(x, y, i === 1 ? 2.6 : 1.4, 0, 7); g.fill(); });
      }
      // coroana
      if (total || light < 0.004) {
        const a = total ? 1 : 0.4;
        for (let i = 0; i < 26; i++) {
          const ang = i / 26 * Math.PI * 2 + Math.sin(i * 7.3) * 0.2, len = 155 * (1.4 + 0.9 * Math.abs(Math.sin(i * 3.7)));
          const gg = g.createLinearGradient(cx, cy, cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
          gg.addColorStop(0, `rgba(255,255,255,${0.55 * a})`); gg.addColorStop(1, 'rgba(200,220,255,0)');
          g.strokeStyle = gg; g.lineWidth = 10 + 12 * Math.abs(Math.sin(i * 1.9)); g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len); g.stroke();
        }
        const cg = g.createRadialGradient(cx, cy, 150, cx, cy, 330); cg.addColorStop(0, `rgba(255,255,255,${0.85 * a})`); cg.addColorStop(0.25, `rgba(220,230,255,${0.35 * a})`); cg.addColorStop(1, 'rgba(180,200,255,0)');
        g.fillStyle = cg; g.beginPath(); g.arc(cx, cy, 330, 0, 7); g.fill();
      }
      // halou în timpul zilei
      if (!total) { const hg = g.createRadialGradient(cx, cy, 150, cx, cy, 300); hg.addColorStop(0, `rgba(255,250,220,${0.6 * light})`); hg.addColorStop(1, 'rgba(255,250,220,0)'); g.fillStyle = hg; g.beginPath(); g.arc(cx, cy, 300, 0, 7); g.fill(); }
      // discul Soarelui (întunecat la margine)
      const sg = g.createRadialGradient(cx, cy, 0, cx, cy, 155); sg.addColorStop(0, '#fffdf2'); sg.addColorStop(0.75, '#fff3c4'); sg.addColorStop(1, '#ffc766');
      g.fillStyle = sg; g.beginPath(); g.arc(cx, cy, 155, 0, 7); g.fill();
      // protuberanțe (vizibile doar la totalitate)
      if (total) { g.fillStyle = 'rgba(255,60,90,.9)'; [[0.6, 9], [2.4, 7], [4.1, 11]].forEach(([a, r]) => { g.beginPath(); g.arc(cx + Math.cos(a) * 157, cy + Math.sin(a) * 157, r, 0, 7); g.fill(); }); }
      // Luna
      const mx = cx - s.x * K, my = cy - s.y * K, mr = s.rm * K;   // privind spre sud: estul e în stânga
      g.fillStyle = total ? '#030308' : '#0b0d14'; g.beginPath(); g.arc(mx, my, mr, 0, 7); g.fill();
      // inelul cu diamant: chiar înainte / după totalitate
      const edge = s.sep - (s.rm - s.rs);
      if (s.rm > s.rs && edge > 0 && edge < 0.035 * s.rs) {
        const ang = Math.atan2(-(my - cy), -(mx - cx)), dx = cx + Math.cos(ang) * 155, dy = cy + Math.sin(ang) * 155;
        const dg = g.createRadialGradient(dx, dy, 0, dx, dy, 70); dg.addColorStop(0, 'rgba(255,255,255,1)'); dg.addColorStop(0.2, 'rgba(255,255,240,.8)'); dg.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = dg; g.beginPath(); g.arc(dx, dy, 70, 0, 7); g.fill();
        for (let i = 0; i < 4; i++) { g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; g.beginPath(); const a = i * Math.PI / 4; g.moveTo(dx - Math.cos(a) * 60, dy - Math.sin(a) * 60); g.lineTo(dx + Math.cos(a) * 60, dy + Math.sin(a) * 60); g.stroke(); }
      }
      // peisaj
      g.fillStyle = mix2(dayK); g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 20) g.lineTo(x, H - 26 - 10 * Math.sin(x / 70) - 6 * Math.sin(x / 23)); g.lineTo(W, H); g.fill();
      let ph = T('ph_none');
      if (s.cov > 0.0005) ph = T('ph_part') + ' · ' + Math.round(s.cov * 100) + '%';
      if (total) ph = T('ph_tot'); else if (s.rm < s.rs && s.sep <= s.rs - s.rm) ph = T('ph_ring');
      if (s.rm > s.rs && edge > 0 && edge < 0.035 * s.rs) ph = T('ph_dia');
      $('#eclPhase').textContent = T('now') + ph;
    } else {
      const l = lunarAt(E.p), K = 175 / l.pen;
      g.fillStyle = '#04060f'; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 70; i++) { g.fillRect((i * 137) % W, (i * 71) % H, 1.3, 1.3); }
      // penumbra și umbra (centrate)
      const pg = g.createRadialGradient(cx, cy, l.umbra * K, cx, cy, l.pen * K); pg.addColorStop(0, 'rgba(120,130,160,.22)'); pg.addColorStop(1, 'rgba(120,130,160,0)');
      g.fillStyle = pg; g.beginPath(); g.arc(cx, cy, l.pen * K, 0, 7); g.fill();
      g.setLineDash([6, 6]); g.strokeStyle = 'rgba(255,120,90,.55)'; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, l.umbra * K, 0, 7); g.stroke();
      g.strokeStyle = 'rgba(170,180,210,.35)'; g.beginPath(); g.arc(cx, cy, l.pen * K, 0, 7); g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(255,150,120,.8)'; g.font = '13px system-ui'; g.textAlign = 'center';
      g.fillText(T('umbra'), cx, cy - l.umbra * K - 6); g.fillStyle = 'rgba(190,200,230,.7)'; g.fillText(T('penumbra'), cx, cy - l.pen * K - 6);
      // Luna, cu umbrirea calculată pixel cu pixel (pe o grilă mică)
      const mx = cx - l.x * K, my = cy - l.y * K, mr = l.rm * K;
      g.save(); g.beginPath(); g.arc(mx, my, mr, 0, 7); g.clip();
      if (moonImg.complete) g.drawImage(moonImg, moonImg.width * 0.25, 0, moonImg.width * 0.5, moonImg.height, mx - mr, my - mr, mr * 2, mr * 2);
      else { g.fillStyle = '#ddd'; g.fillRect(mx - mr, my - mr, 2 * mr, 2 * mr); }
      const rs = rsAng(), step = 4;
      for (let yy = -mr; yy < mr; yy += step) for (let xx = -mr; xx < mr; xx += step) {
        if (xx * xx + yy * yy > (mr + step) * (mr + step)) continue;
        const ax = (mx + xx - cx) / K, ay = (my + yy - cy) / K, d = Math.hypot(ax, ay);
        // din punctul acesta al Lunii: cât din Soare ascunde Pământul?
        const ePm = (l.umbra + l.pen) / 2;                          // raza aparentă a Pământului
        const cov = overlap(rs, ePm, d);
        if (cov <= 0) continue;
        const red = Math.max(0, (cov - 0.82) / 0.18);
        g.fillStyle = `rgba(${Math.round(25 + 90 * red)},${Math.round(8 + 10 * red)},${Math.round(10)},${Math.min(0.93, cov * 0.95)})`;
        g.fillRect(mx + xx, my + yy, step, step);
      }
      g.restore();
      let ph = T('lph_none');
      const dmin = l.sep;
      if (dmin - l.rm < l.pen) ph = T('lph_pen');
      if (dmin - l.rm < l.umbra) ph = T('lph_part');
      if (dmin + l.rm <= l.umbra) ph = T('lph_tot');
      $('#eclPhase').textContent = T('now') + ph;
    }
    g.fillStyle = 'rgba(255,255,255,.8)'; g.font = '600 13px system-ui'; g.textAlign = 'left';
    g.fillText(E.kind === 'solar' ? '☀️ ' + T('sun') + ' + 🌑 ' + T('moon') : '🌕 ' + T('moon') + ' + 🌍 ' + T('umbra'), 12, 20);
  }
  const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k), rgb = c => `rgb(${c.map(v => Math.round(v)).join(',')})`;
  const mix2 = k => rgb(mix([8, 10, 16], [44, 84, 44], k));

  /* ---------------- schema cu conurile de umbră ---------------- */
  function drawSide() {
    const cv = $('#eclSide'), g = cv.getContext('2d'), W = cv.width, H = cv.height, cy = H / 2;
    g.fillStyle = '#060914'; g.fillRect(0, 0, W, H);
    // Soarele, uriaș, în stânga
    const sg = g.createRadialGradient(-120, cy, 40, -120, cy, 230); sg.addColorStop(0, '#fff6c8'); sg.addColorStop(0.8, '#ffb733'); sg.addColorStop(1, 'rgba(255,140,30,0)');
    g.fillStyle = sg; g.beginPath(); g.arc(-120, cy, 230, 0, 7); g.fill();
    g.fillStyle = '#2a1c00'; g.font = '700 13px system-ui'; g.textAlign = 'left'; g.fillText('☀️ ' + T('sun'), 8, 22);
    g.font = '12px system-ui';
    if (E.kind === 'solar') {
      const ex = W - 100, er = 62, mxp = 430, mr = 13, my = cy - (E.off / 4500) * 80;
      const Lk = sunDistKm() * RM / (RS - RM);                      // lungimea conului de umbră (km)
      const margin = Lk - dTopo();                                   // > 0: vârful trece de suprafață → totală
      const surf = ex - er * Math.cos(Math.asin(Math.min(0.95, (my - cy) / er)));
      const tipX = surf + margin * 0.004, s = mr / (tipX - mxp);
      // penumbra
      g.fillStyle = 'rgba(160,170,200,.18)'; g.beginPath(); g.moveTo(mxp, my - mr); g.lineTo(W + 20, my - mr - s * (W + 20 - mxp)); g.lineTo(W + 20, my + mr + s * (W + 20 - mxp)); g.lineTo(mxp, my + mr); g.fill();
      // antumbra (dincolo de vârf)
      g.fillStyle = 'rgba(120,120,150,.35)'; g.beginPath(); g.moveTo(tipX, my); g.lineTo(W + 20, my - s * (W + 20 - tipX)); g.lineTo(W + 20, my + s * (W + 20 - tipX)); g.fill();
      // Pământul (luminat din stânga)
      earth(g, ex, cy, er);
      // umbra
      g.fillStyle = 'rgba(0,0,0,.92)'; g.beginPath(); g.moveTo(mxp, my - mr); g.lineTo(tipX, my); g.lineTo(mxp, my + mr); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(mxp, my - mr); g.lineTo(tipX, my); g.lineTo(mxp, my + mr); g.stroke();
      // linii de la Soare
      g.strokeStyle = 'rgba(255,220,120,.25)'; g.beginPath(); g.moveTo(0, my - mr - s * (mxp)); g.lineTo(mxp, my - mr); g.moveTo(0, my + mr + s * mxp); g.lineTo(mxp, my + mr); g.stroke();
      // Luna
      g.fillStyle = '#bbb'; g.beginPath(); g.arc(mxp, my, mr, 0, 7); g.fill(); g.fillStyle = '#333'; g.beginPath(); g.arc(mxp + 3, my, mr, -Math.PI / 2, Math.PI / 2); g.fill();
      // observatorul
      g.fillStyle = '#ff3355'; g.beginPath(); g.arc(surf, my, 4, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.textAlign = 'center';
      g.fillText('🌑 ' + T('moon'), mxp, my - mr - 10); g.fillText('🌍 ' + T('earth'), ex, cy + er + 18); g.fillText('📍 ' + T('you'), surf - 18, my - 10);
      g.fillStyle = 'rgba(255,255,255,.75)'; g.fillText(T('umbra'), (mxp + tipX) / 2, my + 4 + mr * 0.2);
      g.fillText(T('penumbra'), mxp + 120, my - mr - s * 120 - 18);
      if (margin < 0) g.fillText(T('antumbra'), Math.min(W - 60, tipX + 70), my + 26);
    } else {
      const ex = 300, er = 58, mxp = W - 90;
      const c = classify(), pm = Math.asin(RE / E.d);
      const uh = c.umbra / pm * er, ph = c.pen / pm * er, mr = c.rm / pm * er, my = cy - E.b * D2R / pm * er;
      g.fillStyle = 'rgba(160,170,200,.14)'; g.beginPath(); g.moveTo(ex, cy - er); g.lineTo(mxp + 60, cy - ph - (60 * (ph - er) / (mxp - ex))); g.lineTo(mxp + 60, cy + ph + (60 * (ph - er) / (mxp - ex))); g.lineTo(ex, cy + er); g.fill();
      g.fillStyle = 'rgba(0,0,0,.85)'; g.beginPath(); g.moveTo(ex, cy - er); g.lineTo(mxp, cy - uh); g.lineTo(mxp + 60, cy - uh + 60 * (er - uh) / (mxp - ex) * -1); g.lineTo(mxp + 60, cy + uh - 60 * (er - uh) / (mxp - ex) * -1); g.lineTo(mxp, cy + uh); g.lineTo(ex, cy + er); g.fill();
      g.strokeStyle = 'rgba(255,120,90,.5)'; g.beginPath(); g.moveTo(ex, cy - er); g.lineTo(mxp + 60, cy - uh + 60 * (uh - er) / (mxp - ex)); g.moveTo(ex, cy + er); g.lineTo(mxp + 60, cy + uh - 60 * (uh - er) / (mxp - ex)); g.stroke();
      earth(g, ex, cy, er);
      // Luna (cu culoarea fazei)
      const inU = Math.abs(my - cy) + mr <= uh;
      g.fillStyle = inU ? '#9a3a1c' : '#cfcfcf'; g.beginPath(); g.arc(mxp, my, mr, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.textAlign = 'center';
      g.fillText('🌍 ' + T('earth'), ex, cy + er + 18); g.fillText('🌕 ' + T('moon'), mxp, my + mr + 16);
      g.fillStyle = 'rgba(255,150,120,.85)'; g.fillText(T('umbra'), (ex + mxp) / 2, cy + 4);
      g.fillStyle = 'rgba(200,210,240,.8)'; g.fillText(T('penumbra'), (ex + mxp) / 2, cy - (er + ph) / 2 - 8);
    }
  }
  function earth(g, x, y, r) {
    const eg = g.createRadialGradient(x - r * 0.5, y - r * 0.2, 4, x, y, r); eg.addColorStop(0, '#7fb4ff'); eg.addColorStop(0.6, '#2860b8'); eg.addColorStop(1, '#0a1f45');
    g.fillStyle = eg; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    g.fillStyle = 'rgba(0,0,10,.6)'; g.beginPath(); g.arc(x, y, r, -Math.PI / 2, Math.PI / 2); g.fill();
    g.fillStyle = 'rgba(60,140,70,.75)'; g.beginPath(); g.ellipse(x - r * 0.35, y - r * 0.2, r * 0.25, r * 0.35, 0.4, 0, 7); g.fill();
  }

  /* ---------------- rezultatul ---------------- */
  function result() {
    const c = classify();
    let html = `<b>${T('res')}:</b> `;
    if (c.type === 'none') html += T('none');
    else {
      let name = T('t_' + c.type);
      if (E.kind === 'solar' && c.hybridPossible) name += ' · ' + (L.lang === 'ro' ? 'pe alte porțiuni ale drumului: ' : 'elsewhere on the path: ') + T('t_hybrid');
      html += `<span class="big">${name}</span>`;
      if (E.kind === 'solar') {
        html += `<br>${tr(TXT.cover).replace('{v}', Math.round(c.cov * 100))} · ${tr(TXT.sizes).replace('{m}', Math.round(c.ratio * 100))}`;
        if (c.type === 'total') html += `<br>${tr(TXT.dur).replace('{v}', fmtMin(c.mins))}`;
        if (c.type === 'annular') html += `<br>${tr(TXT.ring).replace('{v}', fmtMin(c.mins))}`;
      } else if (c.type === 'ltotal') html += `<br>${tr(TXT.ldur).replace('{v}', fmtMin(c.mins))}`;
    }
    $('#eclResult').innerHTML = html;
  }

  /* ---------------- globul 3D ---------------- */
  function setupGlobe() {
    if (!globe) return;
    const st = window.APP.st;
    st.playing = false;
    if (E.kind === 'solar') { // Londra la amiază, ca umbra să cadă pe partea luminată
      st.t = Date.UTC(2027, E.month - 1, 15, 11, 50);
      globe.opts.follow = 'city'; globe.ctlN.dist = 2.1; globe.ctlN.min = 1.2;
    } else {
      st.t = Date.UTC(2027, E.month - 1, 15, 0, 0);
      globe.opts.follow = 'free'; globe.ctlN.dist = 1.35; globe.ctlN.min = 0.5;
    }
  }
  function update3D() {
    if (!globe) return;
    const T3 = window.THREE, s = window.APP.st.model.sun(window.APP.st.t);
    const precDeg = s.peri - window.APP.st.model.p.peri, lam = (s.lam - precDeg) * D2R;
    const sunDir = new T3.Vector3(Math.cos(lam), 0, -Math.sin(lam));
    const east = new T3.Vector3(-Math.sin(lam), 0, -Math.cos(lam)), north = new T3.Vector3(0, 1, 0);
    let M;
    if (E.kind === 'solar') {
      const O = globe.cityWorld(), dGeo = E.d / RE;
      const Op = O.clone().sub(sunDir.clone().multiplyScalar(O.dot(sunDir)));
      const sp = solarAt(E.p);
      // Luna stă pe linia observator–Soare, deplasată ca în vederea „pe cer”
      M = Op.add(sunDir.clone().multiplyScalar(dGeo)).add(east.multiplyScalar(sp.x * dGeo)).add(north.multiplyScalar(sp.y * dGeo));
    } else {
      const l = lunarAt(E.p), dGeo = E.d / RE;
      M = sunDir.clone().multiplyScalar(-dGeo).add(east.multiplyScalar(-l.x * dGeo)).add(north.multiplyScalar(l.y * dGeo));
    }
    globe.ecl = { M, cam: E.kind, sunAng: rsAng() };
  }

  /* ---------------- bucla ---------------- */
  let last = 0;
  function loop(now) {
    if (!E.open) return;
    const dt = Math.min(0.1, (now - (last || now)) / 1000); last = now;
    if (E.playing) {
      // mai încet în jurul maximului, ca să se vadă totalitatea
      const c = E.kind === 'solar' ? solarAt(E.p) : null;
      const slow = c && c.cov > 0.97 ? 0.25 : 1;
      E.p += dt * slow / 14; if (E.p >= 1) { E.p = 1; E.playing = false; labelPlay(); }
      $('#eclP').value = E.p;
    }
    update3D(); drawSky(); drawSide(); result();
    raf = requestAnimationFrame(loop);
  }

  /* ---------------- deschidere / închidere ---------------- */
  function open() {
    globe = window.APP && window.APP.globe; E.open = true;
    $('#eclModal').classList.remove('hidden'); document.body.style.overflow = 'hidden';
    if (globe) {
      const st = window.APP.st;
      saved = { t: st.t, playing: st.playing, follow: globe.opts.follow, dist: globe.ctlN.dist, min: globe.ctlN.min, view: globe.view, speed: st.speed };
      prevHost = globe.canvas.parentNode; $('#stageEcl').appendChild(globe.canvas); globe.el = $('#stageEcl');
      window.APP.setView('near'); globe.resize();
    }
    pick(E.type);
    last = 0; raf = requestAnimationFrame(loop);
  }
  function close() {
    E.open = false; cancelAnimationFrame(raf);
    $('#eclModal').classList.add('hidden'); document.body.style.overflow = '';
    if (globe) {
      globe.ecl = null;
      const st = window.APP.st;
      st.t = saved.t; st.playing = saved.playing; st.speed = saved.speed;
      globe.opts.follow = saved.follow; globe.ctlN.dist = saved.dist; globe.ctlN.min = saved.min;
      prevHost.appendChild(globe.canvas); globe.el = prevHost; window.APP.setView(saved.view); window.APP.setFollow(saved.follow); globe.resize();
    }
  }

  buildDom();
  window.Eclipse = { open, close, relang: () => { if (E.open) renderStatic(); const b = $('#eclBtn'); if (b) b.textContent = T('btn'); }, state: E, pick: id => pick(TYPES.find(t => t.id === id)), classify };
})();
