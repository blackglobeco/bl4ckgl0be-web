/* ═══════════════════════════════════════════
   BLACK GLOBE — main.js
   Particle globe + UI interactions
   ═══════════════════════════════════════════ */

// ── NAVBAR SCROLL ──────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ── MOBILE NAV TOGGLE ──────────────────────
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');
navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => navLinks.classList.remove('open'))
);

// ══════════════════════════════════════════════════════
//  PARTICLE GLOBE
// ══════════════════════════════════════════════════════
(function () {
  const canvas = document.getElementById('globeCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // ── Continent outlines as lat/lon polygons ──────────
  // Each region is an array of [lat, lon] pairs
  const CONTINENTS = {
    // North America
    na: [
      [70,-140],[72,-120],[70,-95],[72,-85],[68,-75],[62,-65],[55,-60],
      [47,-53],[43,-66],[40,-70],[35,-75],[30,-80],[25,-80],[20,-87],
      [15,-85],[10,-83],[8,-77],[8,-75],[10,-62],[12,-62],[15,-60],
      [20,-73],[22,-80],[25,-77],[28,-80],[30,-85],[35,-75],[38,-75],
      [42,-70],[47,-53],[50,-55],[52,-56],[55,-60],[58,-68],[60,-64],
      [62,-65],[65,-68],[68,-75],[70,-95],[72,-120],[70,-140],
    ],
    // Greenland
    gl: [
      [76,-73],[72,-22],[60,-44],[63,-52],[68,-54],[72,-57],[76,-68],[76,-73],
    ],
    // South America
    sa: [
      [10,-73],[8,-62],[5,-52],[0,-50],[-5,-35],[-10,-37],[-15,-39],
      [-20,-40],[-23,-43],[-28,-48],[-33,-53],[-38,-57],[-42,-63],
      [-46,-65],[-50,-68],[-52,-68],[-55,-65],[-55,-60],[-52,-58],
      [-48,-65],[-43,-65],[-38,-62],[-33,-70],[-28,-70],[-20,-70],
      [-15,-75],[-5,-80],[0,-80],[5,-77],[8,-77],[10,-73],
    ],
    // Europe
    eu: [
      [71,28],[70,20],[62,5],[52,2],[48,-5],[43,-9],[36,-9],[36,2],
      [38,15],[40,18],[42,28],[45,29],[47,22],[48,17],[50,14],[54,10],
      [56,10],[58,5],[60,5],[62,5],[65,14],[68,16],[70,20],[71,28],
    ],
    // Africa
    af: [
      [37,10],[36,2],[30,-10],[20,-17],[10,-17],[0,-10],[-5,10],
      [-10,15],[-20,35],[-26,33],[-34,18],[-34,27],[-28,32],
      [-20,35],[-10,40],[0,42],[5,41],[10,44],[12,43],[15,40],
      [20,38],[25,35],[30,33],[32,27],[30,24],[35,25],[37,10],
    ],
    // Asia
    as: [
      [70,140],[68,90],[65,60],[60,55],[55,50],[45,35],[40,26],[42,28],
      [38,27],[36,28],[36,36],[37,36],[37,42],[38,48],[37,55],[22,60],
      [8,77],[10,80],[22,88],[22,92],[25,90],[28,88],[28,85],[35,75],
      [40,70],[42,78],[40,80],[42,87],[50,88],[55,80],[60,60],[65,60],
      [68,90],[70,140],
    ],
    // SE Asia islands
    sea: [
      [5,100],[2,104],[0,108],[0,114],[3,114],[5,118],[5,120],
      [2,109],[0,104],[2,100],[5,100],
    ],
    // Japan
    jp: [
      [31,131],[33,131],[35,133],[38,141],[42,143],[44,144],[43,141],
      [38,140],[35,136],[33,131],[31,131],
    ],
    // Australia
    au: [
      [-16,123],[-14,130],[-14,136],[-12,136],[-14,142],[-16,145],
      [-20,148],[-24,152],[-28,153],[-32,152],[-38,146],[-38,140],
      [-34,135],[-32,130],[-25,115],[-22,114],[-18,122],[-16,123],
    ],
    // New Zealand
    nz: [[-36,174],[-38,176],[-42,172],[-44,171],[-42,172],[-38,175],[-36,174]],
  };

  // World map density map — dots per region of the sphere
  // We'll compute which points land on continents via a point-in-poly test

  // ── Point-in-polygon (lat/lon) ──────────────────────
  function pointInPoly(lat, lon, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [yi, xi] = poly[i];
      const [yj, xj] = poly[j];
      if (((yi > lat) !== (yj > lat)) &&
          (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  }

  function onContinent(lat, lon) {
    for (const poly of Object.values(CONTINENTS)) {
      if (pointInPoly(lat, lon, poly)) return true;
    }
    return false;
  }

  // ── Color palette: cool → warm across the globe ─────
  function particleColor(lat, lon, t) {
    // base hue derived from longitude band + time drift
    const hueShift = (lon + 180) / 360; // 0-1
    const latFactor = (lat + 90) / 180; // 0-1

    // Palette inspired by NSO: cyan-blue at bottom, pink-purple mid, teal-green top
    const hue = (200 + hueShift * 140 + latFactor * 60 + t * 8) % 360;
    const sat = 80 + latFactor * 20;
    const lum = 55 + Math.sin(t * 0.3 + lon * 0.05) * 15;
    return `hsl(${hue},${sat}%,${lum}%)`;
  }

  // ── Generate particles ───────────────────────────────
  const PARTICLE_COUNT = 5000;
  const particles = [];

  // Fibonacci sphere for even distribution
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const y = 1 - (i / (PARTICLE_COUNT - 1)) * 2; // -1 to 1
    const r = Math.sqrt(1 - y * y);
    const theta = goldenAngle * i;
    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;

    const lat = Math.asin(y) * 180 / Math.PI;
    const lon = Math.atan2(z, x) * 180 / Math.PI;

    const isLand = onContinent(lat, lon);

    // Size: land dots slightly bigger
    const size = isLand
      ? 1.2 + Math.random() * 1.4
      : 0.5 + Math.random() * 0.6;

    // Brightness boost for land
    const brightness = isLand ? 1.0 : 0.28 + Math.random() * 0.18;

    particles.push({ x, y, z, lat, lon, size, isLand, brightness,
      phase: Math.random() * Math.PI * 2 });
  }

  // ── Add extra dense land particles ──────────────────
  for (let i = 0; i < 2000; i++) {
    const lat = (Math.random() - 0.5) * 180;
    const lon = (Math.random() - 0.5) * 360;
    if (!onContinent(lat, lon)) continue;

    const phi   = (90 - lat) * Math.PI / 180;
    const theta = lon * Math.PI / 180;
    particles.push({
      x: Math.sin(phi) * Math.cos(theta),
      y: Math.cos(phi),
      z: Math.sin(phi) * Math.sin(theta),
      lat, lon,
      size: 1.0 + Math.random() * 1.8,
      isLand: true,
      brightness: 1.0,
      phase: Math.random() * Math.PI * 2,
    });
  }

  // ── Canvas / dimensions ──────────────────────────────
  let W, H, R, cx, cy;
  let rotY = 0;
  let mouseX = 0, mouseY = 0;
  let isDragging = false;
  let lastMX = 0;
  let autoSpin = true;

  function resize() {
    const dpr  = window.devicePixelRatio || 1;
    const size = Math.min(canvas.clientWidth, canvas.clientHeight);
    canvas.width  = size * dpr;
    canvas.height = size * dpr;
    W = canvas.width;
    H = canvas.height;
    R  = W * 0.40;
    cx = W * 0.5;
    cy = H * 0.5;
  }

  // ── 3-D rotation (Y axis only) ───────────────────────
  function rotateY(px, py, pz, a) {
    return {
      x: px * Math.cos(a) + pz * Math.sin(a),
      y: py,
      z: -px * Math.sin(a) + pz * Math.cos(a),
    };
  }

  // ── Draw ─────────────────────────────────────────────
  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Soft glow background under the globe
    const grad = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.05);
    grad.addColorStop(0,   'rgba(10,18,40,0.55)');
    grad.addColorStop(0.6, 'rgba(5,8,20,0.3)');
    grad.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.05, 0, Math.PI * 2);
    ctx.fill();

    // Sort particles back-to-front
    const projected = particles.map(p => {
      const r = rotateY(p.x, p.y, p.z, rotY);
      return {
        sx: cx + r.x * R,
        sy: cy - r.y * R,
        sz: r.z,          // positive = front
        size: p.size,
        isLand: p.isLand,
        brightness: p.brightness,
        lat: p.lat,
        lon: p.lon,
        phase: p.phase,
      };
    }).sort((a, b) => a.sz - b.sz);

    // Draw particles
    projected.forEach(p => {
      // Depth fade: particles at back are dimmer
      const depthFactor = (p.sz + 1) * 0.5; // 0(back) - 1(front)
      if (depthFactor < 0.05) return;        // cull very back

      // Horizon fade (edge of globe)
      const edgeDist = Math.sqrt(
        Math.pow((p.sx - cx) / R, 2) + Math.pow((p.sy - cy) / R, 2)
      );
      const edgeFade = Math.max(0, 1 - edgeDist * 1.1);

      const alpha = depthFactor * edgeFade * p.brightness;
      if (alpha < 0.01) return;

      // Pulsing size for land particles
      const pulse = p.isLand
        ? 1 + 0.3 * Math.sin(t * 1.2 + p.phase)
        : 1;

      const color = particleColor(p.lat, p.lon, t);

      // Draw glow for prominent land particles
      if (p.isLand && depthFactor > 0.5 && p.size > 1.5) {
        const glowR = p.size * pulse * 3.5;
        const grd = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, glowR);
        grd.addColorStop(0,   `hsla(${hueFromColor(color)},90%,75%,${alpha * 0.35})`);
        grd.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, glowR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Core dot
      ctx.globalAlpha = Math.min(1, alpha);
      ctx.fillStyle   = color;
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, p.size * pulse * 0.5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;

    // Atmosphere ring
    const atm = ctx.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.12);
    atm.addColorStop(0,   'rgba(60,120,255,0.12)');
    atm.addColorStop(0.5, 'rgba(80,200,255,0.06)');
    atm.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = atm;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.12, 0, Math.PI * 2);
    ctx.fill();

    t += 0.016;
  }

  // Helper: extract hue number from hsl string
  function hueFromColor(hsl) {
    return parseFloat(hsl.replace('hsl(', ''));
  }

  // ── Animation loop ───────────────────────────────────
  function tick() {
    if (autoSpin) rotY += 0.003;
    draw();
    requestAnimationFrame(tick);
  }

  // ── Drag to rotate ───────────────────────────────────
  canvas.addEventListener('mousedown', e => {
    isDragging = true;
    autoSpin   = false;
    lastMX     = e.clientX;
  });
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    rotY += (e.clientX - lastMX) * 0.005;
    lastMX = e.clientX;
  });
  window.addEventListener('mouseup', () => {
    isDragging = false;
    // resume auto-spin after 2s
    setTimeout(() => { autoSpin = true; }, 2000);
  });

  // Touch support
  canvas.addEventListener('touchstart', e => {
    isDragging = true;
    autoSpin   = false;
    lastMX     = e.touches[0].clientX;
  }, { passive: true });
  canvas.addEventListener('touchmove', e => {
    if (!isDragging) return;
    rotY += (e.touches[0].clientX - lastMX) * 0.005;
    lastMX = e.touches[0].clientX;
  }, { passive: true });
  canvas.addEventListener('touchend', () => {
    isDragging = false;
    setTimeout(() => { autoSpin = true; }, 2000);
  });

  window.addEventListener('resize', resize);
  resize();
  tick();
})();

// ── SCROLL REVEAL ──────────────────────────
const revealEls = document.querySelectorAll(
  '.cap-card, .brief-card, .pillar, .about-card, .stat'
);
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach((el, i) => {
  el.style.opacity    = '0';
  el.style.transform  = 'translateY(20px)';
  el.style.transition = `opacity 0.5s ease ${i * 0.05}s, transform 0.5s ease ${i * 0.05}s`;
  observer.observe(el);
});
