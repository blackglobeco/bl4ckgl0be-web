/* ═══════════════════════════════════════════
   BLACK GLOBE — main.js
   Globe canvas animation + UI interactions
   ═══════════════════════════════════════════ */

// ── NAVBAR SCROLL ──────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ── MOBILE NAV TOGGLE ──────────────────────
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ── GLOBE CANVAS ───────────────────────────
(function () {
  const canvas = document.getElementById('globeCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, R, cx, cy;
  let angle = 0;
  let animId;

  function resize() {
    const size = canvas.clientWidth * window.devicePixelRatio;
    canvas.width = size;
    canvas.height = size;
    W = canvas.width;
    H = canvas.height;
    R = W * 0.42;
    cx = W / 2;
    cy = H / 2;
  }

  // Project a lat/lon on a rotating sphere to 2D
  function project(lat, lon, rotY) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + rotY * 180 / Math.PI) * Math.PI / 180;
    const x = R * Math.sin(phi) * Math.cos(theta);
    const y = R * Math.cos(phi);
    const z = R * Math.sin(phi) * Math.sin(theta);
    return { x: cx + x, y: cy - y, z };
  }

  function drawGreatCircle(lat1, lon1, lat2, lon2, steps, rotY) {
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lat = lat1 + (lat2 - lat1) * t;
      const lon = lon1 + (lon2 - lon1) * t;
      points.push(project(lat, lon, rotY));
    }

    let started = false;
    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      if (p.z < 0) {          // behind the globe
        started = false;
        continue;
      }
      if (!started) {
        ctx.moveTo(p.x, p.y);
        started = true;
      } else {
        ctx.lineTo(p.x, p.y);
      }
    }
    ctx.stroke();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    const rotY = angle;

    // Outer circle
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(240,237,232,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Latitude lines
    const latLines = [-60, -45, -30, -15, 0, 15, 30, 45, 60];
    ctx.strokeStyle = 'rgba(240,237,232,0.25)';
    ctx.lineWidth = 0.8;
    latLines.forEach(lat => {
      const steps = 120;
      const points = [];
      for (let i = 0; i <= steps; i++) {
        const lon = -180 + (360 * i / steps);
        points.push(project(lat, lon, rotY));
      }
      let started = false;
      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (p.z < 0) { started = false; continue; }
        if (!started) { ctx.moveTo(p.x, p.y); started = true; }
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    });

    // Longitude lines
    const lonLines = Array.from({ length: 18 }, (_, i) => -165 + i * 20);
    ctx.strokeStyle = 'rgba(240,237,232,0.18)';
    ctx.lineWidth = 0.6;
    lonLines.forEach(lon => {
      drawGreatCircle(-85, lon, 85, lon, 80, rotY);
    });

    // Accent meridian — crimson
    const accentLon = 0;
    ctx.strokeStyle = 'rgba(180,20,20,0.5)';
    ctx.lineWidth = 1.2;
    drawGreatCircle(-85, accentLon, 85, accentLon, 80, rotY);

    // Equator accent
    ctx.strokeStyle = 'rgba(180,20,20,0.35)';
    ctx.lineWidth = 1.0;
    const eqPoints = [];
    for (let i = 0; i <= 120; i++) {
      const lon = -180 + (360 * i / 120);
      eqPoints.push(project(0, lon, rotY));
    }
    let eqStarted = false;
    ctx.beginPath();
    eqPoints.forEach(p => {
      if (p.z < 0) { eqStarted = false; return; }
      if (!eqStarted) { ctx.moveTo(p.x, p.y); eqStarted = true; }
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // Pulse dots at key cities
    const nodes = [
      { lat: 51.5, lon: -0.1 },   // London
      { lat: 40.7, lon: -74 },    // New York
      { lat: 35.6, lon: 139.7 },  // Tokyo
      { lat: -33.9, lon: 18.4 },  // Cape Town
      { lat: 25.2, lon: 55.3 },   // Dubai
      { lat: 37.8, lon: -122.4 }, // San Francisco
      { lat: 55.7, lon: 37.6 },   // Moscow
      { lat: 1.3, lon: 103.8 },   // Singapore
    ];

    nodes.forEach(({ lat, lon }) => {
      const p = project(lat, lon, rotY);
      if (p.z < 0) return;
      const pulse = (Math.sin(Date.now() / 600 + lat) * 0.5 + 0.5);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2 + pulse * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,20,20,${0.3 + pulse * 0.5})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(240,237,232,0.9)';
      ctx.fill();
    });
  }

  function tick() {
    angle += 0.003;
    draw();
    animId = requestAnimationFrame(tick);
  }

  window.addEventListener('resize', () => {
    resize();
  });

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
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = `opacity 0.5s ease ${i * 0.05}s, transform 0.5s ease ${i * 0.05}s`;
  observer.observe(el);
});
