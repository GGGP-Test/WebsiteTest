// DIY kit generator — client-only using JSZip (free)
(function(){
  const form = document.getElementById('kitForm'); if(!form) return; const note = document.getElementById('downloadNote');

  function now(){ return new Date().toISOString().slice(0,10); }

  // deep-link populate from Money Maker
  if(location.hash.includes('industry=')){
    const match = decodeURIComponent(location.hash.split('industry=')[1] || '');
    const sel = document.getElementById('industry');
    if(sel && match){ sel.value = match; }
  }

  form.addEventListener('submit', async (e)=>{
    e.preventDefault(); if(note) note.hidden=false;
    const industry = document.getElementById('industry').value;
    const acq = [...form.querySelectorAll('input[name="acq"]:checked')].map(i=>i.value);
    const ret = [...form.querySelectorAll('input[name="ret"]:checked')].map(i=>i.value);
    const out = [...form.querySelectorAll('input[name="out"]:checked')].map(i=>i.value);

    const zip = new JSZip();
    zip.file('README.md', `# ${industry} — Galactly DIY Kit

Generated on ${now()}

Contents:
- Prompts (Manager/Acq/Ret)
- Workflows + scoring schema
- Outreach templates (email/DM)
`);

    if(out.includes('Prompts')){
      zip.file('prompts/manager.txt', managerPrompt(industry));
      zip.file('prompts/acquisition.txt', acqPrompt(industry, acq));
      zip.file('prompts/retention.txt', retPrompt(industry, ret));
    }
    if(out.includes('Workflows')){
      zip.file('workflows/scoring.json', JSON.stringify(scoring(industry), null, 2));
      zip.file('workflows/outreach.json', JSON.stringify(outreach(industry), null, 2));
      zip.file('workflows/retention.json', JSON.stringify(retention(industry), null, 2));
    }
    if(out.includes('Templates')){
      zip.file('outreach/email.md', emailTpl(industry));
      zip.file('outreach/dm.md', dmTpl(industry));
    }

    const blob = await zip.generateAsync({type:'blob'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download = `${industry.replace(/\s+/g,'-').toLowerCase()}-galactly-kit.zip`; a.click(); URL.revokeObjectURL(a.href);
    if(note) note.hidden=true;
  });

  // content generators
  function managerPrompt(ind){return `Role: Manager AI for ${ind}.
Goals: supervise acquisition & retention, reweight KPIs weekly, audit call outcomes, reduce churn.
Inputs: lead scores, replies, call transcripts, delivery feedback.
Outputs: KPI changes, audience tweaks, product suggestions.`}
  function acqPrompt(ind, feats){return `Role: Acquisition AI for ${ind}.
Must:
- Discover real-time buyers from public signals.
- Rank leads via Intent/Weight/Character/Platform.
- Generate channel-personalized outreach with CTA.
Enabled features: ${feats.join(', ')||'none'}.`}
  function retPrompt(ind, feats){return `Role: Retention AI for ${ind}.
Must: schedule follow-ups, collect NPS, prompt referrals, and recommend upsells.
Enabled features: ${feats.join(', ')||'none'}.`}

  function scoring(ind){return {industry:ind,version:1,
    intent:[{key:'searchesPerWeek',weight:.3},{key:'warehouseSignals',weight:.2},{key:'ltvToCAC',weight:.25},{key:'toolsInteracted',weight:.15},{key:'size',weight:.1}],
    weight:[{key:'postingBehavior',weight:.25},{key:'acceptsMagnets',weight:.2},{key:'purchaseFrequency',weight:.3},{key:'bizNature',weight:.25}],
    character:[{key:'reviewScore',weight:.3},{key:'jumpCount',weight:.2},{key:'valueLanguage',weight:.25},{key:'cultureLanguage',weight:.25}],
    platform:[{key:'postCount',weight:.3},{key:'commentCount',weight:.3},{key:'replyIntent',weight:.4}]
  };}
  function outreach(ind){return {industry:ind,steps:['choose_best_channel','generate_personalized_copy','send','listen_for_reply','route_hot_to_closer']};}
  function retention(ind){return {industry:ind,cadence:'12-week',weeks:{'1':'case studies','2-5':'industry insights','5-9':'pain points avoided','9-12':'referral push'}}}
  function emailTpl(ind){return `Subject: Quick idea for ${ind} growth

Hi {{firstName}},

Noticed {{signal}}. We help ${ind.toLowerCase()} teams capture ready-to-buy demand, then close it automatically.
Want a 2-minute sample for {{company}}?

— {{sender}}`}
  function dmTpl(ind){return `Hey {{firstName}} — saw {{signal}}. We build private AI for ${ind.toLowerCase()} that finds/warms buyers and reduces churn. Want a quick sample for {{company}}?`}
})();
