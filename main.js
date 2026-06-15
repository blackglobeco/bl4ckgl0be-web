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
document.addEventListener('click', (e) => {
  if (navLinks.classList.contains('open') &&
      !navLinks.contains(e.target) &&
      !navToggle.contains(e.target)) {
    navLinks.classList.remove('open');
    navToggle.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
  }
});

// ── IP Widget ──────────────────────────────
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

  // ── Position widget LEFT of dot ──
  function placeWidget() {
    widget.style.visibility = 'hidden';
    widget.style.display    = 'block';
    var ww = widget.offsetWidth  || 320;
    var wh = widget.offsetHeight || 320;
    widget.style.display    = 'none';
    widget.style.visibility = '';
    var dr   = dot.getBoundingClientRect();
    var dcx  = dr.left + 6, dcy = dr.top + 6;
    var vw   = window.innerWidth, vh = window.innerHeight;
    var pad  = 16, navH = 72;
    var left = dcx - ww - 32;
    var top  = dcy - wh / 2;
    if (left < pad) left = dcx + 32;
    top  = Math.max(navH + pad, Math.min(vh - wh - pad, top));
    left = Math.max(pad, Math.min(vw - ww - pad, left));
    widget.style.top  = Math.round(top)  + 'px';
    widget.style.left = Math.round(left) + 'px';
  }

  // ── Toggle ──
  var isOpen = false, justOpened = false;
  function openWidget() {
    placeWidget();
    widget.style.display = 'block';
    isOpen = true; justOpened = true;
    setTimeout(function () { justOpened = false; }, 0);
  }
  function closeWidget() { widget.style.display = 'none'; isOpen = false; }

  dot.addEventListener('click', function (e) {
    e.stopPropagation();
    isOpen ? closeWidget() : openWidget();
  });
  if (closeBtn) closeBtn.addEventListener('click', function (e) {
    e.stopPropagation(); closeWidget();
  });
  document.addEventListener('click', function (e) {
    if (justOpened || !isOpen) return;
    if (!dot.contains(e.target) && !widget.contains(e.target)) closeWidget();
  });

  // ── Helpers ──
  function setVal(id, text, cls) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = text || 'N/A';
    el.className = 'ipw-v' + (cls ? ' ' + cls : '');
  }

  function fillGeo(isp, location, ipType) {
    var cls = 'residential';
    if (/proxy|vpn/i.test(ipType))       cls = 'proxy';
    else if (/hosting|dc/i.test(ipType)) cls = 'hosting';
    else if (/mobile/i.test(ipType))     cls = 'mobile';
    setVal('wIpType',   ipType, cls);
    setVal('wHostname', 'N/A');
    setVal('wIsp',      isp || 'N/A');
    setVal('wLocation', location || 'N/A');
    setVal('wReferrer', document.referrer || 'Direct Access / Not Provided');
  }

  // Geo lookup for a specific IP — ordered by accuracy + reliability
  // 1. freeipapi.com  — no key, HTTPS, CORS, city+region+country+ISP, unlimited
  // 2. ipwho.is       — no key, HTTPS, CORS, full geo data
  function geoForIP(ip) {
    return fetch('https://freeipapi.com/api/json/' + ip)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || !d.ipAddress) throw new Error('freeipapi fail');
        var isp  = d.ispName || 'N/A';
        var loc  = [d.cityName, d.regionName, d.countryName].filter(Boolean).join(', ');
        var type = 'Residential';
        fillGeo(isp, loc, type);
      })
      .catch(function () {
        // Fallback: ipwho.is
        return fetch('https://ipwho.is/' + ip)
          .then(function (r) { return r.json(); })
          .then(function (g) {
            if (!g || !g.success) throw new Error('ipwho fail');
            var isp  = (g.connection && g.connection.isp) ? g.connection.isp : (g.org || 'N/A');
            var loc  = [g.city, g.region, g.country].filter(Boolean).join(', ');
            var type = 'Residential';
            if (g.connection) {
              var org = (g.connection.org || '').toLowerCase();
              if (/vpn|proxy/i.test(org))                            type = 'Proxy / VPN';
              else if (/hosting|cloud|data.?cent|server/i.test(org)) type = 'Hosting / DC';
            }
            fillGeo(isp, loc, type);
          });
      });
  }

  // ── STEP 1: ipv4.icanhazip.com — Cloudflare-owned, returns plain text IPv4 ──
  // ── STEP 2: pass that IPv4 to geo lookup ──
  fetch('https://ipv4.icanhazip.com')
    .then(function (r) { return r.text(); })
    .then(function (t) {
      var ipv4 = t.trim();
      if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ipv4)) throw new Error('not ipv4');
      document.getElementById('wIpAddr').textContent = ipv4;
      return geoForIP(ipv4);
    })
    .catch(function () {
      // icanhazip failed — try ipwho.is auto-detect as full fallback
      return fetch('https://ipwho.is/')
        .then(function (r) { return r.json(); })
        .then(function (g) {
          if (!g || !g.success || !g.ip) throw new Error('fail');
          document.getElementById('wIpAddr').textContent = g.ip;
          var isp = (g.connection && g.connection.isp) ? g.connection.isp : 'N/A';
          var loc = [g.city, g.region, g.country].filter(Boolean).join(', ');
          fillGeo(isp, loc, 'Residential');
        })
        .catch(function () {
          document.getElementById('wIpAddr').textContent = 'Unavailable';
          setVal('wReferrer', document.referrer || 'Direct Access / Not Provided');
        });
    });

  // ── Connection — navigator.connection (same as c99.nl) ──
  var nc = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (nc) {
    var ct = (nc.effectiveType || '').toUpperCase();
    var dl = nc.downlink != null ? ', \u2193' + nc.downlink + ' Mbps' : '';
    setVal('wConnection', ct + dl);
  } else {
    setVal('wConnection', 'N/A');
  }

  // ── Local IP — WebRTC (same as c99.nl) ──
  try {
    var pc = new (window.RTCPeerConnection || window.webkitRTCPeerConnection)({ iceServers: [] });
    pc.createDataChannel('');
    pc.createOffer(function (s) { pc.setLocalDescription(s, function(){}, function(){}); }, function(){});
    pc.onicecandidate = function (ice) {
      if (!ice || !ice.candidate || !ice.candidate.candidate) return;
      var m = ice.candidate.candidate.match(/([0-9]{1,3}(\.[0-9]{1,3}){3})/g) || [];
      var u = m.filter(function (v, i, a) { return a.indexOf(v) === i; });
      if (u.length) { setVal('wLocalIp', u.join(', ')); pc.onicecandidate = null; }
    };
    setTimeout(function () {
      var el = document.getElementById('wLocalIp');
      if (el && el.textContent === '—') setVal('wLocalIp', 'Not detected');
    }, 3000);
  } catch (e) { setVal('wLocalIp', 'Not supported'); }

})();
