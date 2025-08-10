// Preloader, counters, reveals, ripple, mode toggle, and industry pill.
(function () {
  // --- Preloader fade (<1s total)
  window.addEventListener('load', () => {
    setTimeout(() => document.getElementById('preloader')?.remove(), 900);
  });

  // --- Reveal on view (cards/teasers)
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('reveal');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.how-card,.teaser,.pane,.card').forEach(n => obs.observe(n));

  // --- Animated counters in hero
  function animateCount(el) {
    const target = parseFloat(el.dataset.count || '0');
    const suffix = el.dataset.suffix || '';
    let t0 = performance.now();
    function step(now) {
      const p = Math.min(1, (now - t0) / 1200);
      const val = target * (0.2 + 0.8 * p * p);
      el.textContent = (suffix === '×' ? val.toFixed(1) : Math.round(val)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  window.addEventListener('load', () => {
    document.querySelectorAll('[data-count]')?.forEach(animateCount);
  });

  // --- Ripple on buttons/links
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.ripple');
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const d = Math.max(r.width, r.height);
    const span = document.createElement('span');
    span.className = 'ripple-ink';
    span.style.width = span.style.height = d + 'px';
    span.style.left = (e.clientX - r.left - d / 2) + 'px';
    span.style.top = (e.clientY - r.top - d / 2) + 'px';
    btn.appendChild(span);
    setTimeout(() => span.remove(), 650);
  });

  // --- Mode switching (Money Maker vs Hub)
  function initModes() {
    const btns = document.querySelectorAll('.mode-toggle .mode');
    const sphere = document.getElementById('aiSphere');
    const flow = document.getElementById('workflowCanvas');
    if (!sphere || !flow || btns.length === 0) return;

    function setMode(mode) {
      document.body.classList.toggle('hub-mode', mode === 'hub');
      document.body.classList.toggle('money-mode', mode === 'money');
      btns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));

      // hard toggle canvases so they never overlap
      if (mode === 'hub') {
        sphere.classList.remove('off'); sphere.style.display = 'block';
        flow.classList.add('off');      flow.style.display = 'none';
      } else {
        flow.classList.remove('off');   flow.style.display = 'block';
        sphere.classList.add('off');    sphere.style.display = 'none';
      }

      // broadcast + ensure visible canvas resizes after layout
      window.dispatchEvent(new CustomEvent('tf:mode', { detail: { mode } }));
      setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
    }

    btns.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
    setMode('money'); // default
  }

  // --- Industry select + pill + event
  function initIndustry() {
    const wrap = document.querySelector('.industry-select');
    const sel = document.getElementById('industrySel');
    const pill = document.querySelector('.industry-pill');
    if (!wrap || !sel || !pill) return;

    // initialize pill
    pill.textContent = sel.value;

    // update on change
    sel.addEventListener('change', () => {
      pill.textContent = sel.value;
      window.dispatchEvent(new CustomEvent('tf:industry', { detail: { industry: sel.value } }));
    });

    // focusing the hidden select on click helps on some browsers
    wrap.addEventListener('click', () => sel.focus());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initModes(); initIndustry(); });
  } else { initModes(); initIndustry(); }
})();
