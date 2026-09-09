/* ============================================================
   SECTOR CREATIVO — hero3d.js
   Campo de partículas 3D estilo constelación creativa.
   - Colores de marca (rojo, amarillo, cian, magenta)
   - Rotación lenta + parallax con el mouse
   - Fallback elegante si WebGL o el CDN fallan
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('hero3d');
  if (!canvas) return;

  // Si Three.js no cargó (CDN caído) o no hay WebGL: salir con elegancia.
  if (typeof window.THREE === 'undefined') return;
  if (!window.WebGLRenderingContext) return;

  var renderer, scene, camera, particles, particles2, group;
  var mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rafId = null;

  // Colores de la marca (rojo, amarillo, cian, magenta)
  var COLORS = [
    new THREE.Color(0xff4444),
    new THREE.Color(0xffcc00),
    new THREE.Color(0x44ffcc),
    new THREE.Color(0xff44aa)
  ];

  function init() {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.z = 8;
    camera.position.y = 0.6;

    group = new THREE.Group();
    scene.add(group);

    // ---- Capa 1: esfera de partículas (núcleo) ----
    var count = 1400;
    var geo = new THREE.BufferGeometry();
    var positions = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);

    for (var i = 0; i < count; i++) {
      // Distribución esférica con radio variable (nube irregular)
      var radius = 2.4 + Math.random() * 1.8;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);

      var x = radius * Math.sin(phi) * Math.cos(theta);
      var y = radius * Math.sin(phi) * Math.sin(theta) * 0.7; // achatado
      var z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      var c = COLORS[Math.floor(Math.random() * COLORS.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    var mat = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    particles = new THREE.Points(geo, mat);
    group.add(particles);

    // ---- Capa 2: anillo orbital de partículas ----
    var count2 = 350;
    var geo2 = new THREE.BufferGeometry();
    var positions2 = new Float32Array(count2 * 3);
    var colors2 = new Float32Array(count2 * 3);

    for (var j = 0; j < count2; j++) {
      var a = (j / count2) * Math.PI * 2;
      var rr = 4.2 + Math.random() * 0.35;
      var wob = Math.sin(a * 6) * 0.35;

      positions2[j * 3]     = Math.cos(a) * rr;
      positions2[j * 3 + 1] = Math.sin(a * 2.5) * 0.7 + wob * 0.3;
      positions2[j * 3 + 2] = Math.sin(a) * rr;

      var c2 = COLORS[j % COLORS.length];
      colors2[j * 3] = c2.g;
      colors2[j * 3 + 1] = c2.r;
      colors2[j * 3 + 2] = c2.b;
    }

    geo2.setAttribute('position', new THREE.BufferAttribute(positions2, 3));
    geo2.setAttribute('color', new THREE.BufferAttribute(colors2, 3));

    var mat2 = new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    particles2 = new THREE.Points(geo2, mat2);
    particles2.rotation.x = 0.5;
    group.add(particles2);

    // ---- Capa 3: partículas de fondo lejanas ----
    var geo3 = new THREE.BufferGeometry();
    var positions3 = new Float32Array(600 * 3);
    for (var k = 0; k < 600; k++) {
      positions3[k * 3]     = (Math.random() - 0.5) * 22;
      positions3[k * 3 + 1] = (Math.random() - 0.5) * 12;
      positions3[k * 3 + 2] = (Math.random() - 0.5) * 16 - 4;
    }
    geo3.setAttribute('position', new THREE.BufferAttribute(positions3, 3));

    var mat3 = new THREE.PointsMaterial({
      size: 0.025,
      color: 0xffffff,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    var bgPoints = new THREE.Points(geo3, mat3);
    scene.add(bgPoints);

    onResize();
    window.addEventListener('resize', onResize);

    if (!reducedMotion) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      loop();
    } else {
      renderFrame(); // un solo frame estático
    }
  }

  function onResize() {
    var w = canvas.parentElement.clientWidth || window.innerWidth;
    var h = canvas.parentElement.clientHeight || window.innerHeight;

    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    if (w < 768) {
      camera.position.z = 10.5;
    } else {
      camera.position.z = 8;
    }
  }

  function onPointerMove(e) {
    targetX = (e.clientX / window.innerWidth) * 2 - 1;
    targetY = (e.clientY / window.innerHeight) * 2 - 1;
  }

  function loop() {
    rafId = requestAnimationFrame(loop);
    // Suavizado del parallax
    mouseX += (targetX - mouseX) * 0.04;
    mouseY += (targetY - mouseY) * 0.04;

    // Rotación autónoma lenta
    particles.rotation.y += 0.0012;
    particles.rotation.x += 0.00035;
    particles2.rotation.z += 0.0016;
    particles2.rotation.y += 0.0008;

    // Parallax de cámara (el grupo se inclina hacia el mouse)
    group.rotation.y += (mouseX * 0.28 - group.rotation.y) * 0.06;
    group.rotation.x += (mouseY * 0.18 - group.rotation.x) * 0.06;

    camera.position.x += (mouseX * 0.55 - camera.position.x) * 0.05;
    camera.position.y += (-mouseY * 0.4 + 0.6 - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    renderFrame();
  }

  function renderFrame() {
    renderer.render(scene, camera);
  }

  // Arranque diferido hasta que el canvas esté en pantalla
  function boot() {
    try {
      init();
      canvas.setAttribute('data-three-ready', '1');
    } catch (e) {
      // WebGL no disponible: el hero conserva su gradiente CSS de fondo.
      canvas.style.display = 'none';
      if (window.console && console.warn) console.warn('hero3d: WebGL no disponible, usando fallback CSS', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // Limpieza para evitar fugas
  window.addEventListener('pagehide', function () {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('resize', onResize);
    if (!reducedMotion) window.removeEventListener('pointermove', onPointerMove);
  });
})();