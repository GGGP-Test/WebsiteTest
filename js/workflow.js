// MONEY MAKER AI — storyboard (~60s). Strict mode gating and safe ordering.
(function () {
  const cvs = document.getElementById('workflowCanvas'); if (!cvs) return;
  const ctx = cvs.getContext('2d');

  // ---- RNG / helpers (defined FIRST so any early calls are safe)
  let seed = (Date.now() % 100000) | 0;
  const rnd   = () => (seed = (seed * 1664525 + 1013904223) >>> 0, (seed & 0xffff) / 0xffff);
  const pick  = a => a[Math.floor(rnd() * a.length)];
  const money = (min, max) => Math.floor(min + rnd() * (max - min + 1));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp  = (a, b, t) => a + (b - a) * t;
  const ease  = (t) => 1 - Math.pow(1 - t, 3);

  // ---- background stars (declare BEFORE resize() calls it)
  let stars = [];
  function regenStars() {
    stars = new Array(120).fill(0).map(() => ({
      x: rnd() * W,
      y: rnd() * H,
      a: 0.12 + 0.5 * rnd(),
      s: 0.6 + 0.9 * rnd()
    }));
  }

  // ---- sizing
  let W = 0, H = 0, DPR = 1, M = 24;
  function resize() {
    W = cvs.clientWidth; H = cvs.clientHeight;
    DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    cvs.width = W * DPR; cvs.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    regenStars();
  }
  resize(); window.addEventListener('resize', resize);

  // ---- industry selection
  let industry = 'Custom Packaging';
  window.addEventListener('tf:industry', e => { industry = e.detail?.industry || industry; });

  // ---- data per run
  const peopleSets = [
    ['Jane','Ken','Priya','Luis','Marta','Ava','George','Noah'],
    ['Marco','Iris','Sam','Nina','Leo','Maya','Liam','Sara']
  ];
  const people  = pick(peopleSets);
  const hotLead = {
    name: pick(people),
    need: pick({
      'Custom Packaging': ['protective foam','die-cuts','mailer boxes','insert trays'],
      'Pallet & Crating': ['export crates','ISPM-15 certs','HT pallets'],
      'Labels & Stickers': ['thermal rolls','GHS labels','die-cut set'],
      'Flexible Packaging': ['stand-up pouches','film rolls','barrier bags'],
      'Folding Cartons'  : ['window patch','short-run cartons','gloss cartons']
    }[industry] || ['custom boxes'])
  };
  const amounts = [ money(4200,12500), money(8000,18000), money(2500,9800) ];

  // ---- timeline (seconds)
  const T = { scan:[0,8], card:[8,16], channel:[16,26], craft:[26,36], reply:[36,44], route:[44,52], phone:[52,58], po:[58,64], retain:[64,72], done:72 };

  // ---- drawing helpers
  function roundRect(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
  function panel(x,y,w,h,alpha=0.6){ x=clamp(x,M,W-M-w); y=clamp(y,M,H-M-h); ctx.save(); ctx.fillStyle=`rgba(0,0,0,${alpha})`; roundRect(x,y,w,h,12); ctx.fill(); ctx.strokeStyle='rgba(255,255,255,.12)'; ctx.stroke(); ctx.restore(); }
  function gradText(x,y,txt,size=16,width=240){ const g=ctx.createLinearGradient(x,0,x+width,0); g.addColorStop(0,'#ff0033'); g.addColorStop(1,'#ff4dd2'); ctx.fillStyle=g; ctx.font=`800 ${size}px Montserrat, Inter, sans-serif`; ctx.fillText(txt,x,y); }
  function label(x,y,txt){ ctx.fillStyle='rgba(255,255,255,.78)'; ctx.font='600 14px Inter'; ctx.fillText(txt,x,y); }

  function bg(t){
    ctx.clearRect(0,0,W,H);
    const g = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H));
    g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,0.55)');
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff';
    stars.forEach((s,i)=>{ const x=(s.x + 0.02*t + i*0.001)%W, y=(s.y + 0.005*t + i*0.0007)%H; ctx.globalAlpha=s.a; ctx.beginPath(); ctx.arc(x,y,s.s,0,Math.PI*2); ctx.fill(); });
    ctx.globalAlpha=1;

    // industry pill (top-right)
    const txt = industry; const w = ctx.measureText(txt).width + 48;
    panel(W-w-M, M, w, 34, .55); gradText(W-w-M+12, M+24, txt, 16, w-24);
  }

  // ---- simple icons
  function iconEmail(x,y,sc=1,hot=false){ ctx.save(); ctx.translate(x,y); ctx.scale(sc,sc); ctx.strokeStyle=hot? '#ff4dd2':'rgba(255,255,255,.8)'; ctx.lineWidth=2; roundRect(-16,-11,32,22,5); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-16,-6); ctx.lineTo(0,4); ctx.lineTo(16,-6); ctx.stroke(); ctx.restore(); }
  function iconLinkedIn(x,y,sc=1,hot=false){ ctx.save(); ctx.translate(x,y); ctx.scale(sc,sc); ctx.fillStyle=hot? '#ff4dd2':'rgba(255,255,255,.85)'; ctx.fillRect(-16,-16,32,32); ctx.fillStyle='#111'; ctx.font='900 16px Inter'; ctx.fillText('in', -9, 6); ctx.restore(); }
  function iconSMS(x,y,sc=1,hot=false){ ctx.save(); ctx.translate(x,y); ctx.scale(sc,sc); ctx.strokeStyle=hot? '#ff4dd2':'rgba(255,255,255,.8)'; ctx.lineWidth=2; roundRect(-16,-10,32,20,6); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0,10); ctx.lineTo(6,4); ctx.stroke(); ctx.restore(); }
  function iconPhone(x,y,sc=1){ ctx.save(); ctx.translate(x,y); ctx.scale(sc,sc); ctx.strokeStyle='rgba(255,255,255,.9)'; ctx.lineWidth=2; roundRect(-90,-180,180,360,28); ctx.stroke(); ctx.fillStyle='rgba(255,255,255,.05)'; roundRect(-90,-180,180,320,28); ctx.fill(); ctx.beginPath(); ctx.arc(0,150,12,0,Math.PI*2); ctx.stroke(); ctx.restore(); }
  function stampPO(x,y,txt){ ctx.save(); ctx.translate(x,y); ctx.rotate(-0.06); ctx.strokeStyle='#ff4dd2'; ctx.lineWidth=3; ctx.globalAlpha=0.85; roundRect(-120,-38,240,76,10); ctx.stroke(); ctx.font='800 22px Montserrat, Inter, sans-serif'; gradText(-106,-10,'DEAL CLOSED',22,220); ctx.fillStyle='#fff'; ctx.font='900 24px Montserrat'; ctx.fillText(txt,-106,22); ctx.restore(); }

  // ---- scenes
  function scanScene(p){
    const left=M+20,right=W-M-20,top=H*0.22,bot=H*0.76;
    panel(left, top, right-left, bot-top, .45);
    const x = lerp(left+20, right-20, p);
    ctx.strokeStyle='rgba(255,77,210,.65)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x, top+8); ctx.lineTo(x, bot-8); ctx.stroke();
    for(let i=0;i<18;i++){
      const px = left+30 + (i/17)*(right-left-60);
      const py = lerp(top+24, bot-24, (i*0.37)%1);
      const glow = clamp(1-Math.abs(px-x)/70,0,1);
      ctx.beginPath(); ctx.arc(px,py,3.5,0,Math.PI*2);
      ctx.fillStyle = `rgba(255,255,255,${0.2+0.6*glow})`; ctx.fill();
      if(glow>0.7){ ctx.fillStyle='rgba(159,255,191,.95)'; ctx.font='800 14px Inter'; ctx.fillText('signal', px+6, py-6); }
    }
    panel(M, M, 300, 84, .55); gradText(M+12, M+32, 'Finds buyers', 18); label(M+12, M+56, 'Spots ready-to-buy signals');
    const score = Math.round(lerp(60, 92, ease(p))); ctx.fillStyle='rgba(159,255,191,.95)'; ctx.font='800 16px Inter'; ctx.fillText(`Score: ${score}/100`, M+220, M+56);
  }

  function leadCardScene(p){
    const x = lerp(W*0.12, W*0.50, ease(p));
    const y = H*0.34, w=340,h=160;
    panel(x, y, w, h, .55);
    ctx.beginPath(); ctx.arc(clamp(x+48,M+48,W-M-48), y+48, 18, 0, Math.PI*2); ctx.fillStyle='rgba(255,255,255,.9)'; ctx.fill();
    gradText(x+78, y+50, `${hotLead.name}`, 18, 160);
    label(x+78, y+74, `needs ${hotLead.need}`);
    ['High intent','Fits ICP','Decision maker'].forEach((t,i)=>{
      const tp = clamp((p - i*0.18)/0.6, 0, 1);
      ctx.globalAlpha = tp; panel(x+20, y+90+i*32, 140+ctx.measureText(t).width, 26, .42);
      ctx.fillStyle='#fff'; ctx.font='700 13px Inter'; ctx.fillText(t, x+30, y+108+i*32); ctx.globalAlpha = 1;
    });
    panel(M, M, 320, 84, .55); gradText(M+12, M+32, 'Understands the person', 18); label(M+12, M+56, 'Tags by need & behavior');
  }

  function channelScene(p){
    const left=M+28,right=W-M-28,mid=H*0.62;
    ctx.strokeStyle='rgba(255,255,255,.2)'; ctx.beginPath(); ctx.moveTo(left, mid); ctx.lineTo(right, mid); ctx.stroke();
    const ex = clamp(left + W*0.26, left + 40, right - 40);
    const nodes = [
      {icon:iconEmail,    x:W*0.62, y:mid-90, ms:180, lbl:'Email'},
      {icon:iconLinkedIn, x:W*0.69, y:mid-32, ms:220, lbl:'LinkedIn'},
      {icon:iconSMS,      x:W*0.62, y:mid+26, ms:140, lbl:'SMS'}
    ];
    nodes.forEach((n,i)=>{
      n.x = clamp(n.x, left+60, right-60);
      n.y = clamp(n.y, M+60, H-M-60);
      const tp = clamp((p - i*0.18)/0.7, 0, 1);
      ctx.globalAlpha = tp;
      ctx.beginPath(); ctx.moveTo(ex, mid); ctx.lineTo(n.x, n.y); ctx.strokeStyle='rgba(255,255,255,.25)'; ctx.stroke();
      n.icon(n.x, n.y, 1.2, i===0);
      panel(n.x-86, n.y-50, 172, 48, .5);
      gradText(n.x-76, n.y-24, `${n.lbl} engaged`, 16, 140);
      label(n.x-76, n.y-6, `time: ${n.ms} ms`);
      ctx.globalAlpha = 1;
    });
    panel(M, M, 300, 84, .55); gradText(M+12, M+32, 'Outreach launched', 18); label(M+12, M+56, 'Channel-fit messages sent');
  }

  function craftScene(p){
    const x = M+18, y = H*0.26;
    panel(x, y, 420, 140, .55);
    gradText(x+18, y+40, 'Personalized message', 18, 220);
    label(x+18, y+64, `Hi ${hotLead.name}, noticed a spike in ${hotLead.need}…`);
    const beam = clamp(lerp(x+40, W-M-80, p), x+40, W-M-80);
    ctx.strokeStyle='rgba(255,77,210,.6)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(x+40, y+120); ctx.lineTo(beam, y+120); ctx.stroke();
    ctx.beginPath(); ctx.arc(beam, y+120, 6, 0, Math.PI*2); ctx.fillStyle='#ff4dd2'; ctx.fill();
    panel(M, M, 280, 84, .55); gradText(M+12, M+32, 'Talks for you', 18); label(M+12, M+56, 'Crafts copy that gets replies');
  }

  function replyScene(p){
    const x=clamp(W*0.62, M+60, W-M-60), y=clamp(H*0.56, M+60, H-M-60), r=lerp(8,26,ease(p));
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle='rgba(159,255,191,.95)'; ctx.fill();
    gradText(x-80, y+60, 'Reply detected', 18, 180);
    panel(M, M, 220, 70, .55);
    ctx.fillStyle='rgba(159,255,191,.95)'; ctx.font='900 38px Montserrat'; ctx.fillText('43%', M+12, M+52);
    label(M+84, M+50, 'Reply lift');
  }

  function routeScene(p){
    const y = H*0.26; const w=170,h=58;
    [['AI handles', W*0.58, y],['Closer', W*0.68, y+76],['Nurture (12-wk)', W*0.79, y+152]].forEach(([labelTxt, x, yy],i)=>{
      x=clamp(x, M+20, W-M-20-w); yy=clamp(yy, M+20, H-M-20-h);
      const tp = clamp((p - i*0.18)/0.7, 0, 1);
      ctx.globalAlpha = tp; panel(x, yy, w, h, .55); gradText(x+12, yy+36, labelTxt, 16, 140); ctx.globalAlpha=1;
    });
    panel(M, M, 320, 84, .55); gradText(M+12, M+32, 'Hands it off (or not)', 18); label(M+12, M+56, 'AI handles • Closer • Nurture');
  }

  function phoneScene(p){
    const cx = clamp(W*0.36, M+140, W-M-140), cy = clamp(H*0.58, M+180, H-M-180);
    iconPhone(cx, cy, lerp(0.8,1, ease(p)));
    const x=cx-70,y=cy-120;
    panel(x, y, 160, 64, .55); gradText(x+12, y+36, hotLead.name, 16, 110); label(x+12, y+56, '“Can you quote this?”');
    const bx=cx-58, by=cy+96, bw=140,bh=44;
    ctx.save(); ctx.globalAlpha=clamp((p-0.3)/0.7,0,1); panel(bx,by,bw,bh,.55); gradText(bx+38, by+28, 'Accept', 16, 70); ctx.restore();
  }

  function poScene(p){
    const x=clamp(W*0.70, M+140, W-M-140), y=clamp(H*0.58, M+140, H-M-140), w=240, h=300;
    ctx.save(); ctx.globalAlpha=clamp(p*1.4,0,1); panel(x-w/2, y-h/2, w, h, .5); ctx.restore();
    if(p>0.5){ const txt = `$${amounts[1].toLocaleString()} • PO`; stampPO(x, y, txt); }
  }

  function retentionScene(p){
    const cx=clamp(W*0.24, M+80, W-M-80), cy=clamp(H*0.62, M+80, H-M-80), r=64;
    ctx.strokeStyle='rgba(255,255,255,.3)'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI*1.1, Math.PI*1.1 + Math.PI*2*p); ctx.stroke();
    const a = Math.PI*1.1 + Math.PI*2*clamp(p,0,1);
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r);
    ctx.lineTo(cx + Math.cos(a-0.3)*(r+10), cy + Math.sin(a-0.3)*(r+10));
    ctx.lineTo(cx + Math.cos(a+0.3)*(r+10), cy + Math.sin(a+0.3)*(r+10));
    ctx.closePath(); ctx.fillStyle='rgba(255,255,255,.4)'; ctx.fill();
    panel(M, M, 280, 84, .55); gradText(M+12, M+32, 'Keeps them', 18); label(M+12, M+56, 'Follow-ups • NPS • Reorders');
    ctx.fillStyle='rgba(159,255,191,.95)'; ctx.font='800 16px Inter'; ctx.fillText('Churn −22%', M+200, M+56);
  }

  // ---- time control (GSAP if present; fallback otherwise)
  let time = 0, moneyActive = true;
  window.addEventListener('tf:mode', e=>{
    moneyActive = (e.detail?.mode === 'money');
    if(moneyActive){ resize(); restart(); }
  });

  const hasGSAP = typeof gsap !== 'undefined';
  let tl = null, start = performance.now();
  function restart(){
    if(hasGSAP){
      if(tl) tl.kill();
      const state = { t:0 };
      tl = gsap.timeline({ defaults:{ ease:'none' } })
        .to(state, { t:T.done, duration:T.done, onUpdate:()=> time = state.t });
    } else {
      start = performance.now();
    }
  }
  restart();
  if(!hasGSAP){
    (function tick(){ time = Math.min(T.done, (performance.now()-start)/1000); requestAnimationFrame(tick); })();
  }

  // ---- render
  function frame(){
    requestAnimationFrame(frame);
    if(!moneyActive) return;

    bg(time*1000);
    const seg=(p0,p1)=> clamp((time - p0)/(p1 - p0), 0, 1);

    scanScene(seg(T.scan[0], T.scan[1]));
    if(time>=T.card[0])    leadCardScene(seg(T.card[0], T.card[1]));
    if(time>=T.channel[0]) channelScene(seg(T.channel[0], T.channel[1]));
    if(time>=T.craft[0])   craftScene(seg(T.craft[0], T.craft[1]));
    if(time>=T.reply[0])   replyScene(seg(T.reply[0], T.reply[1]));
    if(time>=T.route[0])   routeScene(seg(T.route[0], T.route[1]));
    if(time>=T.phone[0])   phoneScene(seg(T.phone[0], T.phone[1]));
    if(time>=T.po[0])      poScene(seg(T.po[0], T.po[1]));
    if(time>=T.retain[0])  retentionScene(seg(T.retain[0], T.retain[1]));
  }
  frame();
})();
