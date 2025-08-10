// Preloader, counters, reveals, and a tiny event bus for telemetry.
(function(){
  // Preloader fade (<1s total)
  window.addEventListener('load', ()=>{
    setTimeout(()=> document.getElementById('preloader')?.remove(), 900);
  });

  // Simple intersection-based reveal
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('reveal'); obs.unobserve(e.target);} });
  }, {threshold: 0.15});
  document.querySelectorAll('.how-card,.teaser,.pane,.card').forEach(n=>obs.observe(n));

  // Animated counters in hero
  function animateCount(el){
    const target = parseFloat(el.dataset.count||'0');
    const suffix = el.dataset.suffix||'';
    let t0 = performance.now();
    function step(now){
      const p = Math.min(1, (now-t0)/1200);
      const val = target * (0.2 + 0.8 * p*p);
      el.textContent = (suffix==='×'? val.toFixed(1): Math.round(val)) + suffix;
      if(p<1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  window.addEventListener('load', ()=>{ document.querySelectorAll('[data-count]')?.forEach(animateCount); });

  // --- Telemetry store ---
  const tele = { leads:0, quotes:0, deals:0, engaged:0, roi:9.4 };
  const els = {
    leads: document.getElementById('tLeads'),
    quotes: document.getElementById('tQuotes'),
    deals: document.getElementById('tDeals'),
    engaged: document.getElementById('tEngaged'),
    roi: document.getElementById('tROI'),
    feed: document.getElementById('liveFeed')
  };
  function renderTele(){
    if(els.leads) els.leads.textContent = tele.leads.toLocaleString();
    if(els.quotes) els.quotes.textContent = tele.quotes.toLocaleString();
    if(els.deals) els.deals.textContent = tele.deals.toLocaleString();
    if(els.engaged) els.engaged.textContent = tele.engaged.toLocaleString();
    if(els.roi) els.roi.textContent = `${tele.roi.toFixed(1)}×`;
  }
  renderTele();

  // Event helpers
  function pushEvent(text, ok){
    if(!els.feed) return; const div = document.createElement('div'); div.className = 'event'+(ok?' ok':''); div.textContent = text; els.feed.prepend(div);
    // trim feed
    while(els.feed.childElementCount > 10){ els.feed.lastElementChild?.remove(); }
  }
  window.addEventListener('tf:lead', (e)=>{ tele.leads += 1; renderTele(); pushEvent(`Lead acquired: ${e.detail?.name||'Unknown'} — ${e.detail?.note||'scored high intent'}`, true); });
  window.addEventListener('tf:quote', (e)=>{ tele.quotes += 1; renderTele(); pushEvent(`Quote sent: ${e.detail?.who||'Ops'} — $${(e.detail?.amount||4200).toLocaleString()} • ${e.detail?.item||'Packaging'}`, true); });
  window.addEventListener('tf:deal', (e)=>{ tele.deals += 1; tele.roi = Math.min(18, tele.roi + 0.1); renderTele(); pushEvent(`Deal closed: $${(e.detail?.amount||7200).toLocaleString()} • ${e.detail?.item||'PO'}`, true); });
  window.addEventListener('tf:engaged', ()=>{ tele.engaged += 1; renderTele(); });

  // Expose a minimal API
  window.__telemetry = { pushEvent, tele, renderTele };
})();