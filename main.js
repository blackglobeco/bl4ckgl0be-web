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

  var dot      = document.getElementById('ipDot');
  var widget   = document.getElementById('ipWidget');
  var closeBtn = document.getElementById('ipWidgetClose');
  if (!dot || !widget) return;

  // ── Position dot over globe centre ──
  function placeDot() {
    var g = document.querySelector('.globe-img');
    if (!g) return;
    var r = g.getBoundingClientRect();
    if (r.width === 0) return;
    dot.style.left = Math.round(r.left + r.width  * 0.5 - 6) + 'px';
    dot.style.top  = Math.round(r.top  + r.height * 0.5 - 6) + 'px';
  }
  placeDot();
  window.addEventListener('load', placeDot);
  window.addEventListener('resize', placeDot);
  var polls = 0;
  var poll = setInterval(function () {
    placeDot(); if (++polls > 15) clearInterval(poll);
  }, 200);

  // ── Position widget left of dot, never overlapping globe ──
  function placeWidget() {
    widget.style.visibility = 'hidden';
    widget.style.display = 'block';
    var ww = widget.offsetWidth  || 320;
    var wh = widget.offsetHeight || 320;
    widget.style.display = 'none';
    widget.style.visibility = '';
    var dr  = dot.getBoundingClientRect();
    var dcx = dr.left + 6, dcy = dr.top + 6;
    var vw  = window.innerWidth, vh = window.innerHeight;
    var pad = 16, navH = 70;
    var left = dcx - ww - 24;
    var top  = dcy - wh / 2;
    if (left < pad) left = dcx + 24;
    top  = Math.max(navH + pad, Math.min(vh - wh - pad, top));
    left = Math.max(pad, Math.min(vw - ww - pad, left));
    widget.style.top  = top  + 'px';
    widget.style.left = left + 'px';
  }

  // ── Toggle open/close ──
  var isOpen = false, justOpened = false;
  function openWidget()  { placeWidget(); widget.style.display = 'block'; isOpen = true; justOpened = true; setTimeout(function(){ justOpened = false; }, 0); }
  function closeWidget() { widget.style.display = 'none'; isOpen = false; }

  dot.addEventListener('click', function(e) { e.stopPropagation(); isOpen ? closeWidget() : openWidget(); });
  if (closeBtn) closeBtn.addEventListener('click', function(e) { e.stopPropagation(); closeWidget(); });
  document.addEventListener('click', function(e) {
    if (justOpened || !isOpen) return;
    if (!dot.contains(e.target) && !widget.contains(e.target)) closeWidget();
  });

  // ── Helper ──
  function setVal(id, text, cls) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = text || 'N/A';
    el.className = 'ipw-v' + (cls ? ' ' + cls : '');
  }

  // ── Fetch IP data — three HTTPS CORS APIs, tried in order ──
  // 1. ipwho.is   — HTTPS, no key, returns ip/isp/city/region/country/connection/type
  // 2. ipapi.co   — HTTPS, no key, returns ip/org/city/region/country/hostname
  // 3. freeipapi  — HTTPS, no key, last resort

  function tryIpwho() {
    return fetch('https://ipwho.is/')
      .then(function(r){ return r.json(); })
      .then(function(d){
        if (!d.success || !d.ip) throw new Error('ipwho fail');

        document.getElementById('wIpAddr').textContent = d.ip;

        var typeLabel = 'Residential', typeCls = 'residential';
        if (d.type === 'IPv6')                        { typeLabel = 'IPv6 Residential'; typeCls = 'residential'; }
        if (d.connection && d.connection.org) {
          var org = d.connection.org.toLowerCase();
          if (/vpn|proxy/i.test(org))                 { typeLabel = 'Proxy / VPN';    typeCls = 'proxy'; }
          else if (/hosting|cloud|datacenter/i.test(org)){ typeLabel = 'Hosting / DC'; typeCls = 'hosting'; }
        }
        setVal('wIpType',   typeLabel, typeCls);
        setVal('wHostname', 'N/A');   // ipwho doesn't provide reverse DNS
        setVal('wIsp',      (d.connection && d.connection.isp) ? d.connection.isp : (d.org || 'N/A'));
        var loc = [d.city, d.region, d.country].filter(Boolean).join(', ');
        setVal('wLocation', loc || 'N/A');
        // Referrer from browser
        setVal('wReferrer', document.referrer || 'Direct Access / Not Provided');
      });
  }

  function tryIpapi() {
    return fetch('https://ipapi.co/json/')
      .then(function(r){ return r.json(); })
      .then(function(d){
        if (!d.ip) throw new Error('ipapi fail');

        document.getElementById('wIpAddr').textContent = d.ip;

        setVal('wIpType',   'Residential', 'residential');
        setVal('wHostname', d.hostname || 'N/A');
        setVal('wIsp',      d.org || d.asn || 'N/A');
        var loc = [d.city, d.region, d.country_name].filter(Boolean).join(', ');
        setVal('wLocation', loc || 'N/A');
        setVal('wReferrer', document.referrer || 'Direct Access / Not Provided');
      });
  }

  function tryFreeipapi() {
    return fetch('https://freeipapi.com/api/json')
      .then(function(r){ return r.json(); })
      .then(function(d){
        if (!d.ipAddress) throw new Error('freeipapi fail');

        document.getElementById('wIpAddr').textContent = d.ipAddress;

        setVal('wIpType',   'Residential', 'residential');
        setVal('wHostname', 'N/A');
        setVal('wIsp',      d.ispName || 'N/A');
        var loc = [d.cityName, d.regionName, d.countryName].filter(Boolean).join(', ');
        setVal('wLocation', loc || 'N/A');
        setVal('wReferrer', document.referrer || 'Direct Access / Not Provided');
      });
  }

  // Try each in sequence until one succeeds
  tryIpwho()
    .catch(function(){ return tryIpapi(); })
    .catch(function(){ return tryFreeipapi(); })
    .catch(function(){
      document.getElementById('wIpAddr').textContent = 'Unavailable';
      setVal('wReferrer', document.referrer || 'Direct Access / Not Provided');
    });

  // ── Connection — navigator.connection (same method as c99.nl) ──
  var nc = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (nc) {
    var ct = (nc.effectiveType || '').toUpperCase();
    var dl = nc.downlink != null ? ', \u2193' + nc.downlink + ' Mbps' : '';
    setVal('wConnection', ct + dl);
  } else {
    setVal('wConnection', 'N/A');
  }

  // ── Local IP — WebRTC (same method as c99.nl) ──
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
  } catch(e) { setVal('wLocalIp', 'Not supported'); }

})();
