/* ═══════════════════════════════════════════
   BLACK GLOBE — main.js
   ═══════════════════════════════════════════ */

// ── Mobile nav toggle ──────────────────────
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');
navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ── Animated Background Canvas ─────────────
(function () {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width, height;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resizeCanvas() {
    width  = window.innerWidth;
    height = window.innerHeight;
    canvas.width  = Math.floor(width  * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width  = width  + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // ── Create particles ──
  function createParticles() {
    const particles = [];
    const count = Math.min(110, Math.floor((width * height) / 12000));
    for (let i = 0; i < count; i++) {
      const hasOrbit = Math.random() < 0.22;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        size: Math.random() * 2.4 + 1.2,
        baseOpacity: Math.random() * 0.5 + 0.25,
        phase: Math.random() * Math.PI * 2,
        hasOrbit,
        orbitRadius: hasOrbit ? Math.random() * 10 + 8 : 0,
        orbitSpeed:  (Math.random() - 0.5) * 0.06 + 0.03,
        orbitAngle:  Math.random() * Math.PI * 2,
      });
    }
    return particles;
  }

  let particles = createParticles();
  window.addEventListener('resize', () => { particles = createParticles(); });

  // ── Animation loop ──
  function animate(time) {
    // Motion-trail fade
    ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.fillRect(0, 0, width, height);

    // Deep vignette
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) / 1.4
    );
    gradient.addColorStop(0,    'rgba(22, 22, 24, 0.10)');
    gradient.addColorStop(0.55, 'rgba(9,  9,  11, 0.18)');
    gradient.addColorStop(1,    'rgba(0,  0,  0,  0.30)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // ── Connections ──
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const o = particles[j];
        const dx = p.x - o.x;
        const dy = p.y - o.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 140) {
          const opacity = ((140 - dist) / 140) * 0.32;
          const pulse   = Math.sin(time * 0.0022 + dist * 0.012) * 0.3 + 0.7;

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(o.x, o.y);
          ctx.strokeStyle = `rgba(255,255,255,${opacity * pulse})`;
          ctx.lineWidth = Math.max(0.4, opacity * 2.2);
          ctx.stroke();

          // Data packet
          if (dist < 100 && Math.random() < 0.015) {
            const progress = (Math.sin(time * 0.004 + dist) + 1) / 2;
            const px = p.x + (o.x - p.x) * progress;
            const py = p.y + (o.y - p.y) * progress;
            ctx.beginPath();
            ctx.arc(px, py, 1.6, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.shadowBlur = 8;
            ctx.shadowColor = 'rgba(255,255,255,0.8)';
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }
    }

    // ── Nodes ──
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0)      p.x = width;
      if (p.x > width)  p.x = 0;
      if (p.y < 0)      p.y = height;
      if (p.y > height) p.y = 0;

      const pulse   = 0.15 + 0.5 * (Math.sin(time * 0.001 + p.phase) + 1) / 2;
      const opacity = p.baseOpacity * pulse + 0.1;

      // Outer glow
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
      glow.addColorStop(0,   `rgba(255,255,255,${opacity * 0.55})`);
      glow.addColorStop(0.4, `rgba(220,220,230,${opacity * 0.25})`);
      glow.addColorStop(1,   'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${Math.min(1, opacity + 0.35)})`;
      ctx.fill();

      // Orbiting electron
      if (p.hasOrbit) {
        p.orbitAngle += p.orbitSpeed;
        const ex = p.x + Math.cos(p.orbitAngle) * p.orbitRadius;
        const ey = p.y + Math.sin(p.orbitAngle) * p.orbitRadius * 0.55;

        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.orbitRadius, p.orbitRadius * 0.55, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${opacity * 0.12})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(ex, ey, 1.3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${Math.min(1, opacity + 0.3)})`;
        ctx.fill();
      }
    });

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
})();
