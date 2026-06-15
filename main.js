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

  function isIPv6(ip) { return ip && ip.indexOf(':') !== -1; }

  // ── Fetch all data in parallel ──
  // ipwho.is/  — gets whatever IP the browser uses (may be IPv6)
  // ipwho.is/  with forced IPv4 URL — we pass the IP from the first call
  //             but reversed: get IPv4 from a numeric-only URL trick

  // Strategy: fetch ipwho.is (gets geo + ISP + current IP)
  // Then separately fetch icanhazip.com/4 which is strictly IPv4-only via path
  Promise.allSettled([
    fetch('https://ipwho.is/').then(function(r){ return r.json(); }),
    fetch('https://ipv4.icanhazip.com').then(function(r){ return r.text(); })
  ]).then(function(results) {

    var geo   = results[0].status === 'fulfilled' ? results[0].value : null;
    var ipv4  = results[1].status === 'fulfilled' ? results[1].value.trim() : null;

    // Validate IPv4 result
    if (ipv4 && !/^\d{1,3}(\.\d{1,3}){3}$/.test(ipv4)) ipv4 = null;

    // Display: prefer IPv4 if we got it, else show whatever ipwho.is returns
    var displayIP = ipv4 || (geo && geo.ip) || 'Unavailable';
    document.getElementById('wIpAddr').textContent = displayIP;

    // IP type
    var ipType = 'Residential', cls = 'residential';
    if (geo && geo.connection) {
      var org = (geo.connection.org || '').toLowerCase();
      if (/vpn|proxy/i.test(org))                            { ipType = 'Proxy / VPN';   cls = 'proxy'; }
      else if (/hosting|cloud|data.?cent|server/i.test(org)) { ipType = 'Hosting / DC';  cls = 'hosting'; }
    }
    // If still showing IPv6, label it
    if (isIPv6(displayIP)) { ipType = 'IPv6 / Residential'; }
    setVal('wIpType', ipType, cls);
    setVal('wHostname', 'N/A');

    // ISP and Location from ipwho.is geo
    if (geo && geo.success) {
      var isp = (geo.connection && geo.connection.isp) ? geo.connection.isp : (geo.org || 'N/A');
      var loc = [geo.city, geo.region, geo.country].filter(Boolean).join(', ');
      setVal('wIsp',      isp);
      setVal('wLocation', loc || 'N/A');
    } else {
      setVal('wIsp',      'N/A');
      setVal('wLocation', 'N/A');
    }

    setVal('wReferrer', document.referrer || 'Direct Access / Not Provided');
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
