/* ═══════════════════════════════════════════
   BLACK GLOBE — main.js
   ═══════════════════════════════════════════ */

// ── Mobile nav toggle ──────────────────────
var navToggle = document.getElementById('navToggle');
var navLinks  = document.getElementById('navLinks');

navToggle.addEventListener('click', function () {
  var isOpen = navLinks.classList.toggle('open');
  navToggle.classList.toggle('active', isOpen);
  navToggle.setAttribute('aria-expanded', String(isOpen));
});
navLinks.querySelectorAll('a').forEach(function (a) {
  a.addEventListener('click', function () {
    navLinks.classList.remove('open');
    navToggle.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});
document.addEventListener('click', function (e) {
  if (navLinks.classList.contains('open') &&
      !navLinks.contains(e.target) &&
      !navToggle.contains(e.target)) {
    navLinks.classList.remove('open');
    navToggle.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
  }
});

// ── Smooth scroll for internal anchor nav links ──────────────────────────────
// Strategy: close the nav first, wait two rAF cycles for layout to settle,
// then scroll to exactly (section.offsetTop − navH).
//
// WHY offsetTop and NOT getBoundingClientRect():
//   getBoundingClientRect() returns the position relative to the CURRENT
//   viewport — if the page has already scrolled, you get a wrong number.
//   offsetTop is always the absolute distance from the document top,
//   independent of scroll position. This is the reliable measurement.
//
// WHY navH subtraction and NOT scroll-margin-top:
//   scroll-margin-top on the section would double-subtract on mobile
//   (CSS subtracts navH, then JS subtracts navH again → lands too high).
//   With scroll-margin-top: 0 on .ci-page mobile and padding-top: 0,
//   the section top = content start, and JS places it exactly under nav.
document.querySelectorAll('a.nav-scroll').forEach(function (link) {
  link.addEventListener('click', function (e) {
    var href = this.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    var target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();

    // 1. Close the mobile nav dropdown
    navLinks.classList.remove('open');
    navToggle.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');

    // 2. Wait two animation frames for the nav to fully collapse and
    //    for any layout reflow to complete before measuring.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var navH = parseInt(
          getComputedStyle(document.documentElement)
            .getPropertyValue('--nav-h')
        ) || 60;

        // offsetTop = distance from section top to document top (absolute).
        // Subtract navH so the section top lands flush under the fixed navbar.
        var targetTop = target.offsetTop - navH;

        window.scrollTo({ top: targetTop, behavior: 'smooth' });
      });
    });
  });
});

// ── IP Widget ──────────────────────────────
(function () {

  var dot      = document.getElementById('ipDot');
  var widget   = document.getElementById('ipWidget');
  var closeBtn = document.getElementById('ipWidgetClose');
  if (!dot || !widget) return;

  var globeEl    = null;
  var rafId      = null;
  var isOpen     = false;
  var justOpened = false;

  function getGlobe() {
    if (!globeEl) globeEl = document.querySelector('.globe-img');
    return globeEl;
  }

  function updateDot() {
    var g = getGlobe();
    if (!g) return;
    var r = g.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;

    var cx = Math.round(r.left + r.width  * 0.5 - 6);
    var cy = Math.round(r.top  + r.height * 0.5 - 6);

    var offScreen = (cy < -12 || cy > window.innerHeight + 12 ||
                     cx < -12 || cx > window.innerWidth  + 12);

    if (offScreen) {
      dot.style.opacity = '0';
      dot.style.pointerEvents = 'none';
      if (isOpen) closeWidget();
    } else {
      dot.style.opacity = '1';
      dot.style.pointerEvents = '';
      dot.style.left = cx + 'px';
      dot.style.top  = cy + 'px';
      if (isOpen) repositionWidget();
    }
  }

  function onScroll() {
    if (rafId) return;
    rafId = requestAnimationFrame(function () {
      rafId = null;
      updateDot();
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  window.addEventListener('load',   updateDot);

  updateDot();
  var polls = 0;
  var poll = setInterval(function () {
    updateDot();
    if (++polls >= 20) clearInterval(poll);
  }, 200);

  function repositionWidget() {
    var dr  = dot.getBoundingClientRect();
    var dcx = dr.left + 6;
    var dcy = dr.top  + 6;
    var vw  = window.innerWidth;
    var vh  = window.innerHeight;
    var ww  = widget.offsetWidth  || 320;
    var wh  = widget.offsetHeight || 320;
    var pad = 16, navH = 72;

    var left = dcx - ww - 32;
    var top  = dcy - wh / 2;
    if (left < pad) left = dcx + 32;
    top  = Math.max(navH + pad, Math.min(vh - wh - pad, top));
    left = Math.max(pad,        Math.min(vw - ww - pad, left));

    widget.style.top  = Math.round(top)  + 'px';
    widget.style.left = Math.round(left) + 'px';
  }

  function placeWidget() {
    widget.style.visibility = 'hidden';
    widget.style.display    = 'block';
    repositionWidget();
    widget.style.visibility = '';
  }

  function openWidget() {
    placeWidget();
    widget.style.display = 'block';
    isOpen = true;
    justOpened = true;
    setTimeout(function () { justOpened = false; }, 0);
  }
  function closeWidget() {
    widget.style.display = 'none';
    isOpen = false;
  }

  dot.addEventListener('click', function (e) {
    e.stopPropagation();
    isOpen ? closeWidget() : openWidget();
  });
  if (closeBtn) closeBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    closeWidget();
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

  function geoForIP(ip) {
    return fetch('https://ipapi.co/' + ip + '/json/')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d || d.error) throw new Error('ipapi fail');
        var isp = d.org || d.asn || 'N/A';
        var loc = [d.city, d.region, d.country_name].filter(Boolean).join(', ');
        fillGeo(isp, loc, 'Residential');
      })
      .catch(function () {
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

  fetch('https://ipv4.icanhazip.com')
    .then(function (r) { return r.text(); })
    .then(function (t) {
      var ipv4 = t.trim();
      if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ipv4)) throw new Error('not ipv4');
      document.getElementById('wIpAddr').textContent = ipv4;
      return geoForIP(ipv4);
    })
    .catch(function () {
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

  var nc = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (nc) {
    var ct = (nc.effectiveType || '').toUpperCase();
    var dl = nc.downlink != null ? ', \u2193' + nc.downlink + ' Mbps' : '';
    setVal('wConnection', ct + dl);
  } else {
    setVal('wConnection', 'N/A');
  }

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
