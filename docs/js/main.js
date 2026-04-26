/* ══════════════════════════════════════════════════════════════════════
   main.js — Script principale del sito "Il Buon Pastore"
   Tutto il codice è racchiuso in una IIFE (Immediately Invoked Function
   Expression) per evitare di inquinare il namespace globale.
   ══════════════════════════════════════════════════════════════════════ */
(function(){

  /* ── COSTANTI E UTILITY ──────────────────────────────────────────────
     NS  : namespace SVG, necessario per creare elementi SVG via JS
     $   : shortcut per document.querySelector  (seleziona 1 elemento)
     $$  : shortcut per document.querySelectorAll (seleziona N elementi)
     ─────────────────────────────────────────────────────────────────── */
  var NS = 'http://www.w3.org/2000/svg',
      $ = function(s){ return document.querySelector(s) },
      $$ = function(s){ return document.querySelectorAll(s) };

  /* ── COSTANTI CENTRALIZZATE ── */
  var LS_CART = 'ibp_cart';
  var LS_DARK = 'ibp_dark';
  var LS_EN   = 'ibp_en';
  var LS_HASH = 'ibp_h';
  var MAX_QTY = 99;
  var MAX_WA_URL_LEN = 2000;
  var MOBILE_BP = 768;
  var lang = 'it';

  /* ── DIZIONARIO ETICHETTE UI (it/en) ───────────────────────────────
     Tutte le label bilingue usate nelle card prodotto e lana.
     Per aggiungere una lingua, basta aggiungere una chiave. */
  var L = {
    askInfo:    { it: 'Chiedi info',    en: 'Ask for info' },
    weight:     { it: 'Grammatura',     en: 'Weight' },
    colours:    { it: 'Colori',         en: 'Colours' },
    ingredients:{ it: 'Ingredienti',    en: 'Ingredients' },
    chars:      { it: 'Caratteristiche',en: 'Characteristics' },
    size:       { it: 'Pezzatura',      en: 'Size' },
    storage:    { it: 'Conservazione',  en: 'Storage' },
    consumption:{ it: 'Consumo',        en: 'Consumption' },
    availability:{ it: 'Disponibilit\u00e0', en: 'Availability' },
    portion:    { it: 'Porzione',       en: 'Portion' },
    unavail:    { it: 'Questo prodotto al momento non \u00e8 disponibile', en: 'This product is currently unavailable' }
  };
  function lbl(key){ return L[key][lang] || L[key].it; }

  /* ── SANITIZZAZIONE HTML (prevenzione XSS) ─────────────────────────
     Converte i caratteri pericolosi in HTML entities prima di
     inserire qualsiasi stringa via innerHTML.
     Previene l'iniezione di tag <script>, attributi on*, ecc.
     ─────────────────────────────────────────────────────────────────── */
  var escMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  function esc(s){
    return String(s).replace(/[&<>"']/g, function(c){ return escMap[c] });
  }

  /* ── CONFIG ────────────────────────────────────────────────────────
     Oggetto centralizzato con tutti i dati dell'azienda.
     Viene usato per popolare dinamicamente: navbar, hero, contatti,
     footer e i link WhatsApp dei prodotti.
     Modificando questi valori si aggiorna tutto il sito.
     ─────────────────────────────────────────────────────────────────── */
  var CONFIG = {
    nome: 'Il Buon Pastore',
    sigla: 'IBP',
    luogo: 'Montefiore Conca, Emilia-Romagna',
    anno: 1996,
    email: 'levoland@libero.it',
    whatsapp: '393342998889',
    instagram: 'aziendailbuonpastore',
    indirizzo: 'Via Ca\' Santino 1963, 47834 Montefiore Conca (RN)',
    mappa: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2876.8060815758!2d12.6083407123071!3d43.85984783891961!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x132ceffaa57663af%3A0xf2e126b3d82e1a0b!2sAzienda%20Agricola%20Il%20Buon%20Pastore!5e0!3m2!1sit!2sit!4v1777212458775!5m2!1sit!2sit'
  };

  /* ── NAVIGAZIONE ──────────────────────────────────────────────────
     - Hamburger (#nav-toggle): apre/chiude il menu mobile fullscreen
       aggiungendo/rimuovendo la classe "open" su #mobile-menu.
     - Click su un link del menu mobile: chiude automaticamente il menu.
     ─────────────────────────────────────────────────────────────────── */
  var nav = $('#nav'),
      mobileMenu = $('#mobile-menu');

  mobileMenu.innerHTML =
    '<a href="#timeline" data-i18n="nav.storia">Storia</a>' +
    '<a href="#lana" data-i18n="nav.lana">Lana</a>' +
    '<a href="#prodotti" data-i18n="nav.formaggi">Formaggi</a>' +
    '<a href="#contatti" data-i18n="nav.contatti">Contatti</a>';

  var navToggle = $('#nav-toggle');

  function toggleMenu() {
    var open = mobileMenu.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  navToggle.addEventListener('click', function(){ toggleMenu(); if(mobileMenu.classList.contains('open')) trapFocus(mobileMenu); else releaseFocus(); });
  mobileMenu.addEventListener('click', function(e) {
    if (e.target === mobileMenu){ toggleMenu(); releaseFocus(); }
  });
  mobileMenu.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){ toggleMenu(); releaseFocus(); });
  });

  /* ── REVEAL (animazione scroll-in) ────────────────────────────────
     IntersectionObserver che osserva tutti gli elementi con classe
     "reveal". Quando un elemento entra nel viewport (almeno 10%
     visibile, con margine -60px dal basso):
       1. Aggiunge la classe "visible" → attiva la transizione CSS
          (fade-in + slide-up definiti in style.css)
       2. Smette di osservarlo (animazione one-shot)
     Viene riutilizzato anche per i prodotti e le card contatti
     generati dinamicamente più avanti.
     ─────────────────────────────────────────────────────────────────── */
  var rObs = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('visible'); rObs.unobserve(e.target) }
    });
  }, { threshold: .1, rootMargin: '0px 0px -60px 0px' });

  $$('.reveal').forEach(function(e){ rObs.observe(e) });

  /* ── POPOLA ELEMENTI STATICI DA CONFIG ─────────────────────────────
     Inietta i testi nell'HTML usando i valori di CONFIG:
     - Logo navbar    → sigla ("IBP")
     - Titolo hero    → nome in maiuscolo ("IL BUON PASTORE")
     - Sottotitolo    → luogo + anno ("Montefiore Conca — dal 1998")
     ─────────────────────────────────────────────────────────────────── */
  $('#nav-logo').textContent = CONFIG.sigla;
  var deco = $('#hero-deco');
  deco.textContent = CONFIG.nome.toUpperCase();
  $('.hero-label').textContent = CONFIG.luogo + ' \u2014 dal ' + CONFIG.anno;

  /* ── GENERA CARD CONTATTI ──────────────────────────────────────────
     Costruisce via innerHTML le 4 card della sezione contatti:
     1. Email    → mailto: link
     2. WhatsApp → link wa.me
     3. Instagram → link profilo
     4. Mappa    → iframe Google Maps embed
     Ogni card ha classe "reveal" per l'animazione scroll-in.
     Le icone (data-icon) vengono sostituite con SVG più avanti.
     ─────────────────────────────────────────────────────────────────── */
  var contCards = $('#contatti-cards');
  contCards.innerHTML =
    '<a href="mailto:' + esc(CONFIG.email) + '" class="contatto-card reveal">' +
      '<span class="contatto-icon" data-icon="email"></span>' +
      '<strong>Email</strong>' +
      '<span class="contatto-detail">' + esc(CONFIG.email) + '</span>' +
    '</a>' +
    '<a href="https://wa.me/' + esc(CONFIG.whatsapp) + '" target="_blank" rel="noopener noreferrer" class="contatto-card reveal">' +
      '<span class="contatto-icon" data-icon="whatsapp"></span>' +
      '<strong>WhatsApp</strong>' +
      '<span class="contatto-detail" data-i18n="contact.wa">Scrivici su WhatsApp</span>' +
    '</a>' +
    '<a href="https://instagram.com/' + esc(CONFIG.instagram) + '" target="_blank" rel="noopener noreferrer" class="contatto-card reveal">' +
      '<span class="contatto-icon" data-icon="instagram"></span>' +
      '<strong>Instagram</strong>' +
      '<span class="contatto-detail">@' + esc(CONFIG.instagram) + '</span>' +
    '</a>' +
    '<div class="contatto-card contatto-card--map reveal">' +
      '<span class="contatto-icon" data-icon="pin"></span>' +
      '<strong data-i18n="contact.where">Dove siamo</strong>' +
      '<span class="contatto-detail">' + esc(CONFIG.indirizzo) + '</span>' +
      '<div class="orari">' +
        '<span class="orari-label" data-i18n="contact.hours">Orari</span>' +
        '<div class="orari-row"><span data-i18n="contact.monsat">Lun \u2013 Sab</span><span>15:00 \u2013 19:00</span></div>' +
        '<div class="orari-row orari-closed"><span data-i18n="contact.sun">Domenica</span><span data-i18n="contact.closed">Chiuso</span></div>' +
      '</div>' +
      '<div class="map-wrap"><iframe src="' + esc(CONFIG.mappa) + '" width="100%" height="180" style="border:0;border-radius:6px" allowfullscreen loading="lazy" title="Mappa" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"></iframe></div>' +
    '</div>';

  /* ── GENERA FOOTER ────────────────────────────────────────────────
     Popola il footer con 3 colonne:
     1. Brand: nome completo + tagline con luogo
     2. Navigazione: link a Storia, Formaggi, Contatti
     3. Social: link WhatsApp, Instagram, Email
     ─────────────────────────────────────────────────────────────────── */
  $('#footer-content').innerHTML =
    '<div><span class="footer-logo">' + esc(CONFIG.nome) + '</span><p data-i18n="footer.tagline">Pecorino artigianale<br>' + esc(CONFIG.luogo) + '</p></div>' +
    '<div class="footer-nav"><a href="#timeline" data-i18n="nav.storia">Storia</a><a href="#lana" data-i18n="nav.lana">Lana</a><a href="#prodotti" data-i18n="nav.formaggi">Formaggi</a><a href="#contatti" data-i18n="nav.contatti">Contatti</a></div>' +
    '<div class="footer-social">' +
      '<a href="https://wa.me/' + esc(CONFIG.whatsapp) + '" target="_blank" rel="noopener noreferrer">WhatsApp</a>' +
      '<a href="https://instagram.com/' + esc(CONFIG.instagram) + '" target="_blank" rel="noopener noreferrer">Instagram</a>' +
      '<a href="mailto:' + esc(CONFIG.email) + '">Email</a>' +
    '</div>';

  /* Registra le card contatti appena create nell'observer reveal */
  contCards.querySelectorAll('.reveal').forEach(function(e){ rObs.observe(e) });

  /* ── TIMELINE + SCROLL NAVBAR ──────────────────────────────────────
     Gestisce due effetti legati allo scroll:

     1. NAVBAR SOLIDA: quando scrollY > 80px, aggiunge la classe
        "solid" alla nav → sfondo sfocato semi-trasparente.

     2. TIMELINE PROGRESS: calcola la percentuale di scroll
        all'interno della sezione #timeline e aggiorna l'altezza
        della barra dorata (.tl-progress) di conseguenza.

     3. STEP ATTIVI: ogni .tl-step riceve la classe "active"
        quando il suo centro è tra il 25% e il 75% del viewport.
        Questo attiva le animazioni CSS (clip-path, fade-in testo).

     Usa requestAnimationFrame per throttlare lo scroll.
     ─────────────────────────────────────────────────────────────────── */
  var tl = $('#timeline'),
      tlP = $('.tl-progress'),
      steps = $$('.tl-step'),
      stt = $('#scroll-top'),
      scrollPending = false;

  var stepObs = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      entry.target.classList.toggle('active', entry.isIntersecting);
    });
  }, { rootMargin: '-25% 0px -25% 0px' });
  steps.forEach(function(s){ stepObs.observe(s) });

  function onScroll(){
    scrollPending = false;
    nav.classList.toggle('solid', window.scrollY > 80);
    if(stt) stt.classList.toggle('visible', window.scrollY > 400);
    if(!tl || !tlP) return;
    var r = tl.getBoundingClientRect(), wh = window.innerHeight;
    var pct = (wh - r.top) / tl.offsetHeight;
    tlP.style.height = (pct < 0 ? 0 : pct > 1 ? 100 : pct * 100) + '%';
  }

  window.addEventListener('scroll', function(){
    if(!scrollPending){ scrollPending = true; requestAnimationFrame(onScroll) }
  }, { passive: true });
  onScroll();

  /* ── DARK MODE ─────────────────────────────────────────────────────
     Persiste la preferenza in localStorage (chiave "ibp_dark").
     - Al caricamento: se ibp_dark === '1', applica classe "dark"
       al body e mostra l'icona sole (☀️).
     - Al click: togla la classe "dark", aggiorna icona e salva.
     Le variabili CSS in body.dark sovrascrivono i colori base.
     ─────────────────────────────────────────────────────────────────── */
  var dt = $('#dark-toggle');
  function updateDarkLabel(){
    var on = document.body.classList.contains('dark');
    dt.setAttribute('aria-label', on ? (lang === 'en' ? 'Light mode' : 'Tema chiaro') : (lang === 'en' ? 'Dark mode' : 'Tema scuro'));
  }
  try { if(localStorage.getItem(LS_DARK) === '1'){ document.body.classList.add('dark'); dt.textContent = '\u2600\ufe0f'; } } catch(x){}
  updateDarkLabel();
  dt.addEventListener('click', function(){
    document.body.classList.toggle('dark');
    var on = document.body.classList.contains('dark');
    dt.textContent = on ? '\u2600\ufe0f' : '\ud83c\udf19';
    try { localStorage.setItem(LS_DARK, on ? '1' : '0'); } catch(x){}
    document.querySelector('meta[name="theme-color"]').setAttribute('content', on ? '#1A1A1A' : '#FAF7F0');
    updateDarkLabel();
  });

  /* ── SCENA HERO (pecore animate) ──────────────────────────────────
     La hero contiene una scena animata con:
     - Titolo decorativo grande
     - 3 layer di erba SVG (back, mid, front)
     - 2 pecore sprite che camminano lungo un percorso

     Se la scena o il titolo non esistono nel DOM, esce subito.
     ─────────────────────────────────────────────────────────────────── */
  var scene = $('#hero-scene');
  if(scene && deco){
  var sheepList = [];

  /* ── PERCORSO PECORE (walk path) ───────────────────────────────────
     Array di segmenti che definiscono il percorso delle pecore.
     Ogni segmento: [t_inizio, t_fine, left_inizio%, left_fine%, graze]
     - t: progresso normalizzato 0–1 nel ciclo di animazione
     - left: posizione orizzontale in % del contenitore
     - graze: 1 = la pecora sta brucando (ferma), 0 = cammina

     La funzione ep(t) interpola linearmente la posizione
     per un dato istante t e restituisce:
     - l: posizione left in %
     - g: se sta brucando
     - m: se si sta muovendo (per attivare il bobbing verticale)
     ─────────────────────────────────────────────────────────────────── */
  var wp = [
    [0,   .02, 110, 108, 0], [.02, .28, 108, 60, 0],
    [.28, .30,  60,  60, 0], [.30, .52,  60, 60, 1],
    [.52, .55,  60,  58, 0], [.55, .75,  58, 22, 0],
    [.75, .77,  22,  22, 0], [.77, .90,  22, 22, 1],
    [.90, .92,  22,  20, 0], [.92,   1,  20,-14, 0]
  ];

  function ep(t){
    t %= 1;
    for(var i = 0; i < wp.length; i++){
      var s = wp[i];
      if(t >= s[0] && t < s[1]){
        var p = (t - s[0]) / (s[1] - s[0]);
        return { l: s[2] + (s[3] - s[2]) * p, g: s[4], m: Math.abs(s[3] - s[2]) > 1 };
      }
    }
    return { l: -14, g: 0, m: 0 };
  }

  /* ── CREAZIONE PECORE (sprite) ────────────────────────────────────
     FRAMES: i 4 sprite disponibili per ogni pecora:
       - walk-1, walk-2: alternati durante la camminata
       - stand: ferma in piedi
       - graze: che bruca l'erba

     makeSheep(sz): crea un div .sheep con 4 <img> sovrapposti.
       Il primo frame è visibile (opacity 1), gli altri nascosti.
       Restituisce { el: DOM element, imgs: mappa nome→img }.

     showImg(s, name, smooth): mostra un frame e nasconde gli altri.
       Se smooth=true usa transizione CSS, altrimenti cambio istantaneo.
     ─────────────────────────────────────────────────────────────────── */
  var FRAMES = ['sheep-walk-1.webp', 'sheep-walk-2.webp', 'sheep-stand.webp', 'sheep-graze.webp'];

  function makeSheep(sz){
    var wrap = document.createElement('div');
    wrap.className = 'sheep';
    wrap.style.width = sz + 'px';
    var imgs = {};
    FRAMES.forEach(function(name, idx){
      var img = document.createElement('img');
      img.src = 'assets/imgs/' + name;
      img.alt = '';
      img.draggable = false;
      img.style.cssText = 'width:100%;height:auto;position:' + (idx === 0 ? 'relative' : 'absolute') + ';top:0;left:0;opacity:' + (idx === 0 ? '1' : '0');
      wrap.appendChild(img);
      imgs[name] = img;
    });
    return { el: wrap, imgs: imgs };
  }

  function showImg(s, name, smooth){
    var t = smooth ? 'opacity .4s' : 'none';
    for(var k in s.imgs){
      s.imgs[k].style.transition = t;
      s.imgs[k].style.opacity = k === name ? '1' : '0';
    }
  }

  /* Crea 2 pecore con durate diverse (55s e 65s) per desincronizzarle.
     La seconda ha un delay negativo di -30s per partire sfasata.
     Entrambe vengono aggiunte alla scena e alla lista sheepList. */
  [55e3, 65e3].forEach(function(dur, i){
    var s = makeSheep(85);
    s.dur = dur; s.delay = i ? -30e3 : 0; s._lf = '';
    scene.appendChild(s.el);
    sheepList.push(s);
  });

  /* Riferimenti ai 3 contenitori erba (back, mid, front) */
  var grassEls = ['grass-back', 'grass-mid', 'grass-front'].map(function(id){ return document.getElementById(id) });

  /* position(): allinea erba e pecore al bordo inferiore del titolo.
     Calcola l'offset tra il bottom della scena e il bottom del titolo
     decorativo, poi posiziona i layer di erba e le pecore di conseguenza. */
  function position(){
    var bo = scene.getBoundingClientRect().bottom - deco.getBoundingClientRect().bottom;
    grassEls.forEach(function(e, i){ if(e) e.style.bottom = (bo + 2 - i * 2) + 'px' });
    var sb = (bo - 16) + 'px';
    sheepList.forEach(function(s){ s.el.style.bottom = sb });
  }

  /* ── LOOP DI ANIMAZIONE PECORE ────────────────────────────────────
     Usa requestAnimationFrame per animare le pecore.
     Si ferma quando la hero non è visibile (risparmio CPU).

     Per ogni pecora, ad ogni frame:
     1. Calcola t (progresso ciclico 0–1) in base a durata e delay
     2. Interpola la posizione con ep(t)
     3. Applica left%, opacity (fade in/out ai bordi), e bobbing
     4. Sceglie il frame sprite corretto:
        - graze → sheep-graze.webp
        - moving → alterna walk-1 e walk-2 ogni ~350ms
        - fermo → sheep-stand.webp
     ─────────────────────────────────────────────────────────────────── */
  var t0 = performance.now(), animId = 0, heroVisible = true;

  /* Observer: attiva/disattiva il loop quando la hero entra/esce dal viewport */
  var heroObs = new IntersectionObserver(function(es){
    heroVisible = es[0].isIntersecting;
    if(heroVisible && !animId) animId = requestAnimationFrame(anim);
  }, { threshold: 0 });
  heroObs.observe(scene);

  function anim(now){
    if(!heroVisible){ animId = 0; return; }
    var bob = 'translateY(' + (Math.sin(now * .006) * 1.5) + 'px)';
    sheepList.forEach(function(s){
      var t = (((now - t0 + s.delay) % s.dur) + s.dur) % s.dur / s.dur,
          st = ep(t),
          l = st.l,
          o = l > 105 ? 0 : l > 100 ? (105 - l) / 5 : l < -10 ? 0 : l < -5 ? (l + 10) / 5 : 1;

      s.el.style.left = l + '%';
      s.el.style.opacity = o;
      s.el.style.transform = st.m && !st.g ? bob : '';

      var fr;
      if(st.g) fr = 'sheep-graze.webp';
      else if(st.m) fr = (now / 350 | 0) & 1 ? 'sheep-walk-2.webp' : 'sheep-walk-1.webp';
      else fr = 'sheep-stand.webp';
      if(fr !== s._lf){ showImg(s, fr, !st.m); s._lf = fr; }
    });
    animId = requestAnimationFrame(anim);
  }
  animId = requestAnimationFrame(anim);

  /* ── GENERAZIONE ERBA SVG ──────────────────────────────────────────
     GRASS_LAYERS: configurazione dei 3 layer di erba.
     Ogni layer ha:
     - pn/px: range altezza minima/massima (proporzione dell'altezza titolo)
     - bw: larghezza base del filo d'erba
     - n: numero di fili da generare
     - c: palette di colori verdi (dal più scuro al più chiaro)

     Layer 0 (back):  pochi fili alti, colori scuri, opacity .4
     Layer 1 (mid):   fili medi, colori intermedi, opacity .65
     Layer 2 (front): molti fili bassi, colori vivaci, opacity 1
     ─────────────────────────────────────────────────────────────────── */
  var GRASS_COUNTS = [
    { mobile: 45,  desktop: 90 },
    { mobile: 60,  desktop: 120 },
    { mobile: 70,  desktop: 140 }
  ];
  var GRASS_LAYERS = [
    { pn: .45, px: 1,  bw: 3,   c: ['#1a6e14','#227a1c','#186010','#2a8822'] },
    { pn: .3,  px: .7, bw: 2.4, c: ['#22991e','#2aad2a','#1e8818','#34bf34'] },
    { pn: .15, px: .5, bw: 1.8, c: ['#34bf34','#3cc83c','#2aad2a','#48d848','#40c040'] }
  ];

  /* buildGrass(): genera tutti i fili d'erba SVG per i 3 layer.
     Per ogni filo:
     1. Calcola altezza random nel range del layer
     2. Crea un <svg> posizionato orizzontalmente con leggero jitter
     3. Disegna un <path> a curva di Bézier (forma di filo d'erba)
        con curvatura e direzione casuali
     4. Assegna variabili CSS custom per l'animazione "sway":
        --dur (durata), --del (delay), --from/--to (angoli oscillazione)
     Usa DocumentFragment per performance (un solo reflow per layer). */
  var lastGrassH = 0, lastGrassMobile = null;

  function buildGrass(){
    var mH = deco.getBoundingClientRect().height * .22;
    var mobile = window.innerWidth < MOBILE_BP;
    if(Math.abs(mH - lastGrassH) < 2 && lastGrassH > 0 && mobile === lastGrassMobile) return;
    lastGrassH = mH;
    lastGrassMobile = mobile;
    GRASS_LAYERS.forEach(function(L, li){
      var ct = grassEls[li];
      if(!ct) return;
      ct.innerHTML = '';
      var frag = document.createDocumentFragment(),
          n = (window.innerWidth < MOBILE_BP) ? GRASS_COUNTS[li].mobile : GRASS_COUNTS[li].desktop,
          step = 100 / n,
          cLen = L.c.length;
      for(var i = 0; i < n; i++){
        var h = Math.max(4, mH * (L.pn + Math.random() * (L.px - L.pn))),
            w = L.bw + Math.random() * 1.5,
            svgW = Math.ceil(w * 3),
            hC = Math.ceil(h);

        var s = document.createElementNS(NS, 'svg');
        s.setAttribute('width', svgW);
        s.setAttribute('height', hC);
        s.setAttribute('viewBox', '0 0 ' + svgW + ' ' + hC);
        s.style.left = (i * step + (Math.random() - .5) * step) + '%';

        var cx = svgW / 2,
            dir = Math.random() > .5 ? 1 : -1,
            bend = cx + dir * (1 + Math.random() * 3),
            tip = cx + dir * (Math.random() * 2),
            h55 = h * .55,
            h20 = h * .2,
            hw = w / 2,
            w3 = w / 3,
            w6 = w / 6;

        var p = document.createElementNS(NS, 'path');
        p.setAttribute('d',
          'M' + (cx - hw) + ' ' + h +
          'C' + (cx - w3) + ' ' + h55 + ' ' + (bend - w6) + ' ' + h20 + ' ' + tip + ' 0' +
          'C' + (bend + w6) + ' ' + h20 + ' ' + (cx + w3) + ' ' + h55 + ' ' + (cx + hw) + ' ' + h + 'Z'
        );
        p.setAttribute('fill', L.c[Math.random() * cLen | 0]);
        p.setAttribute('class', 'grass-blade');

        var sr = 4 + Math.random() * 7;
        p.style.setProperty('--dur', (2 + Math.random() * 2) + 's');
        p.style.setProperty('--del', (-Math.random() * 4) + 's');
        p.style.setProperty('--from', (-sr) + 'deg');
        p.style.setProperty('--to', sr + 'deg');

        s.appendChild(p);
        frag.appendChild(s);
      }
      ct.appendChild(frag);
    });
  }

  function resizeSheep(){ var w = window.innerWidth < MOBILE_BP ? '51px' : '85px'; sheepList.forEach(function(s){ s.el.style.width = w }) }
  resizeSheep();
  buildGrass(); position();
  var rt;
  window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(function(){ buildGrass(); position(); resizeSheep() }, 200) });
  if(document.fonts) document.fonts.ready.then(function(){ buildGrass(); position() });
  } /* fine blocco hero scene */

  /* ── ANIMAZIONI LANA/FORMAGGI — ora usa video WebM ── */

  /* ── TIMELINE SLIDESHOWS (autoplay + manuale) ── */
  var TL_INTERVAL = 5500;
  var TL_RESUME   = 6000;

  $$('.tl-slideshow').forEach(function(ss){
    var slides = ss.querySelectorAll('.tl-slide');
    var dots = ss.querySelectorAll('.slide-dot');
    if(slides.length < 2) return;

    var idx = 0, autoTimer = null, resumeTimer = null;
    function goTo(n){
      var prev = idx;
      idx = (n + slides.length) % slides.length;
      if(prev === idx) return;
      slides[prev].classList.remove('active');
      slides[prev].classList.add('wipe-out');
      slides[idx].classList.add('active');
      var old = slides[prev];
      var onEnd = function(){ old.classList.remove('wipe-out'); old.removeEventListener('animationend', onEnd) };
      old.addEventListener('animationend', onEnd);
      dots.forEach(function(d, i){ d.classList.toggle('active', i === idx) });
    }
    function auto(){ goTo(idx + 1) }
    function startAuto(){ stopAuto(); autoTimer = setInterval(auto, TL_INTERVAL) }
    function stopAuto(){ clearInterval(autoTimer); clearTimeout(resumeTimer) }
    function pauseAndResume(){ stopAuto(); resumeTimer = setTimeout(startAuto, TL_RESUME) }
    ss.querySelector('.slide-prev').addEventListener('click', function(){ goTo(idx - 1); pauseAndResume() });
    ss.querySelector('.slide-next').addEventListener('click', function(){ goTo(idx + 1); pauseAndResume() });
    dots.forEach(function(d){ d.addEventListener('click', function(){ goTo(parseInt(d.getAttribute('data-dot'))); pauseAndResume() }) });
    startAuto();
  });

  /* Link WhatsApp per info lana */
  var lanaWa = $('#lana-wa');
  if(lanaWa) lanaWa.href = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent('Salve, vorrei chiedere più informazioni sulla vostra lana.');

  /* ── UTILITY TRADUZIONE CAMPI ── */
  function t_(p, field, l) {
    var v = (l === 'en' && p[field + '_en']) ? p[field + '_en'] : p[field];
    return v || p[field] || '';
  }

  /* ── PRODOTTI LANA ───────────────────────────────────────────────── */
  var lanaList = $('#lana-prodotti-list');
  var loadedLana = null;

  function buildLanaCard(p, l) {
    var avail = p.disponibile !== false;

    /* Immagine o slideshow */
    var imgHtml;
    if(p.hasSlideshow && p.slideshowImgs && p.slideshowImgs.length > 1) {
      imgHtml = '<div class="lana-slideshow">' +
        '<div class="lana-slides">';
      p.slideshowImgs.forEach(function(src, i){
        imgHtml += '<img src="' + esc(src) + '" alt="' + esc(p.nome) + '" loading="lazy" width="280" height="280" class="lana-slide' + (i === 0 ? ' active' : '') + '">';
      });
      imgHtml += '</div>' +
        '<button type="button" class="slide-prev" aria-label="Previous">&#8249;</button>' +
        '<button type="button" class="slide-next" aria-label="Next">&#8250;</button>' +
        '<div class="slide-dots">';
      p.slideshowImgs.forEach(function(_, i){
        imgHtml += '<span class="slide-dot' + (i === 0 ? ' active' : '') + '" data-dot="' + i + '"></span>';
      });
      imgHtml += '</div></div>';
    } else {
      imgHtml = '<img src="' + esc(p.img) + '" alt="' + esc(p.nome) + '" loading="lazy" width="280" height="280">';
    }

    var html = '<div class="prodotto-img">' + imgHtml + '</div>' +
      '<div class="prodotto-body">' +
        '<div class="prodotto-head"><h3>' + esc(p.nome) + '</h3><span class="prodotto-badge">' + esc(t_(p,'badge',l)) + '</span></div>' +
        '<p class="prodotto-desc">' + esc(t_(p,'desc',l)) + '</p>';

    /* Selettore colori */
    if(avail && p.hasColori && p.colori && p.colori.length) {
      var coloriList = (l === 'en' && p.colori_en) ? p.colori_en : p.colori;
      html += '<div class="prodotto-porzioni" data-colori="' + esc(coloriList.join(',')) + '">' +
        '<span class="porzioni-label">' + esc(lbl('colours')) + '</span>' +
        '<div class="porzioni-btns">';
      coloriList.forEach(function(c, i){
        html += '<button type="button" class="porzione-btn colore-btn' + (i === 0 ? ' active' : '') + '" data-colore="' + esc(c) + '">' + esc(c) + '</button>';
      });
      html += '</div></div>';
    }

    /* Selettore grammatura (bottoni per il carrello) */
    if(avail) {
      html += '<div class="prodotto-porzioni" data-porzioni="' + esc(p.grammature.join(',')) + '">' +
        '<span class="porzioni-label">' + esc(lbl('weight')) + '</span>' +
        '<div class="porzioni-btns">';
      p.grammature.forEach(function(g, i){
        var price = p.prezzi && p.prezzi[g] ? p.prezzi[g] : 0;
        html += '<button type="button" class="porzione-btn' + (i === 0 ? ' active' : '') + '" data-porzione="' + esc(g) + '" data-prezzo="' + price + '">' + esc(g) + (price ? ' \u2014 \u20ac' + price.toFixed(2) : '') + '</button>';
      });
      html += '</div></div>';
    } else {
      html += '<p class="prodotto-unavail">' + esc(lbl('unavail')) + '</p>';
    }

    /* Azioni */
    html += '<div class="prodotto-actions">' +
      '<a class="prodotto-wa" href="https://wa.me/' + esc(CONFIG.whatsapp) + '?text=' + encodeURIComponent(WA_MSG.replace('{prodotto}', p.nome)) + '" target="_blank" rel="noopener noreferrer">' +
      '<span class="icon" data-icon="whatsapp"></span> ' + esc(lbl('askInfo')) + '</a>' +
    '</div></div>';

    return html;
  }

  function renderLana(l) {
    if(!loadedLana || !lanaList) return;
    var cards = lanaList.querySelectorAll('.prodotto');
    if(!cards.length) return;
    cards.forEach(function(card, i){
      var p = loadedLana[i];
      if(!p) return;
      card.innerHTML = buildLanaCard(p, l);
    });
    replaceIcons(lanaList);
    initSlideshows(lanaList);
    document.dispatchEvent(new Event('lana-rerender'));
  }

  function initSlideshows(root) {
    (root || document).querySelectorAll('.lana-slideshow').forEach(function(ss){
      if(ss._ssInit) return;
      ss._ssInit = true;
      var slides = ss.querySelectorAll('.lana-slide');
      var dots = ss.querySelectorAll('.slide-dot');
      var idx = 0;
      function goTo(n){
        idx = (n + slides.length) % slides.length;
        slides.forEach(function(s, i){ s.classList.toggle('active', i === idx) });
        dots.forEach(function(d, i){ d.classList.toggle('active', i === idx) });
      }
      ss.querySelector('.slide-prev').addEventListener('click', function(){ goTo(idx - 1) });
      ss.querySelector('.slide-next').addEventListener('click', function(){ goTo(idx + 1) });
      dots.forEach(function(d){ d.addEventListener('click', function(){ goTo(parseInt(d.getAttribute('data-dot'))) }) });
    });
  }

  if(lanaList) {
    lanaList.innerHTML = '<p class="prodotti-loading">Caricamento...</p>';
    fetch('data/lana.json')
      .then(function(r){ if(!r.ok) throw new Error(r.status); return r.json() })
      .then(function(data){
        loadedLana = data;
        var frag = document.createDocumentFragment();
        data.forEach(function(p){
          var el = document.createElement('article');
          el.className = 'prodotto reveal';
          el.innerHTML = buildLanaCard(p, lang);
          frag.appendChild(el);
          rObs.observe(el);
        });
        lanaList.innerHTML = '';
        lanaList.appendChild(frag);
        replaceIcons(lanaList);
        initSlideshows(lanaList);
        document.dispatchEvent(new Event('lana-ready'));
        refreshI18n();
      })
      .catch(function(){ lanaList.textContent = 'Errore nel caricamento dei prodotti lana.' });
  }

  /* Messaggio WhatsApp pre-compilato */
  var WA_MSG = 'Salve, vorrei più informazioni su {prodotto}';
  var loadedProdotti = null;

  function buildCard(p, l) {
    var avail = p.disponibile !== false;
    return '<div class="prodotto-img"><img src="' + esc(p.img) + '" alt="' + esc(p.nome) + '" loading="lazy" width="280" height="280"></div>' +
      '<div class="prodotto-body">' +
        '<div class="prodotto-head"><h3>' + esc(p.nome) + '</h3><span class="prodotto-badge">' + esc(t_(p,'badge',l)) + '</span></div>' +
        '<p class="prodotto-desc">' + esc(t_(p,'desc',l)) + '</p>' +
        '<div class="prodotto-details">' +
          '<div class="prodotto-detail"><span class="detail-label">' + esc(lbl('ingredients')) + '</span><span class="detail-value">' + esc(t_(p,'ingredienti',l)) + '</span></div>' +
          '<div class="prodotto-detail"><span class="detail-label">' + esc(lbl('chars')) + '</span><span class="detail-value">' + esc(t_(p,'caratteristiche',l)) + '</span></div>' +
        '</div>' +
        '<div class="prodotto-specs">' +
          '<div class="spec"><span class="spec-label">' + esc(lbl('size')) + '</span><span class="spec-value">' + esc(t_(p,'pezzatura',l)) + '</span></div>' +
          '<div class="spec"><span class="spec-label">' + esc(lbl('storage')) + '</span><span class="spec-value">' + esc(t_(p,'conservazione',l)) + '</span></div>' +
          '<div class="spec"><span class="spec-label">' + esc(lbl('consumption')) + '</span><span class="spec-value">' + esc(t_(p,'consumo',l)) + '</span></div>' +
          '<div class="spec"><span class="spec-label">' + esc(lbl('availability')) + '</span><span class="spec-value">' + esc(t_(p,'disponibilita',l)) + '</span></div>' +
        '</div>' +
        (avail ?
        '<div class="prodotto-porzioni" data-porzioni="' + esc((p.porzioni || ['Intero']).join(',')) + '">' +
          '<span class="porzioni-label">' + lbl('portion') + '</span>' +
          '<div class="porzioni-btns">' +
          (p.porzioni || ['Intero']).map(function(pz, i){
            var price = p.prezzi && p.prezzi[pz] ? p.prezzi[pz] : 0;
            return '<button type="button" class="porzione-btn' + (i === 0 ? ' active' : '') + '" data-porzione="' + esc(pz) + '" data-prezzo="' + price + '">' + esc(pz) + (price ? ' \u2014 \u20ac' + price.toFixed(2) : '') + '</button>';
          }).join('') +
          '</div>' +
        '</div>'
        : '<p class="prodotto-unavail">' + esc(lbl('unavail')) + '</p>') +
        '<div class="prodotto-actions">' +
        '<a class="prodotto-wa" href="https://wa.me/' + esc(CONFIG.whatsapp) + '?text=' + encodeURIComponent(WA_MSG.replace('{prodotto}', p.nome)) + '" target="_blank" rel="noopener noreferrer">' +
        '<span class="icon" data-icon="whatsapp"></span> ' + esc(lbl('askInfo')) + '</a>' +
      '</div>' +
      '</div>';
  }

  function renderProdotti(l) {
    var list = loadedProdotti;
    if(!list || !prodList) return;
    var cards = prodList.querySelectorAll('.prodotto');
    if(!cards.length) return;
    cards.forEach(function(card, i){
      var p = list[i];
      if(!p) return;
      card.innerHTML = buildCard(p, l);
    });
    replaceIcons(prodList);
    document.dispatchEvent(new Event('prodotti-rerender'));
  }

  var prodList = $('#prodotti-list');
  if(prodList) {
  prodList.innerHTML = '<p class="prodotti-loading">' + 'Caricamento...' + '</p>';
  fetch('data/prodotti.json')
    .then(function(r){ if(!r.ok) throw new Error(r.status); return r.json() })
    .then(function(PRODOTTI){
      loadedProdotti = PRODOTTI;
      var frag = document.createDocumentFragment();
      PRODOTTI.forEach(function(p){
        var el = document.createElement('article');
        el.className = 'prodotto reveal';
        el.innerHTML = buildCard(p, lang);
        frag.appendChild(el);
        rObs.observe(el);
      });
      prodList.innerHTML = '';
      prodList.appendChild(frag);
      replaceIcons(prodList);
      document.dispatchEvent(new Event('prodotti-ready'));
      refreshI18n();
    })
    .catch(function(){ prodList.textContent = 'Errore nel caricamento dei prodotti.'; });
  }

  /* ── ICONE SVG ── */
  var ICONS = {
    email:     'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
    whatsapp:  'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z',
    instagram: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
    pin:       'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z'
  };

  function replaceIcons(root){
    (root || document).querySelectorAll('[data-icon]').forEach(function(el){
      var name = el.getAttribute('data-icon'), d = ICONS[name];
      if(!d) return;
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'currentColor');
      svg.setAttribute('class', el.className);
      if(!el.classList.contains('contatto-icon')){
        svg.setAttribute('width', '16');
        svg.setAttribute('height', '16');
      }
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      svg.appendChild(p);
      el.parentNode.replaceChild(svg, el);
    });
  }
  replaceIcons();

  /* ── INTERNAZIONALIZZAZIONE (i18n) ────────────────────────────────
     Sistema di traduzione IT ↔ EN usando l'API MyMemory.
     Eseguito DOPO tutto il contenuto dinamico per catturare
     tutti gli elementi con attributo data-i18n.

     Funzionamento:
     - orig{}: salva l'HTML originale italiano di ogni chiave i18n
     - cache{}: memorizza le traduzioni inglesi già ottenute
     - ch: hash semplice del contenuto per invalidare la cache
       se il testo sorgente cambia
     - Al caricamento tenta di recuperare le traduzioni da localStorage

     tr(text): traduce un testo IT→EN via API MyMemory.
       Gestisce i <br> convertendoli in \n prima della traduzione
       e ripristinandoli dopo.

     apply(l): applica la lingua scelta a tutti gli elementi i18n.
       Se EN e la traduzione esiste in cache, la usa; altrimenti
       mostra l'originale italiano.

     Click sul bottone lingua (#lang-toggle):
     - Se siamo in EN → torna a IT immediatamente
     - Se siamo in IT → traduce in batch da 5 chiavi alla volta
       per non sovraccaricare l'API, poi salva tutto in localStorage
     ─────────────────────────────────────────────────────────────────── */
  var lb = $('#lang-toggle'),
      orig = {}, cache = {},
      i18n = [], ch = '', uniqueKeys = [];

  function refreshI18n(){
    i18n = Array.prototype.slice.call($$('[data-i18n]'));
    var hs = '';
    i18n.forEach(function(e){ var k = e.getAttribute('data-i18n'); if(!orig[k]) orig[k] = e.innerHTML; hs += e.textContent });
    ch = hs.length + '_' + hs.slice(0, 80);
    uniqueKeys = Object.keys(orig);
    try {
      if(localStorage.getItem(LS_HASH) === ch){
        var raw = JSON.parse(localStorage.getItem(LS_EN) || '{}');
        Object.keys(raw).forEach(function(k){
          if(typeof raw[k] === 'string') cache[k] = raw[k];
        });
      }
    } catch(x){}
  }
  refreshI18n();

  /* Dominio consentito per le richieste di traduzione (allowlist) */
  var TRANSLATE_ORIGIN = 'https://api.mymemory.translated.net';
  var MAX_TRANSLATE_LEN = 500;

  function tr(text){
    var c = text.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');

    /* Limita la lunghezza del testo per evitare abusi */
    if(c.length > MAX_TRANSLATE_LEN) c = c.slice(0, MAX_TRANSLATE_LEN);

    /* Costruisce e valida l'URL contro il dominio consentito */
    var url = TRANSLATE_ORIGIN + '/get?q=' + encodeURIComponent(c) + '&langpair=it|en';
    try {
      var parsed = new URL(url);
      if(parsed.origin !== TRANSLATE_ORIGIN) return Promise.resolve(text);
    } catch(e){ return Promise.resolve(text); }

    return fetch(url)
      .then(function(r){ return r.json() })
      .then(function(d){
        if(d.responseStatus === 200 && d.responseData){
          var r = d.responseData.translatedText;
          /* Sanitizza il testo tradotto prima di reinserirlo nel DOM */
          r = esc(r);
          return text.indexOf('<br') > -1 ? r.replace(/\n/g, '<br>') : r;
        }
        return text;
      })
      .catch(function(){ return text });
  }

  function apply(l){
    lang = l;
    document.documentElement.lang = l;
    i18n.forEach(function(e){
      var k = e.getAttribute('data-i18n');
      var val = l === 'en' && cache[k] ? cache[k] : orig[k];
      if(!val) return;
      if(val.indexOf('<') === -1) e.textContent = val;
      else e.innerHTML = val;
    });
    lb.textContent = l === 'it' ? 'EN' : 'IT';
    updateDarkLabel();
    renderProdotti(l);
    renderLana(l);
  }

  lb.addEventListener('click', function(){
    if(lang !== 'it'){ apply('it'); return }
    var todo = uniqueKeys.filter(function(k){ return !cache[k] });
    if(!todo.length){ apply('en'); return }
    lb.textContent = '...'; lb.disabled = true;
    var BATCH = 5;
    function processBatch(idx){
      var batch = todo.slice(idx, idx + BATCH);
      if(!batch.length){
        try { localStorage.setItem(LS_EN, JSON.stringify(cache)); localStorage.setItem(LS_HASH, ch) } catch(x){}
        lb.disabled = false;
        apply('en');
        return;
      }
      Promise.all(batch.map(function(k){ return tr(orig[k]).then(function(t){ cache[k] = t }) }))
        .then(function(){ processBatch(idx + BATCH) })
        .catch(function(){ lb.disabled = false; apply('it') });
    }
    processBatch(0);
  });

  /* ── SCROLL TO TOP ── */
  if(stt){
    stt.addEventListener('click', function(){ window.scrollTo({ top: 0, behavior: 'smooth' }) });
  }

  /* ── TOAST ── */
  var toastEl = $('#toast'), toastTimer;
  function showToast(msg){
    if(!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ toastEl.classList.remove('show') }, 2000);
  }

  /* ── NAV ACTIVE LINK ── */
  var navLinksA = $$('.nav-links a');
  var navSections = ['timeline','lana','prodotti','contatti'].map(function(id){ return document.getElementById(id) }).filter(Boolean);
  var navSecObs = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        var id = entry.target.id;
        navLinksA.forEach(function(a){ a.classList.toggle('active', a.getAttribute('href') === '#' + id) });
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  navSections.forEach(function(s){ navSecObs.observe(s) });

  /* ── FOCUS TRAP ── */
  var _trapEl = null, _trapHandler = null;
  function trapFocus(el){
    _trapEl = el;
    _trapHandler = function(e){
      if(e.key !== 'Tab') return;
      var focusable = _trapEl.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])');
      if(!focusable.length) return;
      var first = focusable[0], last = focusable[focusable.length - 1];
      if(e.shiftKey){ if(document.activeElement === first){ e.preventDefault(); last.focus() } }
      else { if(document.activeElement === last){ e.preventDefault(); first.focus() } }
    };
    document.addEventListener('keydown', _trapHandler);
    var first = el.querySelector('a[href],button:not([disabled]),input');
    if(first) first.focus();
  }
  function releaseFocus(){ if(_trapHandler){ document.removeEventListener('keydown', _trapHandler); _trapHandler = null; _trapEl = null; } }

  /* ── ESCAPE per chiudere menu mobile e carrello ── */
  document.addEventListener('keydown', function(e){
    if(e.key !== 'Escape') return;
    if(mobileMenu.classList.contains('open')){ toggleMenu(); releaseFocus(); }
  });

  /* ── STAGGER prodotti ── */
  var staggerObs = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(!entry.isIntersecting) return;
      var cards = prodList.querySelectorAll('.prodotto');
      cards.forEach(function(c, i){
        c.style.transitionDelay = (i * .08) + 's';
      });
      staggerObs.unobserve(entry.target);
    });
  }, { threshold: .05 });
  if(prodList) staggerObs.observe(prodList);

  /* ══════════════════════════════════════════════════════════════════
     CARRELLO — Modulo rimovibile
     Per rimuovere: cancellare questo blocco JS,
     il blocco HTML #cart-drawer e il blocco CSS CARRELLO
     ══════════════════════════════════════════════════════════════════ */
  (function initCart(){
    var drawer   = $('#cart-drawer');
    var overlay  = $('#cart-overlay');
    var body     = $('#cart-body');
    var footer   = $('#cart-footer');
    var sendBtn  = $('#cart-send');
    var closeBtn = $('#cart-close');
    var fNome = $('#cart-nome'), fData = $('#cart-data'), fAddr = $('#cart-indirizzo');
    var delToggle = $('#cart-delivery-toggle');
    var deliveryMode = 'pickup';
    if(!drawer) return;

    /* ── Dizionario bilingue carrello ── */
    var CT = {
      empty:     { it: 'Il carrello \u00e8 vuoto', en: 'Cart is empty' },
      clear:     { it: 'Svuota', en: 'Clear all' },
      total:     { it: 'Totale', en: 'Total' },
      totalWa:   { it: '\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n*Totale:* ', en: '\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n*Total:* ' },
      added:     { it: 'Aggiunto al carrello', en: 'Added to cart' },
      addTo:     { it: 'Aggiungi al carrello', en: 'Add to cart' },
      addedPfx:  { it: 'Aggiunto: ', en: 'Added: ' },
      decQty:    { it: 'Diminuisci quantit\u00e0', en: 'Decrease quantity' },
      incQty:    { it: 'Aumenta quantit\u00e0', en: 'Increase quantity' },
      remove:    { it: 'Rimuovi prodotto', en: 'Remove item' },
      orderHdr:  { it: '*Salve, vorrei ordinare i seguenti prodotti:*\n\n', en: '*Hi, I would like to order following products:*\n\n' },
      name:      { it: '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n*Nome:* ', en: '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n*Name:* ' },
      date:      { it: '*Data:* ', en: '\n*Date:* ' },
      pickup:    { it: '*Ritiro in sede*', en: '*Pickup at your location*' },
      address:   { it: '*Consegna a:* ', en: '*Deliver to:* ' },
      tooLong:   { it: 'Ordine troppo lungo per WhatsApp. Prova a rimuovere qualche prodotto.', en: 'Order too long for WhatsApp. Try removing some items.' },
      needName:  { it: 'Inserisci il tuo nome', en: 'Please enter your name' },
      needDate:  { it: 'Seleziona una data di consegna', en: 'Please select a delivery date' },
      needAddr:  { it: 'Inserisci l\u2019indirizzo di consegna', en: 'Please enter a delivery address' },
      sent:      { it: 'Ordine inviato!', en: 'Order sent!' },
      title:     { it: 'Il tuo ordine', en: 'Your order' },
      fields:    { it: 'Dettagli consegna', en: 'Delivery details' },
      phName:    { it: 'Nome', en: 'Name' },
      phDate:    { it: 'Data desiderata', en: 'Desired date' },
      phAddr:    { it: 'Indirizzo di consegna', en: 'Delivery address' },
      delPick:   { it: 'Ritiro in sede', en: 'I will pick it up' },
      delAddr:   { it: 'Consegna', en: 'Home delivery' },
      sendWa:    { it: 'Invia ordine su WhatsApp', en: 'Send order on WhatsApp' }
    };
    function ct(key){ return CT[key][lang] || CT[key].it; }

    /* ── Parsing chiave carrello ── */
    function parseCartKey(key){
      var p = key.split('|');
      var detail = p.length === 3 ? p[1] + ', ' + p[2] : p[1];
      return { name: p[0], detail: detail, display: p[0] + ' (' + detail + ')' };
    }

    function lineTotal(item){ return Math.round(item.price * item.qty * 100) / 100; }

    /* Stato carrello: { chiave: { qty: numero, price: prezzo_unitario } } */
    var cart = {};
    try {
      var saved = JSON.parse(localStorage.getItem(LS_CART) || '{}');
      if(typeof saved === 'object' && saved !== null){
        for(var k in saved){
          if(typeof saved[k] === 'object' && saved[k].qty > 0){
            cart[k] = { qty: Math.min(parseInt(saved[k].qty, 10), MAX_QTY), price: parseFloat(saved[k].price) || 0 };
          } else if(typeof saved[k] === 'number' && saved[k] > 0){
            cart[k] = { qty: Math.min(parseInt(saved[k], 10), MAX_QTY), price: 0 };
          }
        }
      }
    } catch(x){}

    /* Icona carrello nella navbar */
    var toggleBtn = document.createElement('button');
    toggleBtn.className = 'cart-toggle';
    toggleBtn.setAttribute('aria-label', 'Carrello');
    toggleBtn.innerHTML = '\ud83d\uded2 <span class="cart-badge" id="cart-badge">0</span>';
    var navActions = $('.nav-actions');
    if(navActions) navActions.insertBefore(toggleBtn, navActions.firstChild);
    var badge = $('#cart-badge');
    var fab = $('#cart-fab');
    var fabBadge = $('#cart-fab-badge');

    function save(){
      try { localStorage.setItem(LS_CART, JSON.stringify(cart)) } catch(x){}
    }

    function updateCartLang(){
      drawer.querySelector('.cart-header h3').textContent = ct('title');
      drawer.querySelector('.cart-fields-title').textContent = ct('fields');
      fNome.placeholder = ct('phName');
      fData.placeholder = ct('phDate');
      fAddr.placeholder = ct('phAddr');
      if(delToggle){
        var btns = delToggle.querySelectorAll('.cart-del-btn');
        if(btns[0]) btns[0].textContent = ct('delPick');
        if(btns[1]) btns[1].textContent = ct('delAddr');
      }
      var sendSvg = sendBtn.querySelector('svg');
      sendBtn.innerHTML = (sendSvg ? sendSvg.outerHTML + ' ' : '') + ct('sendWa');
    }

    function renderDrawer(){
      var keys = Object.keys(cart).filter(function(k){ return cart[k].qty > 0 });
      var tot = keys.reduce(function(s, k){ return s + cart[k].qty }, 0);
      var totalPrice = keys.reduce(function(s, k){ return s + Math.round(cart[k].qty * cart[k].price * 100) }, 0) / 100;

      /* Badge */
      badge.textContent = tot;
      badge.classList.toggle('visible', tot > 0);

      /* FAB */
      if(fab){
        fabBadge.textContent = tot;
        fab.classList.toggle('visible', tot > 0);
        fab.setAttribute('aria-hidden', tot > 0 ? 'false' : 'true');
      }

      /* Footer */
      footer.classList.toggle('visible', tot > 0);

      /* Body */
      if(!keys.length){
        body.innerHTML = '<p class="cart-empty">' + ct('empty') + '</p>';
        sendBtn.href = '#';
        updateCartLang();
        return;
      }

      var html = '';
      keys.forEach(function(key){
        var ck = parseCartKey(key);
        var item = cart[key];
        var linePrice = item.price > 0 ? ' \u2014 \u20ac' + lineTotal(item).toFixed(2) : '';
        html += '<div class="cart-item">' +
          '<span class="cart-item-name">' + esc(ck.display) + linePrice + '</span>' +
          '<div class="cart-item-qty">' +
            '<button data-cart-minus="' + esc(key) + '" aria-label="' + ct('decQty') + '">&minus;</button>' +
            '<span>' + item.qty + '</span>' +
            '<button data-cart-plus="' + esc(key) + '" aria-label="' + ct('incQty') + '">+</button>' +
          '</div>' +
          '<button class="cart-item-remove" data-cart-remove="' + esc(key) + '" aria-label="' + ct('remove') + '">&times;</button>' +
        '</div>';
      });
      if(totalPrice > 0){
        html += '<div class="cart-total"><span>' + ct('total') + '</span><span>\u20ac' + totalPrice.toFixed(2) + '</span></div>';
      }
      body.innerHTML = html;

      /* Bottone svuota in fondo alla lista */
      var clearBtn = document.createElement('button');
      clearBtn.className = 'cart-clear';
      clearBtn.type = 'button';
      clearBtn.textContent = ct('clear');
      clearBtn.addEventListener('click', function(){ cart = {}; save(); renderDrawer(); refreshAddBtns(); });
      body.appendChild(clearBtn);

      /* Link WhatsApp */
      var msg = ct('orderHdr');
      keys.forEach(function(key){
        var ck = parseCartKey(key);
        msg += '\u2022 ' + ck.name + ' (' + ck.detail + ') x' + cart[key].qty;
        if(cart[key].price > 0) msg += ' \u2014 \u20ac' + lineTotal(cart[key]).toFixed(2);
        msg += '\n';
      });
      if(totalPrice > 0) msg += ct('totalWa') + '\u20ac' + totalPrice.toFixed(2);
      if(fNome.value.trim()) msg += '\n' + ct('name') + fNome.value.trim();
      if(fData.value) msg += '\n' + ct('date') + fData.value;
      if(deliveryMode === 'pickup'){
        msg += '\n' + ct('pickup');
      } else if(fAddr.value.trim()){
        msg += '\n' + ct('address') + fAddr.value.trim();
      }
      /* Validazione campi obbligatori */
      var missingField = !fNome.value.trim() ? 'needName'
        : !fData.value ? 'needDate'
        : (deliveryMode === 'address' && !fAddr.value.trim()) ? 'needAddr'
        : '';
      if(missingField){
        sendBtn.href = '#';
        sendBtn.classList.add('cart-send-disabled');
        updateCartLang();
        return;
      }
      sendBtn.classList.remove('cart-send-disabled');

      var waUrl = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(msg);
      if(waUrl.length > MAX_WA_URL_LEN){
        showToast(ct('tooLong'));
        sendBtn.href = '#';
        updateCartLang();
        return;
      }
      sendBtn.href = waUrl;
      updateCartLang();
    }

    /* Aggiorna stato bottoni "Aggiungi" nelle card */
    function refreshAddBtns(){
      $$('.cart-add-btn').forEach(function(btn){
        var name = btn.getAttribute('data-cart-name');
        var bodyEl = btn.closest('.prodotto-body');
        var key = bodyEl ? buildCartKey(name, bodyEl) : name + '|Intero';
        var qty = cart[key] ? cart[key].qty : 0;
        btn.classList.toggle('added', qty > 0);
        if(qty > 0){
          btn.innerHTML = '\u2713 ' + ct('added') + ' (' + qty + ')';
        } else {
          btn.innerHTML = '\ud83d\uded2 ' + ct('addTo');
        }
      });
    }

    /* Apri / chiudi drawer */
    function openDrawer(){
      drawer.classList.add('open');
      overlay.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      renderDrawer();
      trapFocus(drawer);
    }

    function closeDrawer(){
      drawer.classList.remove('open');
      overlay.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      releaseFocus();
    }

    sendBtn.addEventListener('click', function(e){
      if(sendBtn.getAttribute('href') === '#'){
        e.preventDefault();
        var vMsg = !fNome.value.trim() ? ct('needName')
          : !fData.value ? ct('needDate')
          : (deliveryMode === 'address' && !fAddr.value.trim()) ? ct('needAddr')
          : '';
        if(vMsg) showToast(vMsg);
        return;
      }
      setTimeout(function(){
        cart = {};
        save();
        renderDrawer();
        refreshAddBtns();
        closeDrawer();
        showToast(ct('sent'));
      }, 500);
    });

    toggleBtn.addEventListener('click', openDrawer);
    if(fab) fab.addEventListener('click', openDrawer);
    closeBtn.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);

    /* Delegazione eventi nel body del drawer */
    body.addEventListener('click', function(e){
      var t = e.target;
      var name;
      if((name = t.getAttribute('data-cart-plus'))){
        if(cart[name]) cart[name].qty = Math.min(cart[name].qty + 1, MAX_QTY);
      } else if((name = t.getAttribute('data-cart-minus'))){
        if(cart[name] && cart[name].qty > 1) cart[name].qty--;
        else delete cart[name];
      } else if((name = t.getAttribute('data-cart-remove'))){
        delete cart[name];
      } else return;
      save(); renderDrawer(); refreshAddBtns();
    });

    function addToCart(key, price){
      if(cart[key]) cart[key].qty = Math.min(cart[key].qty + 1, MAX_QTY);
      else cart[key] = { qty: 1, price: price || 0 };
      save(); renderDrawer(); refreshAddBtns();
      var ck = parseCartKey(key);
      showToast(ct('addedPfx') + ck.display);
    }

    function getSelectedPrice(bodyEl){
      var active = bodyEl.querySelector('.porzione-btn:not(.colore-btn).active');
      return active ? parseFloat(active.getAttribute('data-prezzo')) || 0 : 0;
    }

    function getSelectedPorzione(bodyEl){
      var active = bodyEl.querySelector('.porzione-btn:not(.colore-btn).active');
      return active ? active.getAttribute('data-porzione') : 'Intero';
    }

    function getSelectedColore(bodyEl){
      var active = bodyEl.querySelector('.colore-btn.active');
      return active ? active.getAttribute('data-colore') : '';
    }

    function buildCartKey(name, bodyEl){
      var pz = getSelectedPorzione(bodyEl);
      var col = getSelectedColore(bodyEl);
      return col ? name + '|' + col + '|' + pz : name + '|' + pz;
    }

    function injectAddBtns(root){
      var container = root || prodList;
      container.querySelectorAll('.prodotto-body').forEach(function(bodyEl){
        if(bodyEl.querySelector('.cart-add-btn')) return;
        if(bodyEl.querySelector('.prodotto-unavail')) return;
        var h3 = bodyEl.querySelector('h3');
        if(!h3) return;
        var name = h3.textContent;

        bodyEl.querySelectorAll('.porzione-btn').forEach(function(pb){
          pb.addEventListener('click', function(){
            var group = pb.classList.contains('colore-btn') ? '.colore-btn' : '.porzione-btn:not(.colore-btn)';
            bodyEl.querySelectorAll(group).forEach(function(b){ b.classList.remove('active') });
            pb.classList.add('active');
            refreshAddBtns();
          });
        });

        var btn = document.createElement('button');
        btn.className = 'cart-add-btn';
        btn.setAttribute('data-cart-name', name);
        btn.type = 'button';
        var actionsDiv = bodyEl.querySelector('.prodotto-actions');
        if(actionsDiv) actionsDiv.appendChild(btn);
        btn.addEventListener('click', function(){
          addToCart(buildCartKey(name, bodyEl), getSelectedPrice(bodyEl));
        });
      });
      refreshAddBtns();
    }

    function syncPrices(){
      var updated = false;
      Object.keys(cart).forEach(function(key){
        var parts = key.split('|');
        var pz = parts[parts.length - 1];
        $$('.porzione-btn:not(.colore-btn)').forEach(function(btn){
          if(btn.getAttribute('data-porzione') !== pz) return;
          var bodyEl = btn.closest('.prodotto-body');
          if(!bodyEl) return;
          var h3 = bodyEl.querySelector('h3');
          if(!h3 || h3.textContent !== parts[0]) return;
          var freshPrice = parseFloat(btn.getAttribute('data-prezzo')) || 0;
          if(cart[key].price !== freshPrice){
            cart[key].price = freshPrice;
            updated = true;
          }
        });
      });
      if(updated){ save(); renderDrawer(); }
    }

    document.addEventListener('prodotti-ready', function(){ injectAddBtns(); syncPrices(); });
    document.addEventListener('lana-ready', function(){ injectAddBtns(lanaList); syncPrices(); });
    document.addEventListener('prodotti-rerender', function(){ injectAddBtns(); });
    document.addEventListener('lana-rerender', function(){ injectAddBtns(lanaList); });

    /* Aggiorna link WA quando i campi cambiano */
    [fNome, fAddr].forEach(function(f){ f.addEventListener('input', renderDrawer) });
    fData.addEventListener('change', renderDrawer);

    if(delToggle){
      delToggle.addEventListener('click', function(e){
        var btn = e.target.closest('.cart-del-btn');
        if(!btn) return;
        delToggle.querySelectorAll('.cart-del-btn').forEach(function(b){ b.classList.remove('active') });
        btn.classList.add('active');
        deliveryMode = btn.getAttribute('data-delivery');
        fAddr.className = deliveryMode === 'address' ? 'cart-input cart-addr-visible' : 'cart-input cart-addr-hidden';
        if(deliveryMode === 'pickup') fAddr.value = '';
        renderDrawer();
      });
    }

    /* ── Mini-calendario custom ── */
    var calDrop = $('#cal-drop'), calY, calM, calSel = null;
    var now0 = new Date(); var minCalY = now0.getFullYear(), minCalM = now0.getMonth();
    var maxCalDate = new Date(now0.getFullYear() + 1, now0.getMonth(), 1);
    var maxCalY = maxCalDate.getFullYear(), maxCalM = maxCalDate.getMonth();
    var MESI_IT = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
    var MESI_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var GIORNI_IT = ['Lu','Ma','Me','Gi','Ve','Sa','Do'];
    var GIORNI_EN = ['Mo','Tu','We','Th','Fr','Sa','Su'];

    function pad(n){ return n < 10 ? '0' + n : n }

    function fmtDate(d){ return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() }

    function renderCal(){
      var MESI = lang === 'en' ? MESI_EN : MESI_IT;
      var GIORNI = lang === 'en' ? GIORNI_EN : GIORNI_IT;
      var today = new Date(); today.setHours(0,0,0,0);
      var first = new Date(calY, calM, 1);
      var startDay = (first.getDay() + 6) % 7;
      var daysInMonth = new Date(calY, calM + 1, 0).getDate();

      var h = '<div class="cal-head">' +
        '<button type="button" data-cal="prev"' + (calY === minCalY && calM === minCalM ? ' disabled style="visibility:hidden"' : '') + '>&#8249;</button>' +
        '<span class="cal-title">' + MESI[calM] + ' ' + calY + '</span>' +
        '<button type="button" data-cal="next"' + (calY === maxCalY && calM === maxCalM ? ' disabled style="visibility:hidden"' : '') + '>&#8250;</button></div>';
      h += '<div class="cal-grid">';
      GIORNI.forEach(function(g){ h += '<span class="cal-dow">' + g + '</span>' });
      for(var i = 0; i < startDay; i++) h += '<span class="cal-day empty"></span>';
      for(var d = 1; d <= daysInMonth; d++){
        var dt = new Date(calY, calM, d);
        var cls = 'cal-day';
        if(dt < today) cls += ' disabled';
        if(dt.getTime() === today.getTime()) cls += ' today';
        if(calSel && dt.getTime() === calSel.getTime()) cls += ' selected';
        h += '<button type="button" class="' + cls + '" data-cal-day="' + d + '">' + d + '</button>';
      }
      h += '</div>';
      calDrop.innerHTML = h;
    }

    function openCal(){
      var now = calSel || new Date();
      calY = now.getFullYear(); calM = now.getMonth();
      renderCal();
      calDrop.classList.add('open');
      calDrop.setAttribute('aria-hidden', 'false');
    }

    function closeCal(){ calDrop.classList.remove('open'); calDrop.setAttribute('aria-hidden', 'true') }

    fData.addEventListener('click', function(){ calDrop.classList.contains('open') ? closeCal() : openCal() });

    /* Bottone reset intero form consegna */
    var formReset = document.createElement('button');
    formReset.type = 'button';
    formReset.className = 'cart-form-reset';
    formReset.setAttribute('aria-label', lang === 'en' ? 'Reset form' : 'Resetta dettagli');
    formReset.innerHTML = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/></svg>';
    var fieldsTitle = drawer.querySelector('.cart-fields-title');
    if(fieldsTitle) fieldsTitle.parentNode.insertBefore(formReset, fieldsTitle.nextSibling);
    formReset.addEventListener('click', function(){
      fNome.value = '';
      calSel = null; fData.value = '';
      fAddr.value = '';
      deliveryMode = 'pickup';
      fAddr.className = 'cart-input cart-addr-hidden';
      if(delToggle){
        delToggle.querySelectorAll('.cart-del-btn').forEach(function(b){ b.classList.remove('active') });
        var pickBtn = delToggle.querySelector('[data-delivery="pickup"]');
        if(pickBtn) pickBtn.classList.add('active');
      }
      renderDrawer();
    });

    calDrop.addEventListener('click', function(e){
      e.stopPropagation();
      var t = e.target;
      if(t.getAttribute('data-cal') === 'prev'){ calM--; if(calM < 0){ calM = 11; calY-- } if(calY < minCalY || (calY === minCalY && calM < minCalM)){ calY = minCalY; calM = minCalM; } renderCal() }
      else if(t.getAttribute('data-cal') === 'next'){ calM++; if(calM > 11){ calM = 0; calY++ } if(calY > maxCalY || (calY === maxCalY && calM > maxCalM)){ calY = maxCalY; calM = maxCalM; } renderCal() }
      else if(t.hasAttribute('data-cal-day')){
        calSel = new Date(calY, calM, parseInt(t.getAttribute('data-cal-day')));
        fData.value = fmtDate(calSel);
        renderCal();
        closeCal();
        renderDrawer();
      }
    });

    document.addEventListener('click', function(e){
      if(!calDrop.classList.contains('open')) return;
      if(e.target !== fData && !calDrop.contains(e.target)) closeCal();
    });

    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
    });

    renderDrawer();
  })();
  /* ══════════════════════════════════════════════════════════════════
     FINE CARRELLO
     ══════════════════════════════════════════════════════════════════ */

})();
