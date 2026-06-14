/* ═══════════════════════════════════════════════
   BLACK GLOBE — main.js
   Architecture mirrors NSO Group:
   • Three.js WebGL particle globe in #container
   • Vanta-style fog on #fbg (header bg)
   • initStars() particle fields in content sections
   • AOS scroll reveals
   • Animated counters
   ═══════════════════════════════════════════════ */

// ══════════════════════════════════════════════
//  AOS INIT (same as NSO)
// ══════════════════════════════════════════════
AOS.init({
  once: true,
  offset: 60,
  duration: 900,
  easing: 'ease-out-cubic',
});

// ══════════════════════════════════════════════
//  HEADER — scroll class + mobile menu
// ══════════════════════════════════════════════
const header   = document.querySelector('header');
const tglmenu  = document.getElementById('tglmenu');
const menuEl   = document.getElementById('menu-header');

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

tglmenu.addEventListener('click', () => {
  menuEl.classList.toggle('open');
  tglmenu.classList.toggle('active');
});

// Close menu on link click
menuEl.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => {
    menuEl.classList.remove('open');
    tglmenu.classList.remove('active');
  })
);

// ══════════════════════════════════════════════
//  THREE.JS GLOBE — same technique as NSO
//  NSO calls: initGlobe("container", bg.png, particle.png, 0.9)
//  We build initGlobe() ourselves using Three.js r128
// ══════════════════════════════════════════════
function initGlobe(containerId, particleScale) {
  const container = document.getElementById(containerId);
  if (!container || typeof THREE === 'undefined') return;

  // ── Scene setup ──────────────────────────────
  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  camera.position.z = 2.6;

  // ── Continent polygon data [lat, lon] ─────────
  const POLYS = {
    na: [[70,-140],[72,-120],[70,-95],[72,-85],[68,-75],[62,-65],[55,-60],[47,-53],[43,-66],[40,-70],[35,-75],[30,-80],[25,-80],[20,-87],[15,-85],[10,-83],[8,-77],[8,-75],[10,-62],[12,-62],[15,-60],[20,-73],[22,-80],[25,-77],[30,-85],[35,-75],[38,-75],[42,-70],[47,-53],[52,-56],[58,-68],[62,-65],[65,-68],[68,-75],[70,-95],[72,-120],[70,-140]],
    gl: [[76,-73],[72,-22],[60,-44],[63,-52],[68,-54],[72,-57],[76,-68],[76,-73]],
    sa: [[10,-73],[8,-62],[5,-52],[0,-50],[-5,-35],[-10,-37],[-15,-39],[-20,-40],[-23,-43],[-28,-48],[-33,-53],[-38,-57],[-42,-63],[-46,-65],[-50,-68],[-55,-65],[-55,-60],[-52,-58],[-48,-65],[-43,-65],[-38,-62],[-33,-70],[-28,-70],[-20,-70],[-15,-75],[-5,-80],[0,-80],[5,-77],[8,-77],[10,-73]],
    eu: [[71,28],[70,20],[62,5],[52,2],[48,-5],[43,-9],[36,-9],[36,2],[38,15],[40,18],[42,28],[45,29],[47,22],[48,17],[50,14],[54,10],[56,10],[60,5],[62,5],[65,14],[68,16],[70,20],[71,28]],
    af: [[37,10],[36,2],[30,-10],[20,-17],[10,-17],[0,-10],[-5,10],[-10,15],[-20,35],[-26,33],[-34,18],[-34,27],[-28,32],[-20,35],[-10,40],[0,42],[5,41],[10,44],[15,40],[20,38],[25,35],[30,33],[35,25],[37,10]],
    as: [[70,140],[68,90],[65,60],[60,55],[55,50],[45,35],[40,26],[42,28],[38,27],[36,28],[36,36],[37,42],[38,48],[37,55],[22,60],[8,77],[10,80],[22,88],[22,92],[28,88],[28,85],[35,75],[40,70],[42,78],[42,87],[50,88],[55,80],[60,60],[65,60],[68,90],[70,140]],
    sea: [[5,100],[2,104],[0,108],[0,114],[3,114],[5,118],[5,120],[2,109],[0,104],[2,100],[5,100]],
    jp:  [[31,131],[33,131],[35,133],[38,141],[42,143],[44,144],[43,141],[38,140],[35,136],[33,131],[31,131]],
    au:  [[-16,123],[-14,130],[-14,136],[-12,136],[-14,142],[-16,145],[-20,148],[-24,152],[-28,153],[-32,152],[-38,146],[-38,140],[-34,135],[-32,130],[-25,115],[-22,114],[-18,122],[-16,123]],
    nz:  [[-36,174],[-38,176],[-42,172],[-44,171],[-42,172],[-38,175],[-36,174]],
    uk:  [[50,-5],[51,1],[53,1],[55,-2],[58,-3],[60,-1],[57,-6],[54,-5],[52,-4],[50,-5]],
  };

  function inPoly(lat, lon, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [yi, xi] = poly[i], [yj, xj] = poly[j];
      if (((yi > lat) !== (yj > lat)) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)
        inside = !inside;
    }
    return inside;
  }
  function onLand(lat, lon) {
    for (const p of Object.values(POLYS)) if (inPoly(lat, lon, p)) return true;
    return false;
  }

  // ── Build particles ─────────────────────────
  const TOTAL = window.innerWidth < 600 ? 5000 : 9000;
  const positions = [];
  const colors    = [];
  const sizes     = [];

  // Fibonacci sphere distribution
  const PHI = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < TOTAL; i++) {
    const y     = 1 - (i / (TOTAL - 1)) * 2;
    const r     = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = PHI * i;
    const x     = Math.cos(theta) * r;
    const z     = Math.sin(theta) * r;

    const lat  = Math.asin(y) * 180 / Math.PI;
    const lon  = Math.atan2(z, x) * 180 / Math.PI;
    const land = onLand(lat, lon);

    positions.push(x, y, z);

    // Color: NSO palette — cyan→blue→purple→magenta→teal by lat/lon
    const lf  = (lat + 90) / 180;           // 0=south, 1=north
    const lof = ((lon + 180) / 360);
    const hue = (175 + lf * 110 + lof * 85) % 360;
    const sat = 0.85;
    const lum = land ? 0.55 + Math.random() * 0.25 : 0.12 + Math.random() * 0.1;

    // HSL to RGB
    const [r2, g2, b2] = hslToRgb(hue / 360, sat, lum);
    colors.push(r2, g2, b2);

    // Size: land dots bigger
    sizes.push(land
      ? (4.5 + Math.random() * 3.5) * particleScale
      : (1.2 + Math.random() * 0.8) * particleScale
    );
  }

  // Extra dense land fill
  for (let i = 0; i < 3000; i++) {
    const lat = (Math.random() - 0.5) * 160;
    const lon = (Math.random() - 0.5) * 360;
    if (!onLand(lat, lon)) continue;

    const phi   = (90 - lat) * Math.PI / 180;
    const theta = lon * Math.PI / 180;
    positions.push(
      Math.sin(phi) * Math.cos(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.sin(theta)
    );
    const lf  = (lat + 90) / 180;
    const lof = ((lon + 180) / 360);
    const hue = (175 + lf * 110 + lof * 85) % 360;
    const [r2, g2, b2] = hslToRgb(hue / 360, 0.9, 0.65 + Math.random() * 0.2);
    colors.push(r2, g2, b2);
    sizes.push((5.5 + Math.random() * 4) * particleScale);
  }

  // ── Three.js BufferGeometry ─────────────────
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors,    3));
  geo.setAttribute('size',     new THREE.Float32BufferAttribute(sizes,     1));

  const mat = new THREE.ShaderMaterial({
    vertexColors: true,
    transparent:  true,
    depthWrite:   false,
    uniforms: {
      uTime:       { value: 0 },
      uPixelRatio: { value: renderer.getPixelRatio() },
    },
    vertexShader: `
      attribute float size;
      varying vec3 vColor;
      uniform float uTime;
      uniform float uPixelRatio;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float pulse = 1.0 + 0.18 * sin(uTime * 1.4 + position.x * 8.0 + position.y * 6.0);
        gl_PointSize = size * pulse * uPixelRatio * (300.0 / -mv.z);
        gl_Position  = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.1, d);
        // Glow: brighten center
        vec3 c = vColor + (1.0 - vColor) * smoothstep(0.4, 0.0, d) * 0.5;
        gl_FragColor = vec4(c, alpha * 0.92);
      }
    `,
  });

  const globe = new THREE.Points(geo, mat);
  scene.add(globe);

  // ── City connection arcs (Three.js Line) ────
  const CITIES = [
    { lat: 51.5,  lon: -0.1   },  // London
    { lat: 40.7,  lon: -74    },  // New York
    { lat: 35.6,  lon: 139.7  },  // Tokyo
    { lat: 25.2,  lon: 55.3   },  // Dubai
    { lat: 37.8,  lon: -122.4 },  // San Francisco
    { lat: 55.7,  lon: 37.6   },  // Moscow
    { lat: 1.3,   lon: 103.8  },  // Singapore
    { lat: -33.9, lon: 151.2  },  // Sydney
    { lat: 48.8,  lon: 2.3    },  // Paris
    { lat: 19.4,  lon: -99.1  },  // Mexico City
  ];
  const ARCS = [[0,1],[1,4],[0,8],[2,6],[3,6],[5,0],[7,6],[4,9],[1,9],[3,0]];

  function latLonTo3D(lat, lon, r) {
    const phi   = (90 - lat) * Math.PI / 180;
    const theta = lon * Math.PI / 180;
    return new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
  }

  // Build arc curves
  const arcMeshes = ARCS.map(([ai, bi]) => {
    const a = latLonTo3D(CITIES[ai].lat, CITIES[ai].lon, 1.01);
    const b = latLonTo3D(CITIES[bi].lat, CITIES[bi].lon, 1.01);
    const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(1.35);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const pts   = curve.getPoints(60);
    const g     = new THREE.BufferGeometry().setFromPoints(pts);
    const m     = new THREE.LineBasicMaterial({ color: 0x004488, transparent: true, opacity: 0.18 });
    return { mesh: new THREE.Line(g, m), curve, pts };
  });
  arcMeshes.forEach(a => scene.add(a.mesh));

  // Traveling dots along arcs
  const dotGeo = new THREE.SphereGeometry(0.006, 6, 6);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0x00ccff });
  const dots   = arcMeshes.map((a, i) => {
    const d = new THREE.Mesh(dotGeo, dotMat.clone());
    d._arc   = a.curve;
    d._phase = i * (1 / arcMeshes.length);
    scene.add(d);
    return d;
  });

  // City glow dots
  CITIES.forEach(c => {
    const pos = latLonTo3D(c.lat, c.lon, 1.01);
    const g   = new THREE.SphereGeometry(0.008, 8, 8);
    const m   = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.copy(pos);
    scene.add(mesh);
  });

  // ── Atmosphere (same glow NSO globe has) ────
  const atmGeo = new THREE.SphereGeometry(1.06, 64, 64);
  const atmMat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.BackSide,
    uniforms: { uColor: { value: new THREE.Color(0x0044aa) } },
    vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      uniform vec3 uColor;
      void main() {
        float intensity = pow(0.55 - dot(vNormal, vec3(0.0,0.0,1.0)), 3.0);
        gl_FragColor = vec4(uColor, intensity * 0.55);
      }
    `,
  });
  scene.add(new THREE.Mesh(atmGeo, atmMat));

  // ── Mouse drag rotation ──────────────────────
  let isDragging = false, lastX = 0, velX = 0;
  let autoRotate = true;

  renderer.domElement.addEventListener('mousedown', e => {
    isDragging = true; autoRotate = false; lastX = e.clientX; velX = 0;
  });
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    velX = (e.clientX - lastX) * 0.004;
    globe.rotation.y += velX;
    arcMeshes.forEach(a => a.mesh.rotation.y += velX);
    dots.forEach(d => d._rotOffset = (d._rotOffset || 0) + velX);
    lastX = e.clientX;
  });
  window.addEventListener('mouseup', () => {
    isDragging = false;
    setTimeout(() => { autoRotate = true; }, 1800);
  });

  renderer.domElement.addEventListener('touchstart', e => {
    isDragging = true; autoRotate = false; lastX = e.touches[0].clientX;
  }, { passive: true });
  renderer.domElement.addEventListener('touchmove', e => {
    if (!isDragging) return;
    const dx = (e.touches[0].clientX - lastX) * 0.004;
    globe.rotation.y += dx; lastX = e.touches[0].clientX;
  }, { passive: true });
  renderer.domElement.addEventListener('touchend', () => {
    isDragging = false;
    setTimeout(() => { autoRotate = true; }, 1800);
  });

  // ── Resize ───────────────────────────────────
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mat.uniforms.uPixelRatio.value = renderer.getPixelRatio();
  });

  // ── Animation loop ───────────────────────────
  let clock = new THREE.Clock();
  let arcT  = 0;

  function animate() {
    requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    mat.uniforms.uTime.value = elapsed;

    if (autoRotate && !isDragging) {
      globe.rotation.y += 0.0024;
    }

    // Sync arc meshes + atmosphere rotation to globe
    arcMeshes.forEach(a => {
      a.mesh.rotation.y = globe.rotation.y;
    });

    // Animate traveling dots
    arcT = (arcT + 0.004) % 1;
    dots.forEach((d, i) => {
      const t   = (arcT + d._phase) % 1;
      const pos = d._arc.getPoint(t);
      // Apply globe rotation
      const angle = globe.rotation.y;
      const cx = pos.x * Math.cos(angle) + pos.z * Math.sin(angle);
      const cz = -pos.x * Math.sin(angle) + pos.z * Math.cos(angle);
      d.position.set(cx, pos.y, cz);
    });

    renderer.render(scene, camera);
  }
  animate();
}

// ── HSL helper ───────────────────────────────
function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [r, g, b];
}

// ══════════════════════════════════════════════
//  INIT GLOBE — same call pattern as NSO
// ══════════════════════════════════════════════
const isMobile = window.innerWidth < 600;
initGlobe('container', isMobile ? 2 : 0.9);

// ══════════════════════════════════════════════
//  initStars() — particle canvas for content sections
//  Same as NSO's initStars("starsb", null, particle.png, 2.0, 10000, 0.2)
//  We replicate the effect with Canvas 2D
// ══════════════════════════════════════════════
function initStars(containerId, count = 800, speed = 0.18, size = 1.6) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let W, H, stars = [];

  function resize() {
    W = canvas.width  = container.offsetWidth  || window.innerWidth;
    H = canvas.height = container.offsetHeight || 400;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Spawn stars
  for (let i = 0; i < count; i++) {
    stars.push({
      x:     Math.random() * W,
      y:     Math.random() * H,
      r:     0.3 + Math.random() * size,
      dx:    (Math.random() - 0.5) * speed,
      dy:    (Math.random() - 0.5) * speed,
      alpha: 0.1 + Math.random() * 0.6,
      dAlpha: (Math.random() - 0.5) * 0.005,
      // NSO-like colors: mostly white/light-blue with pink accents
      h: Math.random() < 0.15 ? 310 : (Math.random() < 0.5 ? 200 : 220),
      s: Math.random() < 0.15 ? 90  : 80,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    stars.forEach(s => {
      s.x = (s.x + s.dx + W) % W;
      s.y = (s.y + s.dy + H) % H;
      s.alpha = Math.max(0.05, Math.min(0.85, s.alpha + s.dAlpha));
      if (s.alpha <= 0.05 || s.alpha >= 0.85) s.dAlpha *= -1;

      const grd = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 2.5);
      grd.addColorStop(0, `hsla(${s.h},${s.s}%,80%,${s.alpha})`);
      grd.addColorStop(1, `hsla(${s.h},${s.s}%,60%,0)`);
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// Init star fields in content sections (same IDs as NSO)
initStars('stars-canvas', 600, 0.15, 1.4);
initStars('starsb',       1200, 0.2,  1.8);

// ══════════════════════════════════════════════
//  VANTA FOG SIMULATION on #fbg
//  NSO: VANTA.FOG({ el:"#fbg", highlightColor:0x000000,... speed:3.80 })
//  All-black config = barely visible, ultra-subtle fog
// ══════════════════════════════════════════════
(function fogEffect() {
  const el = document.getElementById('fbg');
  if (!el) return;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:100%;height:100%;';
  el.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let W, H;
  const blobs = Array.from({ length: 6 }, (_, i) => ({
    x: Math.random(),
    y: Math.random(),
    r: 0.3 + Math.random() * 0.4,
    dx: (Math.random() - 0.5) * 0.0003,
    dy: (Math.random() - 0.5) * 0.0002,
  }));

  function resize() {
    W = canvas.width  = el.offsetWidth  || window.innerWidth;
    H = canvas.height = el.offsetHeight || 80;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  function draw() {
    ctx.clearRect(0, 0, W, H);
    blobs.forEach(b => {
      b.x = (b.x + b.dx + 1) % 1;
      b.y = (b.y + b.dy + 1) % 1;
      const grd = ctx.createRadialGradient(b.x*W, b.y*H, 0, b.x*W, b.y*H, b.r * W);
      // All-black tones, very dim — same as NSO (all 0x000000 colors)
      grd.addColorStop(0, 'rgba(10,10,20,0.12)');
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
    });
    requestAnimationFrame(draw);
  }
  draw();
})();

// ══════════════════════════════════════════════
//  TECH CANVAS — animated signal network for section 2
// ══════════════════════════════════════════════
(function techCanvas() {
  const canvas = document.getElementById('techCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Network nodes
  const nodes = Array.from({ length: 28 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: 1.5 + Math.random() * 2,
    dx: (Math.random() - 0.5) * 0.4,
    dy: (Math.random() - 0.5) * 0.4,
    pulse: Math.random() * Math.PI * 2,
  }));

  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    t += 0.016;

    // Move nodes
    nodes.forEach(n => {
      n.x = (n.x + n.dx + W) % W;
      n.y = (n.y + n.dy + H) % H;
    });

    // Draw edges between close nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d > 160) continue;
        const alpha = (1 - d / 160) * 0.25;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.strokeStyle = `rgba(0,220,160,${alpha})`;
        ctx.lineWidth   = 0.7;
        ctx.stroke();
      }
    }

    // Draw nodes
    nodes.forEach(n => {
      const pulse = Math.sin(t * 1.5 + n.pulse) * 0.5 + 0.5;
      const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 3 + pulse * 4);
      grd.addColorStop(0, `rgba(0,255,180,${0.6 + pulse * 0.3})`);
      grd.addColorStop(1, 'rgba(0,255,180,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * 3 + pulse * 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,255,200,0.9)';
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }
  draw();
})();

// ══════════════════════════════════════════════
//  ANIMATED COUNTERS
// ══════════════════════════════════════════════
function animCounter(el) {
  if (el._counted) return;
  el._counted = true;
  const target = parseInt(el.dataset.target, 10);
  const dur    = 2000;
  const start  = performance.now();
  function step(now) {
    const p    = Math.min((now - start) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.floor(ease * target).toLocaleString();
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target.toLocaleString();
  }
  requestAnimationFrame(step);
}

const cntObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.querySelectorAll('[data-target]').forEach(animCounter);
  });
}, { threshold: 0.3 });

document.querySelectorAll('.stats-band, .panel-data').forEach(el => cntObs.observe(el));
