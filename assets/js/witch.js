/* ==========================================================================
   witch.js — 🎃 Laboratorul vrăjitoarei: 10 reacții chimice simulate
   Fiecare poțiune: rețetă (ingrediente), un vas, o animație și o explicație
   scurtă pentru copil + formula pentru profesor + eticheta de siguranță.
   ========================================================================== */
(function () {
  'use strict';
  const L = window.I18N, t_ = L.t, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const tr = o => (o && typeof o === 'object' && !Array.isArray(o)) ? (o[L.lang] || o.ro) : o;

  /* ---------------- ingredientele ---------------- */
  const ING = {
    bicarb:  { i: '🧂', c: [245, 245, 240], ro: 'Bicarbonat de sodiu', en: 'Baking soda' },
    vinegar: { i: '🍶', c: [235, 225, 190], ro: 'Oțet', en: 'Vinegar' },
    lemon:   { i: '🍋', c: [250, 240, 150], ro: 'Suc de lămâie', en: 'Lemon juice' },
    dish:    { i: '🧴', c: [120, 220, 120], ro: 'Detergent de vase', en: 'Washing-up liquid' },
    green:   { i: '🟢', c: [40, 200, 60], ro: 'Colorant verde', en: 'Green food colouring' },
    red:     { i: '🔴', c: [220, 30, 60], ro: 'Colorant roșu', en: 'Red food colouring' },
    colours: { i: '🎨', c: [200, 80, 200], ro: 'Coloranți alimentari', en: 'Food colourings' },
    soda:    { i: '🧺', c: [240, 240, 240], ro: 'Sodă de rufe (carbonat de sodiu)', en: 'Washing soda (sodium carbonate)' },
    h2o2c:   { i: '⚗️', c: [230, 240, 255], ro: 'Apă oxigenată 30%', en: '30% hydrogen peroxide' },
    h2o2:    { i: '💧', c: [230, 240, 255], ro: 'Apă oxigenată 3%', en: '3% hydrogen peroxide' },
    ki:      { i: '🧪', c: [250, 250, 250], ro: 'Iodură de potasiu', en: 'Potassium iodide' },
    yeast:   { i: '🍞', c: [210, 180, 130], ro: 'Drojdie cu apă caldă', en: 'Yeast in warm water' },
    phenol:  { i: '🩸', c: [250, 250, 250], ro: 'Fenolftaleină', en: 'Phenolphthalein' },
    vitc:    { i: '🍊', c: [255, 220, 150], ro: 'Vitamina C (dizolvată)', en: 'Vitamin C (dissolved)' },
    iodine:  { i: '🟤', c: [150, 70, 20], ro: 'Tinctură de iod', en: 'Iodine tincture' },
    starch:  { i: '🌽', c: [250, 250, 245], ro: 'Amidon cu apă', en: 'Starch in water' },
    luminol: { i: '✨', c: [235, 240, 250], ro: 'Luminol', en: 'Luminol' },
    ferri:   { i: '🔶', c: [240, 170, 40], ro: 'Fericianură de potasiu', en: 'Potassium ferricyanide' },
    dryice:  { i: '🧊', c: [240, 250, 255], ro: 'Gheață carbonică', en: 'Dry ice' },
    ice:     { i: '❄️', c: [220, 240, 255], ro: 'Gheață obișnuită', en: 'Ordinary ice' },
    warm:    { i: '♨️', c: [150, 190, 230], ro: 'Apă caldă', en: 'Warm water' },
    lead:    { i: '☠️', c: [245, 245, 245], ro: 'Azotat de plumb', en: 'Lead nitrate' },
    water:   { i: '💧', c: [150, 190, 230], ro: 'Apă', en: 'Water' },
    pva:     { i: '🥛', c: [250, 250, 245], ro: 'Aracet (lipici PVA)', en: 'PVA glue' },
    borax:   { i: '🫙', c: [240, 245, 250], ro: 'Soluție de borax', en: 'Borax solution' },
    milk:    { i: '🍼', c: [252, 250, 242], ro: 'Lapte gras', en: 'Full-fat milk' },
    salt:    { i: '🧂', c: [250, 250, 250], ro: 'Sare', en: 'Salt' },
    sugar:   { i: '🍬', c: [250, 250, 250], ro: 'Zahăr', en: 'Sugar' },
    oil:     { i: '🫒', c: [230, 200, 80], ro: 'Ulei', en: 'Oil' },
    flour:   { i: '🌾', c: [245, 240, 225], ro: 'Făină', en: 'Flour' }
  };
  const WRONG = {
    salt: { ro: 'sarea doar se dizolvă, nu reacționează aici.', en: 'salt just dissolves; it does not react here.' },
    sugar: { ro: 'zahărul se dizolvă și atât.', en: 'sugar dissolves, and that\'s all.' },
    oil: { ro: 'uleiul plutește deasupra; nu se amestecă cu apa.', en: 'oil floats on top; it doesn\'t mix with water.' },
    water: { ro: 'apa doar subțiază amestecul.', en: 'water just makes the mixture weaker.' },
    flour: { ro: 'făina face doar o pastă lipicioasă.', en: 'flour only makes a sticky paste.' },
    ice: { ro: 'gheața obișnuită doar se topește, încet. Pentru ceață îți trebuie ceva mult mai rece!', en: 'ordinary ice just melts slowly. You need something much colder for fog!' },
    vinegar: { ro: 'oțetul n-are cu ce să reacționeze aici.', en: 'vinegar has nothing to react with here.' },
    yeast: { ro: 'drojdia are nevoie de apă oxigenată ca să lucreze.', en: 'yeast needs hydrogen peroxide to work.' },
    _: { ro: 'ingredientul ăsta nu face parte din rețetă.', en: 'this ingredient is not part of the recipe.' }
  };

  /* ---------------- cele 10 poțiuni ---------------- */
  const EXP = [
    { id: 'pumpkin', icon: '🎃', vessel: 'pumpkin', safety: 'home', anim: 'foam',
      need: [['bicarb'], ['dish'], ['vinegar']], opt: ['green'], trigger: 'vinegar',
      shelf: ['bicarb', 'dish', 'green', 'vinegar', 'salt', 'oil'],
      t: { ro: 'Dovleacul care vomită', en: 'The vomiting pumpkin' },
      goal: { ro: 'Pune bicarbonat, detergent și colorant în dovleac, apoi toarnă oțetul.', en: 'Put baking soda, washing-up liquid and colouring in the pumpkin, then pour in the vinegar.' },
      type: { ro: 'acid + bază → gaz', en: 'acid + base → gas' },
      f: 'NaHCO₃ + CH₃COOH → CH₃COONa + H₂O + CO₂↑',
      ex: { ro: 'Oțetul este un <b>acid</b>, iar bicarbonatul o <b>bază</b>. Când se întâlnesc, fac un gaz: <b>dioxidul de carbon</b>, același din bulele sucului. Detergentul prinde bulele și face spumă, care iese pe gura dovleacului.',
            en: 'Vinegar is an <b>acid</b> and baking soda is a <b>base</b>. When they meet they make a gas, <b>carbon dioxide</b>, the same as in fizzy drinks. The washing-up liquid traps the bubbles as foam, which pours out of the pumpkin\'s mouth.' },
      real: { ro: 'Praful de copt din prăjituri face același gaz, care umflă aluatul.', en: 'Baking powder in cakes makes the same gas, which makes the dough rise.' },
      teach: { ro: 'Reacție de neutralizare cu degajare de gaz. 2 linguri de bicarbonat + un jet de detergent + 100 ml de oțet. Merge într-un dovleac scobit sau într-o sticlă.', en: 'Neutralisation releasing gas. 2 tbsp baking soda + a squirt of washing-up liquid + 100 ml vinegar. Works in a carved pumpkin or a bottle.' } },

    { id: 'chameleon', icon: '🦎', vessel: 'flask', safety: 'home', anim: 'color', start: [110, 50, 140],
      need: [['vinegar', 'lemon'], ['bicarb', 'soda']], reactive: true,
      shelf: ['vinegar', 'lemon', 'bicarb', 'soda', 'water', 'sugar'],
      t: { ro: 'Poțiunea cameleon', en: 'The chameleon potion' },
      goal: { ro: 'În balon e suc de varză roșie, mov. Adaugă un acid (oțet sau lămâie), apoi o bază (bicarbonat sau sodă). Urmărește culorile!', en: 'The flask holds purple red-cabbage juice. Add an acid (vinegar or lemon), then a base (baking soda or washing soda). Watch the colours!' },
      type: { ro: 'indicator acid–bază', en: 'acid–base indicator' },
      f: { ro: 'antocianine: roz (acid) · mov (neutru) · verde → galben (bază)', en: 'anthocyanins: pink (acid) · purple (neutral) · green → yellow (base)' },
      ex: { ro: 'Varza roșie conține niște coloranți numiți <b>antocianine</b>, care își schimbă culoarea după cât de acru sau de leșios e lichidul. Acidul îi face <b>roz-roșii</b>, iar baza îi face <b>albaștri, verzi</b> și apoi <b>galbeni</b>. Așa poți afla dacă ceva e acid fără să-l guști!',
            en: 'Red cabbage contains colours called <b>anthocyanins</b>, which change colour depending on how sour or soapy the liquid is. Acid turns them <b>pink-red</b>, a base turns them <b>blue, green</b> and then <b>yellow</b>. You can tell if something is acidic without tasting it!' },
      real: { ro: 'Hortensiile fac flori albastre în pământ acid și roz în pământ bazic.', en: 'Hydrangeas grow blue flowers in acidic soil and pink ones in alkaline soil.' },
      teach: { ro: 'Indicator natural de pH. Fierbe 1/4 de varză tocată în 500 ml de apă, 10 minute, apoi strecoară. Sodă = pH ~11 (galben-verde), bicarbonat = pH ~8,5 (albastru-verde), oțet = pH ~3 (roz).', en: 'Natural pH indicator. Boil 1/4 of a chopped cabbage in 500 ml water for 10 minutes, then strain. Washing soda = pH ~11 (yellow-green), baking soda = pH ~8.5 (blue-green), vinegar = pH ~3 (pink).' } },

    { id: 'elephant', icon: '🐘', vessel: 'cylinder', safety: 'lab', anim: 'eruption',
      need: [['h2o2c', 'h2o2'], ['dish'], ['ki', 'yeast']], opt: ['red', 'green'], trigger: ['ki', 'yeast'],
      shelf: ['h2o2c', 'h2o2', 'dish', 'red', 'ki', 'yeast', 'water'],
      t: { ro: 'Pasta de dinți a elefantului', en: 'Elephant toothpaste' },
      goal: { ro: 'Apă oxigenată, detergent și colorant în cilindru, apoi catalizatorul: iodura de potasiu sau drojdia.', en: 'Hydrogen peroxide, washing-up liquid and colouring in the cylinder, then the catalyst: potassium iodide or yeast.' },
      type: { ro: 'descompunere cu catalizator', en: 'decomposition with a catalyst' },
      f: { ro: '2 H₂O₂ → 2 H₂O + O₂↑ (catalizator: I⁻ sau catalaza din drojdie)', en: '2 H₂O₂ → 2 H₂O + O₂↑ (catalyst: I⁻ or catalase from yeast)' },
      ex: { ro: 'Apa oxigenată se desface singură, foarte încet, în apă și <b>oxigen</b>. <b>Catalizatorul</b> o grăbește de mii de ori! Oxigenul iese dintr-odată, iar detergentul îl prinde într-un munte de spumă. Spuma e <b>caldă</b>: reacția eliberează căldură.',
            en: 'Hydrogen peroxide breaks down by itself, very slowly, into water and <b>oxygen</b>. The <b>catalyst</b> speeds it up thousands of times! The oxygen rushes out all at once and the washing-up liquid traps it in a mountain of foam. The foam is <b>warm</b>: the reaction gives off heat.' },
      real: { ro: 'Corpul tău are același catalizator, catalaza. De aceea face bule apa oxigenată pusă pe o zgârietură.', en: 'Your body has the same catalyst, catalase. That\'s why hydrogen peroxide fizzes on a cut.' },
      teach: { ro: 'Varianta de 30% cu KI este o demonstrație de laborator: substanța e corozivă, iar spuma iese fierbinte. Acasă: 3% + drojdie activată în apă caldă, într-o sticlă de 500 ml. E mai lentă, dar sigură.', en: 'The 30% version with KI is a lab demonstration: the chemical is corrosive and the foam comes out hot. At home: 3% + yeast activated in warm water, in a 500 ml bottle. Slower, but safe.' } },

    { id: 'vampire', icon: '🧛', vessel: 'beaker', safety: 'lab', anim: 'color', start: [190, 215, 240],
      need: [['soda'], ['phenol']], reactive: true,
      shelf: ['soda', 'phenol', 'vinegar', 'salt', 'sugar'],
      t: { ro: 'Sângele vampirului', en: 'Vampire blood' },
      goal: { ro: 'Dizolvă soda în apă, apoi picură fenolftaleina. Bonus: ce face oțetul după aceea?', en: 'Dissolve the washing soda in water, then add drops of phenolphthalein. Bonus: what does vinegar do afterwards?' },
      type: { ro: 'indicator care apare și dispare', en: 'an indicator that appears and disappears' },
      f: { ro: 'fenolftaleină: incoloră (pH < 8,2) → roz-magenta (pH > 8,2)', en: 'phenolphthalein: colourless (pH < 8.2) → pink-magenta (pH > 8.2)' },
      ex: { ro: 'Fenolftaleina e un <b>indicator</b> care stă ascuns, fără culoare, în apă sau în acid. Când apa devine <b>bazică</b>, de la sodă, se face brusc <b>roșu-magenta</b>, ca „sângele de vampir”. Dacă torni oțet, acidul neutralizează baza și culoarea <b>dispare</b>!',
            en: 'Phenolphthalein is an <b>indicator</b> that hides, colourless, in water or acid. When the water turns <b>basic</b>, from the washing soda, it suddenly becomes <b>magenta-red</b>, like "vampire blood". Pour in vinegar and the acid neutralises the base, so the colour <b>vanishes</b>!' },
      real: { ro: 'Cu fenolftaleină verifică inginerii dacă betonul proaspăt e încă bazic.', en: 'Engineers use phenolphthalein to check whether fresh concrete is still basic.' },
      teach: { ro: 'Fenolftaleina se folosește doar ca demonstrație: nu se pune pe piele și nu se înghite. O alternativă sigură e varza roșie (poțiunea 2).', en: 'Phenolphthalein is for demonstration only: keep it off skin and never swallow it. A safe alternative is red cabbage (potion 2).' } },

    { id: 'clock', icon: '⏳', vessel: 'beaker', safety: 'adult', anim: 'clock', start: [235, 240, 250],
      need: [['vitc'], ['iodine'], ['starch'], ['h2o2']], trigger: 'h2o2',
      shelf: ['vitc', 'iodine', 'starch', 'h2o2', 'salt', 'sugar'],
      t: { ro: 'Ceasul vrăjit cu iod', en: 'The iodine clock spell' },
      goal: { ro: 'Vitamina C, iodul și amidonul în pahar, apoi apa oxigenată. Amestecă și numără!', en: 'Vitamin C, iodine and starch in the beaker, then the hydrogen peroxide. Stir and count!' },
      type: { ro: 'reacție-ceas', en: 'clock reaction' },
      f: { ro: 'H₂O₂ + 2 I⁻ → I₂ · vitamina C: I₂ → 2 I⁻ · I₂ + amidon → albastru-negru', en: 'H₂O₂ + 2 I⁻ → I₂ · vitamin C: I₂ → 2 I⁻ · I₂ + starch → blue-black' },
      ex: { ro: 'Apa oxigenată fabrică încontinuu iod. <b>Vitamina C</b> îl „mănâncă” imediat, ca o gardă de corp, așa că nu se vede nimic. Când vitamina C <b>se termină</b>, iodul rămâne, se prinde de amidon și tot paharul se face <b>albastru-negru dintr-odată</b>.',
            en: 'The hydrogen peroxide keeps making iodine. <b>Vitamin C</b> "eats" it straight away, like a bodyguard, so you see nothing. When the vitamin C <b>runs out</b>, the iodine stays, grabs the starch and the whole beaker turns <b>blue-black all at once</b>.' },
      real: { ro: 'Picură iod pe un cartof tăiat: se face albastru-negru, pentru că e plin de amidon.', en: 'Drop iodine on a cut potato: it turns blue-black because it is full of starch.' },
      teach: { ro: 'Rețetă de acasă: 1 tabletă de 1000 mg de vitamina C în 60 ml de apă (A). Din A, 1 linguriță + 1 linguriță de tinctură de iod 2% + 60 ml de apă (B). Separat, 60 ml de apă + 1 lingură de apă oxigenată 3% + ½ linguriță de amidon (C). Torni C peste B și aștepți câteva zeci de secunde. Ochelari; iodul pătează.', en: 'Home recipe: one 1000 mg vitamin C tablet in 60 ml water (A). From A, 1 tsp + 1 tsp of 2% iodine tincture + 60 ml water (B). Separately, 60 ml water + 1 tbsp 3% hydrogen peroxide + ½ tsp starch (C). Pour C into B and wait a few tens of seconds. Goggles; iodine stains.' } },

    { id: 'ghostlight', icon: '👻', vessel: 'flask', safety: 'lab', anim: 'glow', start: [230, 235, 245],
      need: [['luminol'], ['h2o2', 'h2o2c'], ['ferri']], trigger: 'ferri',
      shelf: ['luminol', 'h2o2', 'ferri', 'water', 'vinegar'],
      t: { ro: 'Lumina fantomei', en: 'Ghost light' },
      goal: { ro: 'Luminol și apă oxigenată în balon, apoi catalizatorul portocaliu. Luminile se sting singure!', en: 'Luminol and hydrogen peroxide in the flask, then the orange catalyst. The lights go out by themselves!' },
      type: { ro: 'chemiluminescență, adică lumină rece', en: 'chemiluminescence: cold light' },
      f: { ro: 'luminol + H₂O₂ (catalizator Fe³⁺) → 3-aminoftalat* → lumină albastră (~425 nm)', en: 'luminol + H₂O₂ (Fe³⁺ catalyst) → 3-aminophthalate* → blue light (~425 nm)' },
      ex: { ro: 'De obicei, lumina vine de la ceva fierbinte: un bec, o flacără. Aici lumina vine dintr-o <b>reacție chimică</b>, iar lichidul rămâne <b>rece</b>! Energia reacției nu se face căldură, ci se face direct <b>lumină albastră</b>.',
            en: 'Light usually comes from something hot: a bulb, a flame. Here the light comes from a <b>chemical reaction</b>, and the liquid stays <b>cold</b>! The reaction\'s energy doesn\'t turn into heat: it turns straight into <b>blue light</b>.' },
      real: { ro: 'Bețișoarele luminoase de la petreceri și licuricii fac lumină rece la fel. Criminaliștii caută urme de sânge cu luminol: fierul din sânge e catalizatorul!', en: 'Party glow sticks and fireflies make cold light the same way. Detectives look for blood traces with luminol: the iron in blood is the catalyst!' },
      teach: { ro: 'Demonstrație de laborator: luminolul și fericianura nu sunt substanțe de folosit acasă. Varianta sigură: rupe un bețișor luminos într-o cameră întunecată, apoi pune-l în apă caldă și în apă rece și compară luminozitatea.', en: 'Lab demonstration: luminol and ferricyanide are not household chemicals. Safe version: snap a glow stick in a dark room, then put it in warm and in cold water and compare the brightness.' } },

    { id: 'fog', icon: '🌫️', vessel: 'cauldron', safety: 'adult', anim: 'fog',
      need: [['warm'], ['dryice']], opt: ['dish'], trigger: 'dryice',
      shelf: ['warm', 'dryice', 'dish', 'ice', 'salt'],
      t: { ro: 'Ceața din cazan', en: 'Cauldron fog' },
      goal: { ro: 'Apă caldă în cazan, apoi gheața carbonică. Pune și detergent dacă vrei bule de ceață!', en: 'Warm water in the cauldron, then the dry ice. Add washing-up liquid if you want fog bubbles!' },
      type: { ro: 'sublimare (schimbare de stare)', en: 'sublimation (change of state)' },
      f: { ro: 'CO₂ (solid, −78,5 °C) → CO₂ (gaz) · vaporii de apă → picături (ceață)', en: 'CO₂ (solid, −78.5 °C) → CO₂ (gas) · water vapour → droplets (fog)' },
      ex: { ro: 'Gheața carbonică e <b>dioxid de carbon înghețat</b>, la −78 °C! Ea nu se topește, ci trece direct în gaz: asta se numește <b>sublimare</b>. Gazul foarte rece răcește aerul umed de deasupra apei, iar vaporii se fac picături mici: <b>ceață</b>. Ceața curge pe masă, pentru că gazul rece e mai greu decât aerul.',
            en: 'Dry ice is <b>frozen carbon dioxide</b>, at −78 °C! It doesn\'t melt: it turns straight into gas, which is called <b>sublimation</b>. The very cold gas chills the damp air above the water, and the vapour turns into tiny droplets: <b>fog</b>. The fog flows across the table because cold gas is heavier than air.' },
      real: { ro: 'Ceața de pe scenă la concerte și cea de la Halloween se fac exact așa.', en: 'Stage fog at concerts and at Halloween is made exactly like this.' },
      teach: { ro: 'Doar adultul atinge gheața carbonică, cu mănuși groase sau cu cleștele: arde pielea prin îngheț. Niciodată în recipient închis, pentru că gazul îl poate sparge. Cameră aerisită.', en: 'Only the adult handles dry ice, with thick gloves or tongs: it burns skin by freezing. Never in a closed container, because the gas can burst it. Ventilated room.' } },

    { id: 'gold', icon: '🌟', vessel: 'tube', safety: 'lab', anim: 'gold', start: [225, 235, 250],
      need: [['lead'], ['ki']], trigger: 'ki',
      shelf: ['lead', 'ki', 'water', 'salt', 'sugar'],
      t: { ro: 'Ploaia de aur', en: 'Golden rain' },
      goal: { ro: 'Două lichide fără culoare: azotat de plumb și iodură de potasiu. Ce iese când le amesteci?', en: 'Two colourless liquids: lead nitrate and potassium iodide. What appears when you mix them?' },
      type: { ro: 'precipitare, adică un solid care apare din două lichide', en: 'precipitation: a solid appearing from two liquids' },
      f: 'Pb(NO₃)₂ + 2 KI → PbI₂↓ (galben) + 2 KNO₃',
      ex: { ro: 'Două lichide limpezi fac, dintr-odată, un <b>solid galben</b>: <b>iodura de plumb</b>, care nu se dizolvă în apă. Dacă îl încălzești, se dizolvă. La răcire se face loc-loc în solzi strălucitori, ca o <b>ploaie de aur</b>.',
            en: 'Two clear liquids suddenly make a <b>yellow solid</b>: <b>lead iodide</b>, which doesn\'t dissolve in water. Heat it and it dissolves. As it cools, it forms shiny flakes, like <b>golden rain</b>.' },
      real: { ro: 'Stalactitele din peșteri sunt tot un solid care se depune dintr-un lichid, dar foarte încet.', en: 'Cave stalactites are also a solid coming out of a liquid, just very slowly.' },
      teach: { ro: 'NUMAI demonstrație de laborator: compușii plumbului sunt toxici. Aici e doar virtual. O precipitare sigură acasă: lapte + oțet, care face o brânză albă.', en: 'Lab demonstration ONLY: lead compounds are toxic. Virtual here. A safe precipitation at home: milk + vinegar, which makes white curds.' } },

    { id: 'slime', icon: '🟢', vessel: 'bowl', safety: 'home', anim: 'slime',
      need: [['pva'], ['borax']], opt: ['green'], trigger: 'borax',
      shelf: ['pva', 'green', 'borax', 'water', 'flour', 'salt'],
      t: { ro: 'Slime-ul de mlaștină', en: 'Swamp slime' },
      goal: { ro: 'Aracet și colorant în bol, apoi soluția de borax. Amestecă și ridică!', en: 'PVA glue and colouring in the bowl, then the borax solution. Stir and lift!' },
      type: { ro: 'polimer cu „punți”', en: 'a cross-linked polymer' },
      f: { ro: 'lanțuri de PVA + ion borat B(OH)₄⁻ → rețea elastică', en: 'PVA chains + borate ion B(OH)₄⁻ → stretchy network' },
      ex: { ro: 'Lipiciul e făcut din <b>lanțuri foarte lungi</b> de molecule, ca niște spaghete. Boraxul face <b>punți</b> între ele și le leagă într-o plasă. Plasa ține apa prinsă: e moale când o tragi încet, dar se rupe dacă o smucești.',
            en: 'The glue is made of <b>very long chains</b> of molecules, like spaghetti. Borax makes <b>bridges</b> between them and ties them into a net. The net holds the water in: soft when you pull slowly, but it snaps if you yank it.' },
      real: { ro: 'Cauciucul pneurilor e întărit tot prin punți între lanțuri: procedeul se numește vulcanizare.', en: 'Tyre rubber is also toughened by bridges between chains: the process is called vulcanisation.' },
      teach: { ro: '120 ml de aracet + 120 ml de apă + colorant, apoi 1 linguriță de borax dizolvată în 240 ml de apă caldă, adăugată treptat. Mâinile se spală după. Boraxul nu se înghite.', en: '120 ml PVA glue + 120 ml water + colouring, then 1 tsp borax dissolved in 240 ml warm water, added gradually. Wash hands afterwards. Don\'t swallow borax.' } },

    { id: 'milk', icon: '🌈', vessel: 'plate', safety: 'home', anim: 'milk',
      need: [['milk'], ['colours'], ['dish']], trigger: 'dish',
      shelf: ['milk', 'colours', 'dish', 'water', 'oil', 'sugar'],
      t: { ro: 'Laptele fermecat', en: 'Magic milk' },
      goal: { ro: 'Lapte în farfurie, câteva picături de colorant, apoi o picătură de detergent în mijloc.', en: 'Milk on a plate, a few drops of colouring, then one drop of washing-up liquid in the middle.' },
      type: { ro: 'tensiunea superficială și grăsimile', en: 'surface tension and fats' },
      f: { ro: 'detergent → scade tensiunea superficială + se leagă de grăsimi → curenți', en: 'detergent → lowers surface tension + binds to fats → currents' },
      ex: { ro: 'Laptele are la suprafață o „<b>pieliță</b>” care trage în toate părțile. Detergentul <b>rupe pielița</b> în mijloc, iar ea se retrage spre margini, ducând culorile cu ea. Apoi detergentul aleargă după <b>picăturile de grăsime</b> din lapte, așa că culorile se tot învârt.',
            en: 'Milk has a "<b>skin</b>" on its surface, pulling in every direction. The washing-up liquid <b>breaks the skin</b> in the middle, and it pulls back towards the edges, dragging the colours along. Then the washing-up liquid chases the <b>fat droplets</b> in the milk, so the colours keep swirling.' },
      real: { ro: 'Detergentul spală vasele pentru că se prinde de grăsime și o desprinde de farfurie.', en: 'Washing-up liquid cleans plates because it grabs the grease and pulls it off.' },
      teach: { ro: 'Este o reacție mai degrabă fizică, cu tensiune superficială și emulsionare. Merge mai bine cu lapte integral. O legătură cu „Fizica distractivă”: tensiunea superficială.', en: 'Mostly a physical effect: surface tension and emulsification. Works best with full-fat milk. A link to "Fun Physics": surface tension.' } }
  ];

  /* ---------------- starea ---------------- */
  let stars = {};
  try { stars = JSON.parse(localStorage.getItem('osdi-witch') || '{}'); } catch (e) {}
  const save = () => { try { localStorage.setItem('osdi-witch', JSON.stringify(stars)); } catch (e) {} };
  let cur = null, S = null;            // poțiunea curentă și starea ei
  const cv = $('#witchCv'), g = cv.getContext('2d'), W = cv.width, Hh = cv.height, TABLE = 450, VX = 420;
  let parts = [], pours = [], running = false, tPrev = 0, shown = false;

  function fresh(e) {
    return { added: [], wrong: 0, phase: 'idle', t: 0, liq: e.start ? e.start.slice() : null, liqT: e.start ? e.start.slice() : null,
      level: e.start ? 0.55 : 0, levelT: e.start ? 0.55 : 0, foam: 0, dark: 0, msg: '', read: false, seenAcid: false, seenBase: false,
      milkDrops: [], slime: 0, lift: 0, countdown: 0 };
  }

  /* ---------------- interfața ---------------- */
  function buildList() {
    $('#potions').innerHTML = EXP.map((e, i) => {
      const s = stars[e.id] || 0;
      return `<button data-e="${i}" class="${cur === e ? 'on' : ''} ${s ? 'done' : ''}"><span class="n">${i + 1} · ${e.icon}</span><span class="t">${tr(e.t)}</span><span class="st">${'⭐'.repeat(s)}${'☆'.repeat(3 - s)}</span></button>`;
    }).join('');
    $$('#potions button').forEach(b => b.onclick = () => pick(EXP[+b.dataset.e]));
    const tot = Object.values(stars).reduce((a, b) => a + b, 0), n = Object.values(stars).filter(Boolean).length;
    $('#witchScore').textContent = t_('w.score', { a: tot, b: 30, c: n });
  }
  function pick(e) { cur = e; S = fresh(e); parts = []; pours = []; buildList(); buildShelf(); buildRecipe(); }
  function buildShelf() {
    if (!cur) { $('#shelf').innerHTML = ''; return; }
    $('#shelf').innerHTML = cur.shelf.map(id => `<button data-i="${id}" class="${S.added.includes(id) ? 'used' : ''}"><span class="b">${ING[id].i}</span>${tr(ING[id])}</button>`).join('') +
      (cur.reactive ? '' : `<button class="stir" id="wStir"><span class="b">🥄</span>${t_('w.stir').replace(/^\S+\s/, '')}</button>`) +
      `<button class="reset" id="wReset"><span class="b">🧹</span>${t_('w.reset').replace(/^\S+\s/, '')}</button>`;
    $$('#shelf [data-i]').forEach(b => b.onclick = () => add(b.dataset.i));
    const s = $('#wStir'); if (s) s.onclick = stir;
    $('#wReset').onclick = () => pick(cur);
  }
  function needOk(group) { return group.some(id => S.added.includes(id)); }
  function buildRecipe() {
    const r = $('#recipe');
    if (!cur) { r.innerHTML = `<p>${t_('w.pick')}</p><p class="small">${t_('w.stars')}</p>`; return; }
    const e = cur, safeCls = { home: 'home', adult: 'adult', lab: 'lab' }[e.safety];
    let html = `<h3>${e.icon} ${tr(e.t)}</h3><span class="safety ${safeCls}">${t_('w.safe.' + e.safety)}</span>
      <p class="goal">${tr(e.goal)}</p><h4>${t_('w.need')}</h4><ol>` +
      e.need.map(gp => `<li class="${needOk(gp) ? 'ok' : ''}">${gp.map(id => ING[id].i + ' ' + tr(ING[id])).join(L.lang === 'ro' ? ' <i>sau</i> ' : ' <i>or</i> ')}</li>`).join('') +
      (e.opt ? e.opt.map(id => `<li class="${S.added.includes(id) ? 'ok' : ''}">${ING[id].i} ${tr(ING[id])} <i>(${L.lang === 'ro' ? 'opțional' : 'optional'})</i></li>`).join('') : '') + '</ol>';
    html += `<div class="msg" id="wMsg">${S.msg}</div>`;
    if (S.phase === 'done') {
      html += `<div class="explain"><h4>${t_('w.what')}</h4><p>${tr(e.ex)}</p><div class="formula">${tr(e.f)}</div>
        <p class="real">💡 <b>${t_('w.real')}</b>${tr(e.real)}</p><p class="real">👩‍🏫 <b>${t_('w.teacher')}</b>${tr(e.teach)}</p>
        ${S.read ? '' : `<button class="btn" id="wRead">📖 ${L.lang === 'ro' ? 'Am citit! (+⭐)' : 'I\'ve read it! (+⭐)'}</button>`}
        <button class="btn" id="wAgain">${t_('w.again')}</button></div>`;
    }
    r.innerHTML = html;
    const rd = $('#wRead'); if (rd) rd.onclick = () => { S.read = true; award(); buildRecipe(); };
    const ag = $('#wAgain'); if (ag) ag.onclick = () => pick(cur);
  }
  function say(m) { S.msg = m; const el = $('#wMsg'); if (el) el.innerHTML = m; }
  function award() {
    const s = 1 + (S.wrong === 0 ? 1 : 0) + (S.read ? 1 : 0);
    if (!stars[cur.id] || stars[cur.id] < s) { stars[cur.id] = s; save(); }
    buildList(); buildGrimoire();
  }

  /* ---------------- adăugare și amestecare ---------------- */
  const inRecipe = id => cur.need.some(gp => gp.includes(id)) || (cur.opt || []).includes(id);
  function add(id) {
    if (!cur || S.phase === 'reacting') return;
    if (S.phase === 'done' && !cur.reactive) return;
    if (S.added.includes(id) && !cur.reactive) return;
    const ing = ING[id];
    pours.push({ c: ing.c, t: 0, powder: ['bicarb', 'soda', 'salt', 'sugar', 'flour', 'dryice', 'ice'].includes(id), id });
    if (!S.added.includes(id)) S.added.push(id);
    // nivelul lichidului
    if (!['dryice', 'ice'].includes(id)) S.levelT = Math.min(0.85, S.levelT + (S.level === 0 && S.levelT === 0 ? 0.35 : 0.08));
    if (cur.reactive) { reactLive(id); buildShelf(); buildRecipe(); return; }
    if (!inRecipe(id)) {
      S.wrong++; say(t_('w.wrong', { x: tr(WRONG[id] || WRONG._) }));
      if (id === 'oil') S.oil = true;
    } else {
      say(t_('w.added', { x: ing.i + ' ' + tr(ing) }));
      tint(ing.c, id);
      if (cur.id === 'clock' && S.added.includes('vitc') && S.added.includes('iodine')) {
        S.liqT = [236, 238, 246];
        if (id === 'vitc' || id === 'iodine') { say(L.lang === 'ro' ? '🍊 Vitamina C a „șters” culoarea iodului! Paharul e aproape limpede.' : '🍊 Vitamin C "erased" the iodine colour! The beaker is almost clear.'); buildShelf(); buildRecipe(); return; }
      }
      // ingredientul declanșator pornește reacția singur, dacă rețeta e completă
      const trig = [].concat(cur.trigger || []);
      if (trig.includes(id) && cur.need.every(needOk)) setTimeout(() => start(), 700);
    }
    buildShelf(); buildRecipe();
  }
  function tint(c, id) {
    if (!S.liqT) { S.liqT = c.slice(); S.liq = c.slice(); return; }
    const k = ['green', 'red', 'colours', 'iodine'].includes(id) ? 0.75 : 0.25;
    S.liqT = S.liqT.map((v, i) => Math.round(v + (c[i] - v) * k));
  }
  function stir() {
    if (!cur || S.phase !== 'idle') return;
    if (!cur.need.every(needOk)) { say('🥄 ' + t_('w.missing')); return; }
    start();
  }
  function start() {
    if (S.phase !== 'idle') return;
    S.phase = 'reacting'; S.t = 0; say('✨ …');
    if (cur.anim === 'clock') S.countdown = 6;
  }
  function finish() {
    S.phase = 'done'; say('🎉 ' + (L.lang === 'ro' ? 'Poțiune reușită!' : 'Potion complete!')); award(); buildRecipe(); buildShelf();
  }
  // poțiunile care reacționează la fiecare ingredient (cameleon, vampir)
  function reactLive(id) {
    const e = cur, A = id;
    if (e.id === 'chameleon') {
      if (A === 'vinegar') { S.liqT = [225, 60, 120]; S.seenAcid = true; say(L.lang === 'ro' ? '🌸 Acid → roz!' : '🌸 Acid → pink!'); }
      else if (A === 'lemon') { S.liqT = [235, 40, 80]; S.seenAcid = true; say(L.lang === 'ro' ? '❤️ Acid mai tare → roșu!' : '❤️ Stronger acid → red!'); }
      else if (A === 'bicarb') { S.liqT = [40, 120, 160]; S.seenBase = true; say(L.lang === 'ro' ? '💙 Bază slabă → albastru-verzui!' : '💙 Weak base → blue-green!'); }
      else if (A === 'soda') { S.liqT = [170, 200, 40]; S.seenBase = true; say(L.lang === 'ro' ? '💛 Bază tare → verde-galben!' : '💛 Strong base → yellow-green!'); }
      else { S.wrong++; say(t_('w.wrong', { x: tr(WRONG[A] || WRONG._) })); }
      if (A === 'bicarb' && S.seenAcid) for (let i = 0; i < 40; i++) bubble(VX, TABLE - 60, 'rgba(255,255,255,.8)');
      if (S.seenAcid && S.seenBase && S.phase !== 'done') { S.phase = 'done'; setTimeout(finish, 900); }
    } else if (e.id === 'vampire') {
      if (A === 'soda') { S.base = true; say(L.lang === 'ro' ? '🧺 Soda s-a dizolvat. Apa e acum bazică, dar arată la fel!' : '🧺 The soda dissolved. The water is now basic, but looks the same!'); if (S.phenol) S.liqT = [200, 0, 70]; }
      else if (A === 'phenol') { S.phenol = true; if (S.base) { S.liqT = [200, 0, 70]; say(L.lang === 'ro' ? '🩸 Sânge de vampir!' : '🩸 Vampire blood!'); } else say(L.lang === 'ro' ? 'Nimic… apa nu e încă bazică.' : 'Nothing… the water isn\'t basic yet.'); }
      else if (A === 'vinegar') { if (S.liqT[0] > 150 && S.liqT[1] < 60) { S.liqT = [190, 215, 240]; S.base = false; say(L.lang === 'ro' ? '🪄 Oțetul a neutralizat baza: culoarea a dispărut!' : '🪄 Vinegar neutralised the base: the colour vanished!'); S.bonus = true; } else { S.wrong++; say(t_('w.wrong', { x: tr(WRONG.vinegar) })); } }
      else { S.wrong++; say(t_('w.wrong', { x: tr(WRONG[A] || WRONG._) })); }
      if (S.base && S.phenol && S.phase !== 'done') { S.phase = 'done'; setTimeout(finish, 900); }
    }
  }

  /* ---------------- particule ---------------- */
  function bubble(x, y, col, opt) {
    opt = opt || {};
    parts.push({ k: opt.k || 'b', x: x + (Math.random() - 0.5) * (opt.w || 40), y, vx: (Math.random() - 0.5) * (opt.vx || 20), vy: -(opt.vy || 40) * (0.5 + Math.random()),
      r: opt.r || (2 + Math.random() * 4), life: opt.life || 2, age: 0, col, g: opt.g || 0, drag: opt.drag || 0, stick: opt.stick });
  }
  function stepParts(dt) {
    for (const p of parts) {
      p.age += dt; p.vy += p.g * dt; p.vx *= (1 - p.drag * dt); p.vy *= (1 - p.drag * dt);
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.stick && p.y > TABLE - p.r * 0.6) { p.y = TABLE - p.r * 0.6; p.vy = 0; p.vx *= 0.9; }
      if (p.k === 'fog' && p.y > TABLE + 60) { p.y = TABLE + 60; p.vy = 0; p.vx *= 1.002; }
    }
    parts = parts.filter(p => p.age < p.life);
    if (parts.length > 1800) parts.splice(0, parts.length - 1800);
  }

  /* ---------------- desenul ---------------- */
  const rgb = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a === undefined ? 1 : a})`;
  function background(time) {
    const bg = g.createLinearGradient(0, 0, 0, Hh); bg.addColorStop(0, '#1a0f2e'); bg.addColorStop(1, '#0b0614');
    g.fillStyle = bg; g.fillRect(0, 0, W, Hh);
    // pietre
    g.strokeStyle = 'rgba(255,255,255,.04)'; g.lineWidth = 2;
    for (let y = 0; y < TABLE; y += 46) for (let x = (y / 46) % 2 ? -40 : 0; x < W; x += 92) { g.strokeRect(x, y, 92, 46); }
    // fereastra cu lună
    g.fillStyle = '#0d1a3a'; g.beginPath(); g.moveTo(760, 200); g.lineTo(760, 90); g.arc(820, 90, 60, Math.PI, 0); g.lineTo(880, 200); g.closePath(); g.fill();
    g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(838, 82, 26, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#0d1a3a'; g.beginPath(); g.arc(848, 76, 22, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#3a2a1a'; g.lineWidth = 6; g.beginPath(); g.moveTo(820, 30); g.lineTo(820, 200); g.moveTo(760, 125); g.lineTo(880, 125); g.stroke();
    // lilieci
    for (let i = 0; i < 3; i++) {
      const bx = (time * 40 * (1 + i * 0.3) + i * 300) % (W + 100) - 50, by = 60 + i * 35 + Math.sin(time * 3 + i) * 12, f = Math.sin(time * 14 + i) * 6;
      g.fillStyle = '#05020a'; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx - 10, by - 8 - f, bx - 20, by + f * 0.3); g.quadraticCurveTo(bx - 10, by - 2, bx, by + 4);
      g.quadraticCurveTo(bx + 10, by - 2, bx + 20, by + f * 0.3); g.quadraticCurveTo(bx + 10, by - 8 - f, bx, by); g.fill();
    }
    // pânză de păianjen
    g.strokeStyle = 'rgba(255,255,255,.15)'; g.lineWidth = 1;
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(0, 0); const a = i / 5 * Math.PI / 2; g.lineTo(Math.cos(a) * 130, Math.sin(a) * 130); g.stroke(); }
    for (let r = 25; r <= 125; r += 25) { g.beginPath(); for (let i = 0; i <= 5; i++) { const a = i / 5 * Math.PI / 2; const x = Math.cos(a) * r, y = Math.sin(a) * r; i ? g.quadraticCurveTo(Math.cos(a - 0.15) * r * 0.9, Math.sin(a - 0.15) * r * 0.9, x, y) : g.moveTo(x, y); } g.stroke(); }
    // lumânări
    [[120, TABLE], [700, TABLE], [890, TABLE]].forEach(([x, y], i) => {
      g.fillStyle = '#efe6d0'; g.fillRect(x - 9, y - 70, 18, 70);
      const fl = 1 + Math.sin(time * 9 + i * 2) * 0.12 + Math.random() * 0.05;
      const gl = g.createRadialGradient(x, y - 82, 0, x, y - 82, 70); gl.addColorStop(0, 'rgba(255,190,90,.35)'); gl.addColorStop(1, 'rgba(255,150,60,0)');
      g.fillStyle = gl; g.beginPath(); g.arc(x, y - 82, 70, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ffcc55'; g.beginPath(); g.ellipse(x, y - 80, 6 * fl, 13 * fl, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff3c0'; g.beginPath(); g.ellipse(x, y - 77, 3, 6, 0, 0, Math.PI * 2); g.fill();
    });
    // masa
    const tg = g.createLinearGradient(0, TABLE, 0, Hh); tg.addColorStop(0, '#4a2d18'); tg.addColorStop(1, '#22130a');
    g.fillStyle = tg; g.fillRect(0, TABLE, W, Hh - TABLE);
    g.fillStyle = 'rgba(0,0,0,.25)'; for (let x = 0; x < W; x += 140) g.fillRect(x, TABLE, 2, Hh - TABLE);
  }

  // forma vaselor: întoarce { top, bottom, wTop, wBot, mouthY, draw(liqFn) }
  function vesselGeom(kind) {
    switch (kind) {
      case 'cylinder': return { x: VX, bot: TABLE, top: TABLE - 230, w: 64 };
      case 'tube': return { x: VX, bot: TABLE - 10, top: TABLE - 200, w: 44 };
      case 'beaker': return { x: VX, bot: TABLE, top: TABLE - 170, w: 150 };
      case 'flask': return { x: VX, bot: TABLE, top: TABLE - 220, w: 190 };
      case 'cauldron': return { x: VX, bot: TABLE - 4, top: TABLE - 150, w: 250 };
      case 'bowl': return { x: VX, bot: TABLE, top: TABLE - 90, w: 260 };
      case 'pumpkin': return { x: VX, bot: TABLE, top: TABLE - 200, w: 250 };
      case 'plate': return { x: VX, bot: TABLE + 40, top: TABLE - 60, w: 480 };
    }
  }
  function drawVessel(time) {
    const e = cur, v = vesselGeom(e.vessel), lv = S.level, col = S.liq || [150, 190, 230];
    g.save();
    if (e.vessel === 'cylinder' || e.vessel === 'tube') {
      const x0 = v.x - v.w / 2, h = v.bot - v.top;
      if (e.vessel === 'tube') { // stativ
        g.fillStyle = '#5b3a1e'; g.fillRect(v.x - 80, TABLE - 8, 160, 8); g.fillRect(v.x - 76, TABLE - 120, 8, 112); g.fillRect(v.x + 68, TABLE - 120, 8, 112); g.fillRect(v.x - 80, TABLE - 124, 160, 8);
      }
      g.fillStyle = rgb(col, 0.85); const lh = h * lv;
      if (e.vessel === 'tube') { g.beginPath(); g.moveTo(x0 + 4, v.bot - lh); g.lineTo(x0 + 4, v.bot - v.w / 2); g.arc(v.x, v.bot - v.w / 2, v.w / 2 - 4, Math.PI, 0, true); g.lineTo(x0 + v.w - 4, v.bot - lh); g.closePath(); g.fill(); }
      else g.fillRect(x0 + 4, v.bot - lh, v.w - 8, lh);
      g.strokeStyle = 'rgba(220,235,255,.8)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(x0, v.top); g.lineTo(x0, e.vessel === 'tube' ? v.bot - v.w / 2 : v.bot);
      if (e.vessel === 'tube') g.arc(v.x, v.bot - v.w / 2, v.w / 2, Math.PI, 0, true); else g.lineTo(x0 + v.w, v.bot);
      g.lineTo(x0 + v.w, v.top); g.stroke();
      if (e.vessel === 'cylinder') { g.fillStyle = 'rgba(220,235,255,.6)'; g.fillRect(v.x - 55, v.bot - 6, 110, 6); for (let i = 1; i < 9; i++) g.fillRect(x0, v.bot - i * 24, 12, 1.5); }
      g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(x0 + 8, v.top + 10, 6, h - 30);
    } else if (e.vessel === 'beaker') {
      const x0 = v.x - v.w / 2, h = v.bot - v.top, lh = h * lv;
      g.fillStyle = rgb(col, 0.88); g.fillRect(x0 + 4, v.bot - lh, v.w - 8, lh - 4);
      g.strokeStyle = 'rgba(220,235,255,.85)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x0 - 8, v.top); g.lineTo(x0, v.top + 8); g.lineTo(x0, v.bot); g.lineTo(x0 + v.w, v.bot); g.lineTo(x0 + v.w, v.top); g.stroke();
      g.fillStyle = 'rgba(220,235,255,.6)'; for (let i = 1; i < 6; i++) { g.fillRect(x0 + v.w - 30, v.bot - i * 28, 22, 1.5); }
      g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(x0 + 10, v.top + 14, 8, h - 30);
    } else if (e.vessel === 'flask') {
      const neck = 34, nh = 70, bodyTop = v.top + nh, h = v.bot - bodyTop;
      const path = () => { g.beginPath(); g.moveTo(v.x - neck / 2, v.top); g.lineTo(v.x - neck / 2, bodyTop); g.lineTo(v.x - v.w / 2, v.bot); g.lineTo(v.x + v.w / 2, v.bot); g.lineTo(v.x + neck / 2, bodyTop); g.lineTo(v.x + neck / 2, v.top); };
      g.save(); path(); g.clip(); g.fillStyle = rgb(col, 0.9); const ly = v.bot - (v.bot - v.top) * lv * 0.8; g.fillRect(v.x - v.w / 2, ly, v.w, v.bot - ly);
      // valuri ușoare
      g.fillStyle = rgb(col.map(c => Math.min(255, c + 30)), 0.7); g.beginPath(); g.moveTo(v.x - v.w / 2, ly);
      for (let x = -v.w / 2; x <= v.w / 2; x += 10) g.lineTo(v.x + x, ly + Math.sin(x / 14 + time * 3) * 2); g.lineTo(v.x + v.w / 2, ly + 6); g.lineTo(v.x - v.w / 2, ly + 6); g.fill();
      g.restore();
      path(); g.strokeStyle = 'rgba(220,235,255,.85)'; g.lineWidth = 3; g.stroke();
      g.fillStyle = 'rgba(255,255,255,.14)'; g.beginPath(); g.moveTo(v.x - 40, bodyTop + 40); g.lineTo(v.x - 70, v.bot - 20); g.lineTo(v.x - 58, v.bot - 20); g.lineTo(v.x - 32, bodyTop + 40); g.fill();
    } else if (e.vessel === 'cauldron') {
      // focul de sub cazan
      for (let i = 0; i < 5; i++) { const fx = v.x - 60 + i * 30, fh = 20 + Math.sin(time * 10 + i) * 8; g.fillStyle = i % 2 ? '#ff7a1a' : '#ffb347'; g.beginPath(); g.moveTo(fx - 12, TABLE); g.quadraticCurveTo(fx, TABLE - fh * 2, fx + 12, TABLE); g.fill(); }
      g.fillStyle = '#16141c'; g.beginPath(); g.ellipse(v.x, v.top + 70, v.w / 2, 90, 0, 0, Math.PI); g.lineTo(v.x - v.w / 2, v.top + 10); g.lineTo(v.x + v.w / 2, v.top + 10); g.closePath(); g.fill();
      g.fillStyle = rgb(col, 1); g.beginPath(); g.ellipse(v.x, v.top + 14, v.w / 2 - 14, 18, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#2c2a36'; g.lineWidth = 14; g.beginPath(); g.ellipse(v.x, v.top + 12, v.w / 2, 22, 0, 0, Math.PI * 2); g.stroke();
      g.fillStyle = '#2c2a36'; g.fillRect(v.x - v.w / 2 + 20, TABLE - 30, 14, 30); g.fillRect(v.x + v.w / 2 - 34, TABLE - 30, 14, 30);
    } else if (e.vessel === 'bowl') {
      g.fillStyle = '#6b3fa0'; g.beginPath(); g.ellipse(v.x, v.top + 10, v.w / 2, 90, 0, 0, Math.PI); g.closePath(); g.fill();
      if (lv > 0) { g.fillStyle = rgb(col, 1); g.beginPath(); g.ellipse(v.x, v.top + 14, v.w / 2 - 12, 16, 0, 0, Math.PI * 2); g.fill(); }
      g.strokeStyle = '#8a5ac4'; g.lineWidth = 6; g.beginPath(); g.ellipse(v.x, v.top + 10, v.w / 2, 18, 0, 0, Math.PI * 2); g.stroke();
    } else if (e.vessel === 'pumpkin') {
      const cx = v.x, cy = TABLE - 95;
      for (let i = -2; i <= 2; i++) { g.fillStyle = i % 2 ? '#e8701a' : '#f5841f'; g.beginPath(); g.ellipse(cx + i * 38, cy, 70 - Math.abs(i) * 8, 95, 0, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#3b6b1a'; g.fillRect(cx - 8, cy - 115, 16, 26);
      // fața
      g.fillStyle = '#2a1205';
      g.beginPath(); g.moveTo(cx - 70, cy - 30); g.lineTo(cx - 30, cy - 50); g.lineTo(cx - 30, cy - 10); g.fill();
      g.beginPath(); g.moveTo(cx + 70, cy - 30); g.lineTo(cx + 30, cy - 50); g.lineTo(cx + 30, cy - 10); g.fill();
      g.beginPath(); g.moveTo(cx - 80, cy + 20); for (let i = 0; i <= 8; i++) g.lineTo(cx - 80 + i * 20, cy + 20 + (i % 2 ? 18 : 0) + Math.sin(i / 8 * Math.PI) * 30); for (let i = 8; i >= 0; i--) g.lineTo(cx - 80 + i * 20, cy + 40 + (i % 2 ? -6 : 8) + Math.sin(i / 8 * Math.PI) * 42); g.fill();
      const lit = S.phase !== 'idle' ? 0.55 : 0.25 + 0.05 * Math.sin(time * 6);
      g.fillStyle = `rgba(255,200,80,${lit})`;
      g.beginPath(); g.moveTo(cx - 64, cy - 30); g.lineTo(cx - 34, cy - 44); g.lineTo(cx - 34, cy - 16); g.fill();
      g.beginPath(); g.moveTo(cx + 64, cy - 30); g.lineTo(cx + 34, cy - 44); g.lineTo(cx + 34, cy - 16); g.fill();
    } else if (e.vessel === 'plate') {
      g.fillStyle = '#e9e4f2'; g.beginPath(); g.ellipse(v.x, TABLE + 10, 250, 70, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#cfc6e0'; g.beginPath(); g.ellipse(v.x, TABLE + 14, 200, 52, 0, 0, Math.PI * 2); g.fill();
      if (lv > 0) { g.fillStyle = rgb(S.liq || [252, 250, 242], 1); g.beginPath(); g.ellipse(v.x, TABLE + 12, 196, 50, 0, 0, Math.PI * 2); g.fill(); }
    }
    g.restore();
    if (S.oil && ['beaker', 'flask', 'cylinder', 'tube'].includes(e.vessel)) { /* stratul de ulei e sugerat prin mesaj */ }
  }
  function mouth() {
    const v = vesselGeom(cur.vessel);
    if (cur.vessel === 'pumpkin') return { x: v.x, y: TABLE - 65, w: 120 };
    if (cur.vessel === 'cauldron') return { x: v.x, y: v.top + 14, w: v.w - 40 };
    if (cur.vessel === 'bowl') return { x: v.x, y: v.top + 14, w: v.w - 40 };
    if (cur.vessel === 'plate') return { x: v.x, y: TABLE + 12, w: 380 };
    if (cur.vessel === 'flask') return { x: v.x, y: v.top, w: 30 };
    return { x: v.x, y: v.top, w: v.w - 10 };
  }

  function drawPours(dt) {
    const m = mouth();
    pours.forEach(p => {
      p.t += dt;
      const k = Math.min(1, p.t / 0.9), x = m.x + 40, y0 = 30;
      // sticla / punga
      g.save(); g.translate(x + 20, y0 + 20); g.rotate(-0.9 * Math.min(1, p.t * 3));
      g.font = '42px system-ui'; g.textAlign = 'center'; g.fillText(ING[p.id].i, 0, 0); g.restore();
      if (p.t > 0.25 && p.t < 1.1) {
        if (p.powder) { for (let i = 0; i < 4; i++) parts.push({ k: 'p', x: x + (Math.random() - 0.5) * 8, y: y0 + 30, vx: (Math.random() - 0.5) * 10, vy: 60, r: 2, life: (m.y - y0) / 260, age: 0, col: rgb(p.c, 0.9), g: 500, drag: 0 }); }
        else { g.strokeStyle = rgb(p.c, 0.85); g.lineWidth = 6; g.beginPath(); g.moveTo(x, y0 + 30); g.quadraticCurveTo(x - 10, (y0 + m.y) / 2, m.x + 10, m.y + 6); g.stroke(); }
      }
    });
    pours = pours.filter(p => p.t < 1.3);
  }

  /* ---------------- animațiile reacțiilor ---------------- */
  function animate(dt, time, rawDt) {
    const e = cur, m = mouth();
    S.level += (S.levelT - S.level) * Math.min(1, dt * 3);
    if (S.liq && S.liqT) S.liq = S.liq.map((v, i) => v + (S.liqT[i] - v) * Math.min(1, dt * (e.anim === 'clock' && S.phase === 'done' ? 30 : 2.2)));
    if (S.phase === 'reacting') S.t += rawDt;
    const R = S.phase === 'reacting', T = S.t;
    const foamCol = S.added.includes('green') ? 'rgba(150,255,150,.95)' : S.added.includes('red') ? 'rgba(255,150,170,.95)' : 'rgba(255,255,255,.95)';
    switch (e.anim) {
      case 'foam':
        if (R) {
          const rate = T < 4 ? 120 : 30;
          for (let i = 0; i < rate * dt * 3; i++) bubble(m.x, m.y, foamCol, { k: 'f', w: 60, vx: 140, vy: 50, r: 7 + Math.random() * 9, life: 9, g: 140, drag: 1.2, stick: true });
          if (T > 6) finish();
        }
        if (S.phase !== 'idle') for (let i = 0; i < 2; i++) bubble(m.x, m.y, 'rgba(255,255,255,.5)', { w: 50, vy: 30, life: 1 });
        break;
      case 'eruption':
        if (R) {
          const big = S.added.includes('h2o2c') && S.added.includes('ki');
          const power = big ? 520 : 230, n = big ? 12 : 5;
          if (T < (big ? 3.5 : 6)) for (let i = 0; i < n; i++) bubble(m.x, m.y, foamCol, { k: 'f', w: 34, vx: big ? 60 : 30, vy: power, r: 9 + Math.random() * 9, life: 12, g: 260, drag: 0.4, stick: true });
          if (T > 0.5 && T < 7) for (let i = 0; i < 2; i++) bubble(m.x + 60, m.y - 30, 'rgba(255,255,255,.12)', { k: 'steam', w: 120, vy: 40, r: 18, life: 2.5 });
          if (T > 6.5) finish();
        }
        break;
      case 'clock':
        if (R) {
          S.countdown -= rawDt;
          // amestecăm: vârtejuri
          if (S.countdown <= 0) { S.liqT = [15, 20, 70]; finish(); }
        }
        break;
      case 'glow':
        if (R) { S.dark = Math.min(1, S.dark + dt * 0.8); if (T > 1.5) S.glow = Math.min(1, (S.glow || 0) + dt * 0.7); if (T > 6) finish(); }
        if (S.phase === 'done') { S.glow = Math.max(0.35, (S.glow || 1) - dt * 0.02); }
        break;
      case 'fog':
        if (S.phase !== 'idle') {
          const intensity = R ? 1 : Math.max(0.25, 1 - (time - (S.doneAt || time)) * 0.03);
          for (let i = 0; i < 8 * intensity; i++) parts.push({ k: 'fog', x: m.x + (Math.random() - 0.5) * m.w, y: m.y - 4, vx: (Math.random() - 0.5) * 70 + (Math.random() < 0.5 ? -40 : 40), vy: 10 + Math.random() * 30,
            r: 20 + Math.random() * 25, life: 5, age: 0, col: 'rgba(235,240,255,', g: 40, drag: 0.6 });
          for (let i = 0; i < 3; i++) bubble(m.x, m.y + 6, 'rgba(255,255,255,.6)', { w: m.w * 0.8, vy: 20, life: 0.5 });
          if (S.added.includes('dish') && Math.random() < dt * 1.2) parts.push({ k: 'fb', x: m.x + (Math.random() - 0.5) * 80, y: m.y - 10, vx: (Math.random() - 0.5) * 20, vy: -25, r: 10, life: 6, age: 0, col: 'x', g: 0, drag: 0 });
          if (R && T > 5) { S.doneAt = time; finish(); }
        }
        break;
      case 'gold':
        if (R) {
          if (T < 1.2) { S.liqT = [255, 215, 40]; }
          if (T > 2) for (let i = 0; i < 3; i++) parts.push({ k: 'g', x: m.x + (Math.random() - 0.5) * 30, y: m.y + 30 + Math.random() * 40, vx: (Math.random() - 0.5) * 8, vy: 14 + Math.random() * 10,
            r: 2 + Math.random() * 2.5, life: 7, age: 0, col: 'gold', g: 0, drag: 0, rot: Math.random() * 6 });
          if (T > 2.5) S.liqT = [250, 235, 170];
          if (T > 6) finish();
        }
        if (S.phase === 'done' && Math.random() < 0.6) parts.push({ k: 'g', x: m.x + (Math.random() - 0.5) * 30, y: m.y + 30 + Math.random() * 30, vx: 0, vy: 12, r: 2 + Math.random() * 2, life: 8, age: 0, col: 'gold', g: 0, drag: 0, rot: Math.random() * 6 });
        break;
      case 'slime':
        if (R) { S.slime = Math.min(1, S.slime + dt * 0.5); if (T > 2.2) S.lift = Math.min(1, S.lift + dt * 0.35); if (T > 6) finish(); }
        break;
      case 'milk':
        if (S.added.includes('colours') && !S.milkDrops.length) {
          const cols = [[230, 30, 60], [30, 120, 230], [250, 200, 20], [40, 190, 80]];
          for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4; S.milkDrops.push({ x: Math.cos(a) * 45, y: Math.sin(a) * 14, c: cols[i], r: 12 }); }
        }
        if (R) {
          if (!S.milkParts) {
            S.milkParts = [];
            S.milkDrops.forEach(d => { for (let i = 0; i < 70; i++) { const a = Math.atan2(d.y * 3, d.x) + (Math.random() - 0.5) * 1.6, sp = 40 + Math.random() * 110;
              S.milkParts.push({ x: d.x, y: d.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.28, c: d.c, trail: [] }); } });
          }
          S.milkParts.forEach(p => { p.trail.push([p.x, p.y]); if (p.trail.length > 26) p.trail.shift();
            const sw = 0.9; const vx = p.vx, vy = p.vy; p.vx = vx * Math.cos(sw * dt) - vy * 3.4 * Math.sin(sw * dt); p.vy = vy * Math.cos(sw * dt) + (vx / 3.4) * Math.sin(sw * dt);
            p.vx *= (1 - 0.35 * dt); p.vy *= (1 - 0.35 * dt); p.x += p.vx * dt; p.y += p.vy * dt;
            const rr = (p.x / 190) ** 2 + (p.y / 48) ** 2; if (rr > 1) { p.x /= Math.sqrt(rr); p.y /= Math.sqrt(rr); p.vx *= -0.3; p.vy *= -0.3; } });
          if (T > 7) finish();
        }
        break;
    }
  }

  function drawParts(time) {
    for (const p of parts) {
      const a = 1 - p.age / p.life;
      if (p.k === 'fog') { const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * (1 + p.age * 0.5)); gr.addColorStop(0, p.col + (0.22 * a) + ')'); gr.addColorStop(1, p.col + '0)'); g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, p.r * (1 + p.age * 0.5), 0, Math.PI * 2); g.fill(); continue; }
      if (p.k === 'steam') { g.fillStyle = `rgba(255,255,255,${0.1 * a})`; g.beginPath(); g.arc(p.x, p.y, p.r * (1 + p.age), 0, Math.PI * 2); g.fill(); continue; }
      if (p.k === 'g') { g.save(); g.translate(p.x, p.y); g.rotate(p.rot + time * 3); const sh = Math.abs(Math.sin(time * 6 + p.rot * 5)); g.fillStyle = `rgba(255,${190 + sh * 60 | 0},${40 + sh * 120 | 0},${a})`; g.fillRect(-p.r, -p.r * 0.4, p.r * 2, p.r * 0.8); g.restore(); continue; }
      if (p.k === 'fb') { g.strokeStyle = `rgba(230,240,255,${0.7 * a})`; g.lineWidth = 2; g.fillStyle = `rgba(230,240,255,${0.15 * a})`; const r = p.r + p.age * 8; g.beginPath(); g.arc(p.x, p.y, r, 0, Math.PI * 2); g.fill(); g.stroke(); continue; }
      if (p.k === 'f') { const gr = g.createRadialGradient(p.x - p.r * 0.3, p.y - p.r * 0.3, 1, p.x, p.y, p.r); gr.addColorStop(0, p.col); gr.addColorStop(1, p.col.replace('.95', '.75')); g.fillStyle = gr; g.globalAlpha = Math.min(1, a * 3); g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; continue; }
      g.fillStyle = p.col; g.globalAlpha = a; g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
    }
  }

  function drawExtras(time) {
    const e = cur, m = mouth();
    if (e.anim === 'clock' && S.phase === 'reacting') {
      g.fillStyle = '#ffd36a'; g.font = '700 64px system-ui'; g.textAlign = 'center';
      g.fillText(Math.max(0, Math.ceil(S.countdown)), VX, 120);
      // vârtej
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2;
      for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(VX, TABLE - 50, 40 + i * 14, 8, 0, time * 4 + i, time * 4 + i + 2.5); g.stroke(); }
    }
    if (e.anim === 'slime' && S.slime > 0) {
      const v = vesselGeom('bowl'), col = S.added.includes('green') ? [70, 220, 70] : [235, 235, 225];
      g.fillStyle = rgb(col, 0.95);
      const bx = v.x, by = v.top + 14;
      g.beginPath();
      for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2, r = 70 * S.slime + Math.sin(a * 5 + time * 2) * 6; g.lineTo(bx + Math.cos(a) * r * 1.4, by + Math.sin(a) * r * 0.25 - 4); }
      g.fill();
      if (S.lift > 0) {
        const top = by - 200 * S.lift - Math.sin(time * 2) * 10 * S.lift, sw = 26 - 14 * S.lift;
        g.strokeStyle = '#8a5a2b'; g.lineWidth = 8; g.beginPath(); g.moveTo(bx + 80, top - 80); g.lineTo(bx - 10, top + 6); g.stroke();
        g.fillStyle = rgb(col, 0.95); g.beginPath(); g.moveTo(bx - sw - 30, by); g.quadraticCurveTo(bx - sw * 0.4, (by + top) / 2, bx - 12, top);
        g.lineTo(bx + 12, top); g.quadraticCurveTo(bx + sw * 0.4, (by + top) / 2, bx + sw + 30, by); g.fill();
        g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(bx - 4, (by + top) / 2, 3, 30 * S.lift, 0, 0, Math.PI * 2); g.fill();
      }
    }
    if (e.anim === 'milk') {
      const cx = VX, cy = TABLE + 12;
      g.save(); g.beginPath(); g.ellipse(cx, cy, 196, 50, 0, 0, Math.PI * 2); g.clip();
      if (S.milkParts) {
        S.milkParts.forEach(p => { g.strokeStyle = rgb(p.c, 0.35); g.lineWidth = 5; g.beginPath(); p.trail.forEach((q, i) => i ? g.lineTo(cx + q[0], cy + q[1]) : g.moveTo(cx + q[0], cy + q[1])); g.stroke(); });
      } else S.milkDrops.forEach(d => { g.fillStyle = rgb(d.c, 0.9); g.beginPath(); g.ellipse(cx + d.x, cy + d.y, d.r, d.r * 0.35, 0, 0, Math.PI * 2); g.fill(); });
      g.restore();
    }
    if (e.anim === 'glow' && S.dark > 0) {
      g.fillStyle = `rgba(2,2,10,${0.88 * S.dark})`; g.fillRect(0, 0, W, Hh);
      if (S.glow) {
        const v = vesselGeom('flask'), gy = TABLE - 60;
        g.globalCompositeOperation = 'lighter';
        const gr = g.createRadialGradient(v.x, gy, 10, v.x, gy, 260); gr.addColorStop(0, `rgba(90,170,255,${0.8 * S.glow})`); gr.addColorStop(0.4, `rgba(40,110,255,${0.35 * S.glow})`); gr.addColorStop(1, 'rgba(0,40,200,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(v.x, gy, 260, 0, Math.PI * 2); g.fill();
        g.fillStyle = `rgba(120,200,255,${0.85 * S.glow})`;
        g.beginPath(); g.moveTo(v.x - 17, v.top + 70 + 40); g.lineTo(v.x - v.w / 2 + 6, v.bot - 3); g.lineTo(v.x + v.w / 2 - 6, v.bot - 3); g.lineTo(v.x + 17, v.top + 110); g.fill();
        for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(200,240,255,${Math.random() * S.glow})`; g.beginPath(); g.arc(v.x + (Math.random() - 0.5) * 120, v.bot - Math.random() * 90, 2, 0, Math.PI * 2); g.fill(); }
        g.globalCompositeOperation = 'source-over';
      }
    }
  }

  function intro(time) {
    g.fillStyle = '#ffb347'; g.font = '700 34px system-ui'; g.textAlign = 'center';
    g.fillText(L.lang === 'ro' ? '🧙 Alege o poțiune de mai sus' : '🧙 Pick a potion above', W / 2 - 60, 230);
    g.font = '80px system-ui'; g.fillText('⚗️', W / 2 - 60, 340 + Math.sin(time * 2) * 8);
  }

  function loop(now) {
    if (!running) return;
    const time = now / 1000, rawDt = Math.min(0.25, time - (tPrev || time)), dt = Math.min(0.05, rawDt); tPrev = time;
    background(time);
    if (cur) {
      animate(dt, time, rawDt); stepParts(dt);
      drawVessel(time);
      if (cur.anim !== 'glow') drawParts(time);
      drawExtras(time);
      if (cur.anim === 'glow') drawParts(time);
      drawPours(dt);
      g.fillStyle = 'rgba(255,255,255,.85)'; g.font = '600 20px system-ui'; g.textAlign = 'left';
      g.fillText(cur.icon + ' ' + tr(cur.t), 150, 36);
    } else intro(time);
    requestAnimationFrame(loop);
  }

  function buildGrimoire() {
    const done = EXP.filter(e => stars[e.id]);
    const el = $('#grimoire');
    if (!done.length) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    const th = t_('w.grimTh').split(',');
    el.innerHTML = `<h3>${t_('w.grim')}</h3><table><tr>${th.map(x => `<th>${x}</th>`).join('')}</tr>` +
      done.map(e => `<tr><td>${e.icon} ${tr(e.t)} ${'⭐'.repeat(stars[e.id])}</td><td>${tr(e.type)}</td><td>${tr(e.f)}</td></tr>`).join('') + '</table>';
  }

  // vizibilitate: rulăm animația doar cât timp fila e deschisă
  const obs = new MutationObserver(() => { const vis = !$('#p-witch').classList.contains('hidden'); if (vis && !running) { running = true; tPrev = 0; requestAnimationFrame(loop); } if (!vis) running = false; });
  obs.observe($('#p-witch'), { attributes: true, attributeFilter: ['class'] });

  window.Witch = {
    show() { if (!shown) { shown = true; buildList(); buildRecipe(); buildShelf(); buildGrimoire(); } },
    relang() { buildList(); buildRecipe(); buildShelf(); buildGrimoire(); },
    EXP, ING, pick: i => pick(EXP[i]), add, stir, state: () => S
  };
  buildList(); buildRecipe(); buildGrimoire();
})();
