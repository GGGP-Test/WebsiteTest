(function(){
  const f = document.getElementById('intakeForm'); if(!f) return;
  const dl = document.getElementById('dlJson');
  const mail = document.getElementById('sendMail');

  function payload(){
    const data = Object.fromEntries(new FormData(f).entries());
    data.generatedAt = new Date().toISOString();
    return data;
  }

  dl.addEventListener('click', ()=>{
    const data = payload();
    const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `galactly-intake-${(data.company||'company').replace(/\s+/g,'-').toLowerCase()}.json`;
    a.click(); URL.revokeObjectURL(a.href);
  });

  mail.addEventListener('click', ()=>{
    const data = payload();
    const to = 'hello@galactly.com';
    const subject = encodeURIComponent(`Partnership intake — ${data.company||''}`);
    const body = encodeURIComponent(
`Company: ${data.company||''}
Email: ${data.email||''}
Industry: ${data.industry||''}
Monthly orders: ${data.orders||''}
AOV: $${data.aov||''}
Stack: ${data.stack||''}

(Generated locally from galactly.com — no server storage)`
    );
    location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  });
})();
