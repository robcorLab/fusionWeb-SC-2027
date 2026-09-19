/* ============================================================
   SECTOR CREATIVO — hero3d.js
   Campo de partículas 3D estilo constelación creativa.
   - 4 capas: núcleo esférico + anillo orbital + fondo lejano + primer plano cercano
   - Capa cercana con paralaje amplificado y punto suave (bokeh) para
     simular profundidad de campo y blur de movimiento
   - Líneas de constelación (pares cercanos, calculadas 1 sola vez)
   - Reacción al scroll (profundidad) y parallax con el mouse
   - Conteo de partículas adaptativo por viewport + DPR < 2 en móvil
   - Fallback elegante si WebGL o el CDN fallan
   Design by RobCorLab
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('hero3d');
  if (!canvas) return;

  if (typeof window.THREE === 'undefined') return;
  if (!window.WebGLRenderingContext) return;

  var renderer, scene, camera, group;
  var particles, particles2, bgPoints, fgPoints, lines;
  var mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rafId = null;
  var hidden = false;

  var COLORS = [
    new THREE.Color(0xff4444),
    new THREE.Color(0xffcc00),
    new THREE.Color(0x44ffcc),
    new THREE.Color(0xff44aa)
  ];

  function countsFor(w) {
    if (w < 480)  return { core: 500,  ring: 160, bg: 260,  fg: 50,  lineNodes: 60 };
    if (w < 768)  return { core: 750,  ring: 220, bg: 380,  fg: 80,  lineNodes: 90 };
    if (w < 1280) return { core: 1100, ring: 300, bg: 500,  fg: 120, lineNodes: 130 };
    return           { core: 1400, ring: 350, bg: 600,  fg: 160, lineNodes: 170 };
  }

  function buildCore(count) {
    var geo = new THREE.BufferGeometry();
    var positions = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      var radius = 2.4 + Math.random() * 1.8;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.7;
      positions[i * 3 + 2] = radius * Math.cos(phi);
      var c = COLORS[Math.floor(Math.random() * COLORS.length)];
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }

  function buildRing(count) {
    var geo = new THREE.BufferGeometry();
    var positions = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);
    for (var j = 0; j < count; j++) {
      var a = (j / count) * Math.PI * 2;
      var rr = 4.2 + Math.random() * 0.35;
      var wob = Math.sin(a * 6) * 0.35;
      positions[j * 3]     = Math.cos(a) * rr;
      positions[j * 3 + 1] = Math.sin(a * 2.5) * 0.7 + wob * 0.3;
      positions[j * 3 + 2] = Math.sin(a) * rr;
      var c2 = COLORS[j % COLORS.length];
      colors[j * 3] = c2.g; colors[j * 3 + 1] = c2.r; colors[j * 3 + 2] = c2.b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }

  // Líneas de constelación: conecta pares de nodos (muestra del anillo
  // + muestra del núcleo) cuya distancia < umbral. Se calcula UNA vez.
  function buildConstellation(nodeCount, ringCount) {
    var nodes = [];
    var i;
    for (i = 0; i < ringCount; i++) {
      var a = (i / ringCount) * Math.PI * 2;
      nodes.push([Math.cos(a) * 4.2, Math.sin(a * 2.5) * 0.7, Math.sin(a) * 4.2]);
    }
    for (i = 0; i < nodeCount; i++) {
      var r = 2.4 + Math.random() * 1.5;
      var t = Math.random() * Math.PI * 2;
      var p = Math.acos(2 * Math.random() - 1);
      nodes.push([r * Math.sin(p) * Math.cos(t), r * Math.sin(p) * Math.sin(t) * 0.7, r * Math.cos(p)]);
    }
    var pts = [];
    var THRESH = 1.35;
    for (i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var dx = nodes[i][0] - nodes[j][0];
        var dy = nodes[i][1] - nodes[j][1];
        var dz = nodes[i][2] - nodes[j][2];
        if (dx * dx + dy * dy + dz * dz < THRESH * THRESH) {
          pts.push(nodes[i][0], nodes[i][1], nodes[i][2]);
          pts.push(nodes[j][0], nodes[j][1], nodes[j][2]);
        }
      }
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    var mat = new THREE.LineBasicMaterial({
      color: 0x44ffcc,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    return new THREE.LineSegments(geo, mat);
  }

  // Textura radial suave: partícula con caída gradual que simula
  // desenfoque/bokeh (clave para el efecto de profundidad de campo).
  var softTex = (function () {
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.6)');
    g.addColorStop(0.7, 'rgba(255,255,255,0.18)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    var t = new THREE.CanvasTexture(c);
    t.needsUpdate = true;
    return t;
  })();

  // Primer plano: partículas grandes, suaves y dispersas, colocadas
  // cerca de la cámara. Su paralaje amplificado en el loop genera el
  // efecto de movimiento blur / desenfoque de primer término.
  function buildForeground(count) {
    var geo = new THREE.BufferGeometry();
    var positions = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 17;
      positions[i * 3 + 2] = 2 + Math.random() * 3.4;
      var c = COLORS[Math.floor(Math.random() * COLORS.length)];
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    var mat = new THREE.PointsMaterial({
      size: 0.22, vertexColors: true, transparent: true, opacity: 0.5,
      map: softTex, blending: THREE.AdditiveBlending, depthWrite: false
    });
    return new THREE.Points(geo, mat);
  }

  function init() {
    var w = canvas.parentElement.clientWidth || window.innerWidth;
    var counts = countsFor(w);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < 768 ? 1.5 : 2));

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.z = w < 768 ? 10.5 : 8;
    camera.position.y = 0.6;

    group = new THREE.Group();
    scene.add(group);

    var geo = buildCore(counts.core);
    var mat = new THREE.PointsMaterial({
      size: 0.055, vertexColors: true, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    particles = new THREE.Points(geo, mat);
    group.add(particles);

    var geo2 = buildRing(counts.ring);
    var mat2 = new THREE.PointsMaterial({
      size: 0.03, vertexColors: true, transparent: true, opacity: 0.6,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    particles2 = new THREE.Points(geo2, mat2);
    particles2.rotation.x = 0.5;
    group.add(particles2);

    lines = buildConstellation(counts.lineNodes, counts.ring);
    lines.rotation.x = 0.5;
    group.add(lines);

    var geo3 = new THREE.BufferGeometry();
    var positions3 = new Float32Array(counts.bg * 3);
    for (var k = 0; k < counts.bg; k++) {
      positions3[k * 3]     = (Math.random() - 0.5) * 44;
      positions3[k * 3 + 1] = (Math.random() - 0.5) * 26;
      positions3[k * 3 + 2] = (Math.random() - 0.5) * 30 - 8;
    }
    geo3.setAttribute('position', new THREE.BufferAttribute(positions3, 3));
    var mat3 = new THREE.PointsMaterial({
      size: 0.025, color: 0xffffff, transparent: true, opacity: 0.28,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    bgPoints = new THREE.Points(geo3, mat3);
    scene.add(bgPoints);

    fgPoints = buildForeground(counts.fg);
    scene.add(fgPoints);

    onResize();
    window.addEventListener('resize', onResize);

    if (!reducedMotion) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      loop();
    } else {
      renderFrame();
    }
  }

  function onResize() {
    var w = canvas.parentElement.clientWidth || window.innerWidth;
    var h = canvas.parentElement.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    camera.position.z = w < 768 ? 10.5 : 8;
  }

  function onPointerMove(e) {
    targetX = (e.clientX / window.innerWidth) * 2 - 1;
    targetY = (e.clientY / window.innerHeight) * 2 - 1;
  }

  function loop() {
    if (hidden) { rafId = null; return; }
    rafId = requestAnimationFrame(loop);

    mouseX += (targetX - mouseX) * 0.04;
    mouseY += (targetY - mouseY) * 0.04;

    particles.rotation.y += 0.0012;
    particles.rotation.x += 0.00035;
    particles2.rotation.z += 0.0016;
    particles2.rotation.y += 0.0008;

    // Primer plano: movimiento amplificado (2-3x el grupo) + deriva propia.
    // El desenfoque lo aporta la textura suave; el paralaje extra simula
    // profundidad de campo con blur de movimiento.
    fgPoints.rotation.y += 0.0036;
    fgPoints.rotation.x += 0.0012;
    fgPoints.rotation.z -= 0.0009;

    // Reacción al scroll: el sistema se "hunde" lentamente al bajar
    var scrollFactor = Math.min(window.scrollY / window.innerHeight, 1);
    group.position.y = -scrollFactor * 1.6;
    group.rotation.z = -scrollFactor * 0.12;
    fgPoints.position.y = -scrollFactor * 2.4;

    group.rotation.y += (mouseX * 0.28 - group.rotation.y) * 0.06;
    group.rotation.x += (mouseY * 0.18 - group.rotation.x) * 0.06;

    // El primer plano sigue al grupo con factor amplificado → parallax fuerte
    fgPoints.position.x += ((group.rotation.y * 2.2) - fgPoints.position.x) * 0.04;
    fgPoints.position.z += ((group.rotation.x * 2.2) - fgPoints.position.z) * 0.04;

    camera.position.x += (mouseX * 0.55 - camera.position.x) * 0.05;
    camera.position.y += (-mouseY * 0.4 + 0.6 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderFrame();
  }

  function renderFrame() {
    renderer.render(scene, camera);
  }

  function boot() {
    try {
      init();
      canvas.setAttribute('data-three-ready', '1');
    } catch (e) {
      canvas.style.display = 'none';
      canvas.setAttribute('data-three-ready', '0');
      if (window.console && console.warn) console.warn('hero3d: WebGL no disponible, usando fallback CSS', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  document.addEventListener('visibilitychange', function () {
    hidden = document.hidden;
    if (!hidden && !reducedMotion && rafId === null) loop();
  });

  window.addEventListener('pagehide', function () {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    window.removeEventListener('resize', onResize);
    if (!reducedMotion) window.removeEventListener('pointermove', onPointerMove);
  });
})();
