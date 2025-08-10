/* Money Maker / Money Saver — Story Engine (Hero-integrated)
 * - Categories: maker (revenue gen), saver (retention/margin)
 * - Scenarios (maker): inbound, outbound
 * - Scenarios (saver): retention, upsell
 * - Autoplay timeline + animated seek; loop; user control persists
 * - Detailed, believable steps + live ticker feed
 */
(function(){
  const canvas = document.getElementById('mmCanvas'); if(!canvas) return;
  const overlay = document.getElementById('mmOverlay');
  const seek = document.getElementById('mmSeek');
  const playBtn = document.getElementById('mmPlay');
  const pauseBtn = document.getElementById('mmPause');
  const restartBtn = document.getElementById('mmRestart');
  const tabs = document.querySelectorAll('.tab');
  const cats = document.querySelectorAll('.cat');
  const diyBtn = document.getElementById('mmDIY');
  const selIndustry = document.getElementById('mmIndustry');

  const ctx = canvas.getContext('2d');
  let W = canvas.clientWidth, H = canvas.clientHeight, DPR = Math.min(2, window.devicePixelRatio||1);
  function resize(){ W = canvas.clientWidth; H = canvas.clientHeight; canvas.width = W*DPR; canvas.height = H*DPR; ctx.setTransform(DPR,0,0,DPR,0,0); }
  resize(); addEventListener('resize', resize);

  // palette
  const P = {
    bg: '#0f0f19', panel: 'rgba(0,0,0,.52)', stroke: 'rgba(255,255,255,.16)',
    text: 'rgba(255,255,255,.88)', muted: 'rgba(200,205,215,.78)',
    ai: '#ff4dd2', human: '#41d1b5', signal: '#ffd166', success: '#9fffbf', risk:'#ff8766'
  };
  function rr(x,y,w,h,r=14){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function panel(x,y,w,h,a=.52){ ctx.save(); ctx.fillStyle=`rgba(0,0,0,${a})`; rr(x,y,w,h,14); ctx.fill(); ctx.strokeStyle=P.stroke; ctx.stroke(); ctx.restore(); }
  function label(x,y,t,muted=false,fs=14){ ctx.fillStyle = muted? P.muted : P.text; ctx.font = `700 ${fs}px Inter, system-ui`; ctx.fillText(t,x,y); }
  function grad(x,w){ const g=ctx.createLinearGradient(x,0,x+w,0); g.addColorStop(0,'#ff0033'); g.addColorStop(1,'#ff4dd2'); return g; }
  function h2(x,y,t){ ctx.fillStyle = grad(x,260); ctx.font = `800 18px Montserrat, Inter`; ctx.fillText(t,x,y); }

  // categories & scenarios
  let category = 'maker';
  let scenario = 'inbound';
  document.body.classList.toggle('saver-mode', category==='saver');

  cats.forEach(c=>c.addEventListener('click', ()=>{
    cats.forEach(k=>k.classList.remove('active')); c.classList.add('active');
    category = c.dataset.cat;
    document.body.classList.toggle('saver-mode', category==='saver');
    scenario = category==='maker' ? 'inbound' : 'retention';
    tabs.forEach(t=> t.classList.toggle('active', t.dataset.scn===scenario));
    buildTimeline(); tl.seek(0).play();
  }));

  tabs.forEach(b=> b.addEventListener('click', ()=>{
    tabs.forEach(t=>t.classList.remove('active')); b.classList.add('active');
    scenario = b.dataset.scn;
    buildTimeline(); tl.seek(0).play();
  }));

  // industry heuristics
  const nouns = {
    'Custom Packaging': ['mailer boxes','insert trays','protective foam','die-cuts'],
    'Pallet & Crating': ['ISPM‑15 crates','HT pallets','export crates'],
    'Labels & Stickers': ['GHS labels','thermal rolls','die-cut runs'],
    'Flexible Packaging': ['stand‑up pouches','film rolls','barrier bags'],
    'Folding Cartons': ['window patch','short‑run cartons','gloss cartons']
  };
  const sources = ['Yelp RFP','LinkedIn Post','G2 Review','Reddit Thread','Google Maps Q&A','Industry Directory'];
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)] }
  function leadNeed(ind){ return (nouns[ind]||nouns['Custom Packaging']); }

  // panels
  const camera = { x: 0 };
  const panels = [
    { key:'scan',     x: 0,    w: 1200, title:'Discover' },
    { key:'craft',    x: 1200, w: 1200, title:'Compose' },
    { key:'route',    x: 2400, w: 1200, title:'Route' },
    { key:'win',      x: 3600, w: 1200, title:'Win' }
  ];

  // ticker feed
  function pushTicker(txt, ok=true){
    const div = document.createElement('div');
    div.className = 'tick ev'+(ok?' ok':'');
    div.textContent = txt;
    overlay.appendChild(div);
    const max = 6;
    const nodes = [...overlay.querySelectorAll('.tick')];
    nodes.forEach((n,i)=> n.style.transform = `translateY(${-((nodes.length-1-i)*24)}px)`);
    if(nodes.length>max){ nodes[0].remove(); }
  }

  // primitives
  function icon(type, x, y, hot=false){
    ctx.save(); ctx.translate(x,y);
    if(type==='email'){ ctx.strokeStyle = hot? P.ai : 'rgba(255,255,255,.85)'; ctx.lineWidth = 2; rr(-20,-14,40,28,8); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-18,-6); ctx.lineTo(0,6); ctx.lineTo(18,-6); ctx.stroke(); }
    if(type==='li'){ ctx.fillStyle = hot? P.ai : 'rgba(255,255,255,.85)'; ctx.fillRect(-18,-18,36,36); ctx.fillStyle = '#111'; ctx.font='900 18px Inter'; ctx.fillText('in', -10, 7); }
    if(type==='sms'){ ctx.strokeStyle = hot? P.ai : 'rgba(255,255,255,.85)'; ctx.lineWidth=2; rr(-20,-12,40,24,8); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-4,12); ctx.lineTo(4,4); ctx.stroke(); }
    if(type==='human'){ ctx.strokeStyle = P.human; ctx.beginPath(); ctx.arc(0,-4,10,0,Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0,6); ctx.lineTo(0,20); ctx.moveTo(0,10); ctx.lineTo(-10,16); ctx.moveTo(0,10); ctx.lineTo(10,16); ctx.stroke(); }
    if(type==='nps'){ ctx.strokeStyle = P.success; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(-14,0); ctx.lineTo(-4,10); ctx.lineTo(14,-10); ctx.stroke(); }
    ctx.restore();
  }

  // backgrounds
  function drawBackground(){
    ctx.fillStyle = P.bg; ctx.fillRect(0,0,W,H);
    for(let i=0;i<80;i++){
      const x = ((camera.x * 0.25) + (i*180)) % (W+360) - 180;
      const y = (i*37) % H;
      ctx.globalAlpha = 0.1; ctx.beginPath(); ctx.arc(x,y,1.6,0,Math.PI*2); ctx.fillStyle = '#fff'; ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // maker: inbound globe panel
  function drawGlobeScan(x0, top, w, h, ind){
    panel(x0, top, w, h, .45); h2(x0+16, top+34, 'Finds buyers (real sources)');
    const cx = x0 + w*0.36, cy = top + h*0.5, r = Math.min(140, h*0.36);
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
    ctx.globalAlpha=.25;
    for(let i=-60;i<=60;i+=30){ ctx.beginPath(); ctx.arc(cx,cy,r*Math.cos(i*Math.PI/180),0,Math.PI*2); ctx.stroke(); }
    for(let i=0;i<6;i++){ const a=i*Math.PI/5; ctx.beginPath(); ctx.ellipse(cx,cy,r, r*0.55, a,0,Math.PI*2); ctx.stroke(); }
    ctx.globalAlpha=1;

    const t = (gsap.getProperty(tl,'time')||0);
    for(let i=0;i<10;i++){
      const a = (t*0.7 + i*0.37) % (Math.PI*2);
      const px = cx + Math.cos(a)*r*0.86;
      const py = cy + Math.sin(a)*r*0.6;
      ctx.beginPath(); ctx.arc(px,py,3,0,Math.PI*2);
      ctx.fillStyle = P.signal; ctx.globalAlpha=.85; ctx.fill(); ctx.globalAlpha=1;
    }

    const need = pick(leadNeed(ind));
    const src = pick(sources);
    panel(x0 + w*0.58, top+22, w*0.36, 128, .55);
    h2(x0 + w*0.60, top+52, 'Lead #234');
    label(x0 + w*0.60, top+78, `${src}: needs ${need}`);
    label(x0 + w*0.60, top+100, 'Urgency: needs this week • Region: NA', true, 13);

    const score = 88 + Math.round( (Math.sin(t*1.1)+1)*6 );
    panel(x0 + w*0.58, top+158, w*0.36, 70, .52);
    h2(x0 + w*0.60, top+188, 'Score  /100');
    ctx.fillStyle = P.success; ctx.fillRect(x0 + w*0.60, top+198, (w*0.32)*(score/100), 8);
    label(x0 + w*0.60 + (w*0.32) + 10, top+204, `${score}`, false, 14);

    if(!drawGlobeScan.didInit){ pushTicker(`Found Lead #234 via ${src} — ${need}`); drawGlobeScan.didInit = true; }
  }

  function drawScanEmail(x0, top, w, h){
    panel(x0, top, w, h, .45); h2(x0+16, top+34, 'Signals & fit scoring');
    const t = (gsap.getProperty(tl,'time')||0);
    const sx = x0 + 24 + (w-48) * ((t*0.25)%1);
    ctx.strokeStyle = P.ai; ctx.globalAlpha = 0.65; ctx.beginPath(); ctx.moveTo(sx, top+6); ctx.lineTo(sx, top+h-6); ctx.stroke(); ctx.globalAlpha = 1;
    for(let i=0;i<20;i++){
      const px = x0 + 40 + (i/19)*(w-80); const py = top + 40 + ((i*43)% (h-80));
      const d = Math.abs(px-sx); const glow = Math.max(0, 1 - d/120);
      ctx.beginPath(); ctx.arc(px,py,3.2,0,Math.PI*2); ctx.fillStyle = `rgba(255,255,255,${0.25+0.6*glow})`; ctx.fill();
    }
  }

  function drawCraft(x0, top, w, ind, maker=true){
    panel(x0, top, w, 180, .5); h2(x0+16, top+34, maker?'Crafts outreach':'Crafts message');
    const need = pick(leadNeed(ind));
    panel(x0+20, top+60, w-40, 110, .42);
    label(x0+34, top+90, maker? `Hi Ken — saw a spike in ${need}.`: `Hi team — your last NPS was 7/10; proposing reorder + minor tweak.`, false, 16);
    label(x0+34, top+114, maker? `We help teams ship ${need} faster with better yield.` : `Customers like you reorder every 42 days; nudging cadence set to 38 days.`, true, 13);
    const beamY = top + 150;
    ctx.strokeStyle = P.ai; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0+40, beamY); ctx.lineTo(x0+w-40, beamY); ctx.stroke();
    const nodes = maker
      ? [{t:'email', x: x0 + w*0.30, y: beamY-58, hot: true,  ms: 180},
         {t:'li',    x: x0 + w*0.52, y: beamY-8,  hot: false, ms: 240},
         {t:'sms',   x: x0 + w*0.70, y: beamY+46, hot: false, ms: 140}]
      : [{t:'email', x: x0 + w*0.40, y: beamY-24, hot: true,  ms: 160},
         {t:'sms',   x: x0 + w*0.62, y: beamY+26, hot: false, ms: 110}];
    nodes.forEach(n=>{
      icon(n.t, n.x, n.y, n.hot);
      panel(n.x-84, n.y-46, 168, 56, .5);
      h2(n.x-74, n.y-18, `${n.t.toUpperCase()} engaged`); label(n.x-74, n.y+6, `time: ${n.ms} ms`, true, 12);
      ctx.strokeStyle='rgba(255,255,255,.22)'; ctx.beginPath(); ctx.moveTo(x0+40,beamY); ctx.lineTo(n.x, n.y); ctx.stroke();
    });
    if(!drawCraft.didInit){ pushTicker(maker? 'Outreach generated & dispatched' : 'Retention message scheduled'); drawCraft.didInit = true; }
  }

  function drawRoute(x0, top, w, maker=true){
    h2(x0, top, maker?'Routes & engages':'Routes retention actions');
    const opts = maker
      ? [{txt:'AI handles', x: x0+20, y: top+30},
         {txt:'Closer', x: x0+20, y: top+110},
         {txt:'Nurture (12‑wk)', x: x0+20, y: top+190}]
      : [{txt:'Auto‑reorder', x: x0+20, y: top+30},
         {txt:'CSR review', x: x0+20, y: top+110},
         {txt:'Churn rescue', x: x0+20, y: top+190}];
    opts.forEach(o=>{ panel(o.x, o.y, 220, 56, .52); h2(o.x+12, o.y+36, o.txt); });

    panel(x0+270, top+18, w-290, 250, .52);
    h2(x0+286, top+48, maker?'Live thread':'Customer journey');
    function bubble(x,y,who,text){ const color = who==='AI'? P.ai : (who==='Risk'? P.risk : P.human);
      ctx.fillStyle = color; ctx.globalAlpha = .16; rr(x,y, w-320, 54, 12); ctx.fill(); ctx.globalAlpha = 1;
      label(x+12, y+22, who, false, 12); label(x+12, y+40, text, true, 13);
      const ico = who==='AI' ? 'email' : (who==='Risk' ? 'sms' : 'human'); icon(ico, x-26, y+28, who==='AI'); }
    if(maker){
      bubble(x0+286, top+72, 'AI', 'Sent spec + sample and asked for timeline.');
      bubble(x0+286, top+136, 'AI', 'Lead clicked quote builder; signaled budget.');
      bubble(x0+286, top+200, 'Closer', '“Can you quote 2k units with inserts?”');
      if(!drawRoute.didInit){ pushTicker('Hot reply detected — routing to closer'); drawRoute.didInit = true; }
    } else {
      bubble(x0+286, top+72, 'AI', 'NPS 7/10 last order; prompt referral + reorder cadence 38 days.');
      bubble(x0+286, top+136, 'Risk', 'Delivery delay flagged; triggered apology + coupon.');
      bubble(x0+286, top+200, 'AI', 'CSR sees highlights; approves auto‑reorder draft.');
      if(!drawRoute.didInit){ pushTicker('Churn risk mitigated — reorder path armed'); drawRoute.didInit = true; }
    }
  }

  function drawWin(x0, top, maker=true){
    h2(x0, top, maker?'Closes & retains':'Saves & extends LTV');
    if(maker){
      panel(x0, top+24, 320, 280, .52);
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth=2; rr(x0+40, top+40, 240, 240, 28); ctx.stroke();
      label(x0+60, top+86, 'Ken — “Quote looks good.”', false, 14);
      panel(x0+80, top+220, 160, 48, .52); h2(x0+110, top+252, 'Accept');
      ctx.save(); ctx.translate(x0+420, top+160); ctx.rotate(-0.08);
      ctx.strokeStyle = P.ai; ctx.lineWidth=3; rr(-140,-44,280,88,12); ctx.stroke();
      ctx.fillStyle = grad(-120, 240); ctx.font='800 24px Montserrat'; ctx.fillText('DEAL CLOSED', -108, -8);
      ctx.fillStyle = '#fff'; ctx.font='900 26px Montserrat'; ctx.fillText('$12,800 • PO', -108, 24);
      ctx.restore();
      const cx = x0+860, cy = top+160, r = 56;
      panel(x0+760, top+24, 200, 280, .52);
      ctx.strokeStyle='rgba(255,255,255,.25)'; ctx.lineWidth=8; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.stroke();
      const t = (gsap.getProperty(tl,'time')||0)%6; const a = -Math.PI/2 + t/6 * Math.PI*2;
      ctx.strokeStyle=P.success; ctx.beginPath(); ctx.arc(cx,cy,r,-Math.PI/2,a); ctx.stroke();
      label(x0+796, top+250, 'Churn −22%', false, 16);
      if(!drawWin.didInit){ pushTicker('PO received — retention program engaged'); drawWin.didInit = true; }
    } else {
      panel(x0, top+24, 460, 280, .52);
      h2(x0+16, top+60, 'Reorder secured'); label(x0+16, top+90, 'ETA: 38 days • Items: 3 • Value: $4,600', true, 13);
      icon('nps', x0+420, top+52, true); label(x0+16, top+124, 'NPS ↑ from 7 → 9 after fix', false, 14);
      panel(x0+500, top+24, 460, 280, .52);
      h2(x0+516, top+60, 'Upsell accepted'); label(x0+516, top+90, 'Added QR labels + unit‑tracking (+$900/mo)', true, 13);
      if(!drawWin.didInit){ pushTicker('Saved account + upsell accepted'); drawWin.didInit = true; }
    }
  }

  function drawMaker(ind){
    const base = 60 - camera.x, top = 80, w = 1000, h = H-160;
    if(scenario==='inbound') drawGlobeScan(base, top, w, h, ind); else drawScanEmail(base, top, w, h);
    drawCraft( panels[1].x + 60 - camera.x, 80, 1000, ind, true);
    drawRoute( panels[2].x + 60 - camera.x, 80, 1000, true);
    drawWin( panels[3].x + 60 - camera.x, 80, true);
  }

  function drawSaver(ind){
    const base = 60 - camera.x, top = 80, w = 1000, h = H-160;
    drawScanEmail(base, top, w, h);
    drawCraft( panels[1].x + 60 - camera.x, 80, 1000, ind, false);
    drawRoute( panels[2].x + 60 - camera.x, 80, 1000, false);
    drawWin( panels[3].x + 60 - camera.x, 80, false);
  }

  // timeline
  let tl = gsap.timeline({ defaults:{ ease:'none' }, paused:true, repeat: -1, repeatDelay: 0.6 });
  function buildTimeline(){
    tl.kill(); overlay.innerHTML=''; drawGlobeScan.didInit=false; drawCraft.didInit=false; drawRoute.didInit=false; drawWin.didInit=false;
    tl = gsap.timeline({ defaults:{ ease:'none' }, paused:true, repeat: -1, repeatDelay: 0.6 });
    const eas = category==='saver' ? 'power1.inOut' : 'power2.inOut';
    tl.to(camera, { x: panels[0].x, duration: .1, ease:'none' });
    tl.to(camera, { x: panels[1].x-80, duration: 3.0, ease: eas });
    tl.to(camera, { x: panels[2].x-40, duration: 2.6, ease: eas });
    tl.to(camera, { x: panels[3].x,     duration: 2.6, ease: eas });
    tl.eventCallback('onUpdate', ()=>{ seek.value = Math.round(tl.progress()*1000); });
  }

  function render(){
    requestAnimationFrame(render);
    ctx.fillStyle = P.bg; ctx.fillRect(0,0,W,H);
    drawBackground();
    const ind = selIndustry.value;
    if(category==='maker') drawMaker(ind); else drawSaver(ind);
  }
  render();

  // controls
  playBtn.addEventListener('click', ()=> tl.play());
  pauseBtn.addEventListener('click', ()=> tl.pause());
  restartBtn.addEventListener('click', ()=> { tl.seek(0).pause(); seek.value = 0; });
  seek.addEventListener('input', ()=> tl.progress(seek.value/1000).pause());
  document.getElementById('mmDIY')?.addEventListener('click', ()=>{
    const ind = encodeURIComponent(selIndustry.value);
    location.href = `diy.html#industry=${ind}`;
  });

  // start autoplay
  buildTimeline(); tl.play();
})();
