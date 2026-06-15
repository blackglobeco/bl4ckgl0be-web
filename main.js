/* ═══════════════════════════════════════════
   BLACK GLOBE — main.js
   ═══════════════════════════════════════════ */

// ── Mobile nav toggle ──────────────────────
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.classList.toggle('active', isOpen);
  navToggle.setAttribute('aria-expanded', isOpen);
});

navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Close nav on outside tap (mobile)
document.addEventListener('click', (e) => {
  if (navLinks.classList.contains('open') &&
      !navLinks.contains(e.target) &&
      !navToggle.contains(e.target)) {
    navLinks.classList.remove('open');
    navToggle.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
  }
});

// ── Animated Background Canvas ─────────────
(function () {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Reduce particles on mobile for performance
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ||
                   window.innerWidth < 768;

  let width, height;
  const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);

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

  // Debounced resize to avoid thrashing on mobile orientation change
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resizeCanvas();
      particles = createParticles();
    }, 150);
  });

  // ── Create particles ──
  function createParticles() {
    const particles = [];
    // Fewer particles on mobile
    const maxCount = isMobile ? 50 : 110;
    const density  = isMobile ? 18000 : 12000;
    const count    = Math.min(maxCount, Math.floor((width * height) / density));
    for (let i = 0; i < count; i++) {
      const hasOrbit = !isMobile && Math.random() < 0.22; // skip orbits on mobile
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

  // ── Pause when tab/page hidden (saves battery on mobile) ──
  let paused = false;
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
    if (!paused) requestAnimationFrame(animate);
  });

  // ── Animation loop ──
  function animate(time) {
    if (paused) return;

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
    const connDist = isMobile ? 110 : 140;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const o = particles[j];
        const dx = p.x - o.x;
        const dy = p.y - o.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < connDist) {
          const opacity = ((connDist - dist) / connDist) * 0.32;
          const pulse   = Math.sin(time * 0.0022 + dist * 0.012) * 0.3 + 0.7;

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(o.x, o.y);
          ctx.strokeStyle = `rgba(255,255,255,${opacity * pulse})`;
          ctx.lineWidth = Math.max(0.4, opacity * 2.2);
          ctx.stroke();

          // Data packets — skip on mobile for performance
          if (!isMobile && dist < 100 && Math.random() < 0.015) {
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

      // Orbiting electron (desktop only)
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



// ── IP Identity Widget (c99.nl methods) ───
(function () {
  const dot = document.getElementById('globeDot');
  if (!dot) return;

  // Shim helpers
  function shimmer(id) {
    const el = document.getElementById(id);
    if (el) { el.textContent = '—'; el.classList.add('shimmer'); }
  }
  function setVal(id, text, cls) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text || 'N/A';
    el.classList.remove('shimmer','type-residential','type-proxy','type-hosting','type-mobile');
    if (cls) el.classList.add(cls);
  }
  function setIP(text) {
    const el = document.getElementById('wIpAddr');
    if (!el) return;
    el.textContent = text || '—';
    el.classList.remove('shimmer');
  }

  const ids = ['wIpAddr','wIpType','wHostname','wIsp','wLocation','wLocalIp','wReferrer','wConnection'];
  ids.forEach(id => { if (id !== 'wIpAddr') shimmer(id); });

  // ── 1. Public IP + ISP + Location via ip-api.com (no key, CORS OK) ──
  fetch('https://ip-api.com/json/?fields=status,query,isp,org,city,regionName,country,mobile,proxy,hosting,reverse')
    .then(r => r.json())
    .then(d => {
      if (d.status !== 'success') throw new Error('bad status');

      setIP(d.query);

      // IP Type — exact labels matching c99.nl
      let typeLabel = 'Residential', typeCls = 'type-residential';
      if (d.hosting) { typeLabel = 'Hosting / Data Center'; typeCls = 'type-hosting'; }
      else if (d.proxy) { typeLabel = 'Proxy / VPN';         typeCls = 'type-proxy'; }
      else if (d.mobile){ typeLabel = 'Mobile';              typeCls = 'type-mobile'; }
      setVal('wIpType', typeLabel, typeCls);

      // Hostname (reverse DNS)
      setVal('wHostname', d.reverse || 'N/A');

      // ISP
      setVal('wIsp', d.isp || d.org || 'N/A');

      // Location — "City, Region, Country" like c99.nl
      const loc = [d.city, d.regionName, d.country].filter(Boolean).join(', ');
      setVal('wLocation', loc || 'N/A');
    })
    .catch(() => {
      setIP('Unavailable');
      ['wIpType','wHostname','wIsp','wLocation'].forEach(id => setVal(id, 'Unavailable'));
    });

  // ── 2. Referrer — from browser, same as c99.nl ──
  setVal('wReferrer', document.referrer || 'Direct Access / Not Provided');

  // ── 3. Local IP via WebRTC — exact same method as c99.nl ──
  (function getWebRTCIPs() {
    try {
      const pc = new (window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection)({ iceServers: [] });
      pc.createDataChannel('');
      pc.createOffer(sdp => pc.setLocalDescription(sdp, () => {}, () => {}), () => {});
      pc.onicecandidate = ice => {
        if (ice && ice.candidate && ice.candidate.candidate) {
          const ips = ice.candidate.candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/g) || [];
          const unique = [...new Set(ips)];
          if (unique.length) setVal('wLocalIp', unique.join(', '));
          pc.onicecandidate = null;
        }
      };
      setTimeout(() => {
        const el = document.getElementById('wLocalIp');
        if (el && el.classList.contains('shimmer')) setVal('wLocalIp', 'Not detected');
      }, 2000);
    } catch(e) {
      setVal('wLocalIp', 'API not supported');
    }
  })();

  // ── 4. Connection type — exact same as c99.nl ──
  (function getConnection() {
    const nc = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (nc) {
      const type  = nc.effectiveType ? nc.effectiveType.toUpperCase() : '';
      const speed = nc.downlink != null ? `, ↓${nc.downlink} Mbps` : '';
      setVal('wConnection', type + speed);
    } else {
      setVal('wConnection', 'API not supported');
    }
  })();

  // ── Toggle on tap (mobile) ──
  dot.addEventListener('click', e => {
    e.stopPropagation();
    dot.classList.toggle('panel-open');
  });
  document.addEventListener('click', () => dot.classList.remove('panel-open'));

})();
