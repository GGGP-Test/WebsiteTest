(function(){
  const wrap = document.querySelector('.ba-wrap'); const handle = document.querySelector('.ba-handle'); const after = document.querySelector('.ba.after');
  if(!wrap||!handle||!after) return;
  let dragging=false; let W=wrap.clientWidth;

  function setSplit(px){ const p = Math.max(0, Math.min(W, px)); const pct = (p/W)*100;
    after.style.clipPath = `inset(0 ${100-pct}% 0 0)`; handle.style.left = `${pct}%`; handle.setAttribute('aria-valuenow', Math.round(pct)); }
  setSplit(W*0.5);

  handle.addEventListener('pointerdown', (e)=>{ dragging=true; handle.setPointerCapture(e.pointerId); });
  window.addEventListener('pointermove', (e)=>{ if(!dragging) return; const r = wrap.getBoundingClientRect(); setSplit(e.clientX - r.left); });
  ['pointerup','pointercancel','pointerleave'].forEach(ev=> window.addEventListener(ev, ()=> dragging=false));
  window.addEventListener('resize', ()=>{ W=wrap.clientWidth; setSplit(W*0.5); });

  // fake stat bursts
  const replies = document.getElementById('baReplies'); const deals = document.getElementById('baDeals');
  function rand(min,max){ return Math.floor(min + Math.random()*(max-min+1)); }
  setInterval(()=>{ replies.textContent = `${rand(22,48)}%`; deals.textContent = `${rand(6,18)}`; }, 1200);
})();
