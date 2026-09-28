/* ============================================================
   SECTOR CREATIVO — hero3d.js
   Fondo de partículas "constelación creativa" — aniversario 30.
   - FORMA: el enjambre rasteriza el emblema SC (symbol_sc_2.svg)
     y converge formando el símbolo (igual que web-sc-2027).
   - MOVIMIENTO: órbita elíptica por partícula, ciclo enjambre
     (dispersión orgánica original de 5s → número 30 → símbolo cada 30s), convergencia
     inicial 2.8s, mouse revuelve órbitas + atracción suave, y
     viaje de página completa bloqueado a la cámara (el emblema
     sigue la sección visible durante todo el scroll).
   - PROFUNDIDAD DE CAMPO real en GPU: cada punto calcula su
     círculo de confusión según la distancia al plano de foco;
     en foco es un píxel cuadrado nítido, fuera de foco un disco
     bokeh con aro. El foco "respira" con la dispersión, el 30,
     el scroll y el puntero (rack focus).
   - INMERSIÓN: cámara con paralaje al puntero / giroscopio,
     dolly respirante, tres planos de polvo + primer plano bokeh.
   - RENDIMIENTO: deriva del polvo en shader, sin lecturas de
     layout en el loop, bloom a media resolución, gobernador
     adaptativo de calidad, pausa con pestaña oculta o lightbox.
   - Perfiles: escritorio completo · móvil ligero (solo polvo
     bokeh, 30fps, sin PostFX) · reduced-motion (cuadro fijo).
   Design by RobCorLab
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('hero3d');
  if (!canvas) return;

  if (typeof window.THREE === 'undefined') { canvas.setAttribute('data-three-ready', '0'); return; }
  if (!window.WebGLRenderingContext) { canvas.setAttribute('data-three-ready', '0'); return; }

  var renderer, scene, camera, grupo, giro, halo;
  var emblema = null; // { targets: Float32Array, colors: Float32Array }
  var nube = null;    // arrays computados por partícula
  var nubePoints = null;
  var lines = null;
  var dustLayers = [];
  var fgLayers = null;
  var scrollSpeedEMA = 0;
  var composer = null, fisheyePass = null, bloomPass = null;
  var disposables = [];

  var mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
  var camOffX = 0, camOffY = 0;
  var giroExtra = 0, energia = 0, energiaAcum = 0;
  var prevX = 0, prevY = 0, iniciado = false;
  var rafId = null, hidden = false, paused = false;
  var colorsDirty = false;

  // Métricas de layout cacheadas (nunca se leen dentro del loop).
  var viewW = window.innerWidth, viewH = window.innerHeight, maxScroll = 1;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lite = window.matchMedia('(max-width: 767px)').matches;
  var staticScene = reducedMotion;

  var SIMBOLO_URL = 'symbol_sc_2.svg';
  var WORLD = 10.264;            // emblema cuadrado en unidades 3D (+15% sobre 8.925)
  var CAM_Z = 9;
  var CICLO = 30;
  var FASE_DISPERSION = 5;
  var FASE_NUMERO = 0.85;
  var FASE_LECTURA = 1.8;
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
    if (w < 480)  return { max: 1300, lineNodes: 60,  dust: 380, far: 160 };
    if (w < 768)  return { max: 2400, lineNodes: 90,  dust: 500, far: 220 };
    if (w < 1280) return { max: 4000, lineNodes: 130, dust: 800, far: 360 };
    return          { max: 5000, lineNodes: 170, dust: 900, far: 450 };
  }

  /* ---------- Uniforms compartidos de la "lente" ---------- */
  var LENS = {
    uFocus:    { value: CAM_Z },
    uAperture: { value: 0.9 },
    uTime:     { value: 0 },
    uScale:    { value: 400 },
    uFogNear:  { value: 9 },
    uFogFar:   { value: 30 }
  };

  var DOF_VERT = [
    'uniform float uFocus;',
    'uniform float uAperture;',
    'uniform float uTime;',
    'uniform float uScale;',
    'uniform float uFogNear;',
    'uniform float uFogFar;',
    'uniform float uSize;',
    'uniform float uMaxCoc;',
    '#ifdef DRIFT',
    'attribute float seed;',
    '#endif',
    'varying vec3 vColor;',
    'varying float vBlur;',
    'varying float vAlpha;',
    'void main() {',
    '  vec3 p = position;',
    '#ifdef DRIFT',
    '  // Deriva ascendente con retorno (antes en CPU, ahora gratis en GPU)',
    '  p.x += cos(uTime * 0.22 + seed) * 0.35;',
    '  p.y = mod(p.y + uTime * 0.13 + sin(uTime * 0.3 + seed) * 0.25 + 8.0, 16.0) - 8.0;',
    '#endif',
    '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
    '  float depth = max(0.1, -mv.z);',
    '  float coc = min(abs(depth - uFocus) * uAperture, uMaxCoc);',
    '  vBlur = coc / (1.0 + coc);',
    '  float fog = 1.0 - smoothstep(uFogNear, uFogFar, depth);',
    '  vAlpha = fog / (1.0 + coc * 0.6);',
    '  vColor = color;',
    '  gl_PointSize = uSize * (1.0 + coc) * uScale / depth;',
    '  gl_Position = projectionMatrix * mv;',
    '}'
  ].join('\n');

  var DOF_FRAG = [
    'uniform float uOpacity;',
    'uniform float uSharp;',
    'varying vec3 vColor;',
    'varying float vBlur;',
    'varying float vAlpha;',
    'void main() {',
    '  vec2 c = gl_PointCoord - 0.5;',
    '  float r = length(c) * 2.0;',
    '  float sq = 1.0 - step(0.44, max(abs(c.x), abs(c.y)));',
    '  float dotS = 1.0 - smoothstep(0.45, 1.0, r);',
    '  float focusShape = mix(dotS, sq, uSharp);',
    '  // Disco bokeh con aro brillante (apertura circular de lente)',
    '  float disc = (1.0 - smoothstep(0.8, 1.0, r)) * (0.45 + 0.55 * smoothstep(0.3, 0.92, r));',
    '  float shape = mix(focusShape, disc, smoothstep(0.08, 0.45, vBlur));',
    '  float a = shape * vAlpha * uOpacity;',
    '  if (a < 0.004) discard;',
    '  gl_FragColor = vec4(vColor, a);',
    '}'
  ].join('\n');

  /* Material de puntos con profundidad de campo. sharp=1 → píxel
     cuadrado en foco (look 2027); sharp=0 → punto redondo suave. */
  function makeDofMaterial(opts) {
    var mat = new THREE.ShaderMaterial({
      uniforms: {
        uFocus: LENS.uFocus,
        uAperture: LENS.uAperture,
        uTime: LENS.uTime,
        uScale: LENS.uScale,
        uFogNear: LENS.uFogNear,
        uFogFar: LENS.uFogFar,
        uSize: { value: opts.size },
        uMaxCoc: { value: opts.maxCoc },
        uOpacity: { value: opts.opacity },
        uSharp: { value: opts.sharp || 0 }
      },
      defines: opts.drift ? { DRIFT: '' } : {},
      vertexShader: DOF_VERT,
      fragmentShader: DOF_FRAG,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    disposables.push(mat);
    return mat;
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
    var tex = new THREE.CanvasTexture(c);
    disposables.push(tex);
    return tex;
  }

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

  // Se muestrea una sola vez: mismo número de partículas, sin geometrías
  // nuevas durante la animación ni dependencia de una fuente descargada.
  function buildAnniversaryTargets(count) {
    var c = document.createElement('canvas');
    c.width = 640; c.height = 480;
    var ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.font = '900 360px "Arial Black", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    var bounds = ctx.measureText('30');
    var ascent = bounds.actualBoundingBoxAscent || 260;
    var descent = bounds.actualBoundingBoxDescent || 0;
    ctx.fillText('30', 320, 240 + (ascent - descent) / 2);
    var px = ctx.getImageData(0, 0, 640, 480).data;
    var samples = [];
    for (var y = 0; y < 480; y += 2) {
      for (var x = 0; x < 640; x += 2) {
        if (px[(y * 640 + x) * 4 + 3] > 160) samples.push(x, y);
      }
    }
    var targets = new Float32Array(count * 3);
    var sampleCount = samples.length / 2;
    for (var i = 0; i < count; i++) {
      var k = Math.floor((i + 0.5) * sampleCount / count) * 2;
      targets[i * 3] = (samples[k] - 320) / 640 * WORLD * 1.2;
      targets[i * 3 + 1] = -(samples[k + 1] - 240) / 640 * WORLD * 1.2 + 0.6;
      targets[i * 3 + 2] = 0;
    }
    return targets;
  }

  function smooth(value) {
    var p = Math.max(0, Math.min(1, value));
    return p * p * (3 - 2 * p);
  }

  function anniversaryState(t) {
    var elapsed = t - PRIMER_EVENTO;
    if (elapsed < 0) return { scatter: 0, number: 0 };
    var phase = elapsed % CICLO;
    if (phase < FASE_DISPERSION) {
      // Mantener intactos el ritmo original y las órbitas aleatorias.
      // El 30 interviene únicamente después de completar la dispersión.
      return { scatter: smooth(phase / FASE_DISPERSION), number: 0 };
    }
    phase -= FASE_DISPERSION;
    if (phase < FASE_NUMERO) {
      var formation = smooth(phase / FASE_NUMERO);
      return { scatter: 1 - formation, number: formation };
    }
    phase -= FASE_NUMERO;
    if (phase < FASE_LECTURA) return { scatter: 0, number: 1 };
    phase -= FASE_LECTURA;
    if (phase < FASE_RETRACCION) {
      return { scatter: 0, number: 1 - smooth(phase / FASE_RETRACCION) };
    }
    return { scatter: 0, number: 0 };
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
    disposables.push(geo, mat);
    return new THREE.LineSegments(geo, mat);
  }

  /* Polvo ambiental en paleta (como PolvoProfundidad del 2027):
     viaja bloqueado con la cámara; la deriva se calcula en el shader. */
  function buildDust(count, z0, z1, spreadX, spreadY, size, opacity, maxCoc) {
    var geo = new THREE.BufferGeometry();
    var positions = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);
    var seeds = new Float32Array(count);
    for (var k = 0; k < count; k++) {
      positions[k * 3]     = (Math.random() - 0.5) * spreadX;
      positions[k * 3 + 1] = (Math.random() - 0.5) * spreadY;
      positions[k * 3 + 2] = z0 + Math.random() * (z1 - z0);
      var c = COLORS[Math.floor(Math.random() * COLORS.length)];
      colors[k * 3] = c.r; colors[k * 3 + 1] = c.g; colors[k * 3 + 2] = c.b;
      seeds[k] = Math.random() * Math.PI * 2;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
    disposables.push(geo);
    var pts = new THREE.Points(geo, makeDofMaterial({
      size: size, opacity: opacity, maxCoc: maxCoc, drift: true
    }));
    pts.frustumCulled = false; // la deriva en shader mueve los puntos fuera del bbox
    return pts;
  }

  /* Primer plano desenfocado: bokeh grandes entre la cámara y el emblema.
     Parallax diferencial + lag => profundidad real que engaña al ojo. */
  function buildForeground(scaleCount) {
    var layers = [];
    var defs = [
      { count: 90, size: 0.2,  maxCoc: 2.0, opacity: 0.95, z0: 6.0, z1: 7.2, par: 1.35 },
      { count: 20, size: 0.42, maxCoc: 2.2, opacity: 0.6,  z0: 7.4, z1: 8.0, par: 1.9 }
    ];
    for (var d = 0; d < defs.length; d++) {
      var def = defs[d];
      var count = Math.max(8, Math.round(def.count * scaleCount));
      var geo = new THREE.BufferGeometry();
      var positions = new Float32Array(count * 3);
      var colors = new Float32Array(count * 3);
      for (var i = 0; i < count; i++) {
        positions[i * 3]     = (Math.random() - 0.5) * 30;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 17;
        positions[i * 3 + 2] = def.z0 + Math.random() * (def.z1 - def.z0);
        var c = COLORS[Math.floor(Math.random() * COLORS.length)];
        colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      disposables.push(geo);
      var mat = makeDofMaterial({ size: def.size, opacity: def.opacity, maxCoc: def.maxCoc });
      layers.push({ points: new THREE.Points(geo, mat), par: def.par });
    }
    return layers;
  }

  /* Nube computada: posiciones, dispersión, colores y semillas orbitales.
     Todo lo que no depende del tiempo se precalcula aquí. */
  function buildNube(emblemaData) {
    var n = emblemaData.targets.length / 3;
    if (!n) return null;
    var targets = new Float32Array(n * 3);
    var positions = new Float32Array(n * 3);
    var dispersos = new Float32Array(n * 3);
    var colors = new Float32Array(n * 3);
    var seeds = new Float32Array(n * 4);
    var kGiro = new Float32Array(n);
    var kEnergia = new Float32Array(n);
    var stagger = new Float32Array(n);
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
      kGiro[i] = 0.6 + ((seeds[i * 4 + 2] * 7) % 0.8);
      kEnergia[i] = 0.5 + ((seeds[i * 4 + 3] * 9) % 1);
      stagger[i] = ((seeds[i * 4] / (Math.PI * 2)) % 1) * 0.4;
    }
    var anniversary = buildAnniversaryTargets(n);
    // Color del "30": degradado horizontal precalculado (antes por frame).
    var numberColors = new Float32Array(n * 3);
    for (var j = 0; j < n; j++) {
      var hue = Math.max(0, Math.min(1, anniversary[j * 3] / WORLD + 0.5));
      numberColors[j * 3]     = 1 - hue * 0.65;
      numberColors[j * 3 + 1] = 0.55 + hue * 0.45;
      numberColors[j * 3 + 2] = 0.25 + hue * 0.65;
    }
    return {
      targets: targets, anniversary: anniversary, numberColors: numberColors,
      initial: positions.slice(), positions: positions, dispersos: dispersos,
      colors: colors, originalColors: colors.slice(), seeds: seeds,
      kGiro: kGiro, kEnergia: kEnergia, stagger: stagger, n: n
    };
  }

  function measureLayout() {
    viewW = window.innerWidth;
    viewH = window.innerHeight;
    maxScroll = Math.max(1, document.documentElement.scrollHeight - viewH);
  }

  function onResize() {
    measureLayout();
    var w = viewW, h = viewH;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    LENS.uScale.value = h * 0.5 * renderer.getPixelRatio();

    // El emblema se encoge en vertical/angosto para que quepa siempre.
    var vh = 2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    var scale = Math.min(1, ((vh / 2) * camera.aspect * 1.6) / WORLD);
    if (grupo) grupo.scale.set(scale, scale, scale);

    if (composer) {
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(w, h);
      // Bloom a media resolución: el glow es difuso, no necesita más.
      if (bloomPass) {
        var pr = renderer.getPixelRatio();
        bloomPass.setSize(Math.round(w * pr * 0.5), Math.round(h * pr * 0.5));
      }
    }
    if (staticScene) renderFrameStatic();
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
        new THREE.Vector2(viewW * 0.5, viewH * 0.5), 1.15, 0.55, 0.08
      );
      composer.addPass(bloomPass);
      return composer;
    } catch (e) {
      composer = null; fisheyePass = null; bloomPass = null;
      return null;
    }
  }

  function dropComposer() {
    if (!composer) return;
    try {
      if (bloomPass && bloomPass.dispose) bloomPass.dispose();
      if (composer.renderTarget1) composer.renderTarget1.dispose();
      if (composer.renderTarget2) composer.renderTarget2.dispose();
    } catch (e) {}
    composer = null; fisheyePass = null; bloomPass = null;
  }

  function onPointerMove(e) {
    targetX = (e.clientX / viewW) * 2 - 1;
    targetY = (e.clientY / viewH) * 2 - 1;
  }

  /* Giroscopio (móvil): inclinar el teléfono = mover el puntero.
     No se pide permiso: en iOS solo funciona si ya fue concedido. */
  function onOrientation(e) {
    if (e.gamma == null || e.beta == null) return;
    targetX = Math.max(-1, Math.min(1, e.gamma / 30));
    targetY = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
  }

  function onLightbox(e) {
    paused = !!(e.detail && e.detail.open);
    if (!paused && !hidden && !staticScene && rafId === null) rafId = requestAnimationFrame(loop);
  }

  function init(linesObj) {
    var counts = countsFor(window.innerWidth);
    var maxDpr = lite ? 1.25 : 2;

    renderer = new THREE.WebGLRenderer({
      canvas: canvas, antialias: !lite, alpha: true, powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 8, 18); // afecta a las líneas

    camera = new THREE.PerspectiveCamera(68, 1, 0.1, 100);
    camera.position.set(0, 0.4, CAM_Z);

    grupo = new THREE.Group();
    scene.add(grupo);

    giro = new THREE.Group();
    grupo.add(giro);

    if (emblema) {
      halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: haloTexture(),
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }));
      disposables.push(halo.material);
      halo.position.set(0, 0.6, -2.2);
      grupo.add(halo);

      nube = buildNube(emblema);
    }
    if (nube) {
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(nube.positions, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(nube.colors, 3));
      disposables.push(geo);
      nubePoints = new THREE.Points(geo, makeDofMaterial({
        size: 0.072, opacity: 0.95, maxCoc: 4, sharp: 1
      }));
      nubePoints.frustumCulled = false;
      giro.add(nubePoints);

      if (linesObj) { giro.add(linesObj); lines = linesObj; }
    }

    // Tres planos de polvo: medio, lejano y (en primer plano) bokeh.
    dustLayers.push(buildDust(counts.dust, -13, -1, 26, 15, 0.05, 0.55, 5));
    dustLayers.push(buildDust(counts.far, -20, -14, 44, 24, 0.07, 0.35, 6));
    for (var di = 0; di < dustLayers.length; di++) scene.add(dustLayers[di]);

    fgLayers = buildForeground(lite ? 0.5 : 1);
    for (var fd = 0; fd < fgLayers.length; fd++) scene.add(fgLayers[fd].points);

    if (!staticScene && !lite) setupComposer();

    onResize();
    window.addEventListener('resize', onResize);
    if ('ResizeObserver' in window) {
      // La altura del documento cambia con imágenes/filtros: re-medir sin tocar el loop.
      new ResizeObserver(measureLayout).observe(document.body);
    }

    if (staticScene) {
      renderFrameStatic();
      return;
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    if (lite) window.addEventListener('deviceorientation', onOrientation, { passive: true });
    document.addEventListener('sc:lightbox', onLightbox);
    rafId = requestAnimationFrame(loop);
  }

  function renderFrameStatic() {
    if (nubePoints) {
      var pos = nubePoints.geometry.attributes.position;
      pos.array.set(nube.targets);
      pos.needsUpdate = true;
    }
    LENS.uAperture.value = 0.3;
    renderer.render(scene, camera);
  }

  /* ---------- Gobernador de calidad ---------- */
  var perf = { t0: 0, frames: 0, sum: 0, level: 0, last: 0 };
  function governor(now) {
    var dt = perf.last ? now - perf.last : 16;
    perf.last = now;
    if (perf.level >= 2) return;
    if (!perf.t0) perf.t0 = now;
    if (now - perf.t0 < 2500 || dt > 100) return; // calentamiento / pestaña recién visible
    perf.sum += dt; perf.frames++;
    if (perf.frames < 90) return;
    var avg = perf.sum / perf.frames;
    perf.sum = 0; perf.frames = 0;
    if (perf.level === 0 && avg > 22) {
      perf.level = 1;
      renderer.setPixelRatio(1);
      onResize();
    } else if (perf.level === 1 && avg > 28) {
      perf.level = 2;
      dropComposer();
    }
  }

  var frameOdd = false;
  function loop(now) {
    if (hidden || paused) { rafId = null; return; }
    rafId = requestAnimationFrame(loop);
    governor(now);

    // Móvil: ~30fps (render en frames alternos) para cuidar batería.
    if (lite) {
      frameOdd = !frameOdd;
      if (frameOdd) return;
    }

    if (loop._t0 === undefined) loop._t0 = now;
    var t = (now - loop._t0) / 1000;
    LENS.uTime.value = t;

    mouseX += (targetX - mouseX) * 0.04;
    mouseY += (targetY - mouseY) * 0.04;

    // --- Ciclo enjambre ---
    var anniversaryPhase = nube ? anniversaryState(t) : { scatter: 0, number: 0 };
    var base = anniversaryPhase.scatter;
    var number = anniversaryPhase.number;
    var pulso = Math.sin(number * Math.PI) * 0.35;
    var prog = Math.min(1, t / 2.8);
    var ease = 1 - Math.pow(1 - prog, 3);

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

    // --- Viaje vertical bloqueado a la cámara (scroll de página completa) ---
    var p = Math.min(1, Math.max(0, s / maxScroll));
    var vh = 2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    var wy = s * (vh / viewH);
    var baseY = 0.4 - wy;
    grupo.position.y = baseY;
    grupo.position.x = Math.sin(p * Math.PI) * 1.0;

    // --- Cámara inmersiva: paralaje al puntero + dolly respirante ---
    camOffX += (mouseX * 0.45 - camOffX) * 0.035;
    camOffY += (-mouseY * 0.3 - camOffY) * 0.035;
    camera.position.set(camOffX, baseY + camOffY, CAM_Z + Math.sin(t * 0.12) * 0.15);
    camera.lookAt(grupo.position.x * 0.25, baseY, 0);

    // --- Lente: foco y apertura (profundidad de campo) ---
    // Convergencia inicial = rack focus; dispersión abre el diafragma;
    // el 30 se lee nítido; el scroll rápido desenfoca.
    var apT = 0.22 + (1 - ease) * 0.9 + base * 0.55 +
              Math.min(0.6, scrollSpeedEMA * 0.06) - number * 0.14;
    LENS.uAperture.value += (Math.max(0.06, apT) - LENS.uAperture.value) * 0.08;
    var focusT = camera.position.z + mouseY * 0.9 + base * 1.5;
    LENS.uFocus.value += (focusT - LENS.uFocus.value) * 0.05;

    // Polvo ambiental: acompaña a la cámara (la deriva la hace el shader)
    for (var di = 0; di < dustLayers.length; di++) {
      dustLayers[di].position.y = baseY;
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

    if (nube) updateNube(t, base, number, pulso, ease, p, vh);

    // PostFX: ojo de pez + aberración cromática reaccionan al scroll
    if (fisheyePass) {
      fisheyePass.uniforms.distortion.value = 0.4 + Math.min(0.85, scrollSpeedEMA * 0.09);
      fisheyePass.uniforms.aberration.value = 0.0012 + Math.min(0.006, scrollSpeedEMA * 0.0009);
    }

    if (composer) composer.render();
    else renderer.render(scene, camera);
  }
  loop._t0 = undefined;

  function updateNube(t, base, number, pulso, ease, p, vh) {
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
    var freeMotion = 1 - number;
    giro.rotation.set(
      (p * VUELTA_34 + Math.sin(t * 0.18) * 0.35) * freeMotion,
      Math.sin(t * 0.22) * 0.66 * freeMotion,
      (p * VUELTA_34 + Math.sin(t * 0.15) * 0.06) * freeMotion
    );
    if (lines) lines.material.opacity = 0.16 * freeMotion;

    // Halo respirante
    if (halo) {
      halo.material.opacity = (0.34 + Math.sin(t * 1.1) * 0.08) * (1 - base * 0.55) + pulso * 0.3;
      var hs = 17 + Math.sin(t * 0.7) * 1.2 + base * 10;
      halo.scale.set(hs, hs, 1);
    }

    var pos = nubePoints.geometry.attributes.position;
    var arr = pos.array;
    var tg = nube.targets, ps = nube.initial, ds = nube.dispersos, sd = nube.seeds, n = nube.n;
    var anniversary = nube.anniversary;
    var kG = nube.kGiro, kE = nube.kEnergia, stg = nube.stagger;
    var mxTerm = mouseX * freeMotion, myTerm = mouseY * 0.5 * freeMotion;
    var base14 = base * 1.4;

    for (var i = 0; i < n; i++) {
      var ix = i * 3, is = i * 4;
      var fase = sd[is];
      var ang = fase + t * sd[is + 1] + giroExtra * kG[i] + energiaAcum * kE[i];
      var ox = Math.cos(ang) * sd[is + 2];
      var oy = Math.sin(ang) * sd[is + 3];
      var oz = Math.sin(ang * 0.7 + fase) * 0.42;

      var bx = ps[ix] + (tg[ix] - ps[ix]) * ease;
      var by = ps[ix + 1] + (tg[ix + 1] - ps[ix + 1]) * ease;
      var bz = ps[ix + 2] + (tg[ix + 2] - ps[ix + 2]) * ease;
      if (number > 0) {
        bx += (anniversary[ix] - bx) * number;
        by += (anniversary[ix + 1] - by) * number;
        bz += (anniversary[ix + 2] - bz) * number;
      }

      var di = base14 - stg[i];
      di = di < 0 ? 0 : di > 1 ? 1 : di;
      di = di * di * (3 - 2 * di);

      var mx = bx + (ds[ix] - bx) * di;
      var my = by + (ds[ix + 1] - by) * di;
      var mz = bz + (ds[ix + 2] - bz) * di;

      // El 30 queda frontal y estable, aun si el puntero está en movimiento.
      var atr = (0.1 + di * 0.25) * freeMotion;
      arr[ix]     = mx + ox * freeMotion + (pwx - mx) * atr + mxTerm * (0.7 - mz * 0.08);
      arr[ix + 1] = my + oy * freeMotion + (pwy - my) * atr + myTerm;
      arr[ix + 2] = mz + oz * freeMotion;
    }
    pos.needsUpdate = true;

    // Colores: solo se reescriben mientras el 30 está presente
    // (y una vez más al volver a 0 para restaurar la paleta).
    if (number > 0 || colorsDirty) {
      var colorAttribute = nubePoints.geometry.attributes.color;
      var ca = colorAttribute.array, oc = nube.originalColors, nc = nube.numberColors;
      var len = n * 3;
      for (var c = 0; c < len; c++) ca[c] = oc[c] + (nc[c] - oc[c]) * number;
      colorAttribute.needsUpdate = true;
      colorsDirty = number > 0;
    }

    nubePoints.material.uniforms.uSize.value = 0.072 + Math.sin(t * 1.4) * 0.008;
  }

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

  function ready() {
    canvas.setAttribute('data-three-ready', '1');
    canvas.setAttribute('data-three-mode', staticScene ? 'static' : lite ? 'lite' : 'full');
  }

  function boot() {
    try {
      // Móvil ligero: enjambre compacto que reproduce el emblema SC.
      // Sin movimiento reducido también oculta el SVG estático (data-particle-logo).
      if (lite) {
        var cLite = countsFor(window.innerWidth);
        var capLite = window.innerWidth < 480 ? 900 : 1500;
        var imgLite = new Image();
        imgLite.src = SIMBOLO_URL;
        imgLite.onload = function () {
          emblema = rasterEmblema(imgLite, 560, 4, capLite);
          init(null);
          if (!staticScene && emblema.targets.length) {
            document.documentElement.setAttribute('data-particle-logo', '1');
          }
          ready();
          if (window.location.search.indexOf('silhueta') >= 0) silhuetaDeb(imgLite);
        };
        imgLite.onerror = function () { init(null); ready(); };
        return;
      }
      var counts = countsFor(window.innerWidth);
      var img = new Image();
      img.src = SIMBOLO_URL;
      img.onload = function () {
        emblema = rasterEmblema(img, 560, 3, counts.max);
        if (!emblema.targets.length) emblema = buildFallbackTargets(counts.max);
        var l = buildLines(img, counts.lineNodes); // misma imagen ya cargada
        init(l);
        ready();
        if (window.location.search.indexOf('silhueta') >= 0) silhuetaDeb(img);
      };
      img.onerror = function () {
        emblema = buildFallbackTargets(counts.max);
        init(null);
        ready();
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
    if (!hidden) perf.last = 0; // no contar el hueco como frame lento
    if (!hidden && !paused && !staticScene && renderer && rafId === null) rafId = requestAnimationFrame(loop);
  });

  window.addEventListener('pagehide', function (e) {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (e.persisted) { hidden = true; return; } // bfcache: se reanuda en pageshow
    window.removeEventListener('resize', onResize);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('deviceorientation', onOrientation);
    dropComposer();
    for (var i = 0; i < disposables.length; i++) {
      try { disposables[i].dispose(); } catch (err) {}
    }
    if (renderer) renderer.dispose();
  });

  window.addEventListener('pageshow', function (e) {
    if (!e.persisted || !renderer) return;
    hidden = document.hidden;
    if (!hidden && !paused && !staticScene && rafId === null) rafId = requestAnimationFrame(loop);
  });
})();
