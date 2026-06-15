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




// ── IP Widget — fixed overlay ──────────────
(function () {

  var dot    = document.getElementById('ipDot');
  var widget = document.getElementById('ipWidget');
  var closeBtn = document.getElementById('ipWidgetClose');
  if (!dot || !widget) return;

  // ── Position the dot over the globe centre ──
  function placeDot() {
    var globeImg = document.querySelector('.globe-img');
    if (!globeImg) return;
    var r = globeImg.getBoundingClientRect();
    var cx = r.left + r.width  * 0.5;
    var cy = r.top  + r.height * 0.5;
    dot.style.left = (cx - 6) + 'px';
    dot.style.top  = (cy - 6) + 'px';
  }

  placeDot();
  window.addEventListener('resize', placeDot);
  // Re-place after gif loads
  var gi = document.querySelector('.globe-img');
  if (gi) gi.addEventListener('load', placeDot);

  // ── Position widget near the dot ──
  function placeWidget() {
    var dr = dot.getBoundingClientRect();
    var cx = dr.left + 6; // dot center x
    var cy = dr.top  + 6; // dot center y
    var ww = widget.offsetWidth  || 320;
    var wh = widget.offsetHeight || 300;
    var vw = window.innerWidth;
    var vh = window.innerHeight;

    // Try above-centre first
    var top  = cy - wh - 20;
    var left = cx - ww / 2;

    // Clamp to viewport
    if (top < 10) top = cy + 24;            // flip below if off top
    if (left < 10) left = 10;
    if (left + ww > vw - 10) left = vw - ww - 10;
    if (top + wh > vh - 10) top = vh - wh - 10;

    widget.style.top  = top  + 'px';
    widget.style.left = left + 'px';
  }

  // ── Toggle widget ──
  var isOpen = false;
  function openWidget() {
    widget.style.display = 'block';
    placeWidget();
    isOpen = true;
  }
  function closeWidget() {
    widget.style.display = 'none';
    isOpen = false;
  }

  dot.addEventListener('click', function (e) {
    e.stopPropagation();
    isOpen ? closeWidget() : openWidget();
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      closeWidget();
    });
  }

  document.addEventListener('click', function (e) {
    if (isOpen && !widget.contains(e.target) && e.target !== dot) {
      closeWidget();
    }
  });

  // ── Fetch IP data ──
  function setVal(id, text, cls) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = text || 'N/A';
    el.className = 'ipw-v' + (cls ? ' ' + cls : '');
  }

  // ip-api.com — free, no key, CORS enabled
  fetch('https://ip-api.com/json/?fields=status,query,isp,org,city,regionName,country,mobile,proxy,hosting,reverse')
    .then(function(r){ return r.json(); })
    .then(function(d){
      if (d.status !== 'success') throw new Error('fail');

      document.getElementById('wIpAddr').textContent = d.query || '—';

      var typeLabel = 'Residential', typeCls = 'residential';
      if (d.hosting)     { typeLabel = 'Hosting / DC';  typeCls = 'hosting'; }
      else if (d.proxy)  { typeLabel = 'Proxy / VPN';   typeCls = 'proxy'; }
      else if (d.mobile) { typeLabel = 'Mobile';        typeCls = 'mobile'; }
      setVal('wIpType',   typeLabel, typeCls);
      setVal('wHostname', d.reverse || 'N/A');
      setVal('wIsp',      d.isp || d.org || 'N/A');
      var loc = [d.city, d.regionName, d.country].filter(Boolean).join(', ');
      setVal('wLocation', loc || 'N/A');
    })
    .catch(function(){
      document.getElementById('wIpAddr').textContent = 'Unavailable';
    });

  // Referrer
  setVal('wReferrer', document.referrer || 'Direct Access / Not Provided');

  // Connection type (navigator.connection — same as c99.nl)
  var nc = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (nc) {
    var ct = (nc.effectiveType || '').toUpperCase();
    var dl = nc.downlink != null ? ', \u2193' + nc.downlink + ' Mbps' : '';
    setVal('wConnection', ct + dl);
  } else {
    setVal('wConnection', 'API not supported');
  }

  // Local IP via WebRTC (same method as c99.nl)
  try {
    var pc = new (window.RTCPeerConnection || window.webkitRTCPeerConnection)({ iceServers: [] });
    pc.createDataChannel('');
    pc.createOffer(function(sdp){ pc.setLocalDescription(sdp, function(){}, function(){}); }, function(){});
    pc.onicecandidate = function(ice) {
      if (!ice || !ice.candidate || !ice.candidate.candidate) return;
      var m = ice.candidate.candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/g) || [];
      var uniq = m.filter(function(v,i,a){ return a.indexOf(v)===i; });
      if (uniq.length) { setVal('wLocalIp', uniq.join(', ')); pc.onicecandidate = null; }
    };
    setTimeout(function(){
      var el = document.getElementById('wLocalIp');
      if (el && el.textContent === '—') setVal('wLocalIp', 'Not detected');
    }, 3000);
  } catch(e) {
    setVal('wLocalIp', 'Not supported');
  }

})();
