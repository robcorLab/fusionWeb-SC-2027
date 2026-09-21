/* ============================================================
   SECTOR CREATIVO — hero3d.js
   Fondo de partículas "constelación creativa" v2.
   - FORMA: el enjambre rasteriza el emblema SC (symbol_sc_2.svg)
     y converge formando el símbolo (igual que web-sc-2027).
   - MOVIMIENTO: órbita elíptica por partícula, ciclo enjambre
     (dispersión 5s + retracción 1.75s cada 30s), convergencia
     inicial 2.8s, mouse revuelve órbitas + atracción suave, y
     viaje de página completa bloqueado a la cámara (el emblema
     sigue la sección visible durante todo el scroll).
   - LUCES Y COLORES conservados: paleta brand, textura bokeh
     radial, blend aditivo, líneas de constelación sobre muestreo
     del emblema, polvo ambiental viajero, primer plano con
     paralaje amplificado y halo respirante.
   - Adaptativo por viewport/DPR, prefers-reduced-motion, y
     fallback elegante si WebGL, el CDN o el emblema fallan.
   Design by RobCorLab
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('hero3d');
  if (!canvas) return;

  if (typeof window.THREE === 'undefined') return;
  if (!window.WebGLRenderingContext) return;

  var renderer, scene, camera, grupo, giro, halo;
  var emblema = null; // { targets: Float32Array, colors: Float32Array }
  var nube = null;    // arrays computados por partícula
  var lines = null, bgPoints = null;
  var bgArr = null, bgSeeds = null, bgN = 0;
  var fgLayers = null;
  var scrollSpeedEMA = 0;
  var composer = null, fisheyePass = null, bloomPass = null;
  var squareTex = null, bokehTex = null;

  var mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
  var giroExtra = 0, energia = 0, energiaAcum = 0;
  var prevX = 0, prevY = 0, iniciado = false;
  var rafId = null, hidden = false;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var SIMBOLO_URL = 'symbol_sc_2.svg';
  var WORLD = 10.264;            // emblema cuadrado en unidades 3D (+15% sobre 8.925)
  var CICLO = 30;                // enjambre: dispersión + retracción
  var FASE_DISPERSION = 5;
  var FASE_RETRACCION = 1.75;
  var PRIMER_EVENTO = 8;
  var VUELTA_34 = Math.PI * 1.5;

  // Paleta de marca (conservada del diseño actual) = PALETA_PARTICULAS del 2027
  var COLORS = [
    new THREE.Color(0xff4444),
    new THREE.Color(0xffcc00),
    new THREE.Color(0x44ffcc),
    new THREE.Color(0xff44aa),
    new THREE.Color(0xffffff)
  ];

  function countsFor(w) {
    if (w < 480)  return { max: 1300, lineNodes: 60 };
    if (w < 768)  return { max: 2400, lineNodes: 90 };
    if (w < 1280) return { max: 4000, lineNodes: 130 };
    return          { max: 5000, lineNodes: 170 };
  }

  /* Halo rojo respirante detrás del emblema. */
  function haloTexture() {
    var c = document.createElement('canvas');
    c.width = c.height = 256;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,70,70,0.8)');
    g.addColorStop(0.35, 'rgba(255,60,60,0.3)');
    g.addColorStop(0.65, 'rgba(255,60,90,0.1)');
    g.addColorStop(1, 'rgba(255,60,60,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }

  /* Píxel nítido (igual que squareTexture del 2027): el emblema se ve
     como puntos cuadrados definidos, no bokeh. */
  function squareTexture() {
    var c = document.createElement('canvas');
    c.width = c.height = 32;
    var ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(2, 2, 28, 28);
    return new THREE.CanvasTexture(c);
  }

  /* Bokeh suave (círculo radial con caída) para la capa cercana:
     desenfoque de foco que da la ilusión de profundidad de campo. */
  function bokehTexture() {
    var c = document.createElement('canvas');
    c.width = c.height = 64;
    var ctx = c.getContext('2d');
    var g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.4)');
    g.addColorStop(0.75, 'rgba(255,255,255,0.12)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }
  squareTex = squareTexture();
  bokehTex = bokehTexture();

  /* Rasteriza el emblema y devuelve posiciones-objetivo + colores.
     gapPx determina la resolución de muestreo. */
  function rasterEmblema(img, S, gapPx, cap) {
    var c = document.createElement('canvas');
    c.width = S;
    c.height = S;
    var ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, S, S);
    ctx.drawImage(img, 0, 0, S, S);
    var px = ctx.getImageData(0, 0, S, S).data;
    var pts = [], cols = [];
    for (var y = 0; y < S; y += gapPx) {
      for (var x = 0; x < S; x += gapPx) {
        var i = (y * S + x) * 4;
        if (px[i + 3] > 120) {
          pts.push(
            (x / S - 0.5) * WORLD,
            -(y / S - 0.5) * WORLD,
            (Math.random() - 0.5) * 0.5
          );
          cols.push(px[i] / 255, px[i + 1] / 255, px[i + 2] / 255);
        }
      }
    }
    var step = Math.max(1, Math.floor(pts.length / 3 / cap));
    var targets = [], colors = [];
    for (var k = 0; k < pts.length; k += step * 3) {
      targets.push(pts[k], pts[k + 1], pts[k + 2]);
      colors.push(cols[k], cols[k + 1], cols[k + 2]);
    }
    return { targets: new Float32Array(targets), colors: new Float32Array(colors) };
  }

  /* Si el emblema no carga: forma esférica clásica como fallback. */
  function buildFallbackTargets(count) {
    var targets = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      var radius = 2.4 + Math.random() * 1.8;
      var theta = Math.random() * Math.PI * 2;
      var phi = Math.acos(2 * Math.random() - 1);
      targets[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
      targets[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.7;
      targets[i * 3 + 2] = radius * Math.cos(phi);
      var c = COLORS[Math.floor(Math.random() * COLORS.length)];
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    return { targets: targets, colors: colors };
  }

  /* Líneas de constelación: muestreo grueso del emblema, pares cercanos. */
  function buildLines(img, lineNodes) {
    var coarse;
    try {
      coarse = rasterEmblema(img, 560, 46, 300);
    } catch (e) { return null; }
    if (!coarse.targets.length) return null;
    var nodes = [];
    var count = coarse.targets.length / 3;
    var step = Math.max(1, Math.floor(count / lineNodes));
    for (var i = 0; i < count; i += step) {
      nodes.push([coarse.targets[i * 3], coarse.targets[i * 3 + 1], coarse.targets[i * 3 + 2]]);
    }
    var pts = [];
    var THRESH = 1.55;
    var a, b, dx, dy, dz;
    for (a = 0; a < nodes.length; a++) {
      for (b = a + 1; b < nodes.length; b++) {
        dx = nodes[a][0] - nodes[b][0];
        dy = nodes[a][1] - nodes[b][1];
        dz = nodes[a][2] - nodes[b][2];
        if (dx * dx + dy * dy + dz * dz < THRESH * THRESH) {
          pts.push(nodes[a][0], nodes[a][1], nodes[a][2]);
          pts.push(nodes[b][0], nodes[b][1], nodes[b][2]);
        }
      }
    }
    if (!pts.length) return null;
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

  /* Polvo ambiental en paleta (como PolvoProfundidad del 2027):
     viaja bloqueado con la cámara y deriva lentamente. */
  function buildBackground(count) {
    var geo = new THREE.BufferGeometry();
    var positions = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);
    var seeds = new Float32Array(count);
    for (var k = 0; k < count; k++) {
      positions[k * 3]     = (Math.random() - 0.5) * 26;
      positions[k * 3 + 1] = (Math.random() - 0.5) * 15;
      positions[k * 3 + 2] = -Math.random() * 12 - 1;
      var c = COLORS[Math.floor(Math.random() * COLORS.length)];
      colors[k * 3] = c.r; colors[k * 3 + 1] = c.g; colors[k * 3 + 2] = c.b;
      seeds[k] = Math.random() * Math.PI * 2;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    var mat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });
    return { points: new THREE.Points(geo, mat), seeds: seeds, count: count };
  }

  /* Primer plano desenfocado: bokeh grandes entre la cámara y el emblema.
     Parallax diferencial + lag => profundidad real que engaña al ojo. */
  function buildForeground() {
    var layers = [];
    var defs = [
      { count: 90, size: 0.34, opacity: 0.5,  z0: 6.0, z1: 7.2, par: 1.35 },
      { count: 20, size: 0.72, opacity: 0.28, z0: 7.4, z1: 8.0, par: 1.9 }
    ];
    for (var d = 0; d < defs.length; d++) {
      var def = defs[d];
      var geo = new THREE.BufferGeometry();
      var positions = new Float32Array(def.count * 3);
      var colors = new Float32Array(def.count * 3);
      for (var i = 0; i < def.count; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 30;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 17;
        positions[i * 3 + 2] = def.z0 + Math.random() * (def.z1 - def.z0);
        var c = COLORS[Math.floor(Math.random() * COLORS.length)];
        colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      var mat = new THREE.PointsMaterial({
        size: def.size,
        map: bokehTex,
        vertexColors: true,
        transparent: true,
        opacity: def.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true
      });
      layers.push({ points: new THREE.Points(geo, mat), par: def.par, baseY: 0 });
    }
    return layers;
  }

  /* Nube computada: posiciones, dispersión, colores y semillas orbitales. */
  function buildNube(emblemaData) {
    var n = emblemaData.targets.length / 3;
    if (!n) return null;
    var targets = new Float32Array(n * 3);
    var positions = new Float32Array(n * 3);
    var dispersos = new Float32Array(n * 3);
    var colors = new Float32Array(n * 3);
    var seeds = new Float32Array(n * 4);
    for (var i = 0; i < n; i++) {
      targets[i * 3]     = emblemaData.targets[i * 3];
      targets[i * 3 + 1] = emblemaData.targets[i * 3 + 1] + 0.6;
      targets[i * 3 + 2] = emblemaData.targets[i * 3 + 2];

      positions[i * 3]     = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 13;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;

      dispersos[i * 3]     = (Math.random() - 0.5) * 26;
      dispersos[i * 3 + 1] = (Math.random() - 0.5) * 15;
      dispersos[i * 3 + 2] = -4 + Math.random() * 6;

      // Mezcla idéntica a web-sc-2027: 15% negro (huecos por blending aditivo),
      // 55% color del emblema (rojo SC = rojo de marca), 30% blanco brillante.
      var set = Math.random();
      if (set < 0.15) {
        colors[i * 3] = 0; colors[i * 3 + 1] = 0; colors[i * 3 + 2] = 0;
      } else if (set < 0.7) {
        colors[i * 3]     = emblemaData.colors[i * 3];
        colors[i * 3 + 1] = emblemaData.colors[i * 3 + 1];
        colors[i * 3 + 2] = emblemaData.colors[i * 3 + 2];
      } else {
        colors[i * 3] = 1; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 1;
      }

      seeds[i * 4]     = Math.random() * Math.PI * 2;       // fase
      seeds[i * 4 + 1] = 0.13 + Math.random() * 0.35;       // velocidad orbital
      seeds[i * 4 + 2] = 0.11 + Math.random() * 0.37;       // radio X
      seeds[i * 4 + 3] = 0.09 + Math.random() * 0.29;       // radio Y
    }
    return { targets: targets, positions: positions, dispersos: dispersos, colors: colors, seeds: seeds, n: n };
  }

  function onResize() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    // El emblema se encoge en vertical/angosto para que quepa siempre.
    var vh = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    var scale = Math.min(1, ((vh / 2) * camera.aspect * 1.6) / WORLD);
    if (grupo) grupo.scale.set(scale, scale, scale);

    if (composer) {
      composer.setSize(w, h);
      if (bloomPass) bloomPass.setSize(w, h);
    }
  }

  /* PostFX (réplica del 2027): ojo de pez + aberración cromática + viñeta
     y Bloom para el glow/destellos. Si no hay composer, se degrada a render. */
  function makeFisheyeShader() {
    return {
      uniforms: {
        tDiffuse: { value: null },
        distortion: { value: 0.4 },
        aberration: { value: 0.0012 }
      },
      vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D tDiffuse;',
        'uniform float distortion;',
        'uniform float aberration;',
        'varying vec2 vUv;',
        'void main() {',
        '  vec2 cc = vUv - 0.5;',
        '  float r2 = dot(cc, cc);',
        '  vec2 warped = vUv + cc * r2 * distortion;',
        '  float off = aberration * (0.35 + r2 * 2.4);',
        '  vec4 cr = texture2D(tDiffuse, warped + vec2(off, 0.0));',
        '  vec4 cg = texture2D(tDiffuse, warped);',
        '  vec4 cb = texture2D(tDiffuse, warped - vec2(off, 0.0));',
        '  vec4 outC = vec4(cr.r, cg.g, cb.b, cg.a);',
        '  float vig = smoothstep(0.95, 0.30, length(cc));',
        '  outC.rgb *= mix(0.5, 1.0, vig);',
        '  gl_FragColor = outC;',
        '}'
      ].join('\n')
    };
  }

  function setupComposer() {
    try {
      if (!window.THREE.EffectComposer || !window.THREE.RenderPass ||
          !window.THREE.ShaderPass || !window.THREE.UnrealBloomPass) return null;
      composer = new THREE.EffectComposer(renderer);
      composer.addPass(new THREE.RenderPass(scene, camera));
      fisheyePass = new THREE.ShaderPass(makeFisheyeShader());
      composer.addPass(fisheyePass);
      bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight), 1.15, 0.55, 0.08
      );
      composer.addPass(bloomPass);
      return composer;
    } catch (e) {
      composer = null; fisheyePass = null; bloomPass = null;
      return null;
    }
  }

  function onPointerMove(e) {
    targetX = (e.clientX / window.innerWidth) * 2 - 1;
    targetY = (e.clientY / window.innerHeight) * 2 - 1;
  }

  function init(linesObj) {
    var w = window.innerWidth;
    var counts = countsFor(w);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < 768 ? 1.5 : 2));

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 8, 18);

    camera = new THREE.PerspectiveCamera(68, 1, 0.1, 100);
    camera.position.set(0, 0.4, 9);

    grupo = new THREE.Group();
    scene.add(grupo);

    giro = new THREE.Group();
    grupo.add(giro);

    halo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: haloTexture(),
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    halo.position.set(0, 0.6, -2.2);
    grupo.add(halo);

    nube = buildNube(emblema);
    if (nube) {
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(nube.positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(nube.colors, 3));
      var mat = new THREE.PointsMaterial({
        size: 0.072,
        map: squareTex,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
      });
      var points = new THREE.Points(geo, mat);
      giro.add(points);

      if (linesObj) { giro.add(linesObj); lines = linesObj; }
    }

    var bg = buildBackground(900);
    bgPoints = bg.points;
    bgArr = bgPoints.geometry.attributes.position.array;
    bgSeeds = bg.seeds; bgN = bg.count;
    scene.add(bgPoints);

    fgLayers = buildForeground();
    for (var fd = 0; fd < fgLayers.length; fd++) scene.add(fgLayers[fd].points);

    setupComposer();

    onResize();
    window.addEventListener('resize', onResize);

    if (reducedMotion) {
      renderFrameStatic();
      return;
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    loop();
  }

  function renderFrameStatic() {
    if (nube) {
      var pos = giro.children[0].geometry.attributes.position;
      pos.array.set(nube.targets);
      pos.needsUpdate = true;
    }
    renderer.render(scene, camera);
  }

  function loop() {
    if (hidden) { rafId = null; return; }
    rafId = requestAnimationFrame(loop);
    if (!nube) { renderer.render(scene, camera); return; }

    if (loop._t0 === undefined) loop._t0 = Date.now();
    var t = (Date.now() - loop._t0) / 1000;

    mouseX += (targetX - mouseX) * 0.04;
    mouseY += (targetY - mouseY) * 0.04;

    var pos = giro.children[0].geometry.attributes.position;
    var arr = pos.array;
    var tg = nube.targets, ps = nube.positions, ds = nube.dispersos, sd = nube.seeds, n = nube.n;

    // --- Ciclo enjambre ---
    var te = t - PRIMER_EVENTO;
    var base = 0, pulso = 0;
    if (te > 0) {
      var tt = te % CICLO;
      var total = FASE_DISPERSION + FASE_RETRACCION;
      if (tt < total) {
        var crudo = tt < FASE_DISPERSION ? tt / FASE_DISPERSION : 1 - (tt - FASE_DISPERSION) / FASE_RETRACCION;
        base = crudo * crudo * (3 - 2 * crudo);
        if (tt >= FASE_DISPERSION) pulso = Math.sin(((tt - FASE_DISPERSION) / FASE_RETRACCION) * Math.PI);
      }
    }
    var prog = Math.min(1, t / 2.8);
    var ease = 1 - Math.pow(1 - prog, 3);

    // --- Viaje vertical bloqueado a la cámara (scroll de página completa) ---
    var doc = document.documentElement;
    var max = Math.max(1, doc.scrollHeight - window.innerHeight);

    // --- PostFX del 2027: el lente "respira" con la velocidad del scroll ---
    // (FOV 68 -> hasta 82 al scrollear rápido; la cámara rebota al cambiar de sección)
    var s = window.scrollY;
    if (loop._lastScroll === undefined) loop._lastScroll = s;
    var dts = loop._lastT === undefined ? 0.016 : Math.max(0.001, t - loop._lastT);
    loop._lastT = t;
    var inst = Math.min(60, Math.abs(s - loop._lastScroll) / Math.max(0.001, dts * 60));
    loop._lastScroll = s;
    scrollSpeedEMA += (inst - scrollSpeedEMA) * 0.1;
    var fovT = 68 + Math.min(14, scrollSpeedEMA * 1.6);
    if (Math.abs(camera.fov - fovT) > 0.01) {
      camera.fov = fovT;
      camera.updateProjectionMatrix();
    }

    var p = Math.min(1, Math.max(0, window.scrollY / max));
    var vh = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    var wy = window.scrollY * (vh / window.innerHeight);
    var baseY = 0.4;
    camera.position.y = baseY - wy;
    grupo.position.y = baseY - wy;
    grupo.position.x = Math.sin(p * Math.PI) * 1.0;

    // --- Puntero -> órbitas ---
    if (!iniciado) {
      prevX = targetX; prevY = targetY; iniciado = true;
    }
    var mdx = targetX - prevX;
    var mdy = targetY - prevY;
    prevX = targetX; prevY = targetY;
    giroExtra += mdx * 2.2;
    var instE = Math.min(3, Math.hypot(mdx, mdy) * 9);
    energia += (instE - energia) * 0.08;
    energiaAcum += energia * 0.045;

    var pwx = mouseX * (vh * camera.aspect / 2) - grupo.position.x;
    var pwy = mouseY * (vh / 2);

    // Giro del emblema: vaivén permanente
    giro.rotation.set(
      p * VUELTA_34 + Math.sin(t * 0.18) * 0.35,
      Math.sin(t * 0.22) * 0.66,
      p * VUELTA_34 + Math.sin(t * 0.15) * 0.06
    );

    // Halo respirante
    if (halo) {
      halo.material.opacity = (0.34 + Math.sin(t * 1.1) * 0.08) * (1 - base * 0.55) + pulso * 0.3;
      var hs = 17 + Math.sin(t * 0.7) * 1.2 + base * 10;
      halo.scale.set(hs, hs, 1);
    }

    // Actualizar posiciones
    for (var i = 0; i < n; i++) {
      var ix = i * 3, is = i * 4;
      var fase = sd[is], vel = sd[is + 1];
      var ang = fase + t * vel + giroExtra * (0.6 + ((sd[is + 2] * 7) % 0.8)) + energiaAcum * (0.5 + ((sd[is + 3] * 9) % 1));
      var ox = Math.cos(ang) * sd[is + 2];
      var oy = Math.sin(ang) * sd[is + 3];
      var oz = Math.sin(ang * 0.7 + fase) * 0.42;

      var bx = ps[ix] + (tg[ix] - ps[ix]) * ease;
      var by = ps[ix + 1] + (tg[ix + 1] - ps[ix + 1]) * ease;
      var bz = ps[ix + 2] + (tg[ix + 2] - ps[ix + 2]) * ease;

      var st = (fase / (Math.PI * 2)) % 1;
      var di = base * 1.4 - st * 0.4;
      di = di < 0 ? 0 : di > 1 ? 1 : di;
      di = di * di * (3 - 2 * di);

      var mx = bx + (ds[ix] - bx) * di;
      var my = by + (ds[ix + 1] - by) * di;
      var mz = bz + (ds[ix + 2] - bz) * di;

      var atr = 0.1 + di * 0.25;
      arr[ix]     = mx + ox + (pwx - mx) * atr + mouseX * (0.7 - mz * 0.08);
      arr[ix + 1] = my + oy + (pwy - my) * atr + mouseY * 0.5;
      arr[ix + 2] = mz + oz;
    }
    pos.needsUpdate = true;

    giro.children[0].material.size = 0.072 + Math.sin(t * 1.4) * 0.008;

    // Polvo ambiental: acompaña a la cámara y deriva (como PolvoProfundidad)
    if (bgPoints) {
      bgPoints.position.y = camera.position.y;
      for (var bi = 0; bi < bgN; bi++) {
        var bix = bi * 3;
        var bs = bgSeeds[bi];
        var by = bgArr[bix + 1] + Math.sin(t * 0.3 + bs) * 0.0009 + 0.0022;
        var bx = bgArr[bix] + Math.cos(t * 0.22 + bs) * 0.0009;
        if (by > 8) by = -8;
        bgArr[bix + 1] = by;
        bgArr[bix] = bx;
      }
      bgPoints.geometry.attributes.position.needsUpdate = true;
    }

    // Primer plano: bokeh que "laggea" el viaje de la cámara y reacciona
    // al puntero en dirección contraria (profundidad engañosa).
    if (fgLayers) {
      for (var fi = 0; fi < fgLayers.length; fi++) {
        var fg = fgLayers[fi];
        var fgy = (camera.position.y * fg.par + Math.sin(t * 0.4 + fi * 2) * 0.5);
        fg.points.position.y += (fgy - fg.points.position.y) * 0.05;
        fg.points.position.x += (-mouseX * fg.par * 2.4 - fg.points.position.x) * 0.028;
      }
    }

    // PostFX: ojo de pez + aberración cromática reaccionan al scroll
    if (fisheyePass) {
      fisheyePass.uniforms.distortion.value = 0.4 + Math.min(0.85, scrollSpeedEMA * 0.09);
      fisheyePass.uniforms.aberration.value = 0.0012 + Math.min(0.006, scrollSpeedEMA * 0.0009);
    }

    if (composer) composer.render();
    else renderer.render(scene, camera);
  }
  loop._t0 = undefined;

  function silhuetaDeb(img) {
    try {
      var S = 60;
      var c = document.createElement('canvas');
      c.width = S; c.height = S;
      var ctx = c.getContext('2d');
      ctx.clearRect(0, 0, S, S);
      ctx.drawImage(img, 0, 0, S, S);
      var px = ctx.getImageData(0, 0, S, S).data;
      var rows = [];
      for (var y = 0; y < S; y += 2) {
        var row = '';
        for (var x = 0; x < S; x += 1) row += px[(y * S + x) * 4 + 3] > 120 ? '#' : ' ';
        rows.push(row);
      }
      document.documentElement.setAttribute('data-sil', rows.join('\n'));
      if (emblema && emblema.targets.length) {
        var mnX = 1e9, mxX = -1e9, mnY = 1e9, mxY = -1e9, n = emblema.targets.length / 3;
        for (var i = 0; i < n; i++) {
          var x = emblema.targets[i * 3], y = emblema.targets[i * 3 + 1];
          if (x < mnX) mnX = x; if (x > mxX) mxX = x; if (y < mnY) mnY = y; if (y > mxY) mxY = y;
        }
        document.documentElement.setAttribute('data-emblema', 'n=' + n + ' x[' + mnX.toFixed(2) + ',' + mxX.toFixed(2) + '] y[' + mnY.toFixed(2) + ',' + mxY.toFixed(2) + ']');
      }
    } catch (e) {}
  }

  function boot() {
    try {
      var counts = countsFor(window.innerWidth);
      var img = new Image();
      img.src = SIMBOLO_URL;
      img.onload = function () {
        emblema = rasterEmblema(img, 560, 3, counts.max);
        if (!emblema.targets.length) emblema = buildFallbackTargets(counts.max);
        var l = buildLines(img, counts.lineNodes); // misma imagen ya cargada
        init(l);
        canvas.setAttribute('data-three-ready', '1');
        if (window.location.search.indexOf('silhueta') >= 0) silhuetaDeb(img);
      };
      img.onerror = function () {
        emblema = buildFallbackTargets(counts.max);
        init(null);
        canvas.setAttribute('data-three-ready', '1');
      };
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