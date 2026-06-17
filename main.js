/* ═══════════════════════════════════════════
   BLACK GLOBE — main.js
   ═══════════════════════════════════════════ */

// ── Mobile nav toggle ──────────────────────
var navToggle = document.getElementById('navToggle');
var navLinks  = document.getElementById('navLinks');

function setDotVisibility(visible) {
  var dot = document.getElementById('ipDot');
  if (!dot) return;
  dot.style.opacity       = visible ? '' : '0';
  dot.style.pointerEvents = visible ? '' : 'none';
}

function openNav() {
  navLinks.classList.add('open');
  navToggle.classList.add('active');
  navToggle.setAttribute('aria-expanded', 'true');
  document.body.classList.add('nav-open');
  setDotVisibility(false);
}

function closeNav() {
  navLinks.classList.remove('open');
  navToggle.classList.remove('active');
  navToggle.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('nav-open');
  setDotVisibility(true);
}

navToggle.addEventListener('click', function () {
  navLinks.classList.contains('open') ? closeNav() : openNav();
});
navLinks.querySelectorAll('a').forEach(function (a) {
  // Don't close the nav when tapping the Contact or Platforms trigger on mobile
  if (a.id === 'contactTrigger' || a.id === 'platformsTrigger') return;
  a.addEventListener('click', closeNav);
});
document.addEventListener('click', function (e) {
  if (navLinks.classList.contains('open') &&
      !navLinks.contains(e.target) &&
      !navToggle.contains(e.target)) {
    closeNav();
  }
});

// ── Platforms dropdown ──────────────────────
(function () {
  var trigger  = document.getElementById('platformsTrigger');
  var dropdown = document.getElementById('platformsDropdown');
  if (!trigger || !dropdown) return;

  // Position dropdown under the trigger (desktop)
  function positionDropdown() {
    if (window.innerWidth > 768) {
      var rect = trigger.getBoundingClientRect();
      dropdown.style.left = rect.left + 'px';
    } else {
      dropdown.style.left = '';
    }
  }

  function openDropdown() {
    positionDropdown();
    dropdown.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
  }
  function closeDropdown() {
    dropdown.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
  }

  trigger.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    dropdown.classList.contains('is-open') ? closeDropdown() : openDropdown();
  });

  // Close on outside click
  document.addEventListener('click', function (e) {
    if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
      closeDropdown();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDropdown();
  });

  // Close platforms dropdown when a sub-item is clicked
  dropdown.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      closeDropdown();
    });
  });
})();

// ── Contact dropdown ──────────────────────
(function () {
  var trigger  = document.getElementById('contactTrigger');
  var dropdown = document.getElementById('contactDropdown');
  if (!trigger || !dropdown) return;

  function openDropdown() {
    dropdown.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
  }
  function closeDropdown() {
    dropdown.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
  }

  trigger.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    dropdown.classList.contains('is-open') ? closeDropdown() : openDropdown();
  });

  // Close on outside click
  document.addEventListener('click', function (e) {
    if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
      closeDropdown();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDropdown();
  });
})();

// ── Smooth scroll for internal anchor nav links ──────
document.querySelectorAll('a.nav-scroll').forEach(function (link) {
  link.addEventListener('click', function (e) {
    var href = this.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    var target = document.querySelector(href);
    if (!target) return;
    e.preventDefault();

    navLinks.classList.remove('open');
    navToggle.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var isMobile = window.innerWidth <= 768;
        if (isMobile) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          var navH = parseInt(
            getComputedStyle(document.documentElement)
              .getPropertyValue('--nav-h')
          ) || 64;
          var top = target.getBoundingClientRect().top + window.pageYOffset - navH;
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
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

    var navIsOpen = document.body.classList.contains('nav-open');
    if (offScreen) {
      dot.style.opacity = '0';
      dot.style.pointerEvents = 'none';
      if (isOpen) closeWidget();
    } else {
      dot.style.opacity = navIsOpen ? '0' : '1';
      dot.style.pointerEvents = navIsOpen ? 'none' : '';
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
