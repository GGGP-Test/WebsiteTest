// Preloader fade
window.addEventListener('load', () => setTimeout(() => document.getElementById('preloader')?.remove(), 800));

// Year
document.getElementById('year')?.appendChild(document.createTextNode(new Date().getFullYear()));

// Reveal on view
const obs = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('reveal'); obs.unobserve(e.target); } });
}, { threshold: 0.15 });
document.querySelectorAll('.how-card,.teaser,.pane,.card')?.forEach(n => obs.observe(n));

// Ripple
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.ripple'); if (!btn) return;
  const r = btn.getBoundingClientRect(); const d = Math.max(r.width, r.height);
  const span = document.createElement('span'); span.className = 'ripple-ink';
  span.style.width = span.style.height = d + 'px';
  span.style.left = (e.clientX - r.left - d / 2) + 'px';
  span.style.top = (e.clientY - r.top - d / 2) + 'px';
  btn.appendChild(span); setTimeout(() => span.remove(), 650);
});

// Hero counters
function animateCount(el) {
  const target = parseFloat(el.dataset.count || '0');
  const suffix = el.dataset.suffix || '';
  const t0 = performance.now();
  function step(now) {
    const p = Math.min(1, (now - t0) / 1100);
    const val = target * (0.3 + 0.7 * p * p);
    el.textContent = (suffix === '×' ? val.toFixed(1) : Math.round(val)) + suffix;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
window.addEventListener('load', () => document.querySelectorAll('[data-count]')?.forEach(animateCount));
