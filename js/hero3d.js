// INTELLIGENCE HUB — sphere + network + geo flashes
(function () {
  const canvas = document.getElementById('aiSphere'); if (!canvas) return;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  let W = canvas.clientWidth, H = canvas.clientHeight; const DPR = Math.min(2, window.devicePixelRatio || 1);
  renderer.setPixelRatio(DPR); renderer.setSize(W, H, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 1000); camera.position.set(0, 0, 52);
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));

  // core sphere
  const core = new THREE.Mesh(new THREE.SphereGeometry(10, 96, 96), new THREE.MeshBasicMaterial({ color: 0x24000f, transparent: true, opacity: 0.65 }));
  scene.add(core);

  // glow sprite
  const glowCanvas = document.createElement('canvas'); glowCanvas.width = 256; glowCanvas.height = 256;
  const gctx = glowCanvas.getContext('2d');
  const grad = gctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,77,210,0.85)'); grad.addColorStop(0.45, 'rgba(255,0,51,0.35)'); grad.addColorStop(1, 'rgba(255,0,51,0)');
  gctx.fillStyle = grad; gctx.beginPath(); gctx.arc(128, 128, 128, 0, Math.PI * 2); gctx.fill();
  const glowTex = new THREE.CanvasTexture(glowCanvas);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, opacity: 0.78 }));
  glow.scale.set(58, 58, 1); scene.add(glow);

  // stars
  const pts = []; for (let i = 0; i < 340; i++) { const r = 16 + Math.random() * 7, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1); pts.push(r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph)); }
  const cloud = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)), new THREE.PointsMaterial({ size: 0.18, color: 0xffffff })); scene.add(cloud);

  // network arcs + moving packets
  const net = new THREE.Group(); scene.add(net);
  const packets = [];
  function randOnSphere(R = 12) { const v = new THREE.Vector3(Math.random() - .5, Math.random() - .5, Math.random() - .5).normalize(); return v.multiplyScalar(R); }
  function greatCircle(a, b, segments = 72) {
    const mid = a.clone().add(b).normalize().multiplyScalar(14);
    const geo = new THREE.BufferGeometry(); const arr = [];
    for (let i = 0; i <= segments; i++) { const t = i / segments; const p = new THREE.QuadraticBezierCurve3(a, mid, b).getPoint(t); arr.push(p.x, p.y, p.z); }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); return geo;
  }
  function addArc() {
    const A = randOnSphere(12), B = randOnSphere(12);
    net.add(new THREE.Line(greatCircle(A, B), new THREE.LineBasicMaterial({ color: 0xff1f7a, transparent: true, opacity: 0.25 })));
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 1, depthWrite: false, depthTest: false }));
    spr.scale.set(1.9, 1.9, 1); scene.add(spr);
    packets.push({ sprite: spr, a: A, b: B, t: Math.random(), speed: 0.0015 + Math.random() * 0.0025 });
  }
  for (let i = 0; i < 26; i++) addArc();

  // HUD labels
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function makeLabel(title, value, pos) {
    const w = 520, h = 152; const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
    g.fillStyle = 'rgba(0,0,0,0.52)'; roundRect(g, 10, 10, w - 20, h - 20, 24); g.fill();
    const grd = g.createLinearGradient(0, 0, w, 0); grd.addColorStop(0, '#ff0033'); grd.addColorStop(1, '#ff4dd2');
    g.fillStyle = grd; g.font = '700 30px Montserrat, Inter, sans-serif'; g.fillText(title, 26, 58);
    g.fillStyle = '#fff'; g.font = '800 48px Montserrat, Inter, sans-serif'; g.fillText(String(value), 26, 112);
    const tex = new THREE.CanvasTexture(cv); tex.minFilter = THREE.LinearFilter;
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false }));
    spr.scale.set(13, 3.9, 1); spr.position.copy(pos); spr.userData = { tex, title, value };
    spr.update = (v) => {
      spr.userData.value = v; const ctx2 = tex.image.getContext('2d'); ctx2.clearRect(0, 0, w, h);
      ctx2.fillStyle = 'rgba(0,0,0,0.52)'; roundRect(ctx2, 10, 10, w - 20, h - 20, 24); ctx2.fill();
      const grd2 = ctx2.createLinearGradient(0, 0, w, 0); grd2.addColorStop(0, '#ff0033'); grd2.addColorStop(1, '#ff4dd2');
      ctx2.fillStyle = grd2; ctx2.font = '700 30px Montserrat, Inter, sans-serif'; ctx2.fillText(spr.userData.title, 26, 58);
      ctx2.fillStyle = '#fff'; ctx2.font = '800 48px Montserrat, Inter, sans-serif'; ctx2.fillText(String(v), 26, 112); spr.userData.tex.needsUpdate = true;
    };
    spr.renderOrder = 999;
    return spr;
  }
  const hud = {
    leads: makeLabel('Leads Spotted', '0', new THREE.Vector3(-11, 7, 0)),
    quotes: makeLabel('Quotes Sent', '0', new THREE.Vector3(11, 7, 0)),
    deals: makeLabel('Deals Closed', '0', new THREE.Vector3(-11, -7, 0)),
    eng: makeLabel('Leads Engaged', '0', new THREE.Vector3(11, -7, 0)),
  };
  Object.values(hud).forEach(s => scene.add(s));

  const counters = { leads: 0, quotes: 0, deals: 0, eng: 0 };
  function inc(name, n = 1) { counters[name] += n; hud[name].update(counters[name].toLocaleString()); }

  // geo flashes
  const flashes = [];
  function latLonToVec(latDeg, lonDeg, R = 18) { const lat = latDeg * Math.PI / 180, lon = lonDeg * Math.PI / 180; return new THREE.Vector3(R * Math.cos(lat) * Math.cos(lon), R * Math.sin(lat), R * Math.cos(lat) * Math.sin(lon)); }
  function biasedLatLon() {
    const r = Math.random();
    if (r < 0.6) return [25 + Math.random() * 35, -130 + Math.random() * 70];     // US/Canada
    if (r < 0.8) return [35 + Math.random() * 25, -10 + Math.random() * 40];      // Europe
    if (r < 0.9) return [10 + Math.random() * 40, 60 + Math.random() * 60];       // Asia
    return [-35 + Math.random() * 90, -170 + Math.random() * 340];
  }
  function spawnLeadFlash() {
    const [lat, lon] = biasedLatLon(); const pos = latLonToVec(lat, lon, 18);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity: 0.95, depthWrite: false, depthTest: false }));
    s.scale.set(2.3, 2.3, 1); s.position.copy(pos); s.userData = { life: 1.2 };
    scene.add(s); flashes.push(s); inc('leads', 1);
  }

  // parallax
  let mx = 0, my = 0; canvas.addEventListener('pointermove', (e) => { const r = canvas.getBoundingClientRect(); mx = (e.clientX - (r.left + r.width / 2)) / r.width * 2; my = (e.clientY - (r.top + r.height / 2)) / r.height * -2; });

  // mode gate
  let playing = false;
  window.addEventListener('tf:mode', e => { playing = (e.detail?.mode === 'hub'); if (playing) onResize(); });

  const t0 = performance.now();
  function animate() {
    requestAnimationFrame(animate);
    if (!playing) return;

    core.rotation.y += 0.004; cloud.rotation.y += 0.006; net.rotation.y -= 0.002; glow.position.copy(core.position);
    camera.position.x = mx * 0.06; camera.position.y = my * 0.06; camera.lookAt(0, 0, 0);

    packets.forEach(p => {
      p.t += p.speed; if (p.t > 1) p.t = 0;
      const mid = p.a.clone().add(p.b).normalize().multiplyScalar(14);
      const pt = new THREE.QuadraticBezierCurve3(p.a, mid, p.b).getPoint(p.t);
      p.sprite.position.copy(pt);
    });

    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i]; f.userData.life -= 0.02; f.material.opacity = Math.max(0, f.userData.life);
      if (f.userData.life <= 0) { scene.remove(f); flashes.splice(i, 1); }
    }

    if (Math.random() < 0.18) spawnLeadFlash();
    if (Math.random() < 0.04) inc('eng', 1);
    if (Math.random() < 0.03) inc('quotes', 1);
    if (Math.random() < 0.02) inc('deals', 1);

    Object.values(hud).forEach(s => { s.lookAt(camera.position); s.material.depthTest = false; s.renderOrder = 999; });

    renderer.render(scene, camera);
  }
  animate();

  function onResize() { W = canvas.clientWidth; H = canvas.clientHeight; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); }
  window.addEventListener('resize', onResize);
})();
