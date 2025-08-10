(function(){
  const form = document.getElementById('roiForm'); if(!form) return;
  const out = document.getElementById('roiOut');

  function ease(t){return 1-Math.pow(1-t,3)}
  function animateNum(el, from, to, dur=700, fmt=(v)=>v){
    const t0 = performance.now();
    function step(now){ const p=Math.min(1,(now-t0)/dur); const v=from+(to-from)*ease(p); el.textContent=fmt(v); if(p<1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }

  function calc(){
    const v = +document.getElementById('visitors').value;
    const lr = +document.getElementById('leadRate').value / 100;
    const cr = +document.getElementById('closeRate').value / 100;
    const aov = +document.getElementById('aov').value;
    const hours = +document.getElementById('hoursSaved').value;
    const hourly = +document.getElementById('hourly').value;

    const leads = v * lr; const deals = leads * cr; const revenue = deals * aov; const labor = hours * hourly;
    const impliedROI = (revenue + labor) / Math.max(1, 1500);

    out.innerHTML = `
      <div class="metrics">
        <div><strong id="mLeads">0</strong><span>Leads / mo</span></div>
        <div><strong id="mDeals">0</strong><span>Deals / mo</span></div>
        <div><strong id="mRev">$0</strong><span>New revenue / mo</span></div>
        <div><strong id="mLabor">$0</strong><span>Labor saved / mo</span></div>
        <div><strong id="mROI">0×</strong><span>Implied ROI</span></div>
      </div>`;

    animateNum(document.getElementById('mLeads'), 0, leads, 700, v=>Math.round(v).toString());
    animateNum(document.getElementById('mDeals'), 0, deals, 700, v=>Math.round(v).toString());
    animateNum(document.getElementById('mRev'), 0, revenue, 800, v=>`$${Math.round(v).toLocaleString()}`);
    animateNum(document.getElementById('mLabor'), 0, labor, 800, v=>`$${Math.round(v).toLocaleString()}`);
    animateNum(document.getElementById('mROI'), 0, impliedROI, 900, v=>`${v.toFixed(1)}×`);

    return {v,lr,cr,aov,hours,hourly,leads,deals,revenue,labor,impliedROI};
  }

  document.getElementById('calcBtn')?.addEventListener('click', calc);
  document.getElementById('exportBtn')?.addEventListener('click', ()=>{
    const r = calc();
    const md = `# Partnership ROI Estimate

- Visitors: ${r.v}
- Lead rate: ${(r.lr*100).toFixed(1)}%
- Close rate: ${(r.cr*100).toFixed(1)}%
- AOV: $${r.aov}
- Hours saved: ${r.hours} @ $${r.hourly}/hr

**Leads/mo:** ${r.leads.toFixed(0)}
**Deals/mo:** ${r.deals.toFixed(0)}
**New revenue/mo:** $${r.revenue.toLocaleString()}
**Labor saved/mo:** $${r.labor.toLocaleString()}
**Implied ROI:** ${r.impliedROI.toFixed(1)}×
`;
    const blob = new Blob([md], {type:'text/markdown'}); const a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download='galactly-roi-estimate.md'; a.click(); URL.revokeObjectURL(a.href);
  });
})();
