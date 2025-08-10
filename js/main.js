/* =========================================================
   main.js — HERO GLOBE (calm, lead spots, slow)
   Canvas id: #galaxy
   - Globe-style sphere with meridians
   - Rotating globe with random lead labels
   - Slow motion, subtle arcs + packets
   ========================================================= */
(function heroGlobe(){
  const cvs = document.getElementById('galaxy'); if(!cvs) return;

  // ---------- Palette (calm) ----------
  const PAL = {
    bg:  '#050a1f',
    core: 0x0e051e,
    node: 0x9fdfff,
    meridian: 'rgba(255,255,255,0.12)',
    arc: 'rgba(153,236,255,0.23)',
    label: '#ffffff',
    packet: 0xffffff
  };
  document.body.style.background =
    `radial-gradient(1000px 600px at 30% -10%, #0d1340 0%, ${PAL.bg} 55%, #020514 100%)`;

  // ---------- Three.js setup ----------
  const renderer = new THREE.WebGLRenderer({ canvas: cvs, antialias: true, alpha: true });
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  const scene = new THREE.Scene();
  const globe = new THREE.Group();
  scene.add(globe);
  const camera = new THREE.PerspectiveCamera(55, 2, 0.1, 2000);
  camera.position.set(0, 0, 120);
  scene.add(new THREE.AmbientLight(0xffffff, 0.85));

  // ---------- Globe core ----------
  const R = 42; // visible globe radius
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(R, 96, 96),
    new THREE.MeshBasicMaterial({ color: PAL.core, transparent: true, opacity: 0.55 })
  );
  globe.add(core);

  // ---------- Thin star shell (calm background) ----------
  const shellCount = 700;
  const shellPos = new Float32Array(shellCount * 3);
  for (let i = 0; i < shellCount; i++) {
    const v = new THREE.Vector3(Math.random() - .5, Math.random() - .5, Math.random() - .5)
      .normalize()
      .multiplyScalar(110 + Math.random() * 14);
    shellPos[i * 3] = v.x; shellPos[i * 3 + 1] = v.y; shellPos[i * 3 + 2] = v.z;
  }
  const shell = new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(shellPos, 3)),
    new THREE.PointsMaterial({ color: PAL.node, size: 0.8, transparent: true, opacity: 0.45 })
  );
  scene.add(shell);

  // ---------- Meridians / Parallels (wireframe feel) ----------
  const meridianMat = new THREE.LineBasicMaterial({ color: new THREE.Color(PAL.meridian) });
  const grid = new THREE.Group(); globe.add(grid);

  function ring(radius, tiltX = 0, tiltY = 0, segments = 128) {
    const geo = new THREE.BufferGeometry();
    const pts = [];
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
    }
    geo.setFromPoints(pts);
    const line = new THREE.Line(geo, meridianMat);
    line.rotation.x = tiltX; line.rotation.y = tiltY;
    return line;
  }

  // Parallels
  for (let i = -60; i <= 60; i += 20) {
    const phi = THREE.MathUtils.degToRad(i);
    const rr = Math.cos(phi) * R;
    const rx = Math.sin(phi) * R;
    const l = ring(rr, 0, 0);
    l.position.y = rx;
    grid.add(l);
  }
  // Meridians
  for (let i = 0; i < 180; i += 20) {
    const mer = ring(R, THREE.MathUtils.degToRad(90), 0);
    mer.rotation.z = THREE.MathUtils.degToRad(i);
    grid.add(mer);
  }

  // ---------- Arcs across globe (subtle, sparse) ----------
  const arcMat = new THREE.LineBasicMaterial({ color: PAL.arc, transparent: true, opacity: 0.24 });
  const arcsGroup = new THREE.Group(); globe.add(arcsGroup);

  function randOnSphere(radius = R) {
    return new THREE.Vector3(Math.random() - .5, Math.random() - .5, Math.random() - .5)
      .normalize()
      .multiplyScalar(radius);
  }
  function arcCurve(a, b, lift = 1.1) {
    const mid = a.clone().add(b).normalize().multiplyScalar(R * lift);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const pts = curve.getPoints(60);
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    return new THREE.Line(geo, arcMat);
  }
  // Build a few calm arcs
  for (let i = 0; i < 14; i++) {
    const A = randOnSphere(R), B = randOnSphere(R);
    arcsGroup.add(arcCurve(A, B, 1.10 + Math.random() * 0.06));
  }

  // ---------- Data packets that ride arcs (slow) ----------
  const packetTex = (() => {
    const c = document.createElement('canvas'); c.width = 32; c.height = 32;
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.arc(16, 16, 6, 0, Math.PI * 2); g.fill();
    return new THREE.CanvasTexture(c);
  })();
  const packets = [];
  arcsGroup.children.forEach((line, idx) => {
    if (idx % 2) return; // fewer packets
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: packetTex, color: PAL.packet, transparent: true, opacity: 0.65, depthWrite: false }));
    sprite.scale.set(1.8, 1.8, 1);
    sprite.userData = {
      line,
      t: Math.random(),
      speed: 0.004 + Math.random() * 0.002 // slow
    };
    globe.add(sprite); packets.push(sprite);
  });

  // ---------- Dynamic lead spots ----------
  function makeTextSprite(text, color = PAL.label) {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
    const g = canvas.getContext('2d'); g.clearRect(0, 0, canvas.width, canvas.height);
    g.fillStyle = color;
    g.font = '700 26px Inter, Montserrat, system-ui, sans-serif';
    g.textBaseline = 'middle';
    g.fillText(text, 10, canvas.height / 2);
    const tex = new THREE.CanvasTexture(canvas); tex.minFilter = THREE.LinearFilter;
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.8, depthWrite: false }));
    const baseW = 28;
    spr.scale.set(baseW, baseW * 0.4, 1);
    return spr;
  }

  const LOCATIONS = [
    { name: 'United States', lat: 37.0902, lon: -95.7129 },
    { name: 'Canada',       lat: 56.1304, lon: -106.3468 },
    { name: 'Germany',      lat: 51.1657, lon: 10.4515 },
    { name: 'Brazil',       lat: -14.2350, lon: -51.9253 },
    { name: 'Australia',    lat: -25.2744, lon: 133.7751 }
  ];
  const PRODUCTS = {
    'Custom Packaging': ['die‑cut mailers','insert trays','retail boxes','mailer kits'],
    'Corrugated': ['double‑wall boxes','printed cartons','litho‑lam boxes'],
    'Stretch Wraps': ['machine film','hand film','eco film'],
    'Labels & Stickers': ['barcode sets','UL labels','die‑cut rolls'],
    'Flexible Packaging': ['stand‑up pouches','barrier bags','sachets']
  };
  const INDUSTRIES = Object.keys(PRODUCTS);

  function latLonToAngles(lat, lon){
    return {
      phi: THREE.MathUtils.degToRad(90 - lat),
      theta: THREE.MathUtils.degToRad(lon + 180)
    };
  }

  function placeOnGlobe(obj, phi, theta, radius = R){
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    obj.position.set(x, y, z);
  }

  let activeLabel = null, activeMarker = null;

  function spawnLead(){
    if(activeLabel){ globe.remove(activeLabel); activeLabel.material.map.dispose(); }
    if(activeMarker){ globe.remove(activeMarker); }

    const loc = LOCATIONS[Math.floor(Math.random()*LOCATIONS.length)];
    const ind = INDUSTRIES[Math.floor(Math.random()*INDUSTRIES.length)];
    const kw = PRODUCTS[ind][Math.floor(Math.random()*PRODUCTS[ind].length)];
    const n = Math.floor(Math.random()*900) + 50;
    const text = `${n} ${ind} leads in ${loc.name} for ${kw} (30s)`;

    const label = makeTextSprite(text);
    const {phi, theta} = latLonToAngles(loc.lat, loc.lon);
    placeOnGlobe(label, phi, theta, R + 3);
    globe.add(label);

    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 16, 16),
      new THREE.MeshBasicMaterial({ color: PAL.node })
    );
    placeOnGlobe(marker, phi, theta, R);
    globe.add(marker);

    activeLabel = label; activeMarker = marker;
  }

  spawnLead();
  setInterval(spawnLead, 3000);

  // ---------- Resize ----------
  function resize() {
    const w = cvs.clientWidth, h = cvs.clientHeight;
    renderer.setPixelRatio(DPR); renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize(); window.addEventListener('resize', resize);

  // ---------- Motion (slow, calm) ----------
  let t = 0, mx = 0, my = 0;
  cvs.addEventListener('pointermove', (e) => {
    const r = cvs.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width - .5) * 2;
    my = ((e.clientY - r.top) / r.height - .5) * -2;
  });

  (function animate() {
    requestAnimationFrame(animate);
    t += 0.0025; // slow

    // Camera drift + subtle parallax
    camera.position.x = mx * 7 + Math.sin(t * 0.25) * 1.0;
    camera.position.y = my * 5 + Math.sin(t * 0.22) * 0.8;
    camera.lookAt(0, 0, 0);

    // Globe rotation
    globe.rotation.y += 0.0008;
    shell.rotation.y += 0.0003;

    // Packets progressing along their arc lines
    packets.forEach((s) => {
      s.userData.t += s.userData.speed;
      if (s.userData.t > 1) s.userData.t = 0;
      const line = s.userData.line;
      const posAttr = line.geometry.attributes.position;
      const idx = Math.floor(s.userData.t * (posAttr.count - 1));
      const x = posAttr.getX(idx), y = posAttr.getY(idx), z = posAttr.getZ(idx);
      s.position.set(x, y, z);
    });

    // Keep active label facing the camera
    if (activeLabel) {
      activeLabel.lookAt(camera.position);
    }

    renderer.render(scene, camera);
  })();
})();

/* =========================================================
   (The rest of main.js continues below… Money Maker / Saver,
   Workflow, DIY, Contact, bindings, etc.)
   Ask me to Go Ahead to finish the rest.
   ========================================================= */


   /* =========================================================
   main.js — CONTINUED
   Utilities, Data catalog, PanelEngine (Maker/Saver) setup
   (Calm pacing, realistic numbers)
   ========================================================= */

/* ------------ Utilities ------------ */
const rnd   = (min, max) => min + Math.random()*(max-min);
const pick  = (arr) => arr[Math.floor(Math.random()*arr.length)];
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const money = (n) => `$${Math.round(n).toLocaleString()}`;
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]];} return a; }

/* ------------ Domain Data (Packaging) ------------ */
const DATA = {
  industries: [
    "Custom Packaging","Corrugated","Stretch Wraps","Labels & Stickers",
    "Flexible Packaging","Pallet & Crating","Folding Cartons","Industrial Supplies"
  ],
  personas: ["Ops Manager","Purchasing","Founder","Production Lead","Warehouse Lead","Sustainability Dir","Quality Lead"],
  companies: ["NorthPeak","Vanguard","BlueOx","EverPath","StoneRiver","ArrowNorth","CivicLoop","Axiom","GreenRidge","SummitWorks"],
  cities: ["Austin, TX","Denver, CO","Toronto, ON","Seattle, WA","Columbus, OH","Atlanta, GA","Vancouver, BC","Chicago, IL","Reno, NV","Calgary, AB"],
  products: {
    "Custom Packaging":["die‑cut mailers","insert trays","protective foam","retail boxes","mailer kits"],
    "Corrugated":["RSC cartons","litho‑lam","bulk bins","double‑wall","ecom shippers"],
    "Stretch Wraps":["machine film","hand film","eco film","colored wrap","VCI film"],
    "Labels & Stickers":["thermal labels","GHS labels","barcode sets","UL labels","die‑cut rolls"],
    "Flexible Packaging":["stand‑up pouches","rollstock","barrier bags","spout pouches","sachets"],
    "Pallet & Crating":["export crates","ISPM‑15 pallets","skids","custom foam","HT pallets"],
    "Folding Cartons":["gloss cartons","window patch","short‑run","mini cartons","foil cartons"],
    "Industrial Supplies":["mailers","tape","void fill","strapping","edge protectors"]
  }
};

/* =========================================================
   Money Maker / Money Saver — PanelEngine (Canvas 2D)
   - 72s cycle (6 scenes × 12s), calm transitions
   - Realistic SMB packaging numbers (baseline ~12–20 deals/mo)
   - Step-by-step visuals: stepper / typing / globe-2D / routing / gauge / ticker
   Canvas IDs:
     Maker:  #makerCanvas, overlay #makerOverlay, feed #makerFeed
     Saver:  #saverCanvas, overlay #saverOverlay, feed #saverFeed
   ========================================================= */
class PanelEngine{
  constructor(kind, canvasId, overlayId, metrics, feedEl){
    this.kind = kind; // 'maker' | 'saver'
    this.cvs  = document.getElementById(canvasId);
    this.ctx  = this.cvs?.getContext('2d');
    this.overlay = document.getElementById(overlayId);
    this.metrics = metrics;
    this.feed = feedEl;

    this.playing = true;
    this.duration = 72; // seconds
    this.clock = 0;
    this.activeIdx = -1;
    this.scenes = [];
    this.scenesOrder = [];

    this.industry = DATA.industries[0];
    this._bgGrad = null;

    this.DPR = Math.max(1, Math.min(2, window.devicePixelRatio||1));
    this.resize(); window.addEventListener('resize', ()=>this.resize());
  }

  resize(){
    if(!this.cvs) return;
    const r = this.cvs.getBoundingClientRect();
    this.W = Math.max(640, r.width|0);
    this.H = Math.max(360, r.height|0);
    this.cvs.width = this.W * this.DPR; this.cvs.height = this.H * this.DPR;
    this.ctx?.setTransform(this.DPR,0,0,this.DPR,0,0);
    this._bgGrad = null;
  }

  setIndustry(ind){
    this.industry = ind;
    this.prepareScenes();
    this.resetRun();
  }

  // ---------- Scenes factory ----------
  prepareScenes(){
    const P = DATA.products[this.industry] || DATA.products["Custom Packaging"];
    const persona = () => pick(DATA.personas);
    const company = () => pick(DATA.companies);
    const city = ()    => pick(DATA.cities);
    const qty = ()     => (Math.round(rnd(2,10))*1000);
    const lead = ()    => pick(["Jane","Ken","Priya","Luis","Marta","Ava","George","Nina","Marco","Iris","Sam","Leo","Maya","Liam","Sara","Noah","Omar","Hana"]);

    if(this.kind === 'maker'){
      this.scenes = [
        // 1) Signal → Score → Urgency
        (t)=> this.scene_stepper({
          title: "Public RFP detected",
          steps: [
            ["Source",       `${city()} • portal`],
            ["Need",         `${pick(P)} • qty ${qty()}`],
            ["Persona",      `${persona()} @ ${company()}`],
            ["Scoring",      `Intent 0.${(rnd(74,92)|0)}, Fit 0.${(rnd(68,90)|0)}`],
            ["Urgency",      pick(["rush (5 days)","standard (14 days)"])]
          ],
          onKPI: ()=>{ this.bump(this.metrics.leads,'mkLeads', (rnd(1,3)|0)); this.emit("RFP found — tagged high‑intent","ok"); }
        }, t),

        // 2) Competitor churn → Tailored offer
        (t)=> this.scene_typing({
          title: "Competitor churn marker",
          lines: [
            `Review: "late delivery" • −0.${(rnd(32,66)|0)}`,
            `Offer: ${pick(["SLA + QC","45‑day credit","eco film swap","faster line"])}`,
            `Persona: ${persona()} @ ${company()}`
          ],
          onKPI: ()=>{ this.bump(this.metrics.replies,'mkReplies'); this.emit("Counter‑offer queued","ok"); }
        }, t),

        // 3) Trade show list → ICP warm
        (t)=> this.scene_map({
          headline:"Trade show parsed",
          sub:`Contacts ${(rnd(120,220)|0)} • ICP ${(rnd(30,50)|0)} • Warmed ${(rnd(12,22)|0)}`,
          pins: 12,
          onKPI: ()=>{ this.bump(this.metrics.leads,'mkLeads', (rnd(8,14)|0)); }
        }, t),

        // 4) Personalized outreach
        (t)=> this.scene_outreach({
          greet:`Hi ${lead()}, spike in ${pick(P)} at ${company()}.`,
          body:`We can ship ${qty()} by ${pick(["Fri","Mon","Wed"])} with QA screenshots.`,
          cta: `Want a ${pick(["2‑min sample","quick quote","counter‑sample"])}?`,
          onKPI: ()=>{ this.bump(this.metrics.quotes,'mkQuotes'); }
        }, t),

        // 5) Routing
        (t)=> this.scene_routing({
          headline:"Hot reply",
          lanes:["AI handles","Closer","12‑wk nurture"],
          chosen: pick([0,1,1,0,2]),
          onKPI: ()=>{ this.bump(this.metrics.replies,'mkReplies'); }
        }, t),

        // 6) Deal closed
        (t)=> this.scene_deal({
          item: pick(P),
          amount: Math.round(rnd(1800, 7500)),
          onKPI: ()=>{ const inc = rnd(1800, 7500); this.bumpMoney(this.metrics.revenue,'mkRev', inc); this.bump(this.metrics.deals,'mkDeals'); this.emit(`PO: ${money(inc)} — ${this.industry}`,"ok"); }
        }, t)
      ];
    } else {
      // SAVER
      this.scenes = [
        // 1) Churn gauge
        (t)=> this.scene_gauge({
          title:"Churn model",
          lines:[
            `Acct: ${company()} • ${city()}`,
            `Engagement ↓ ${(rnd(12,28)|0)}% • tickets ${(rnd(0,2)|0)}`,
            `Action: insights + reorder nudge`
          ],
          onKPI: ()=>{ this.bump(this.metrics.tickets,'svTickets'); this.setText('svChurn', `${(rnd(6,12)|0)}%`); this.emit("Churn risk mitigated","ok"); }
        }, t),

        // 2) Supplier pricing deltas
        (t)=> this.scene_ticker({
          title:"Supplier changes",
          items:[
            `Film A − ${(rnd(1.6,3.6)).toFixed(1)}%`,
            `Linerboard − ${(rnd(0.6,1.6)).toFixed(1)}%`,
            `Ink set − ${(rnd(0.3,0.9)).toFixed(1)}%`
          ],
          onKPI: ()=>{ const sv=rnd(400,1600); this.bumpMoney(this.metrics.cogs,'svCOGS', sv); this.emit(`COGS saved ${money(sv)}`,"ok"); }
        }, t),

        // 3) Stock optimization
        (t)=> this.scene_stepper({
          title:"Stock optimization",
          steps:[
            ["Forecast", `${pick(P)} reorder wk ${(rnd(2,4)|0)}`],
            ["Waste", `avoid ${money(rnd(600,2200))}`],
            ["Backorder", `risk ↓ ${(rnd(8,20)|0)}%`]
          ],
          onKPI: ()=>{ const sv=rnd(600,2200); this.bumpMoney(this.metrics.cogs,'svCOGS', sv); }
        }, t),

        // 4) License cleanup
        (t)=> this.scene_typing({
          title:"Unused licenses canceled",
          lines:[
            `${(rnd(2,5)|0)} inactive users • 90d`,
            `Vendors: Tracky, SchedX, CallHub`,
            `Savings: ${money(rnd(300,1200))}/yr`
          ],
          onKPI: ()=>{ const sv=rnd(300,1200); this.bumpMoney(this.metrics.labor,'svLabor', sv); this.emit(`License cleanup — ${money(sv)}/yr`,"ok"); }
        }, t),

        // 5) Route optimization
        (t)=> this.scene_map({
          headline:"Route optimization",
          sub:`Stops ${(rnd(4,7)|0)} • Time ↓ ${(rnd(7,14)|0)}% • Fuel ↓ ${(rnd(4,10)|0)}%`,
          pins: 8,
          onKPI: ()=>{ this.bump(this.metrics.retained,'svRetained', (rnd(0,2)|0)); }
        }, t),

        // 6) Support deflection
        (t)=> this.scene_routing({
          headline:"Support deflection",
          lanes:["AI self‑serve","Agent"],
          chosen:0,
          onKPI: ()=>{ const sv=rnd(180,560); this.bumpMoney(this.metrics.labor,'svLabor', sv); this.emit(`Ticket deflected — saved ${money(sv)}`,"ok"); }
        }, t)
      ];
    }
  }

  resetRun(){
    this.activeIdx = -1;
    this.clock = 0;
    this.scenesOrder = shuffle([...Array(this.scenes.length).keys()]);
    this.overlay?.replaceChildren();
  }

  play(v=true){ this.playing = v; }

  /* ---------- UI helpers ---------- */
  emit(msg, cls='ok'){
    if(!this.feed) return;
    const div = document.createElement('div'); div.className='event';
    const time = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    div.innerHTML = `<span class="t">${time}</span><span class="msg ${cls}">${msg}</span>`;
    this.feed.prepend(div);
    while(this.feed.childElementCount>24){ this.feed.lastElementChild.remove(); }
  }
  bump(store, id, step=1){ store.val += step; const el = document.getElementById(id); if(el) el.textContent = store.val.toLocaleString(); }
  bumpMoney(store, id, amount){ store.val += amount; const el = document.getElementById(id); if(el) el.textContent = money(store.val); }
  setText(id, txt){ const el=document.getElementById(id); if(el) el.textContent = txt; }

  /* ---------- 2D draw helpers ---------- */
  bg(){
    if(!this._bgGrad){
      const g = this.ctx.createRadialGradient(this.W*.5,this.H*.5,0,this.W*.5,this.H*.5,Math.max(this.W,this.H));
      g.addColorStop(0,'rgba(255,255,255,.015)'); g.addColorStop(1,'rgba(0,0,0,.5)');
      this._bgGrad = g;
    }
    this.ctx.fillStyle = this._bgGrad; this.ctx.fillRect(0,0,this.W,this.H);
  }
  panel(x,y,w,h){
    this.ctx.fillStyle = 'rgba(0,0,0,.35)'; this.roundRect(x,y,w,h,12); this.ctx.fill();
    this.ctx.strokeStyle = 'rgba(255,255,255,.10)'; this.ctx.stroke();
  }
  roundRect(x,y,w,h,r){ const c=this.ctx; c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
  text(x,y,txt,size=14,bold=false, color='#fff'){ this.ctx.fillStyle=color; this.ctx.font=`${bold?'800':'600'} ${size}px ${bold?'Montserrat, Inter':'Inter'}, sans-serif`; this.ctx.fillText(txt,x,y); }
  line(a,b, color='rgba(255,255,255,.20)'){ this.ctx.beginPath(); this.ctx.moveTo(a[0],a[1]); this.ctx.lineTo(b[0],b[1]); this.ctx.strokeStyle=color; this.ctx.stroke(); }
  dot(x,y,r,c){ this.ctx.beginPath(); this.ctx.arc(x,y,r,0,Math.PI*2); this.ctx.fillStyle=c; this.ctx.fill(); }
  circle(x,y,r,st='rgba(255,255,255,.16)'){ this.ctx.beginPath(); this.ctx.arc(x,y,r,0,Math.PI*2); this.ctx.strokeStyle=st; this.ctx.stroke(); }
  arc(x,y,r,a0,a1,st){ this.ctx.beginPath(); this.ctx.arc(x,y,r,a0,a1); this.ctx.strokeStyle=st; this.ctx.stroke(); }
  badge(x,y,txt,glow=false){
    this.ctx.save(); this.ctx.translate(x,y);
    this.ctx.fillStyle = glow? 'rgba(159,255,191,.12)' : 'rgba(255,255,255,.05)';
    this.roundRect(-6,-6,110,28,12); this.ctx.fill();
    this.ctx.strokeStyle='rgba(255,255,255,.14)'; this.ctx.stroke();
    this.text(10,14, txt, 12,false);
    this.ctx.restore();
  }
  progress(x,y,w,h,p, colA='#8bf8ff', colB='#ff4dd2'){
    const pad=8; const ww = w- pad*2; const hh = h- pad*2;
    this.ctx.fillStyle='rgba(255,255,255,.05)'; this.roundRect(x,y,w,h,10); this.ctx.fill();
    const grad=this.ctx.createLinearGradient(x+pad,y,x+pad+ww,y);
    grad.addColorStop(0,colA); grad.addColorStop(1,colB);
    this.ctx.fillStyle = grad; this.roundRect(x+pad,y+pad, ww*clamp(p,0,1), hh, 8); this.ctx.fill();
  }

  /* ---------- Scene types (calm) ---------- */
  scene_stepper(opts, t){
    const p = clamp(t/10, 0, 1);
    this.ctx.clearRect(0,0,this.W,this.H); this.bg();
    const w=this.W*.70, h=this.H*.50, x=this.W*.15, y=this.H*.20;
    this.panel(x,y,w,h);
    this.text(x+16,y+32, opts.title, 18,true);
    const steps = opts.steps || [];
    const vis = Math.floor(steps.length * p) + 1;
    for(let i=0;i<Math.min(steps.length,vis);i++){
      const [k,v] = steps[i];
      this.text(x+20, y+62 + i*28, `• ${k}: ${v}`, 14, false);
    }
    this.progress(x+20, y+h-48, w-40, 18, p, '#9fffbf', '#66e6ff');
    if(opts.onKPI && (p>0.95)) opts.onKPI();
  }

  scene_typing(opts, t){
    const x=this.W*.12, y=this.H*.20, w=this.W*.76, h=this.H*.50;
    this.ctx.clearRect(0,0,this.W,this.H); this.bg();
    this.panel(x,y,w,h); this.text(x+16,y+30, opts.title, 18,true);
    const lines = opts.lines||[]; const speed=22;
    for(let i=0;i<lines.length;i++){
      const full = lines[i];
      const vis = Math.min(full.length, Math.floor((t*speed - i*speed*0.9)));
      const str = full.slice(0, Math.max(0, vis));
      this.text(x+16, y+64+i*32, str + (i===((t*1)|0)%lines.length ? '▍':''), 16,false);
    }
    if(opts.onKPI && t>9.2) opts.onKPI();
  }

  scene_map(opts, t){
    const p = clamp(t/10,0,1);
    const cx=this.W*.64, cy=this.H*.52, r=this.H*.22;
    this.ctx.clearRect(0,0,this.W,this.H); this.bg();
    for(let i=0;i<7;i++){ this.circle(cx,cy,r*(.25+i*.085)); }
    for(let i=0;i<12;i++){
      const a = i*Math.PI/12 + t*.25; this.arc(cx,cy,r, a, a+Math.PI, 'rgba(255,255,255,.10)');
    }
    const n = opts.pins || 8;
    for(let i=0;i<n;i++){
      const a = i*0.65 + t*0.5, rr = r*(.4+.45*Math.sin(a*2));
      const x = cx + Math.cos(a)*rr, y = cy + Math.sin(a*.9)*rr*.6;
      this.dot(x,y, i%3?2:3, i%3? '#fff':'#9fffbf');
    }
    const x=this.W*.10, y=this.H*.22, w=this.W*.38, h=this.H*.40; this.panel(x,y,w,h);
    this.text(x+14,y+30, opts.headline, 18,true);
    this.text(x+14,y+58, opts.sub, 14);
    this.progress(x+14,y+h-44, w-28, 18, p, '#9fffbf', '#ff4dd2');
    if(opts.onKPI && p>0.95) opts.onKPI();
  }

  scene_outreach(opts, t){
    const x=this.W*.12, y=this.H*.20, w=this.W*.76, h=this.H*.50;
    this.ctx.clearRect(0,0,this.W,this.H); this.bg();
    this.panel(x,y,w,h);
    this.text(x+16,y+30, "Personalized outreach", 18,true);
    const L = [opts.greet, opts.body, opts.cta];
    const speed=22;
    for(let i=0;i<L.length;i++){
      const full = L[i]; const vis = Math.min(full.length, Math.floor((t*speed - i*speed*0.75)));
      const str = full.slice(0, Math.max(0, vis));
      this.text(x+16, y+64+i*34, str + (i===((t*0.9)|0)%L.length ? '▍':''), 16,false);
    }
    if(opts.onKPI && t>9.5) opts.onKPI();
  }

  scene_routing(opts, t){
    const p=clamp(t/10,0,1);
    const lanes = opts.lanes||[];
    this.ctx.clearRect(0,0,this.W,this.H); this.bg();
    this.panel(this.W*.10, this.H*.12, this.W*.34, this.H*.18);
    this.text(this.W*.12, this.H*.16, opts.headline, 18,true);
    this.text(this.W*.12, this.H*.20, 'Routing:', 14);
    lanes.forEach((name,i)=> this.badge(this.W*.12 + i*110, this.H*.22, name, i===opts.chosen));

    this.ctx.strokeStyle='rgba(255,255,255,.20)';
    const startX=this.W*.22, startY=this.H*.36;
    for(let i=0;i<lanes.length;i++){
      const end = [this.W*.72, this.H*.28 + i*60];
      const mid1 = [startX+50, startY+18], mid2 = [this.W*.54, this.H*.28 + i*60];
      this.ctx.beginPath(); this.ctx.moveTo(startX,startY);
      this.ctx.bezierCurveTo(mid1[0],mid1[1], mid2[0],mid2[1], end[0],end[1]); this.ctx.stroke();
      this.dot(end[0], end[1], 5, i===opts.chosen ? '#9fffbf':'#fff');
    }

    this.progress(this.W*.12, this.H*.66, this.W*.76, 18, p);
    if(opts.onKPI && p>0.95) opts.onKPI();
  }

  scene_deal(opts, t){
    const p=clamp(t/10,0,1);
    const x=this.W*.22, y=this.H*.22, w=this.W*.56, h=this.H*.44;
    this.ctx.clearRect(0,0,this.W,this.H); this.bg();
    this.panel(x,y,w,h);
    this.text(x+18,y+34,'Deal closed',22,true);
    this.text(x+18,y+72,`Item: ${opts.item}`, 16);
    this.text(x+18,y+104,`PO: ${money(opts.amount)}`, 26,true);
    this.progress(x+18, y+h-44, w-36, 18, p);
    if(opts.onKPI && p>0.95) opts.onKPI();
  }

  scene_gauge(opts, t){
    const p=clamp(t/10,0,1);
    const cx=this.W*.64, cy=this.H*.54, r=this.H*.22;
    this.ctx.clearRect(0,0,this.W,this.H); this.bg();

    this.ctx.lineWidth=12; this.arc(cx,cy,r, Math.PI*.8, Math.PI*2.2, 'rgba(255,255,255,.12)');
    const prog = Math.PI*.8 + (Math.PI*1.4)* (0.35+0.4*Math.abs(Math.sin(t*.5)));
    this.arc(cx,cy,r, Math.PI*.8, prog, '#9fffbf');
    this.dot(cx + Math.cos(prog)*r, cy + Math.sin(prog)*r, 5,'#9fffbf');

    const x=this.W*.10, y=this.H*.22, w=this.W*.38, h=this.H*.38;
    this.panel(x,y,w,h);
    this.text(x+14,y+30, opts.title, 18,true);
    (opts.lines||[]).forEach((s,i)=> this.text(x+14, y+60+i*24, `• ${s}`, 14));
    this.progress(this.W*.12, this.H*.66, this.W*.76, 18, p);
    if(opts.onKPI && p>0.95) opts.onKPI();
  }

  scene_ticker(opts, t){
    const p=clamp(t/10,0,1);
    const x=this.W*.12, y=this.H*.24, w=this.W*.76, h=this.H*.36;
    this.ctx.clearRect(0,0,this.W,this.H); this.bg();
    this.panel(x,y,w,h);
    this.text(x+16,y+28, opts.title, 18,true);
    const items = opts.items||[];
    for(let i=0;i<items.length;i++){
      const y0 = y+56 + i*26;
      this.text(x+20, y0, items[i], 15);
    }
    this.progress(x+16, y+h-40, w-32, 18, p);
    if(opts.onKPI && p>0.95) opts.onKPI();
  }

  /* ---------- Engine loop ---------- */
  start(){
    if(!this.cvs || !this.ctx) return;
    const loop = (now)=>{
      if(!this._start) this._start = now;
      const dt = (now - this._start)/1000; this._start = now;
      if(this.playing){
        this.clock += dt;
        const perScene = this.duration / this.scenes.length;
        const seg = Math.floor((this.clock % this.duration) / perScene);
        if(seg !== this.activeIdx){
          this.activeIdx = seg;
          // overlay pulse
          this.overlay?.replaceChildren();
          const c = document.createElement('div'); c.className='card';
          c.innerHTML = `<h4>${this.kind==='maker'?'Money Maker':'Money Saver'} · Scene ${seg+1}</h4><p>Calm narrative view.</p>`;
          this.overlay?.appendChild(c);
          setTimeout(()=> c.remove(), 1400);
        }
        const localT = (this.clock % perScene) / perScene * 10;
        const idx = this.scenesOrder[this.activeIdx];
        this.scenes[idx](localT);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

/* ------------ Instantiate engines ------------ */
const maker = new PanelEngine('maker','makerCanvas','makerOverlay', {
  leads:{val:0}, replies:{val:0}, quotes:{val:0}, deals:{val:0}, revenue:{val:0}
}, document.getElementById('makerFeed'));

const saver = new PanelEngine('saver','saverCanvas','saverOverlay', {
  tickets:{val:0}, churn:{val:0}, labor:{val:0}, cogs:{val:0}, retained:{val:0}
}, document.getElementById('saverFeed'));

/* ------------ Industry selection ------------ */
const industrySel = document.getElementById('industrySel');
const defaultIndustry = industrySel?.value || DATA.industries[0];
function setIndustryAll(ind){ maker.setIndustry(ind); saver.setIndustry(ind); }
industrySel?.addEventListener('change', e=> setIndustryAll(e.target.value));
setIndustryAll(defaultIndustry);

/* ------------ Controls: play/pause, next, timeline ------------ */
const playBtn = document.getElementById('playPause');
const nextBtn = document.getElementById('nextScene');
const tbar    = document.getElementById('timelineBar')?.querySelector('span');

let __playing = true;
function setPlaying(p){
  __playing = p; maker.play(p); saver.play(p);
  if(playBtn){ playBtn.textContent = p ? 'Pause' : 'Play'; playBtn.setAttribute('aria-pressed', (!p).toString()); }
}
playBtn?.addEventListener('click', ()=> setPlaying(!__playing));

nextBtn?.addEventListener('click', ()=>{
  const jump = maker.duration / maker.scenes.length + 0.05;
  maker.clock += jump; saver.clock += jump;
  _timelineStart = performance.now() - (maker.clock % maker.duration) * 1000;
});

let _timelineStart = performance.now();
let _lastNow;
(function tickTimeline(now){
  const cycle = 72000; // match engine duration
  if(!__playing && _lastNow) _timelineStart += (now - _lastNow);
  const p = ((now - _timelineStart) % cycle) / cycle;
  if(tbar) tbar.style.width = `${(100 * p).toFixed(2)}%`;
  _lastNow = now; requestAnimationFrame(tickTimeline);
})(performance.now());

/* ------------ Start engines ------------ */
maker.prepareScenes(); maker.resetRun(); maker.start();
saver.prepareScenes(); saver.resetRun(); saver.start();

/* =========================================================
   (Next: Interactive Workflow, DIY Kit generator, Contact,
   metric element bindings.)
   Ask me to Go Ahead to finish the rest.
   ========================================================= */
/* =========================================================
   main.js — CONTINUED (Part 3)
   Interactive Workflow • DIY Kit generator • Contact • Bindings
   ========================================================= */

/* ------------ Interactive Workflow (copy + wiring) ------------ */
const FLOW_COPY = {
  signals: {
    h: "Signals",
    bullets: [
      "Public RFPs / bids (Yelp, directories, portals)",
      "Review sentiment & competitor churn markers",
      "Tech installs (Wappalyzer, script tags)",
      "Hiring & job changes (decision‑maker moves)",
      "Search spikes & geo intent (week over week)",
      "Social posts, comments, DMs, and mentions"
    ]
  },
  scoring: {
    h: "Scoring",
    bullets: [
      "Intent: searches, tech stack, customer count, tools, size",
      "Weight: posting behavior, offers, business nature, frequency",
      "Character: past reviews, jump count, value language",
      "Platform: activity, comments, likelihood to respond"
    ]
  },
  outreach: {
    h: "Outreach",
    bullets: [
      "Channel fit auto‑selected (email/DM/SMS/call)",
      "Personalized copy → CTA (quote, sample, audit)",
      "Lead magnet created on the fly (calculator/tracker)",
      "Jump tracking (Hyros‑style) to assess heat"
    ]
  },
  routing: {
    h: "Routing",
    bullets: [
      "AI replies for tier‑1 questions",
      "Hot → closer with closing suggestions",
      "Not‑now → 12‑week value sequence",
      "Quotes from structured needs"
    ]
  },
  closing: {
    h: "Closing",
    bullets: [
      "AI summarizes objections & winning angles",
      "Call analysis → pattern learning",
      "Updated prompts for next interactions",
      "Signed PO → revenue booked"
    ]
  },
  retention: {
    h: "Retention",
    bullets: [
      "NPS + feedback loops → feature tweaks",
      "Predictive reorder & route optimization",
      "Referral/review nudges at the right moment",
      "Churn model retrains on each outcome"
    ]
  }
};

(function workflowInit(){
  const detail = document.getElementById('flowDetail');
  const bullets = document.getElementById('flowBullets');
  if(!detail || !bullets) return;

  function render(key){
    const d = FLOW_COPY[key]; if(!d) return;
    detail.querySelector('h3').textContent = d.h;
    bullets.replaceChildren();
    d.bullets.forEach(t=>{
      const li = document.createElement('li');
      li.textContent = t; bullets.appendChild(li);
    });
  }

  document.querySelectorAll('.flow-step')?.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.flow-step').forEach(x=>x.classList.remove('active'));
      btn.classList.add('active');
      render(btn.dataset.k);
    });
  });

  // default
  document.querySelector('.flow-step[data-k="signals"]')?.click();
})();

/* ------------ DIY Kit generator (JSZip, fully client‑side) ------------ */
(function diy(){
  const form = document.getElementById('kitForm'); if(!form) return;
  const note = document.getElementById('kitNote');

  function now(){ return new Date().toISOString().slice(0,10); }

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    if(note) note.hidden = false;

    const industry = document.getElementById('kitIndustry')?.value || DATA.industries[0];
    const feats = [...form.querySelectorAll('input[type="checkbox"]:checked')].map(x=>x.value);

    const zip = new JSZip();

    zip.file('README.md',
`# ${industry} — DIY Kit
Generated ${now()}

This kit includes prompts, basic scoring schema, and outreach templates you can run locally
or plug into your stack (no server required).

Selected features: ${feats.join(', ') || 'none'}
`);

    // Prompts
    zip.file('prompts/manager.txt',
`Role: Manager AI for ${industry}.
Owns orchestration across acquisition and retention. Reweights KPIs weekly, monitors churn,
and learns from calls/transcripts to improve close rate and LTV.`);

    zip.file('prompts/acquisition.txt',
`Role: Acquisition AI for ${industry}.
Discover real‑time buyers from public signals; score by Intent/Weight/Character/Platform; generate
channel‑fit outreach with CTA to quote/sample/audit.`);

    zip.file('prompts/retention.txt',
`Role: Retention AI for ${industry}.
Predict churn, schedule follow‑ups, NPS, review/referral prompts, and reorder recommendations.
Escalate risky accounts to CSM/Closer with suggested talking points.`);

    // Workflows
    zip.file('workflows/scoring.json', JSON.stringify({
      industry,
      version: 1,
      weights: { intent: 0.35, weight: 0.25, character: 0.20, platform: 0.20 },
      intent: ["searchesPerWeek","warehouseSignals","ltvToCAC","toolsInteracted","companySize"],
      weight: ["postingBehavior","acceptsMagnets","purchaseFrequency","bizNature"],
      character: ["reviewScore","jumpCount","valueLanguage","cultureLanguage"],
      platform: ["postCount","commentCount","replyIntent"]
    }, null, 2));

    zip.file('workflows/outreach.json', JSON.stringify({
      steps: ["choose_best_channel","generate_personalized_copy","send","listen_for_reply","route_hot_to_closer"],
      channels: ["email","linkedin","sms","call"]
    }, null, 2));

    zip.file('workflows/retention.json', JSON.stringify({
      cadence: "12-week",
      weeks: { "1":"case studies","2-5":"industry insights","5-9":"pain points avoided","9-12":"referral push" }
    }, null, 2));

    // Templates
    zip.file('outreach/email.md',
`Subject: Quick idea for ${industry}

Hi {{firstName}},

Noticed {{signal}} at {{company}}. We help ${industry.toLowerCase()} teams capture ready‑to‑buy demand and close it automatically.
Want a {{cta}}?

— {{sender}}`);

    zip.file('outreach/dm.md',
`Hey {{firstName}} — saw {{signal}}. We build private AI for ${industry.toLowerCase()} that finds and warms buyers, then routes hot replies to you.
Want a quick sample for {{company}}?`);

    // Build & download
    const blob = await zip.generateAsync({type:'blob'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${industry.replace(/\s+/g,'-').toLowerCase()}-galactly-kit.zip`;
    a.click();
    URL.revokeObjectURL(a.href);
    if(note) note.hidden = true;
  });
})();

/* ------------ Privacy‑friendly Contact (local .md export) ------------ */
(function contact(){
  const form = document.getElementById('contactForm'); if(!form) return;
  const note = document.getElementById('contactNote');

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const payload = JSON.stringify({ ...data, ts: new Date().toISOString() }, null, 2);
    const md =
`# Galactly — Intake Request

\`\`\`json
${payload}
\`\`\`

> Save this file and email it to hello@galactly.com (or attach in your ticket).
`;
    const blob = new Blob([md], {type:'text/markdown'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `galactly-intake-${(new Date()).toISOString().slice(0,10)}.md`;
    a.click(); URL.revokeObjectURL(a.href);
    if(note){ note.textContent = 'Saved locally as a .md file — please send it to us.'; }
    form.reset();
  });
})();

/* ------------ Metric element bindings (DOM mirrors) ------------ */
// Maker
maker.metrics.leads.el    = document.getElementById('mkLeads');
maker.metrics.replies.el  = document.getElementById('mkReplies');
maker.metrics.quotes.el   = document.getElementById('mkQuotes');
maker.metrics.deals.el    = document.getElementById('mkDeals');
maker.metrics.revenue.el  = document.getElementById('mkRev');
// Saver
saver.metrics.tickets.el  = document.getElementById('svTickets');
saver.metrics.labor.el    = document.getElementById('svLabor');
saver.metrics.cogs.el     = document.getElementById('svCOGS');
saver.metrics.retained.el = document.getElementById('svRetained');
saver.metrics.churnEl     = document.getElementById('svChurn');

/* ------------ Timeline controls (already wired earlier) ------------ */
// (No change: play/pause/next + animated bar are active)

/* =========================================================
   END OF main.js
   ========================================================= */
