# Rediseño Profundo Dark Neon — Sector Creativo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolucionar sectorcreativo.com.mx a un one-page inmersivo dark-neon de nivel premium: preloader, hero 3D con constelación y reacción al scroll, marquee inclinado, logo-wall de clientes reales (13), servicios con iconos dibujados y bordes de neón, proceso en 4 pasos, estadísticas animadas con datos reales (30 años, 13 clientes, 8 servicios), portafolio bento con filtros, contacto reforzado, footer de 3 columnas — todo accesible, eficiente y multi-dispositivo. **NO SUBIR AL HOSTING** (el usuario avisará cuándo).

**Architecture:** Single-page PHP (formulario con CSRF/honeypot intacto), un solo CSS (~1500 líneas) y un solo main.js (IIFE, bloques por feature). El hero 3D se reescribe en hero3d.js con líneas de constelación estáticas dentro del grupo que rota (O(n) por frame, sin O(n²)) y conteo de partículas adaptativo por viewport. El HTML completo (index.php) se entrega en Task 1 con TODAS las secciones; las tareas siguientes son CSS/JS puros para que cada una sea una unidad de diseño revisable.

**Tech Stack:** PHP 8.5 (built-in server local :8090), CSS moderno (clamp, grid, clip-path, backdrop-filter), JavaScript vanilla (IntersectionObserver, rAF, matchMedia), Three.js 0.128 desde CDN con fallback, WebP via cwebp, Playwright para verificación.

**Spec:** Propuesta de diseño aprobada en chat (2026-09-09): dirección dark-neon evolucionada, H1 = frase original "We are all Creative" + badge "30 años", datos de contacto vigentes, alcance rediseño profundo one-page reforzado.

## Global Constraints

- **NOMBRE DEL H1:** Se mantiene exacto: `We are all Creative` (con `Creative` en `.grad-text`). Se añade badge flotante en el hero con el texto `30 años creando`.
- **Datos de contacto VIGENTES (no cambiar):** dirección "Venustiano Carranza 2800, Col. Guerrero, C.P. 88240 — Nuevo Laredo, Tamps.", teléfonos `+52 1 867 217 9046` y `+52 867 719 4445`, correo `atencion1@sectorcreativo.com.mx`, WhatsApp `528672179046`.
- **Datos de empresa REALES (no inventar otros):** 30 años de trayectoria · 13 clientes: AGUA LIV, FARMACIAS CALDERON, MEDLINE, RHEEM, CHROMALOX, TELEFLEX, HOSPITAL SAN GERARDO, MARISCOS LA LAGUNA, CEVICHE 76, ALITAS & TARROS, LA BOTANERIA, MUNICIPIO DE NUEVO LAREDO, CENTRO CULTURAL · 8 servicios reales + Acabados Especiales.
- **Prohibido subir al hosting** hasta aviso explícito del usuario. Todo el trabajo es local (git + servidor PHP :8090).
- **Sin inventar logos oficiales** de los clientes: se usan nombres en tipografía display (logo wall tipográfico).
- **Accesibilidad:** skip-link, `:focus-visible` neón, ARIA en menú/lightbox, alt descriptivos, contraste AA, `prefers-reduced-motion` desactiva TODAS las animaciones (incluye preloader, contadores, íconos, filtros).
- **Robustez:** con `html.no-js` el preloader NO se muestra y ningún contenido queda oculto (reveal visible).
- **Eficiencia:** fuentes Google reducidas a `Unbounded:wght@400;700;900` + `Outfit:wght@300;500;700`; imágenes → thumbs WebP ≤800px; DPR cap 1.5 en móvil; pausa rAF cuando `document.hidden`.
- Verificación obligatoria en cada tarea: `php -l index.php`, `node --check` sobre los JS, y Playwright contra `http://127.0.0.1:8090/`.

---

### Task 0: Inicializar repo git local + baseline

**Files:**
- Run: `git init` en el directorio del proyecto

- [ ] **Step 1: Inicializar repositorio**

Run:
```bash
cd /Users/sector1/Documents/sectoradmin/Proyectos/SECTORCREATIVO.COM.MX
git init -b main
```
Expected: `Initialized empty Git repository`.

- [ ] **Step 2: Commit baseline**

```bash
printf '%s\n' 'logs/' '.DS_Store' 'error_log' '.well-known/' > .gitignore
git add -A
git commit -m "chore: baseline del sitio antes del rediseño profundo dark neon"
```
Expected: commit exitoso con el sitio actual intacto.

- [ ] **Step 3: Verificar servidor local corriendo**

Run: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8090/`
Expected: `200`. Si no responde, arrancar con:
```bash
cd /Users/sector1/Documents/sectoradmin/Proyectos/SECTORCREATIVO.COM.MX
php -S 127.0.0.1:8090 > /tmp/sc_site_php.log 2>&1 &
```

---

### Task 1: Estructura completa — index.php nuevo + main.js base + CSS bloque A

**Files:**
- Rewrite: `index.php` (estructura total del one-page: preloader, header nav 4 enlaces, hero con badge, marquee band, CLIENTES, SERVICIOS, PROCESO, ESTADÍSTICAS, PORTFOLIO bento con filtros, CONTACTO, footer 3 columnas, lightbox, back-to-top; head optimizado con fuentes reducidas y skip-link)
- Rewrite: `js/main.js` (bloque base: preloader, header scrolled, menú móvil + scrollspy, reveal, scroll progress, seguridad timeout)
- Modify: `css/styles.css` (bloque A: preloader, skip-link, focus-visible, scroll-progress, ajuste de pesos de fuente, html.js/no-js)

**Interfaces:**
- Consumes: Task 0 (git, servidor local).
- Produces: Selectores que TASKS POSTERIORES consumen:
  - Preloader: `#preloader` (div abierto al cargar, el JS lo oculta), `.preloader-bar`, `.preloader-count`
  - Scroll progress: `#scrollProgress` (barra fija top, `transform: scaleX(p)`), JS usa `window.scrollY / (docHeight - winHeight)`
  - Hero badge: `.hero-badge` (texto `30 años creando`)
  - Secciones con `id`: `#inicio`, `#clientes`, `#servicios`, `#proceso`, `#estadisticas`, `#proyectos`, `#contacto` — scrollspy usa estas ids contra `nav a[href^="#"]`
  - Marquee band: `.marquee-band` (contenedor), `.marquee` (cinta inclinada), `.marquee-track`, `.marquee-track.reverse` (segunda fila opuesta)
  - Clientes: `#clientes .clients-track` con `span.client-name`; doble track `.clients-track` y `.clients-track.reverse`
  - Servicios: `.service-card .service-icon svg path.se-icon` (paths con `data-draw` para animación de trazo)
  - Proceso: `.process-step` con `.step-num`, `.step-title`, `.step-txt`; rail `.process-rail` con `.process-rail-fill` (JS setea `--p: 0-100%`)
  - Estadísticas: `.stat` con `.stat-num[data-count][data-suffix]` y `.stat-label`
  - Portafolio: `.filters .chip[data-filter]`, `.galeria-grid.galeria-bento .item[data-cat]`
  - Formulario: `#contactForm`, `#btnSubmit`, `.field-error`, `.form-field.has-error`
  - Back-to-top: `#backTop` (button fija abajo-izquierda, visible >600px)
  - Lightbox: igual que antes + soporte touch en `.lightbox-figure`
  - Footer: `.footer-inner` con `.footer-brand`, `.footer-nav`, `.footer-services`
- HTML (index.php) usa clases `reveal` para animación de entrada; main.js base observa `.reveal`.

- [ ] **Step 1: Escribir index.php completo (rewrite)**

Escribir el archivo completo en `index.php`:

```php
<?php
// ============================================================
// SECTOR CREATIVO — Formulario de contacto seguro
// ============================================================
session_start();

$enviado   = false;
$error     = '';
$modoDemo  = false;
$old       = ['nombre' => '', 'email' => '', 'telefono' => '', 'mensaje' => ''];

$host = strtolower((string)($_SERVER['HTTP_HOST'] ?? ''));
$addr = (string)($_SERVER['SERVER_ADDR'] ?? '');
$esLocal = (str_starts_with($host, 'localhost')
    || str_starts_with($host, '127.0.0.1')
    || str_starts_with($host, '[::1]')
    || $addr === '127.0.0.1'
    || $addr === '::1');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $csrfToken = $_POST['csrf'] ?? '';
    $honeypot  = trim((string)($_POST['website'] ?? ''));

    foreach ($old as $k => $v) {
        $old[$k] = trim(strip_tags((string)($_POST[$k] ?? '')));
    }

    if (empty($_SESSION['csrf']) || !hash_equals($_SESSION['csrf'], (string)$csrfToken)) {
        $error = 'Tu sesión expiró. Recarga la página e intenta de nuevo.';
    } elseif ($honeypot !== '') {
        $enviado = true;
    } else {
        $nombre   = $old['nombre'];
        $email    = $old['email'];
        $telefono = $old['telefono'];
        $mensaje  = $old['mensaje'];

        $nombreOk = mb_strlen($nombre) >= 2 && mb_strlen($nombre) <= 100;
        $emailOk  = filter_var($email, FILTER_VALIDATE_EMAIL);
        $telOk    = $telefono === '' || preg_match('/^[\d\s\-\+\(\)]{7,20}$/', $telefono);
        $msgOk    = mb_strlen($mensaje) >= 5 && mb_strlen($mensaje) <= 5000;

        if (!$nombreOk || !$emailOk || !$telOk || !$msgOk) {
            $error = 'Revisa los campos: nombre y mensaje completos, correo válido.';
        } else {
            $to      = 'atencion1@sectorcreativo.com.mx';
            $subject = '=?UTF-8?B?' . base64_encode('Nuevo mensaje desde el sitio web — Sector Creativo') . '?=';

            $body  = "Un visitante envió un mensaje desde el sitio web:\r\n\r\n";
            $body .= "Nombre:   {$nombre}\r\n";
            $body .= "Correo:   {$email}\r\n";
            $body .= "Teléfono: " . ($telefono !== '' ? $telefono : '—') . "\r\n\r\n";
            $body .= "Mensaje:\r\n{$mensaje}\r\n";

            $headers  = "From: Sitio Web Sector Creativo <no-reply@sectorcreativo.com.mx>\r\n";
            $headers .= "Reply-To: {$email}\r\n";
            $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
            $headers .= "X-Mailer: PHP/" . phpversion();

            if ($esLocal) {
                $logDir = __DIR__ . '/logs';
                if (!is_dir($logDir)) { @mkdir($logDir, 0755, true); }
                $fecha = date('Y-m-d_H-i-s');
                @file_put_contents(
                    $logDir . "/contacto_{$fecha}.txt",
                    "{$body}\r\n--- Headers ---\r\n{$headers}\r\n",
                    FILE_APPEND
                );
                $modoDemo = true;
                $enviado  = true;
            } else {
                $enviado = @mail($to, $subject, $body, $headers);
                if (!$enviado) {
                    $error = 'No pudimos enviar el mensaje. Escríbenos directo por WhatsApp: +52 1 867 217 9046';
                }
            }
        }
    }
}

if (empty($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(16));
}
$csrf = $_SESSION['csrf'];

// ============ DATOS REALES (verificados con el cliente 2026-09-09) ============
$clientes = [
    'AGUA LIV', 'FARMACIAS CALDERON', 'MEDLINE', 'RHEEM', 'CHROMALOX',
    'TELEFLEX', 'HOSPITAL SAN GERARDO', 'MARISCOS LA LAGUNA', 'CEVICHE 76',
    'ALITAS & TARROS', 'LA BOTANERIA', 'MUNICIPIO DE NUEVO LAREDO', 'CENTRO CULTURAL'
];

$stats = [
    ['num' => 30, 'suffix' => '',  'label' => 'años creando'],
    ['num' => 13, 'suffix' => '+', 'label' => 'clientes corporativos'],
    ['num' => 8,  'suffix' => '',  'label' => 'servicios especializados'],
];

$procesos = [
    ['01', 'Escucha',      'Entendemos tu marca, tu mercado y el objetivo real de cada pieza.'],
    ['02', 'Diseño',       'Conceptualizamos y validamos la propuesta visual contigo.'],
    ['03', 'Producción',   'Impresión, corte, grabado y acabados en nuestros talleres.'],
    ['04', 'Instalación',  'Entrega, montaje e instalación en sitio cuando lo requiere.'],
];

// Categorías PROVISIONALES (se confirman/ajustan visualmente en Task 10)
$proyectos = [
    ['n' => 1,  'cat' => 'Gran Formato', 'alt' => 'Lona publicitaria de gran formato instalada — Sector Creativo'],
    ['n' => 2,  'cat' => 'Rotulación',   'alt' => 'Rotulación vehicular con livery corporativa — Sector Creativo'],
    ['n' => 3,  'cat' => 'Letreros',     'alt' => 'Letrero luminoso de fachada LED — Sector Creativo'],
    ['n' => 4,  'cat' => 'Diseño Gráfico','alt' => 'Pieza de diseño editorial e identidad — Sector Creativo'],
    ['n' => 5,  'cat' => 'Serigrafía',   'alt' => 'Serigrafía textil personalizada — Sector Creativo'],
    ['n' => 6,  'cat' => 'Láser',        'alt' => 'Corte y grabado láser de precisión — Sector Creativo'],
    ['n' => 7,  'cat' => 'CNC',          'alt' => 'Corte CNC en acrílico y MDF — Sector Creativo'],
    ['n' => 8,  'cat' => 'Gran Formato', 'alt' => 'Valla publicitaria y pendones — Sector Creativo'],
    ['n' => 9,  'cat' => 'Rotulación',   'alt' => 'Rotulación de vidrio y fachada — Sector Creativo'],
    ['n' => 10, 'cat' => 'Letreros',     'alt' => 'Anuncio luminoso tipo neón LED — Sector Creativo'],
];
$cats = array_values(array_unique(array_column($proyectos, 'cat')));
?>
<!DOCTYPE html>
<html lang="es" class="no-js">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sector Creativo | Comunicación Visual — Diseño, Impresión, Rotulación, CNC y Láser</title>
<meta name="description" content="Sector Creativo, Nuevo Laredo: comunicación visual de alto impacto desde hace 30 años. Diseño gráfico, impresión gran formato y digital, rotulación vehicular, corte CNC, grabado láser, serigrafía y letreros luminosos.">
<meta property="og:type" content="website">
<meta property="og:title" content="Sector Creativo | Comunicación Visual">
<meta property="og:description" content="30 años de diseño, impresión, rotulación, CNC, láser, serigrafía y letreros luminosos en Nuevo Laredo, Tamaulipas.">
<meta property="og:url" content="https://www.sectorcreativo.com.mx/">
<meta property="og:image" content="https://www.sectorcreativo.com.mx/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#050508">
<link rel="icon" href="favicon.ico" type="image/x-icon">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;700;900&family=Outfit:wght@300;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/styles.css">
<script>
document.documentElement.classList.replace('no-js', 'js');
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Sector Creativo",
  "legalName": "Sector Creativo, S.A. de C.V.",
  "url": "https://www.sectorcreativo.com.mx",
  "logo": "https://www.sectorcreativo.com.mx/logo_sc_3.svg",
  "image": "https://www.sectorcreativo.com.mx/og-image.png",
  "description": "Comunicación visual: diseño gráfico, impresión gran formato y digital, rotulación, corte CNC, grabado láser, serigrafía y letreros luminosos. 30 años de trayectoria.",
  "telephone": "+528672179046",
  "email": "atencion1@sectorcreativo.com.mx",
  "foundingDate": "1996",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Venustiano Carranza 2800, Col. Guerrero",
    "postalCode": "88240",
    "addressLocality": "Nuevo Laredo",
    "addressRegion": "Tamaulipas",
    "addressCountry": "MX"
  },
  "sameAs": [
    "https://www.facebook.com/screativomx/",
    "https://www.instagram.com/screativomx/",
    "https://www.tiktok.com/@screativomx",
    "https://wa.me/528672179046"
  ]
}
</script>
</head>
<body>

<!-- Skip-link accesible -->
<a class="skip-link" href="#servicios">Saltar al contenido</a>

<!-- Fondo de ruido sutil -->
<div class="noise" aria-hidden="true"></div>

<!-- Barra de progreso de scroll -->
<div id="scrollProgress" aria-hidden="true"></div>

<!-- ================= PRELOADER ================= -->
<div id="preloader" aria-hidden="true">
  <img src="logo_sc_3.svg" alt="" width="150" height="45">
  <div class="preloader-bar"><span></span></div>
  <div class="preloader-count">0%</div>
</div>

<!-- ================= HEADER ================= -->
<header id="header">
  <a href="#inicio" class="logo-link" aria-label="Sector Creativo — Inicio">
    <img src="logo_sc_3.svg" alt="Sector Creativo" class="logo" id="logoHome" width="150" height="45">
  </a>
  <nav id="navMenu" aria-label="Navegación principal">
    <a href="#servicios">Servicios</a>
    <a href="#clientes">Clientes</a>
    <a href="#proyectos">Proyectos</a>
    <a href="#contacto">Contacto</a>
  </nav>
  <button class="hamburger" id="hamburger" aria-label="Abrir menú" aria-expanded="false" aria-controls="navMenu">
    <span></span><span></span><span></span>
  </button>
</header>

<main id="contenido">

<!-- ================= HERO 3D ================= -->
<section class="hero" id="inicio">
  <canvas id="hero3d" aria-hidden="true"></canvas>
  <div class="hero-content">
    <p class="hero-eyebrow">Comunicación Visual · Nuevo Laredo</p>
    <h1 class="hero-title"><span>We are all</span><span class="grad-text">Creative</span></h1>
    <p class="hero-tagline">Diseño · Impresión · Rotulación · CNC · Láser &mdash; de la idea al impacto.</p>
    <div class="hero-badge" role="text">⚡ 30 años creando</div>
    <div class="hero-cta">
      <a href="#servicios" class="btn btn-primary">Explorar servicios</a>
      <a href="#contacto" class="btn btn-ghost">Cotizar ahora</a>
    </div>
  </div>
  <a href="#servicios" class="scroll-hint" aria-label="Bajar a servicios">
    <span></span>
  </a>
</section>

<!-- ================= MARQUEE BAND (inclinado) ================= -->
<div class="marquee-band" aria-hidden="true">
  <div class="marquee">
    <div class="marquee-track">
      <span>Diseño Gráfico</span><span>✦</span>
      <span>Impresión Gran Formato</span><span>✦</span>
      <span>Impresión Digital</span><span>✦</span>
      <span>Rotulación Vehicular</span><span>✦</span>
      <span>Corte CNC</span><span>✦</span>
      <span>Grabado Láser</span><span>✦</span>
      <span>Serigrafía</span><span>✦</span>
      <span>Letreros Luminosos</span><span>✦</span>
      <span>Acabados Especiales</span><span>✦</span>
      <span>Diseño Gráfico</span><span>✦</span>
      <span>Impresión Gran Formato</span><span>✦</span>
      <span>Impresión Digital</span><span>✦</span>
      <span>Rotulación Vehicular</span><span>✦</span>
      <span>Corte CNC</span><span>✦</span>
      <span>Grabado Láser</span><span>✦</span>
      <span>Serigrafía</span><span>✦</span>
      <span>Letreros Luminosos</span><span>✦</span>
      <span>Acabados Especiales</span><span>✦</span>
    </div>
  </div>
</div>

<!-- ================= CLIENTES ================= -->
<section class="section" id="clientes">
  <div class="section-head reveal">
    <p class="section-kicker">Confianza</p>
    <h2>Marcas que confían</h2>
    <p class="section-sub">Tres décadas produciendo comunicación visual para empresas e instituciones de la región.</p>
  </div>
  <div class="clients-marquee reveal">
    <div class="clients-track">
      <?php foreach (array_merge($clientes, $clientes) as $c): ?>
      <span class="client-name"><?= htmlspecialchars($c, ENT_QUOTES, 'UTF-8') ?></span><span class="client-sep">✦</span>
      <?php endforeach; ?>
    </div>
    <div class="clients-track reverse" aria-hidden="true">
      <?php foreach (array_merge(array_reverse($clientes), array_reverse($clientes)) as $c): ?>
      <span class="client-name"><?= htmlspecialchars($c, ENT_QUOTES, 'UTF-8') ?></span><span class="client-sep">✦</span>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<!-- ================= SERVICIOS ================= -->
<section class="section" id="servicios">
  <div class="section-head reveal">
    <p class="section-kicker">Qué hacemos</p>
    <h2>Servicios</h2>
    <p class="section-sub">Comunicación visual de alta calidad, desde la conceptualización hasta la producción final.</p>
  </div>

  <div class="services-grid">
    <?php
    $servicios = [
        'Diseño Gráfico' => [
            'Identidad corporativa', 'Diseño editorial', 'Publicidad y redes', 'Adobe · CorelDRAW',
            'M12,2 L19,9 L12,16 L5,9 Z M12,2 L12,16 M5,9 L12,16 L12,2 Z'
        ],
        'Impresión Gran Formato' => [
            'Lonas y vinilos', 'Pendones y roll-ups', 'Vallas publicitarias', 'Materiales rígidos',
            'M4,4 L9,4 L15,10 L20,10 L20,20 L4,20 Z M9,4 L9,10 L15,10 M4,12 L8,12 M4,16 L8,16'
        ],
        'Impresión Digital' => [
            'Tarjetas de presentación', 'Volantes y flyers', 'Catálogos', 'Formatos hasta 33×48 cm',
            'M6,3 L14,3 L18,7 L18,21 L6,21 Z M14,3 L14,7 L18,7 M9,12 L15,12 M9,16 L15,16 M9,8 L11,8'
        ],
        'Rotulación' => [
            'Wraps vehiculares', 'Vidrios y fachadas', 'Vinilo textil y microperforado', 'Letreros corpóreos',
            'M12,3 C7,3 4,6 4,10 C4,14 7,16 12,21 C17,16 20,14 20,10 C20,6 17,3 12,3 Z M12,10 m-2,0 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0'
        ],
        'Corte CNC' => [
            'Precisión en MDF y acrílico', 'Troqueles y moldes', 'Prototipado 3D', 'Fresado de piezas',
            'M12,8 a4,4 0 1,0 0.001,0 Z M12,2 L15,6 L9,6 Z M12,22 L15,18 L9,18 Z M2,12 L6,9 L6,15 Z M22,12 L18,9 L18,15 Z'
        ],
        'Corte y Grabado Láser' => [
            'Acrílico, madera, metal, vidrio', 'Trofeos y placas', 'Reconocimientos', 'Letreros grabados',
            'M4,20 L20,4 M10,14 L14,10 M7,12 L12,7 M13,17 L17,13'
        ],
        'Serigrafía' => [
            'Playeras y textiles', 'Objetos promocionales', 'Serigrafía industrial', 'Termos, gorras, bolsas',
            'M9,3 L15,3 L17,5 L17,12 L15,14 L9,14 L7,12 L7,5 Z M7,14 L9,21 L15,21 L17,14 M12,3 L12,21'
        ],
        'Letreros Luminosos' => [
            'Neón LED', 'Cajas de luz', 'Fachadas iluminadas', 'Anuncios luminosos',
            'M3,12 C7,6 11,6 14,10 C17,14 20,14 21,12 M7,21 L21,7 M12,21 L21,12'
        ],
        'Acabados Especiales' => [
            'Troquel y repujado', 'Laminados y barniz UV', 'Encuadernación', 'Lujo en cada detalle',
            'M12,3 L14.5,8.5 L20,9 L16,13 L17,19 L12,16 L7,19 L8,13 L4,9 L9.5,8.5 Z'
        ],
    ];
    $i = 0;
    foreach ($servicios as $nombre => $datos):
        $items = array_slice($datos, 0, 4);
        $icon  = $datos[4];
        $i++;
    ?>
    <article class="service-card tilt reveal" style="--d:<?= $i * 0.06 ?>s" data-index="<?= $i ?>">
      <div class="service-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path class="se-icon" d="<?= $icon ?>"/>
        </svg>
      </div>
      <h3><?= htmlspecialchars($nombre, ENT_QUOTES, 'UTF-8') ?></h3>
      <ul>
        <?php foreach ($items as $item): ?>
        <li><?= htmlspecialchars($item, ENT_QUOTES, 'UTF-8') ?></li>
        <?php endforeach; ?>
      </ul>
    </article>
    <?php endforeach; ?>
  </div>
</section>

<!-- ================= PROCESO ================= -->
<section class="section" id="proceso">
  <div class="section-head reveal">
    <p class="section-kicker">Cómo trabajamos</p>
    <h2>De la idea al impacto</h2>
    <p class="section-sub">Un proceso claro de 4 pasos para que tu proyecto llegue a tiempo y con la calidad que tu marca merece.</p>
  </div>
  <div class="process-wrap reveal">
    <div class="process-rail" aria-hidden="true"><span class="process-rail-fill" id="processFill"></span></div>
    <div class="process-grid">
      <?php foreach ($procesos as $idx => $p): ?>
      <div class="process-step reveal" style="--d:<?= $idx * 0.12 ?>s" data-step="<?= $idx + 1 ?>">
        <div class="step-num"><?= $p[0] ?></div>
        <h3 class="step-title"><?= $p[1] ?></h3>
        <p class="step-txt"><?= $p[2] ?></p>
      </div>
      <?php endforeach; ?>
    </div>
  </div>
</section>

<!-- ================= ESTADÍSTICAS ================= -->
<section class="section" id="estadisticas">
  <div class="stats-grid">
    <?php foreach ($stats as $s): ?>
    <div class="stat reveal" style="--d:<?= ($s['num'] * 0.02) ?>s">
      <div class="stat-num" data-count="<?= $s['num'] ?>" data-suffix="<?= htmlspecialchars($s['suffix'], ENT_QUOTES, 'UTF-8') ?>">0</div>
      <div class="stat-label"><?= $s['label'] ?></div>
    </div>
    <?php endforeach; ?>
  </div>
</section>

<!-- ================= PORTFOLIO BENTO ================= -->
<section class="section" id="proyectos">
  <div class="section-head reveal">
    <p class="section-kicker">Portafolio</p>
    <h2>Proyectos</h2>
    <p class="section-sub">Trabajo real producido en nuestros talleres. Toca una imagen para verla en grande.</p>
  </div>

  <div class="filters reveal" role="group" aria-label="Filtrar proyectos por servicio">
    <button class="chip active" data-filter="todos" type="button">Todos</button>
    <?php foreach ($cats as $cat): ?>
    <button class="chip" data-filter="<?= htmlspecialchars($cat, ENT_QUOTES, 'UTF-8') ?>" type="button"><?= htmlspecialchars($cat, ENT_QUOTES, 'UTF-8') ?></button>
    <?php endforeach; ?>
  </div>

  <div class="galeria-grid galeria-bento" id="galeriaGrid">
    <?php foreach ($proyectos as $p): ?>
    <figure class="item reveal<?= $p['n'] % 3 === 0 ? ' item-wide' : '' ?>" data-cat="<?= htmlspecialchars($p['cat'], ENT_QUOTES, 'UTF-8') ?>" style="--d:<?= $p['n'] * 0.03 ?>s">
      <img src="img/proyecto<?= $p['n'] ?>.png" data-full="img/proyecto<?= $p['n'] ?>.png" alt="<?= htmlspecialchars($p['alt'], ENT_QUOTES, 'UTF-8') ?>" loading="lazy" decoding="async" width="800" height="600">
      <figcaption><span class="cap-cat"><?= htmlspecialchars($p['cat'], ENT_QUOTES, 'UTF-8') ?></span><span class="cap-num">Proyecto <?= $p['n'] ?></span></figcaption>
    </figure>
    <?php endforeach; ?>
  </div>
</section>

<!-- ================= CONTACTO ================= -->
<section class="section" id="contacto">
  <div class="section-head reveal">
    <p class="section-kicker">Hablemos</p>
    <h2>Contacto</h2>
    <p class="section-sub">Cuéntanos tu idea y te respondemos con una cotización.</p>
  </div>

  <div class="contact-grid reveal">
    <div class="contact-info">
      <h3>Sector Creativo</h3>
      <p class="contact-line">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12,21 C12,21 5,14.5 5,9.5 A7,7 0 0,1 19,9.5 C19,14.5 12,21 12,21 Z M12,12 m-2.5,0 a2.5,2.5 0 1,0 5,0 a2.5,2.5 0 1,0 -5,0"/></svg>
        <a href="https://maps.app.goo.gl/WUXCeJtFhZ1yJd9FA" target="_blank" rel="noopener">Venustiano Carranza 2800, Col. Guerrero, C.P. 88240 — Nuevo Laredo, Tamps.</a>
      </p>
      <p class="contact-line">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5,4 L9,4 L10.5,9 L8,10.5 C9.5,13.5 10.5,14.5 13.5,16 L15,13.5 L20,15 L20,19 C20,19 15,22 10,17 C5,12 5,4 5,4 Z"/></svg>
        <a href="tel:+528672179046">+52 1 867 217 9046</a> &nbsp;·&nbsp; <a href="tel:+528677194445">+52 867 719 4445</a>
      </p>
      <p class="contact-line">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4,5 L20,5 L20,19 L4,19 Z M4,7 L12,13 L20,7"/></svg>
        <a href="mailto:atencion1@sectorcreativo.com.mx">atencion1@sectorcreativo.com.mx</a>
      </p>

      <div class="redes-sociales" aria-label="Redes sociales">
        <a href="https://www.facebook.com/screativomx/" target="_blank" rel="noopener" aria-label="Facebook"><img src="icons/facebook.png" alt="Facebook" width="40" height="40"></a>
        <a href="https://www.instagram.com/screativomx/" target="_blank" rel="noopener" aria-label="Instagram"><img src="icons/instagram.png" alt="Instagram" width="40" height="40"></a>
        <a href="https://www.tiktok.com/@screativomx" target="_blank" rel="noopener" aria-label="TikTok"><img src="icons/tiktok.png" alt="TikTok" width="40" height="40"></a>
        <a href="https://www.youtube.com" target="_blank" rel="noopener" aria-label="YouTube"><img src="icons/youtube.png" alt="YouTube" width="40" height="40"></a>
        <a href="https://wa.me/528672179046" target="_blank" rel="noopener" aria-label="WhatsApp"><img src="icons/whatsapp.png" alt="WhatsApp" width="40" height="40"></a>
      </div>
    </div>

    <div class="contact-form-wrap">
      <?php if ($enviado): ?>
      <div class="form-alert success" role="status">
        <?php if ($modoDemo): ?>
          ✅ Modo desarrollo: mensaje capturado (no se envió correo). Revisa <code>logs/</code> en la copia local.
        <?php else: ?>
          ✅ ¡Mensaje enviado correctamente! Te contactaremos pronto.
        <?php endif; ?>
      </div>
      <?php elseif ($error): ?>
      <div class="form-alert error" role="alert">⚠️ <?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div>
      <?php endif; ?>

      <form method="POST" action="" id="contactForm" novalidate>
        <input type="text" name="website" class="hp-field" tabindex="-1" autocomplete="off" aria-hidden="true">
        <input type="hidden" name="csrf" value="<?= htmlspecialchars($csrf, ENT_QUOTES, 'UTF-8') ?>">

        <div class="form-row">
          <div class="form-field">
            <label for="f-nombre">Nombre</label>
            <input type="text" id="f-nombre" name="nombre" value="<?= htmlspecialchars($old['nombre'], ENT_QUOTES, 'UTF-8') ?>" required minlength="2" maxlength="100" placeholder="Tu nombre" aria-describedby="err-nombre">
            <p class="field-error" id="err-nombre" hidden></p>
          </div>
          <div class="form-field">
            <label for="f-email">Correo electrónico</label>
            <input type="email" id="f-email" name="email" value="<?= htmlspecialchars($old['email'], ENT_QUOTES, 'UTF-8') ?>" required placeholder="tucorreo@ejemplo.com" aria-describedby="err-email">
            <p class="field-error" id="err-email" hidden></p>
          </div>
        </div>
        <div class="form-field">
          <label for="f-telefono">Teléfono <span class="opt">(opcional)</span></label>
          <input type="tel" id="f-telefono" name="telefono" value="<?= htmlspecialchars($old['telefono'], ENT_QUOTES, 'UTF-8') ?>" pattern="[\d\s\-\+\(\)]{7,20}" placeholder="+52 ..." aria-describedby="err-telefono">
          <p class="field-error" id="err-telefono" hidden></p>
        </div>
        <div class="form-field">
          <label for="f-mensaje">Mensaje</label>
          <textarea id="f-mensaje" name="mensaje" rows="5" required minlength="5" maxlength="5000" placeholder="Cuéntanos qué necesitas…" aria-describedby="err-mensaje"><?= htmlspecialchars($old['mensaje'], ENT_QUOTES, 'UTF-8') ?></textarea>
          <p class="field-error" id="err-mensaje" hidden></p>
        </div>
        <button type="submit" class="btn btn-primary btn-block" id="btnSubmit">
          <span class="btn-label">Enviar mensaje</span><span class="btn-spinner" aria-hidden="true"></span>
        </button>
        <p class="form-note">Respuesta típica en menos de 24 h hábiles.</p>
      </form>
    </div>
  </div>
</section>

</main>

<!-- ================= FOOTER ================= -->
<footer>
  <div class="footer-inner">
    <div class="footer-brand">
      <img src="logo_sc_3.svg" alt="Sector Creativo" class="footer-logo" width="120" height="36">
      <p>Comunicación visual de alto impacto desde 1996.<br>Nuevo Laredo, Tamaulipas.</p>
    </div>
    <div class="footer-nav">
      <h4>Navegación</h4>
      <a href="#servicios">Servicios</a>
      <a href="#clientes">Clientes</a>
      <a href="#proyectos">Proyectos</a>
      <a href="#contacto">Contacto</a>
    </div>
    <div class="footer-services">
      <h4>Servicios</h4>
      <span>Diseño Gráfico</span><span>Gran Formato</span><span>Rotulación</span><span>CNC y Láser</span><span>Serigrafía</span><span>Letreros Luminosos</span>
    </div>
  </div>
  <div class="footer-bottom">
    <p>&copy; 2026 Sector Creativo, S.A. de C.V. · Nuevo Laredo, Tamaulipas</p>
    <p class="footer-credits">Design by <span class="robcor">RobCor</span></p>
  </div>
</footer>

<!-- ================= LIGHTBOX ================= -->
<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Visor de proyectos" hidden>
  <button class="lightbox-close" id="lbClose" aria-label="Cerrar">&times;</button>
  <button class="lightbox-nav prev" id="lbPrev" aria-label="Anterior">&#10094;</button>
  <figure class="lightbox-figure">
    <img class="lightbox-img" src="" alt="" id="lbImg">
    <figcaption class="lightbox-caption" id="lbCaption"></figcaption>
  </figure>
  <button class="lightbox-nav next" id="lbNext" aria-label="Siguiente">&#10095;</button>
  <span class="lightbox-counter" id="lbCounter"></span>
</div>

<!-- Back to top -->
<button id="backTop" aria-label="Volver arriba" hidden>&#8593;</button>

<!-- WhatsApp flotante -->
<a class="wa-float" href="https://wa.me/528672179046?text=Hola%20Sector%20Creativo%2C%20quiero%20una%20cotizaci%C3%B3n." target="_blank" rel="noopener" aria-label="Cotizar por WhatsApp">
  <img src="icons/whatsapp.png" alt="WhatsApp" width="56" height="56">
</a>

<!-- Three.js desde CDN con carga diferida -->
<script defer src="https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js" onerror="window.__THREE_FAILED__=true"></script>
<script defer src="js/hero3d.js"></script>
<script defer src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Validar sintaxis PHP**

Run: `php -l /Users/sector1/Documents/sectoradmin/Proyectos/SECTORCREATIVO.COM.MX/index.php`
Expected: `No syntax errors detected`.

- [ ] **Step 3: Escribir js/main.js (bloque base completo)**

Escribir `js/main.js` completo:

```js
/* ============================================================
   SECTOR CREATIVO — main.js
   Preloader · scroll progress · header scrolled · menú móvil +
   scrollspy · reveal · (bloques añadidos por tarea: hero parallax,
   iconos draw, proceso, contadores, filtros, lightbox touch,
   formulario reforzado, back-to-top)
   ============================================================ */
(function () {
  'use strict';

  var doc = document;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia('(pointer: coarse)').matches;

  /* ================= UTILIDADES ================= */
  function qs(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }

  /* ================= PRELOADER ================= */
  var preloader = qs('#preloader');
  var countEl = qs('.preloader-count');
  var barEl = qs('.preloader-bar span');

  function killPreloader() {
    if (!preloader) return;
    preloader.classList.add('done');
    setTimeout(function () {
      if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
    }, 600);
  }

  if (preloader && !reducedMotion) {
    var t0 = null;
    var DURATION = 900;

    function tick(now) {
      if (!t0) t0 = now;
      var p = Math.min((now - t0) / DURATION, 1);
      // easing suave
      var eased = 1 - Math.pow(1 - p, 3);
      var pct = Math.round(eased * 100);
      if (countEl) countEl.textContent = pct + '%';
      if (barEl) barEl.style.transform = 'scaleX(' + eased + ')';
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        doc.body.classList.add('loaded');
        killPreloader();
      }
    }
    requestAnimationFrame(tick);
    // Red de seguridad: nunca bloquear el sitio
    setTimeout(killPreloader, 2600);
  } else if (preloader) {
    // sin animación: ocultar al instante
    doc.body.classList.add('loaded');
    killPreloader();
  }

  /* ================= SCROLL PROGRESS ================= */
  var progressEl = qs('#scrollProgress');
  function onScrollProgress() {
    if (!progressEl) return;
    var max = doc.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? window.scrollY / max : 0;
    progressEl.style.transform = 'scaleX(' + p + ')';
  }
  window.addEventListener('scroll', onScrollProgress, { passive: true });

  /* ================= HEADER SCROLLED ================= */
  var header = qs('#header');
  function onScrollHeader() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 24);
    if (backTop) backTop.hidden = window.scrollY < 600;
  }
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  /* ================= LOGO → INICIO ================= */
  var logo = qs('#logoHome');
  if (logo) {
    logo.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
      closeMenu();
    });
  }

  /* ================= MENÚ HAMBURGUESA ================= */
  var hamburger = qs('#hamburger');
  var navMenu = qs('#navMenu');

  function closeMenu() {
    if (!navMenu || !hamburger) return;
    navMenu.classList.remove('show');
    hamburger.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'Abrir menú');
  }

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', function () {
      var open = navMenu.classList.toggle('show');
      hamburger.classList.toggle('active', open);
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
      hamburger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });

    navMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          var target = doc.querySelector(href);
          if (target) {
            var y = target.getBoundingClientRect().top + window.scrollY - (header ? header.offsetHeight : 0) - 6;
            window.scrollTo({ top: y, behavior: reducedMotion ? 'auto' : 'smooth' });
          }
          closeMenu();
        }
      });
    });
  }

  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  /* ================= SCROLLSPY ================= */
  var navLinks = navMenu ? qsa('a[href^="#"]', navMenu) : [];
  var spySections = navLinks
    .map(function (a) { return qs(a.getAttribute('href')); })
    .filter(Boolean);
  if ('IntersectionObserver' in window && spySections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = '#' + entry.target.id;
        navLinks.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === id);
        });
        // en móvil, al cambiar de sección navegada, cerrar menú
        if (navMenu.classList.contains('show')) closeMenu();
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    spySections.forEach(function (s) { spy.observe(s); });
  }

  /* ================= SCROLL REVEAL ================= */
  var revealEls = qsa('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }
})();
```

Nota: `backTop` se referencia en `onScrollHeader()` antes de declararse → en Task 8 se declara con `var backTop = qs('#backTop')` ANTES de `onScrollHeader` (la variable debe estar declarada en el scope del IIFE antes de que se ejecute la llamada inicial `onScrollHeader()`). Para que esto no rompa en Task 1, declarar ya en este archivo:

```js
  /* ================= BACK TO TOP (botón visible >600px) ================= */
  var backTop = qs('#backTop');
  if (backTop) {
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  }
```

Insertar ese bloque INMEDIATAMENTE ANTES del bloque `/* ================= HEADER SCROLLED ================= */`.

- [ ] **Step 4: Validar sintaxis JS**

Run: `node --check /Users/sector1/Documents/sectoradmin/Proyectos/SECTORCREATIVO.COM.MX/js/main.js`
Expected: sin errores.

- [ ] **Step 5: CSS bloque A — reemplazar css/styles.css completo**

Escribir `css/styles.css` completo (este archivo reemplaza el anterior e incorpora: raíz con paleta ampliada + bloque A; las tareas siguientes AÑADEN bloques al final tras `/* ============ BLOQUE A ============ */` — para tareas posteriores, insertar antes del media query de prefers-reduced-motion):

```css
/* ============================================================
   SECTOR CREATIVO — styles.css
   Rediseño profundo dark neon. Bloques: A estructura/preloader/
   accesibilidad · B hero · C marquee band · D clientes ·
   E servicios · F proceso · G estadísticas · H portafolio ·
   I contacto/lightbox · J footer/backtop · K responsive/reduced
   ============================================================ */

:root {
  --bg: #050508;
  --bg-soft: #0b0b12;
  --surface: rgba(255, 255, 255, 0.04);
  --surface-hover: rgba(255, 255, 255, 0.08);
  --border: rgba(255, 255, 255, 0.1);
  --text: #f4f4f8;
  --text-dim: #9a9aa8;
  --rojo: #ff4444;
  --amarillo: #ffcc00;
  --cian: #44ffcc;
  --cian-neon: #00e5ff;
  --magenta: #ff44aa;
  --violeta: #7a2dff;
  --grad-marca: linear-gradient(270deg, #ff4444, #ffcc00, #44ffcc, #ff44aa, #ff4444);
  --grad-marca-size: 600% 600%;
  --font-display: 'Unbounded', 'Outfit', system-ui, sans-serif;
  --font-body: 'Outfit', system-ui, sans-serif;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --radius: 16px;
  --shadow-neon: 0 0 40px rgba(255, 68, 68, 0.25);
}

* { margin: 0; padding: 0; box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  font-family: var(--font-body);
  background: var(--bg);
  color: var(--text);
  line-height: 1.7;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

a { text-decoration: none; color: inherit; }
img { max-width: 100%; display: block; }
ul { list-style: none; }
button { font-family: inherit; }

::selection { background: var(--magenta); color: #fff; }

::-webkit-scrollbar { width: 10px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, var(--rojo), var(--magenta));
  border-radius: 5px;
}

/* ---------- Ruido de fondo ---------- */
.noise {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* ---------- Accesibilidad: skip-link ---------- */
.skip-link {
  position: fixed;
  top: -100px;
  left: 16px;
  z-index: 3000;
  background: var(--bg-soft);
  border: 1px solid var(--cian-neon);
  color: var(--text);
  padding: 10px 18px;
  border-radius: 0 0 12px 12px;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  transition: top 0.25s var(--ease-out);
}
.skip-link:focus { top: 0; }

/* ---------- Accesibilidad: focus visible neón ---------- */
a:focus-visible,
button:focus-visible,
input:focus-visible,
textarea:focus-visible,
.chip:focus-visible {
  outline: 2px solid var(--cian-neon);
  outline-offset: 3px;
  border-radius: 6px;
}

/* ---------- Scroll progress ---------- */
#scrollProgress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  z-index: 1200;
  background: var(--grad-marca);
  background-size: var(--grad-marca-size);
  transform: scaleX(0);
  transform-origin: left;
  animation: gradienteLento 10s ease infinite;
  pointer-events: none;
}

/* ---------- Preloader ---------- */
#preloader {
  position: fixed;
  inset: 0;
  z-index: 5000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;
  background: var(--bg);
  transition: opacity 0.5s ease, visibility 0.5s ease;
}
html.no-js #preloader { display: none; }
#preloader.done { opacity: 0; visibility: hidden; }
#preloader img { width: min(200px, 50vw); height: auto; }
.preloader-bar {
  width: min(260px, 60vw);
  height: 4px;
  border-radius: 4px;
  background: var(--border);
  overflow: hidden;
}
.preloader-bar span {
  display: block;
  height: 100%;
  width: 100%;
  background: var(--grad-marca);
  background-size: var(--grad-marca-size);
  transform: scaleX(0);
  transform-origin: left;
  animation: gradienteLento 4s ease infinite;
}
.preloader-count {
  font-family: var(--font-display);
  font-size: 0.85rem;
  letter-spacing: 0.3em;
  color: var(--text-dim);
}

/* ============================================================
   HEADER
   ============================================================ */
header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px clamp(20px, 6vw, 150px);
  background: rgba(5, 5, 8, 0.55);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid transparent;
  z-index: 1000;
  transition: background 0.4s ease, border-color 0.4s ease, padding 0.4s ease;
}

header.scrolled {
  background: rgba(5, 5, 8, 0.85);
  border-bottom-color: var(--border);
  padding-block: 10px;
}

.logo-link { line-height: 0; }
.logo { width: clamp(110px, 18vw, 160px); height: auto; }

nav {
  display: flex;
  gap: clamp(18px, 3vw, 38px);
}

nav a {
  position: relative;
  color: var(--text);
  font-weight: 500;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 6px 2px;
  transition: color 0.3s ease;
}

nav a::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 2px;
  background: var(--grad-marca);
  background-size: var(--grad-marca-size);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.35s var(--ease-out);
  animation: gradienteLento 8s ease infinite;
}

nav a:hover { color: #fff; }
nav a:hover::after, nav a.active::after { transform: scaleX(1); }
nav a.active { color: #fff; }

/* Hamburguesa */
.hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  z-index: 1001;
}

.hamburger span {
  width: 28px;
  height: 2.5px;
  background: var(--text);
  border-radius: 2px;
  transition: all 0.35s var(--ease-out);
}

.hamburger.active span:nth-child(1) { transform: translateY(7.5px) rotate(45deg); }
.hamburger.active span:nth-child(2) { opacity: 0; }
.hamburger.active span:nth-child(3) { transform: translateY(-7.5px) rotate(-45deg); }

/* ---------- Animaciones base ---------- */
@keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes gradienteLento {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* ---------- Reveal on scroll ---------- */
.reveal {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.9s var(--ease-out) var(--d, 0s), transform 0.9s var(--ease-out) var(--d, 0s);
  will-change: opacity, transform;
}
.reveal.visible { opacity: 1; transform: translateY(0); }
html.no-js .reveal { opacity: 1; transform: none; }

/* ============ BLOQUE A ============ */
/* (Las tareas siguientes insertan aquí su CSS, ANTES del media query
   prefers-reduced-motion que está al final del archivo) */
```

+ incluir al final del archivo el bloque responsive + reduced-motion actualizado (copiado de tareas posteriores se añadirá al final en Task 10; por ahora conservar el existente):

```css
/* ============================================================
   RESPONSIVE
   ============================================================ */
@media (max-width: 900px) {
  .contact-grid { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; gap: 0; }
}

@media (max-width: 768px) {
  nav {
    position: fixed;
    top: 0;
    right: 0;
    height: 100svh;
    width: min(78vw, 320px);
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 34px;
    background: rgba(5, 5, 8, 0.97);
    backdrop-filter: blur(20px);
    border-left: 1px solid var(--border);
    transform: translateX(100%);
    transition: transform 0.5s var(--ease-out);
  }

  nav.show { transform: translateX(0); }

  nav a { font-size: 1.1rem; }

  .hamburger { display: flex; }

  .lightbox-nav { width: 44px; height: 44px; }
  .lightbox-nav.prev { left: 10px; }
  .lightbox-nav.next { right: 10px; }

  .galeria-grid .item img { height: 200px; }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001s !important;
    scroll-behavior: auto !important;
  }

  .reveal { opacity: 1; transform: none; }
}
```

- [ ] **Step 6: Verificar página servida con Playwright (estructura completa)**

Crear `pwtest/task1_check.js`:

```js
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://127.0.0.1:8090/', { waitUntil: 'networkidle' });
  const checks = {
    title: await page.title(),
    h1: await page.locator('h1').innerText(),
    preloaderGone: await page.locator('#preloader').count() === 0,
    skipLink: await page.locator('.skip-link').count() === 1,
    sections: await page.locator('main section').count(),
    clientes: await page.locator('.client-name').count(),
    services: await page.locator('.service-card').count(),
    stats: await page.locator('.stat').count(),
    steps: await page.locator('.process-step').count(),
    chips: await page.locator('.chip').count(),
    items: await page.locator('.item').count(),
    navLinks: await page.locator('#navMenu a').count(),
    backTop: await page.locator('#backTop').count(),
    footerCols: await page.locator('.footer-inner > div').count()
  };
  console.log(JSON.stringify({ checks, errors }, null, 2));
  await browser.close();
})();
```

Run from `/var/folders/b1/p4bj4v0j2ll3s5dj2tnwp5zc0000gn/T/opencode/pwtest/`:
```bash
node task1_check.js
```
Expected: `h1` = "We are all\nCreative", `preloaderGone` = true (o `#preloader` eliminado tras el timeout), `clientes` = 26 (13×2), `services` = 9, `stats` = 3, `steps` = 4, `chips` = 8 (Todos + 7 categorías), `items` = 10, `navLinks` = 4, `backTop` = 1, `footerCols` = 3, `errors` = [].

- [ ] **Step 7: Commit**

```bash
cd /Users/sector1/Documents/sectoradmin/Proyectos/SECTORCREATIVO.COM.MX
git add -A
git commit -m "feat: estructura one-page reforzada (preloader, clientes, proceso, stats, bento, footer 3 col) + main.js base"
```

---

### Task 2: Hero 3D evolución (constelación + scroll reaction + DPR adaptativo) + parallax de título

**Files:**
- Rewrite: `js/hero3d.js` (partículas con líneas de constelación estáticas dentro del grupo; counts y DPR adaptativos por viewport; reacción al scroll; pausa en `document.hidden`)
- Modify: `js/main.js` (bloque parallax del hero-content con rAF — insertar antes de `/* ================= SCROLL REVEAL ================= */`)
- Modify: `css/styles.css` (bloque B insertado tras `/* ============ BLOQUE A ============ */`)

**Interfaces:**
- Consumes: `#hero3d` (canvas), `.hero-content`, `.hero-badge`, `data-three-ready` (atributo que main.js puede leer).
- Produces: `data-three-ready="0"|"1"` en el canvas; `.hero-content` con transform aplicada por JS (parallax + fade al hacer scroll); badge con pulso CSS.

- [ ] **Step 1: Reescribir js/hero3d.js completo**

```js
/* ============================================================
   SECTOR CREATIVO — hero3d.js
   Campo de partículas 3D estilo constelación creativa.
   - 3 capas: núcleo esférico + anillo orbital + fondo lejano
   - Líneas de constelación (pares cercanos, calculadas 1 sola vez)
   - Reacción al scroll (profundidad) y parallax con el mouse
   - Conteo de partículas adaptativo por viewport + DPR < 2 en móvil
   - Fallback elegante si WebGL o el CDN fallan
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('hero3d');
  if (!canvas) return;

  if (typeof window.THREE === 'undefined') return;
  if (!window.WebGLRenderingContext) return;

  var renderer, scene, camera, group;
  var particles, particles2, bgPoints, lines;
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
    if (w < 480)  return { core: 500,  ring: 160, bg: 260,  lineNodes: 60 };
    if (w < 768)  return { core: 750,  ring: 220, bg: 380,  lineNodes: 90 };
    if (w < 1280) return { core: 1100, ring: 300, bg: 500,  lineNodes: 130 };
    return           { core: 1400, ring: 350, bg: 600,  lineNodes: 170 };
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
      positions3[k * 3]     = (Math.random() - 0.5) * 22;
      positions3[k * 3 + 1] = (Math.random() - 0.5) * 12;
      positions3[k * 3 + 2] = (Math.random() - 0.5) * 16 - 4;
    }
    geo3.setAttribute('position', new THREE.BufferAttribute(positions3, 3));
    var mat3 = new THREE.PointsMaterial({
      size: 0.025, color: 0xffffff, transparent: true, opacity: 0.28,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    bgPoints = new THREE.Points(geo3, mat3);
    scene.add(bgPoints);

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

    // Reacción al scroll: el sistema se "hunde" lentamente al bajar
    var scrollFactor = Math.min(window.scrollY / window.innerHeight, 1);
    group.position.y = -scrollFactor * 1.6;
    group.rotation.z = -scrollFactor * 0.12;

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
```

- [ ] **Step 2: Validar sintaxis JS**

Run: `node --check /Users/sector1/Documents/sectoradmin/Proyectos/SECTORCREATIVO.COM.MX/js/hero3d.js`
Expected: sin errores.

- [ ] **Step 3: Añadir parallax del hero-content en main.js**

Insertar en `js/main.js`, ANTES del bloque `/* ================= SCROLL REVEAL ================= */`:

```js
  /* ================= PARALLAX TÍTULO (scroll) ================= */
  var heroContent = qs('.hero-content');
  var heroEl = qs('.hero');
  if (heroContent && heroEl && !reducedMotion) {
    var rafParallax = null;

    function onParallaxScroll() {
      if (rafParallax) return;
      rafParallax = requestAnimationFrame(function () {
        rafParallax = null;
        var rect = heroEl.getBoundingClientRect();
        if (rect.bottom < 0) return;
        var sc = Math.min(window.scrollY, window.innerHeight * 1.4);
        var p = sc / (window.innerHeight * 1.4);
        heroContent.style.transform = 'translateY(' + (sc * 0.22) + 'px)';
        heroContent.style.opacity = String(Math.max(1 - p * 1.05, 0));
      });
    }
    window.addEventListener('scroll', onParallaxScroll, { passive: true });
  }
```

- [ ] **Step 4: CSS bloque B (hero: badge, parallax base, glow)**

Insertar tras `/* ============ BLOQUE A ============ */` en `css/styles.css`:

```css
/* ============ BLOQUE B — HERO ============ */
.hero {
  position: relative;
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
}

#hero3d {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  z-index: 1;
}

.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    radial-gradient(ellipse 60% 45% at 50% 40%, rgba(255, 68, 68, 0.16), transparent 70%),
    radial-gradient(ellipse 50% 40% at 20% 75%, rgba(0, 229, 255, 0.10), transparent 70%),
    radial-gradient(ellipse 50% 40% at 82% 30%, rgba(255, 68, 170, 0.10), transparent 70%);
  animation: pulsoGlow 9s ease-in-out infinite alternate;
}

.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 75%);
}

@keyframes pulsoGlow {
  0%   { opacity: 0.7; transform: scale(1); }
  100% { opacity: 1;   transform: scale(1.08); }
}

.hero-content {
  position: relative;
  z-index: 2;
  padding: 120px 24px 80px;
  max-width: 1100px;
  will-change: transform, opacity;
}

.hero-eyebrow {
  display: inline-block;
  font-size: 0.8rem;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: var(--text-dim);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 8px 20px;
  margin-bottom: 28px;
  backdrop-filter: blur(4px);
  background: rgba(255, 255, 255, 0.03);
  animation: fadeDown 0.9s var(--ease-out) both;
}

.hero-title {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(2.8rem, 10vw, 8.5rem);
  line-height: 1.04;
  letter-spacing: -0.03em;
  text-transform: uppercase;
  margin-bottom: 24px;
}

.hero-title span { display: block; animation: fadeUp 1s var(--ease-out) both; }
.hero-title span:nth-child(2) { animation-delay: 0.15s; }

.hero-title .grad-text {
  background: var(--grad-marca);
  background-size: var(--grad-marca-size);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradienteLento 10s ease infinite, fadeUp 1s var(--ease-out) 0.15s both;
}

.hero-tagline {
  font-size: clamp(1rem, 2vw, 1.3rem);
  color: var(--text-dim);
  max-width: 620px;
  margin: 0 auto 26px;
  animation: fadeUp 1s var(--ease-out) 0.3s both;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 68, 68, 0.45);
  border-radius: 999px;
  padding: 10px 20px;
  margin-bottom: 30px;
  box-shadow: 0 0 24px rgba(255, 68, 68, 0.25), inset 0 0 18px rgba(255, 68, 68, 0.08);
  animation: fadeUp 1s var(--ease-out) 0.38s both, badgePulse 3s ease-in-out infinite;
  backdrop-filter: blur(6px);
}

@keyframes badgePulse {
  0%, 100% { box-shadow: 0 0 24px rgba(255, 68, 68, 0.25), inset 0 0 18px rgba(255, 68, 68, 0.08); }
  50%      { box-shadow: 0 0 38px rgba(255, 68, 68, 0.5), inset 0 0 24px rgba(255, 68, 170, 0.15); }
}

.hero-cta { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; animation: fadeUp 1s var(--ease-out) 0.45s both; }

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 16px 34px;
  border-radius: 999px;
  cursor: pointer;
  border: none;
  transition: transform 0.3s var(--ease-out), box-shadow 0.3s ease, background 0.3s ease;
}

.btn-primary {
  background: var(--grad-marca);
  background-size: var(--grad-marca-size);
  color: #050508;
  animation: gradienteLento 10s ease infinite;
  box-shadow: 0 0 28px rgba(255, 68, 68, 0.35);
  position: relative;
  overflow: hidden;
}

/* shine sweep */
.btn-primary::after {
  content: '';
  position: absolute;
  top: -40%;
  left: -60%;
  width: 50%;
  height: 180%;
  background: linear-gradient(105deg, transparent, rgba(255, 255, 255, 0.45), transparent);
  transform: skewX(-25deg);
  transition: left 0.6s var(--ease-out);
  pointer-events: none;
}
.btn-primary:hover::after { left: 130%; }

.btn-primary:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 0 44px rgba(255, 68, 170, 0.5); }

.btn-ghost {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
  backdrop-filter: blur(4px);
}

.btn-ghost:hover { transform: translateY(-3px); border-color: var(--cian-neon); color: var(--cian-neon); box-shadow: 0 0 24px rgba(0, 229, 255, 0.2); }

.btn-block { width: 100%; }

.scroll-hint {
  position: absolute;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  width: 26px;
  height: 44px;
  border: 2px solid var(--border);
  border-radius: 999px;
  animation: fadeUp 1s var(--ease-out) 0.8s both;
}

.scroll-hint span {
  position: absolute;
  top: 8px;
  left: 50%;
  width: 4px;
  height: 8px;
  margin-left: -2px;
  border-radius: 2px;
  background: var(--magenta);
  animation: scrollPulse 1.8s ease-in-out infinite;
}

@keyframes scrollPulse {
  0%   { transform: translateY(0); opacity: 1; }
  70%  { transform: translateY(14px); opacity: 0; }
  100% { transform: translateY(0); opacity: 0; }
}
```

- [ ] **Step 5: Verificar WebGL + parallax con Playwright**

Crear `pwtest/task2_check.js`:

```js
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://127.0.0.1:8090/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const ready = await page.locator('#hero3d').getAttribute('data-three-ready');
  const badge = await page.locator('.hero-badge').innerText();
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(300);
  const heroOpacity = await page.evaluate(() => getComputedStyle(document.querySelector('.hero-content')).opacity);
  console.log(JSON.stringify({ ready, badge, heroOpacity, errors }, null, 2));
  await browser.close();
})();
```

Run:
```bash
node task2_check.js
```
Expected: `ready` = `"1"` (o `"0"` si el entorno no tiene WebGL — aceptable, el fallback CSS entra), `badge` contiene `30 años`, `heroOpacity` < `1` (parallax activo), `errors` = [].

- [ ] **Step 6: Commit**

```bash
cd /Users/sector1/Documents/sectoradmin/Proyectos/SECTORCREATIVO.COM.MX
git add -A
git commit -m "feat: hero 3D con constelación, scroll reaction y DPR adaptativo + parallax de título y badge 30 años"
```

---

### Task 3: Marquee band inclinado + detalles de sección

**Files:**
- Modify: `css/styles.css` (bloque C tras BLOQUE B)

**Interfaces:**
- Consumes: `.marquee-band`, `.marquee`, `.marquee-track` del index.php.
- Produces: comportamiento visual (banda inclinada, glow, pausa en hover) sin JS.

- [ ] **Step 1: CSS bloque C**

Insertar tras el BLOQUE B en `css/styles.css`:

```css
/* ============ BLOQUE C — MARQUEE BAND ============ */
.marquee-band {
  position: relative;
  z-index: 5;
  overflow: hidden;
  padding: 30px 0;
  margin: -10px 0;
  pointer-events: none;
}

.marquee {
  position: relative;
  border-block: 1px solid var(--border);
  background:
    linear-gradient(90deg, rgba(255, 68, 68, 0.06), rgba(0, 229, 255, 0.05), rgba(255, 68, 170, 0.06)),
    var(--bg-soft);
  overflow: hidden;
  padding: 16px 0;
  transform: rotate(-2deg) scale(1.04);
  box-shadow: 0 0 40px rgba(255, 68, 68, 0.08);
  pointer-events: auto;
}

.marquee-track {
  display: flex;
  gap: 30px;
  align-items: center;
  white-space: nowrap;
  width: max-content;
  animation: marqueeMove 26s linear infinite;
}

.marquee-track:hover { animation-play-state: paused; }

.marquee-track span {
  font-family: var(--font-display);
  font-size: 0.82rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--text-dim);
  transition: color 0.3s ease, text-shadow 0.3s ease;
}

.marquee-track span:nth-child(even) { color: var(--magenta); }

.marquee:hover .marquee-track span { color: var(--text); text-shadow: 0 0 14px rgba(255, 68, 170, 0.5); }

@keyframes marqueeMove { to { transform: translateX(-50%); } }
```

- [ ] **Step 2: Verificación visual (screenshot)**

Crear `pwtest/task3_check.js`:

```js
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8090/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const marquee = await page.evaluate(() => {
    const el = document.querySelector('.marquee');
    const cs = getComputedStyle(el);
    return { rotate: cs.transform, trackAnim: getComputedStyle(el.querySelector('.marquee-track')).animationName };
  });
  await page.screenshot({ path: 'task3_marquee.png' });
  console.log(JSON.stringify({ marquee }, null, 2));
  await browser.close();
})();
```

Run:
```bash
node task3_check.js
```
Expected: `rotate` no vacío (matriz con rotación), `trackAnim` = `marqueeMove`. Revisar `task3_marquee.png` con el usuario si se desea.

- [ ] **Step 3: Commit**

```bash
cd /Users/sector1/Documents/sectoradmin/Proyectos/SECTORCREATIVO.COM.MX
git add -A
git commit -m "feat: marquee band inclinada con glow y pausa en hover"
```

---

### Task 4: Logo wall de clientes (marquee doble dirección)

**Files:**
- Modify: `css/styles.css` (bloque D tras BLOQUE C)

**Interfaces:**
- Consumes: `#clientes .clients-marquee`, `.clients-track` (+ `.reverse`), `.client-name`, `.client-sep` (ya en index.php).
- Produces: marquee doble con direcciones opuestas, pausa en hover, los nombres se iluminan con gradiente de marca.

- [ ] **Step 1: CSS bloque D**

Insertar tras el BLOQUE C en `css/styles.css`:

```css
/* ============ BLOQUE D — CLIENTES (logo wall tipográfico) ============ */
#clientes { padding-top: clamp(60px, 8vw, 100px); }

.clients-marquee {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 18px;
  overflow: hidden;
  padding: 12px 0;
  mask-image: linear-gradient(90deg, transparent, black 12%, black 88%, transparent);
  -webkit-mask-image: linear-gradient(90deg, transparent, black 12%, black 88%, transparent);
}

.clients-track {
  display: flex;
  align-items: center;
  gap: 22px;
  width: max-content;
  white-space: nowrap;
  animation: clientsMove 40s linear infinite;
}

.clients-track.reverse {
  animation-direction: reverse;
  animation-duration: 46s;
}

.clients-marquee:hover .clients-track { animation-play-state: paused; }

.client-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(1.05rem, 2.4vw, 1.55rem);
  letter-spacing: 0.06em;
  color: var(--text-dim);
  opacity: 0.75;
  transition: opacity 0.35s ease, color 0.35s ease, text-shadow 0.35s ease;
}

.client-sep {
  color: var(--magenta);
  font-size: 0.85rem;
  opacity: 0.6;
}

.clients-marquee:hover .client-name {
  opacity: 1;
  color: var(--text);
  text-shadow: 0 0 18px rgba(255, 68, 170, 0.45);
}

@keyframes clientsMove { to { transform: translateX(-50%); } }
```

- [ ] **Step 2: Verificación con Playwright**

Crear `pwtest/task4_check.js`:

```js
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8090/#clientes', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const data = await page.evaluate(() => {
    const names = Array.from(document.querySelectorAll('.client-name')).map(e => e.textContent.trim());
    const tracks = document.querySelectorAll('.clients-track');
    return {
      count: names.length,
      unique: new Set(names).size,
      reverseAnim: getComputedStyle(tracks[1]).animationDirection,
      hasRheem: names.includes('RHEEM'),
      hasMunicipio: names.some(n => n.includes('MUNICIPIO'))
    };
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
```

Run:
```bash
node task4_check.js
```
Expected: `count` = 26, `unique` = 13, `reverseAnim` = `reverse`, `hasRheem`/`hasMunicipio` = true.

- [ ] **Step 3: Commit**

```bash
cd /Users/sector1/Documents/sectoradmin/Proyectos/SECTORCREATIVO.COM.MX
git add -A
git commit -m "feat: logo wall tipográfico de 13 clientes reales con marquee doble dirección"
```

---

### Task 5: Servicios — iconos dibujados + bordes de neón + esquinas chip

**Files:**
- Modify: `css/styles.css` (bloque E tras BLOQUE D)
- Modify: `js/main.js` (bloque "iconos draw" — insertar ANTES de `/* ================= SCROLL REVEAL ================= */`)

**Interfaces:**
- Consumes: `.service-card .service-icon svg path.se-icon`, `.service-card.tilt` (ya en HTML).
- Produces: `.se-icon` con `stroke-dasharray/dashoffset` animado al entrar en viewport; bordes de neón con clip-path; el path NO se anima si `reducedMotion`.

- [ ] **Step 1: JS iconos draw**

Insertar en `js/main.js` antes de `/* ================= SCROLL REVEAL ================= */`:

```js
  /* ================= ICONOS DIBUJADOS (stroke draw) ================= */
  var iconPaths = qsa('.se-icon');
  if (!reducedMotion && iconPaths.length && 'IntersectionObserver' in window) {
    var ioIcons = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var p = entry.target;
        var len = p.getTotalLength ? p.getTotalLength() : 300;
        p.style.setProperty('--len', Math.ceil(len));
        p.classList.add('drawn');
        ioIcons.unobserve(p);
      });
    }, { threshold: 0.4 });
    iconPaths.forEach(function (p) { ioIcons.observe(p); });
  } else {
    iconPaths.forEach(function (p) { p.classList.add('drawn'); });
  }
```

- [ ] **Step 2: CSS bloque E**

Insertar tras el BLOQUE D en `css/styles.css`:

```css
/* ============ BLOQUE E — SERVICIOS ============ */
.section {
  padding: clamp(70px, 10vw, 120px) clamp(20px, 6vw, 150px);
  position: relative;
  z-index: 1;
  max-width: 1500px;
  margin: 0 auto;
}

.section-head { text-align: center; margin-bottom: clamp(40px, 6vw, 70px); }

.section-kicker {
  font-size: 0.8rem;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: var(--magenta);
  margin-bottom: 14px;
}

.section-head h2 {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(2rem, 5vw, 3.6rem);
  text-transform: uppercase;
  letter-spacing: -0.02em;
  margin-bottom: 16px;
}

.section-head h2::after {
  content: '';
  display: block;
  width: 80px;
  height: 4px;
  margin: 18px auto 0;
  background: var(--grad-marca);
  background-size: var(--grad-marca-size);
  border-radius: 2px;
  animation: gradienteLento 10s ease infinite;
}

.section-sub { color: var(--text-dim); max-width: 640px; margin: 0 auto; font-size: 1.05rem; }

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: 22px;
}

.service-card {
  position: relative;
  background: var(--bg-soft);
  border: 1px solid transparent;
  border-radius: var(--radius);
  padding: 30px 26px;
  /* borde gradiente animado (técnica padding-box/border-box) */
  background:
    linear-gradient(var(--bg-soft), var(--bg-soft)) padding-box,
    linear-gradient(120deg, rgba(255, 68, 68, 0.4), rgba(255, 68, 170, 0.4), rgba(0, 229, 255, 0.4)) border-box;
  background-size: 100% 100%, 300% 300%;
  background-position: 0 0, 0% 50%;
  transition: background-position 0.6s ease, transform 0.35s var(--ease-out), box-shadow 0.4s ease;
  transform-style: preserve-3d;
  overflow: hidden;
  clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px));
}

.service-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(400px circle at var(--mx, 50%) var(--my, 0%), rgba(255, 68, 170, 0.12), transparent 45%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.service-card:hover {
  background-position: 0 0, 100% 50%;
  animation: bordeNeon 3s ease infinite;
  box-shadow: 0 0 30px rgba(255, 68, 170, 0.15);
}

@keyframes bordeNeon {
  0%   { background-position: 0 0, 0% 50%; }
  50%  { background-position: 0 0, 100% 50%; }
  100% { background-position: 0 0, 0% 50%; }
}

.service-card:hover::before { opacity: 1; }

.service-icon {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: var(--magenta);
  transition: color 0.35s ease, box-shadow 0.35s ease, transform 0.35s var(--ease-out);
}

.service-icon svg { width: 28px; height: 28px; }

/* trazo dibujado */
.se-icon {
  stroke-dasharray: var(--len, 400);
  stroke-dashoffset: var(--len, 400);
  transition: stroke-dashoffset 1.1s var(--ease-out) 0.15s;
}
.se-icon.drawn { stroke-dashoffset: 0; }

.service-card:hover .service-icon {
  color: var(--cian-neon);
  box-shadow: 0 0 24px rgba(0, 229, 255, 0.25);
  transform: translateZ(30px) scale(1.06);
}

.service-card h3 {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.05rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 14px;
  transform: translateZ(20px);
}

.service-card ul li {
  position: relative;
  color: var(--text-dim);
  font-size: 0.92rem;
  padding-left: 18px;
  margin-bottom: 7px;
}

.service-card ul li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.65em;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: var(--grad-marca);
  transform: rotate(45deg);
}
```

- [ ] **Step 3: Verificación**

Crear `pwtest/task5_check.js`:

```js
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://127.0.0.1:8090/#servicios', { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  const data = await page.evaluate(() => {
    const drawn = Array.from(document.querySelectorAll('.se-icon')).filter(p => p.classList.contains('drawn'));
    const first = document.querySelector('.se-icon');
    return {
      drawnCount: drawn.length,
      total: document.querySelectorAll('.se-icon').length,
      hasDasharray: getComputedStyle(first).strokeDasharray !== 'none',
      clip: getComputedStyle(document.querySelector('.service-card')).clipPath.includes('polygon')
    };
  });
  console.log(JSON.stringify({ data, errors }, null, 2));
  await browser.close();
})();
```

Run:
```bash
node task5_check.js
```
Expected: `drawnCount` = `total` (9), `hasDasharray` = true, `clip` = true, `errors` = [].

- [ ] **Step 4: Commit**

```bash
cd /Users/sector1/Documents/sectoradmin/Proyectos/SECTORCREATIVO.COM.MX
git add -A
git commit -m "feat: servicios con iconos stroke-draw, bordes neón animados y esquinas chip"
```

---

### Task 6: Proceso — rail de progreso iluminado

**Files:**
- Modify: `css/styles.css` (bloque F tras BLOQUE E)
- Modify: `js/main.js` (bloque proceso — `processFill` actualiza `--p` según el paso visible)

**Interfaces:**
- Consumes: `#processFill`, `.process-step[data-step]` (HTML ya en index.php).
- Produces: `--p` (0–100%) en `#processFill`, rail visible solo con `reducedMotion` en estado final.

- [ ] **Step 1: JS proceso**

Insertar en `js/main.js` antes de `/* ================= SCROLL REVEAL ================= */`:

```js
  /* ================= PROCESO: RAIL DE PROGRESO ================= */
  var processFill = qs('#processFill');
  var processSteps = qsa('.process-step');
  if (processFill && processSteps.length && 'IntersectionObserver' in window) {
    var ioProcess = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var step = parseInt(entry.target.getAttribute('data-step'), 10) || 0;
        var p = Math.round((step / processSteps.length) * 100);
        if (step === processSteps.length ? p : p - 25 < 0 ? 0 : p - 25) {
          processFill.style.setProperty('--p', Math.max(0, p - 25) + '%');
        }
        if (step === processSteps.length) {
          processFill.style.setProperty('--p', '100%');
        }
        ioProcess.unobserve(entry.target);
      });
    }, { threshold: 0.35 });
    processSteps.forEach(function (s) { ioProcess.observe(s); });
  } else if (processFill) {
    processFill.style.setProperty('--p', '100%');
  }
```

- [ ] **Step 2: CSS bloque F**

Insertar tras el BLOQUE E en `css/styles.css`:

```css
/* ============ BLOQUE F — PROCESO ============ */
.process-wrap { position: relative; max-width: 1100px; margin: 0 auto; }

.process-rail {
  position: absolute;
  top: 26px;
  left: 6%;
  right: 6%;
  height: 3px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}

.process-rail-fill {
  display: block;
  height: 100%;
  width: 100%;
  background: var(--grad-marca);
  background-size: var(--grad-marca-size);
  animation: gradienteLento 10s ease infinite;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.8s var(--ease-out);
}

.process-rail-fill { transform: scaleX(var(--p, 0%)); }

.process-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  counter-reset: step;
}

.process-step { text-align: center; padding: 0 8px; }

.step-num {
  position: relative;
  z-index: 2;
  display: inline-grid;
  place-items: center;
  width: 52px;
  height: 52px;
  margin-bottom: 18px;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 1rem;
  color: var(--text);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 999px;
  box-shadow: 0 0 0 6px var(--bg);
  transition: border-color 0.35s ease, box-shadow 0.35s ease, color 0.35s ease;
}

.process-step.visible .step-num {
  border-color: rgba(255, 68, 170, 0.6);
  color: var(--magenta);
  box-shadow: 0 0 0 6px var(--bg), 0 0 24px rgba(255, 68, 170, 0.35);
}

.step-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 10px;
}

.step-txt { color: var(--text-dim); font-size: 0.92rem; max-width: 220px; margin: 0 auto; }
```

Nota: el `.process-step` es también `.reveal`, así que al entrar en viewport recibe `.visible` del observer de reveal — el CSS usa `.process-step.visible` para encender el número. El JS de rail usa su propio observer.

- [ ] **Step 3: Verificación**

```bash
node --check /Users/sector1/Documents/sectoradmin/Proyectos/SECTORCREATIVO.COM.MX/js/main.js
```
Expected: sin errores. Verificación de runtime incluida en Task 10 (playwright integral).

- [ ] **Step 4: Commit**

```bash
cd /Users/sector1/Documents/sectoradmin/Proyectos/SECTORCREATIVO.COM.MX
git add -A
git commit -m "feat: proceso en 4 pasos con rail de progreso iluminado"
```

---

### Task 7: Estadísticas animadas (datos reales)

**Files:**
- Modify: `css/styles.css` (bloque G tras BLOQUE F)
- Modify: `js/main.js` (bloque contadores — insertar ANTES de `/* ================= SCROLL REVEAL ================= */`)

**Interfaces:**
- Consumes: `.stat-num[data-count][data-suffix]` (HTML ya en index.php).
- Produces: animación de contador 0→target con easing, ~1.6s, al entrar en viewport; respeta `reducedMotion` (salta directo al valor).

- [ ] **Step 1: JS contadores**

Insertar en `js/main.js` antes de `/* ================= SCROLL REVEAL ================= */`:

```js
  /* ================= CONTADORES DE ESTADÍSTICAS ================= */
  var statNums = qsa('.stat-num[data-count]');
  if (statNums.length) {
    if (!reducedMotion && 'IntersectionObserver' in window) {
      var ioStats = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var target = parseInt(el.getAttribute('data-count'), 10) || 0;
          var suffix = el.getAttribute('data-suffix') || '';
          var t0 = null;
          var DUR = 1600;
          function step(now) {
            if (!t0) t0 = now;
            var p = Math.min((now - t0) / DUR, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(eased * target) + suffix;
            if (p < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
          ioStats.unobserve(el);
        });
      }, { threshold: 0.5 });
      statNums.forEach(function (s) { ioStats.observe(s); });
    } else {
      statNums.forEach(function (el) {
        el.textContent = (el.getAttribute('data-count') || '0') + (el.getAttribute('data-suffix') || '');
      });
    }
  }
```

- [ ] **Step 2: CSS bloque G**

Insertar tras el BLOQUE F en `css/styles.css`:

```css
/* ============ BLOQUE G — ESTADÍSTICAS ============ */
#estadisticas {
  padding-block: clamp(40px, 6vw, 70px);
  border-block: 1px solid var(--border);
  background:
    radial-gradient(ellipse 50% 80% at 50% 50%, rgba(255, 68, 170, 0.06), transparent 70%),
    var(--bg-soft);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: clamp(24px, 5vw, 60px);
  text-align: center;
  max-width: 1000px;
  margin: 0 auto;
}

.stat-num {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(3rem, 8vw, 5.5rem);
  line-height: 1.1;
  background: var(--grad-marca);
  background-size: var(--grad-marca-size);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradienteLento 10s ease infinite;
  filter: drop-shadow(0 0 22px rgba(255, 68, 170, 0.35));
}

.stat-label {
  margin-top: 8px;
  color: var(--text-dim);
  font-size: 0.9rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
```

- [ ] **Step 3: Verificación**

Crear `pwtest/task7_check.js`:

```js
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8090/#estadisticas', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const vals = await page.evaluate(() => Array.from(document.querySelectorAll('.stat-num')).map(e => e.textContent));
  console.log(JSON.stringify({ vals }, null, 2));
  await browser.close();
})();
```

Run:
```bash
node task7_check.js
```
Expected: `vals` = `["30", "13+", "8"]` (contador completado).

- [ ] **Step 4: Commit**

```bash
cd /Users/sector1/Documents/sectoradmin/Proyectos/SECTORCREATIVO.COM.MX
git add -A
git commit -m "feat: estadísticas animadas con datos reales (30 años, 13+ clientes, 8 servicios)"
```

---

### Task 8: Portafolio bento + filtros por categoría

**Files:**
- Modify: `css/styles.css` (bloque H tras BLOQUE G)
- Modify: `js/main.js` (bloque filtros + lightbox mejorado con `data-full`)

**Interfaces:**
- Consumes: `.filters .chip[data-filter]`, `.galeria-grid .item[data-cat]` (HTML ya en index.php).
- Produces: filtrado con fade; en lightbox, `lbImg.src` usa `data-full` (original) en vez del thumb (thumb llega en Task 9 — por ahora src original).

- [ ] **Step 1: JS filtros + lightbox data-full**

Insertar en `js/main.js` antes de `/* ================= SCROLL REVEAL ================= */`:

```js
  /* ================= FILTROS DE PORTAFOLIO ================= */
  var chips = qsa('.chip[data-filter]');
  var galItems = qsa('.galeria-bento .item[data-cat]');
  (function initFilter() {
    if (!chips.length || !galItems.length) return;
    function applyFilter(filter) {
      galItems.forEach(function (item) {
        var show = filter === 'todos' || item.getAttribute('data-cat') === filter;
        item.style.display = show ? '' : 'none';
      });
    }
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        applyFilter(chip.getAttribute('data-filter'));
      });
    });
  })();
```

Insertar el lightbox mejorado REEMPLAZANDO el bloque lightbox que vendrá con el nuevo main.js (ver nota): el `showImage` debe usar `data-full`:

```js
  /* ================= LIGHTBOX (con data-full + touch) ================= */
  var lightbox = qs('#lightbox');
  var lbImg = qs('#lbImg');
  var lbCaption = qs('#lbCaption');
  var lbCounter = qs('#lbCounter');
  var lbClose = qs('#lbClose');
  var lbPrev = qs('#lbPrev');
  var lbNext = qs('#lbNext');
  var lbItems = qsa('.galeria-grid .item img');
  var current = 0;
  var lastFocus = null;
  var touchX = null;

  function showImage(index) {
    if (!lbItems.length) return;
    current = (index + lbItems.length) % lbItems.length;
    var img = lbItems[current];
    lbImg.src = img.getAttribute('data-full') || img.src;
    lbImg.alt = img.alt || '';
    lbCaption.textContent = (img.alt || '').replace(' — Sector Creativo', '');
    lbCounter.textContent = (current + 1) + ' / ' + lbItems.length;
  }

  function openLightbox(index) {
    if (!lightbox) return;
    lastFocus = doc.activeElement;
    showImage(index);
    lightbox.hidden = false;
    requestAnimationFrame(function () { lightbox.classList.add('open'); });
    doc.body.style.overflow = 'hidden';
    if (lbClose) lbClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    doc.body.style.overflow = '';
    setTimeout(function () { lightbox.hidden = true; }, 350);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function changeImage(dir) {
    if (lbItems.length) showImage(current + dir);
  }

  if (lightbox) {
    lbItems.forEach(function (img, i) {
      img.addEventListener('click', function () { openLightbox(i); });
    });

    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbPrev) lbPrev.addEventListener('click', function () { changeImage(-1); });
    if (lbNext) lbNext.addEventListener('click', function () { changeImage(1); });

    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    // Touch swipe en móvil
    var lbFigure = qs('.lightbox-figure');
    if (isTouch && lbFigure) {
      lbFigure.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
      lbFigure.addEventListener('touchend', function (e) {
        if (touchX === null) return;
        var dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 50) changeImage(dx < 0 ? 1 : -1);
        touchX = null;
      }, { passive: true });
    }

    // Focus trap
    doc.addEventListener('keydown', function (e) {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') { closeLightbox(); return; }
      if (e.key === 'ArrowLeft') { changeImage(-1); return; }
      if (e.key === 'ArrowRight') { changeImage(1); return; }
      if (e.key === 'Tab') {
        var focusables = qsa('button', lightbox).filter(function (b) { return !b.hidden; });
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
```

**IMPORTANTE:** En el main.js final, este bloque lightbox REEMPLAZA al place-holder del bloque base anterior (no existía aún), así que Task 8 define el lightbox completo y Task 1 NO lo incluía — verificar que no haya duplicados al final.

- [ ] **Step 2: Validar sintaxis**

Run: `node --check /Users/sector1/Documents/sectoradmin/Proyectos/SECTORCREATIVO.COM.MX/js/main.js`
Expected: sin errores.

- [ ] **Step 3: CSS bloque H**

Insertar tras el BLOQUE G en `css/styles.css`:

```css
/* ============ BLOQUE H — PORTAFOLIO BENTO + FILTROS ============ */
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-bottom: 36px;
}

.chip {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-dim);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 9px 20px;
  cursor: pointer;
  transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
}

.chip:hover { color: var(--text); border-color: var(--magenta); }

.chip.active {
  color: #050508;
  background: var(--grad-marca);
  background-size: var(--grad-marca-size);
  animation: gradienteLento 8s ease infinite;
  border-color: transparent;
  font-weight: 700;
  box-shadow: 0 0 20px rgba(255, 68, 170, 0.35);
}

.galeria-bento {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 210px;
  gap: 18px;
}

.galeria-bento .item {
  position: relative;
  grid-column: span 1;
  grid-row: span 1;
  border-radius: var(--radius);
  overflow: hidden;
  cursor: pointer;
  border: 1px solid var(--border);
  background: var(--bg-soft);
  transform-style: preserve-3d;
  transition: border-color 0.35s ease, box-shadow 0.35s ease, opacity 0.4s ease, transform 0.4s ease;
}

.galeria-bento .item-wide { grid-column: span 2; grid-row: span 2; }
.galeria-bento .item:nth-child(2) { grid-row: span 2; }
.galeria-bento .item:nth-child(5) { grid-column: span 2; }

.galeria-bento .item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s var(--ease-out), filter 0.45s ease;
  filter: grayscale(0.35) contrast(1.05);
}

.galeria-bento .item:hover img { transform: scale(1.06); filter: grayscale(0) saturate(1.15); }

.galeria-bento .item:hover {
  border-color: rgba(0, 229, 255, 0.5);
  box-shadow: 0 14px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 229, 255, 0.12);
}

.galeria-bento .item figcaption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 10px;
  padding: 30px 16px 14px;
  background: linear-gradient(transparent, rgba(5, 5, 8, 0.94));
  font-size: 0.78rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text);
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.4s ease, transform 0.4s var(--ease-out);
}

.galeria-bento .item:hover figcaption { opacity: 1; transform: translateY(0); }

.cap-cat { color: var(--cian-neon); font-weight: 700; }
.cap-num { color: var(--text-dim); }

/* ---------- LIGHTBOX ---------- */
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(3, 3, 6, 0.96);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.35s ease;
}

.lightbox[hidden] { display: none; }
.lightbox.open { opacity: 1; }

.lightbox-figure { position: relative; max-width: min(90vw, 1100px); max-height: 86vh; text-align: center; }

.lightbox-img {
  max-width: 100%;
  max-height: 78vh;
  border-radius: 12px;
  box-shadow: 0 20px 80px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 68, 170, 0.15);
  opacity: 0;
  transform: scale(0.96);
  transition: opacity 0.4s var(--ease-out), transform 0.4s var(--ease-out);
}

.lightbox.open .lightbox-img { opacity: 1; transform: scale(1); }

.lightbox-caption {
  margin-top: 14px;
  font-size: 0.95rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.lightbox-counter {
  position: absolute;
  top: 26px;
  right: 28px;
  font-family: var(--font-display);
  font-size: 0.85rem;
  color: var(--text-dim);
  letter-spacing: 0.2em;
}

.lightbox-close,
.lightbox-nav {
  position: absolute;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.lightbox-close { top: 22px; left: 26px; width: 48px; height: 48px; font-size: 1.5rem; }
.lightbox-nav { top: 50%; transform: translateY(-50%); width: 52px; height: 52px; font-size: 1.3rem; }
.lightbox-nav.prev { left: 22px; }
.lightbox-nav.next { right: 22px; }

.lightbox-close:hover,
.lightbox-nav:hover { background: rgba(255, 68, 170, 0.25); border-color: var(--magenta); color: #fff; }
```

- [ ] **Step 4: Verificación filtros + lightbox**

Crear `pwtest/task8_check.js`:

```js
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://127.0.0.1:8090/#proyectos', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  // filtro por primera categoría distinta de "todos"
  const cat = await page.getAttribute('.chip:nth-child(2)', 'data-filter');
  await page.click(`.chip[data-filter="${cat}"]`);
  await page.waitForTimeout(400);
  const visible = await page.evaluate(() => Array.from(document.querySelectorAll('.galeria-bento .item')).filter(i => i.style.display !== 'none').length);
  await page.click('.galeria-bento .item');
  await page.waitForTimeout(500);
  const lbOpen = await page.evaluate(() => !document.getElementById('lightbox').hidden && document.getElementById('lightbox').classList.contains('open'));
  const lbSrc = await page.evaluate(() => document.getElementById('lbImg').src);
  console.log(JSON.stringify({ cat, visible, lbOpen, lbSrc, errors }, null, 2));
  await browser.close();
})();
```

Run:
```bash
node task8_check.js
```
Expected: `visible` > 0 y < 10 (filtro activo), `lbOpen` = true, `lbSrc` termina en `.png` (original).

- [ ] **Step 5: Commit**

```bash
cd /Users/sector1/Documents/sectoradmin/Proyectos/SECTORCREATIVO.COM.MX
git add -A
git commit -m "feat: portafolio bento con filtros por servicio y lightbox con focus trap + swipe"
```

---

### Task 9: Contacto reforzado + footer + back-to-top

**Files:**
- Modify: `css/styles.css` (bloque I tras BLOQUE H)
- Modify: `js/main.js` (bloque formulario reforzado — reemplaza/amplía el de validación actual del main.js final)

**Interfaces:**
- Consumes: `#contactForm`, `.field-error`, `#btnSubmit`, `#backTop`, `.footer-inner` (HTML ya en index.php).
- Produces: mensajes de error por campo con `aria-live`, spinner en botón al enviar, foco al primer error.

- [ ] **Step 1: JS formulario reforzado + back-top handler**

En el main.js final, el bloque de formulario (que sustituye al simple de validación de clase `.invalid`) se inserta ANTES de `/* ================= SCROLL REVEAL ================= */`:

```js
  /* ================= FORMULARIO REFORZADO ================= */
  var form = qs('#contactForm');
  var btnSubmit = qs('#btnSubmit');
  var btnLabel = btnSubmit ? qs('.btn-label', btnSubmit) : null;

  if (form) {
    var inputs = {
      nombre: qs('#f-nombre'),
      email: qs('#f-email'),
      telefono: qs('#f-telefono'),
      mensaje: qs('#f-mensaje')
    };

    var msgs = {
      nombre: 'Escribe tu nombre (mínimo 2 caracteres).',
      email: 'Escribe un correo válido (ej. nombre@dominio.com).',
      telefono: 'Solo dígitos, espacios, +, - o paréntesis (7–20).',
      mensaje: 'Cuéntanos algo más (mínimo 5 caracteres).'
    };

    function setError(field, hasError) {
      var el = inputs[field];
      var err = qs('#err-' + field);
      if (!el) return;
      var box = el.closest('.form-field');
      if (box) box.classList.toggle('has-error', hasError);
      if (err) {
        err.hidden = !hasError;
        err.textContent = hasError ? msgs[field] : '';
      }
    }

    function validate(field) {
      var el = inputs[field];
      if (!el) return true;
      var val = el.value.trim();
      var ok = true;
      if (field === 'nombre') ok = val.length >= 2;
      if (field === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val);
      if (field === 'telefono') ok = val === '' || /^[\d\s\-\+\(\)]{7,20}$/.test(val);
      if (field === 'mensaje') ok = val.length >= 5;
      setError(field, !ok);
      return ok;
    }

    Object.keys(inputs).forEach(function (key) {
      var el = inputs[key];
      if (!el) return;
      el.addEventListener('input', function () { validate(key); });
      el.addEventListener('blur', function () { validate(key); });
    });

    form.addEventListener('submit', function (e) {
      var hp = form.querySelector('input[name="website"]');
      if (hp && hp.value.trim() !== '') { e.preventDefault(); window.location.reload(); return; }

      var fields = Object.keys(inputs);
      var firstBad = null;
      fields.forEach(function (k) {
        if (!validate(k) && !firstBad) firstBad = inputs[k];
      });
      if (firstBad) {
        e.preventDefault();
        firstBad.focus();
        return;
      }
      // estado de envío
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.classList.add('loading');
        if (btnLabel) btnLabel.textContent = 'Enviando…';
      }
      // no preventDefault: el POST recarga la página y PHP responde
    });
  }
```

CSS del botón spinner (bloque I):

```css
#btnSubmit .btn-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(5, 5, 8, 0.35);
  border-top-color: #050508;
  border-radius: 50%;
  display: none;
  animation: spin 0.7s linear infinite;
}

#btnSubmit.loading .btn-spinner { display: inline-block; }
#btnSubmit.loading { opacity: 0.75; cursor: progress; }

@keyframes spin { to { transform: rotate(360deg); } }
```

- [ ] **Step 2: CSS bloque I (contacto + footer + backTop)**

Insertar tras el BLOQUE H en `css/styles.css`:

```css
/* ============ BLOQUE I — CONTACTO + FOOTER + BACKTOP ============ */
.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: clamp(30px, 5vw, 70px);
  align-items: start;
  max-width: 1100px;
  margin: 0 auto;
}

.contact-info h3 {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.4rem;
  text-transform: uppercase;
  margin-bottom: 26px;
}

.contact-line {
  display: flex;
  gap: 13px;
  align-items: flex-start;
  color: var(--text-dim);
  margin-bottom: 18px;
  font-size: 1rem;
}

.contact-line svg { width: 20px; height: 20px; flex-shrink: 0; margin-top: 4px; color: var(--magenta); }

.contact-line a:hover { color: var(--cian-neon); }

.redes-sociales { display: flex; gap: 16px; margin-top: 30px; flex-wrap: wrap; }

.redes-sociales a {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.04);
  transition: transform 0.3s var(--ease-out), border-color 0.3s ease, box-shadow 0.3s ease;
}

.redes-sociales a:hover {
  transform: translateY(-4px) scale(1.06);
  border-color: var(--magenta);
  box-shadow: 0 8px 24px rgba(255, 68, 170, 0.25);
}

.redes-sociales img { width: 22px; height: 22px; filter: brightness(0) invert(1); }

.contact-form-wrap {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: calc(var(--radius) + 4px);
  padding: clamp(24px, 4vw, 40px);
  backdrop-filter: blur(10px);
}

.form-alert {
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 22px;
  font-size: 0.95rem;
}

.form-alert.success { background: rgba(68, 255, 204, 0.08); border: 1px solid rgba(68, 255, 204, 0.35); color: var(--cian); }
.form-alert.error { background: rgba(255, 68, 68, 0.08); border: 1px solid rgba(255, 68, 68, 0.35); color: #ff8a8a; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }

.form-field { margin-bottom: 18px; }

.form-field label {
  display: block;
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-dim);
  margin-bottom: 8px;
}

.form-field .opt { opacity: 0.6; text-transform: none; letter-spacing: 0.02em; }

.form-field input,
.form-field textarea {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 1rem;
  transition: border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
}

.form-field input:focus,
.form-field textarea:focus {
  outline: none;
  border-color: var(--cian-neon);
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 0 0 3px rgba(0, 229, 255, 0.12);
}

.form-field textarea { resize: vertical; min-height: 120px; }

.form-field.has-error input,
.form-field.has-error textarea { border-color: rgba(255, 68, 68, 0.6); }

.field-error {
  margin-top: 6px;
  font-size: 0.82rem;
  color: #ff8a8a;
}

.form-note { text-align: center; color: var(--text-dim); font-size: 0.85rem; margin-top: 14px; }

.hp-field {
  position: absolute !important;
  left: -9999px !important;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

/* ---------- FOOTER ---------- */
footer {
  border-top: 1px solid var(--border);
  background: var(--bg-soft);
  padding: 56px 24px 28px;
  position: relative;
  z-index: 1;
}

.footer-inner {
  display: grid;
  grid-template-columns: 2fr 1fr 1.4fr;
  gap: clamp(28px, 5vw, 60px);
  max-width: 1200px;
  margin: 0 auto 36px;
}

.footer-brand p { color: var(--text-dim); font-size: 0.9rem; margin-top: 10px; }
.footer-logo { margin-bottom: 4px; opacity: 0.9; }

.footer-nav h4,
.footer-services h4 {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.8rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text);
  margin-bottom: 16px;
}

.footer-nav a,
.footer-services span {
  display: block;
  color: var(--text-dim);
  font-size: 0.9rem;
  padding: 3px 0;
  transition: color 0.25s ease;
}

.footer-nav a:hover { color: var(--cian-neon); }

.footer-bottom {
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 20px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.footer-bottom p { color: var(--text-dim); font-size: 0.85rem; }

footer .robcor {
  font-family: var(--font-display);
  font-weight: 700;
  background: var(--grad-marca);
  background-size: var(--grad-marca-size);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradienteLento 10s ease infinite;
}

/* ---------- BACK TO TOP ---------- */
#backTop {
  position: fixed;
  bottom: 26px;
  left: 24px;
  z-index: 1500;
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border);
  color: var(--text);
  font-size: 1.1rem;
  cursor: pointer;
  transition: transform 0.3s var(--ease-out), border-color 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease;
}

#backTop[hidden] { display: none; }

#backTop:hover {
  transform: translateY(-3px);
  border-color: var(--magenta);
  box-shadow: 0 8px 24px rgba(255, 68, 170, 0.3);
}

/* ---------- WHATSAPP FLOTANTE ---------- */
.wa-float {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1500;
  width: 60px;
  height: 60px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
  transition: transform 0.3s var(--ease-out), box-shadow 0.3s ease;
  animation: waPulse 2.6s ease-in-out infinite;
}

.wa-float::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  z-index: -1;
}

.wa-float img { width: 34px; height: 34px; filter: brightness(0) invert(1); }

.wa-float:hover { transform: translateY(-4px) scale(1.08); box-shadow: 0 12px 40px rgba(34, 197, 94, 0.4); }

@keyframes waPulse {
  0%, 100% { box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5), 0 0 0 0 rgba(34, 197, 94, 0.45); }
  50% { box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5), 0 0 0 16px rgba(34, 197, 94, 0); }
}
```

- [ ] **Step 3: Verificación formulario + footer**

Crear `pwtest/task9_check.js`:

```js
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8090/#contacto', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  // enviar vacío → errores inline
  await page.click('#btnSubmit');
  await page.waitForTimeout(400);
  const errs = await page.evaluate(() => Array.from(document.querySelectorAll('.field-error')).filter(e => !e.hidden).length);
  // footer
  const footerCols = await page.locator('.footer-inner > div').count();
  // back top
  await page.evaluate(() => window.scrollTo(0, 1500));
  await page.waitForTimeout(300);
  const backTopHidden = await page.evaluate(() => document.getElementById('backTop').hidden);
  console.log(JSON.stringify({ errs, footerCols, backTopHidden }, null, 2));
  await browser.close();
})();
```

Run:
```bash
node task9_check.js
```
Expected: `errs` = 3 (nombre, email, mensaje — teléfono opcional válido vacío), `footerCols` = 3, `backTopHidden` = false.

- [ ] **Step 4: Commit**

```bash
cd /Users/sector1/Documents/sectoradmin/Proyectos/SECTORCREATIVO.COM.MX
git add -A
git commit -m "feat: contacto con errores inline y estado de envío, footer 3 columnas, back-to-top"
```

---

### Task 10: Performance — thumbs WebP + OG image + fuentes ya reducidas

**Files:**
- Create: `img/thumbs/proyecto1.webp` … `img/thumbs/proyecto10.webp`
- Create: `og-image.png` (raíz, 1200×630)
- Modify: `index.php` (src de galería → thumbs con `data-full` original — ya está `data-full`; cambiar `src` a `img/thumbs/proyectoN.webp`)
- Modify: `css/styles.css` (bloque K responsive final, ya aplicado en bloques; añadir reglas thumb/display grid restante en móvil)

**Interfaces:**
- Consumes: `img/proyectoN.png` originales (10 archivos, 0.9–12.9 MB).
- Produces: `img/thumbs/proyectoN.webp` ≤ ~120 KB cada uno; `og-image.png` para redes; `data-full` conserva la original para el lightbox.

- [ ] **Step 1: Generar thumbs WebP con cwebp**

```bash
cd /Users/sector1/Documents/sectoradmin/Proyectos/SECTORCREATIVO.COM.MX
mkdir -p img/thumbs
for i in 1 2 3 4 5 6 7 8 9 10; do
  cwebp -resize 800 0 -q 78 "img/proyecto${i}.png" -o "img/thumbs/proyecto${i}.webp" 2>/dev/null || \
  ffmpeg -y -i "img/proyecto${i}.png" -vf scale=800:-1 -quality 78 "img/thumbs/proyecto${i}.webp" 2>/dev/null
done
ls -la img/thumbs/
```
Expected: 10 archivos `.webp`; cada uno ≤ 120 KB aprox (anotar tamaños).

- [ ] **Step 2: Generar og-image.png (1200×630)**

Crear `pwtest/og_gen.html` (previsualización para screenshot):

```html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px;
    display: grid; place-items: center;
    background: radial-gradient(ellipse 70% 60% at 50% 40%, #1a0b14 0%, #050508 70%);
    font-family: 'Arial Black', 'Helvetica Neue', sans-serif;
    position: relative; overflow: hidden;
  }
  .grid-bg {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 78%);
  }
  .glow {
    position: absolute; width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(255,68,68,0.35), transparent 70%);
    top: -180px; left: -120px; filter: blur(20px);
  }
  .glow2 {
    position: absolute; width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(0,229,255,0.28), transparent 70%);
    bottom: -180px; right: -120px; filter: blur(20px);
  }
  .content { position: relative; text-align: center; z-index: 2; padding: 40px; }
  .brand { font-size: 58px; font-weight: 900; letter-spacing: 0.02em; color: #fff; text-transform: uppercase; }
  .brand span {
    background: linear-gradient(270deg, #ff4444, #ffcc00, #44ffcc, #ff44aa, #ff4444);
    background-size: 400% 400%; -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .sub { font-size: 30px; color: #9a9aa8; margin-top: 18px; letter-spacing: 0.35em; text-transform: uppercase; }
  .years { display: inline-block; margin-top: 26px; font-size: 22px; letter-spacing: 0.2em; color: #ff8a8a; border: 1px solid rgba(255,68,68,0.5); padding: 10px 26px; border-radius: 999px; }
</style>
</head>
<body>
  <div class="grid-bg"></div>
  <div class="glow"></div>
  <div class="glow2"></div>
  <div class="content">
    <div class="brand">SECTOR <span>CREATIVO</span></div>
    <div class="sub">Comunicación Visual · Nuevo Laredo</div>
    <div class="years">⚡ 30 AÑOS CREANDO</div>
  </div>
</body>
</html>
```

Screenshot (desde pwtest):

```js
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto('file:///var/folders/b1/p4bj4v0j2ll3s5dj2tnwp5zc0000gn/T/opencode/pwtest/og_gen.html');
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/Users/sector1/Documents/sectoradmin/Proyectos/SECTORCREATIVO.COM.MX/og-image.png' });
  await browser.close();
})();
```

Run:
```bash
node task10_og.js
```
Expected: `og-image.png` creado en la raíz (1200×630, ~100-300 KB).

- [ ] **Step 3: Apuntar la galería a los thumbs**

En `index.php`, en el bucle de proyectos, cambiar SOLO el `src`:

De:
```php
<img src="img/proyecto<?= $p['n'] ?>.png" data-full="img/proyecto<?= $p['n'] ?>.png" ...
```
A:
```php
<img src="img/thumbs/proyecto<?= $p['n'] ?>.webp" data-full="img/proyecto<?= $p['n'] ?>.png" ...
```

- [ ] **Step 4: Verificar tamaños y carga**

```bash
cd /Users/sector1/Documents/sectoradmin/Proyectos/SECTORCREATIVO.COM.MX
du -sh img/thumbs/
php -l index.php
curl -s -o /dev/null -w "%{http_code} %{size_download}\n" http://127.0.0.1:8090/img/thumbs/proyecto1.webp
```
Expected: `img/thumbs/` total ≤ 1.5 MB (vs ~41 MB originales), `php -l` OK, curl `200` con tamaño del webp.

- [ ] **Step 5: Commit**

```bash
cd /Users/sector1/Documents/sectoradmin/Proyectos/SECTORCREATIVO.COM.MX
git add -A
git commit -m "perf: thumbs WebP 800px para la galería (41MB → ~1MB) + og-image.png 1200x630"
```

---

### Task 11: Verificación integral multi-viewport + ajuste de categorías + informe

**Files:**
- Modify: `index.php` (ajustar `$proyectos` categorías/alt si la revisión visual de las imágenes lo amerita)
- Test: Playwright multi-viewport (360, 768, 1440)

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: informe final con checklist de accesibilidad/performance y confirmación de categorías.

- [ ] **Step 1: Verificación multi-viewport**

Crear `pwtest/final_check.js`:

```js
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const results = [];
  for (const vp of [{ w: 360, h: 780 }, { w: 768, h: 900 }, { w: 1440, h: 900 }]) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto('http://127.0.0.1:8090/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    // overflow horizontal (bug común responsive)
    const overflowX = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    // menú hamburguesa en móvil
    let menuOk = true;
    if (vp.w <= 768) {
      await page.click('#hamburger');
      await page.waitForTimeout(350);
      menuOk = await page.evaluate(() => document.getElementById('navMenu').classList.contains('show') && document.getElementById('hamburger').getAttribute('aria-expanded') === 'true');
    }
    // lightbox touch (móvil)
    let lbOk = true;
    if (vp.w <= 768) {
      await page.click('.galeria-bento .item');
      await page.waitForTimeout(450);
      lbOk = await page.evaluate(() => document.getElementById('lightbox').classList.contains('open'));
      await page.keyboard.press('Escape');
    }
    await page.screenshot({ path: `final_${vp.w}.png`, fullPage: false });
    results.push({ vp, overflowX, menuOk, lbOk, errors });
    await page.close();
  }
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
})();
```

Run:
```bash
node final_check.js
```
Expected: en los 3 viewports `overflowX` = false, `errors` = []; en ≤768 `menuOk` = true y `lbOk` = true.

- [ ] **Step 2: Revisión visual de cada imagen y ajuste de categorías**

Usar `local-vision_analyze_image` (si la herramienta de visión responde) o revisión manual de `img/proyectoN.png` con `read` para confirmar el contenido real de cada proyecto y ajustar `$proyectos` (cat + alt) en `index.php` con la descripción real de la imagen. Si la visión local sigue caída, pedir al usuario que describa 1 línea por proyecto o revisar los screenshots `final_*.png` con el usuario.

- [ ] **Step 3: Checklist final de accesibilidad**

Verificar con Playwright:
```js
// en el mismo script o script aparte: comprobar focus-visible styles,
// skip-link accesible por teclado, alt en todas las imágenes, aria en menú
```
Crear `pwtest/a11y_check.js`:

```js
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://127.0.0.1:8090/', { waitUntil: 'networkidle' });
  const data = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    const badAlt = imgs.filter(i => i.getAttribute('alt') === null || i.getAttribute('alt') === '').length;
    const css = getComputedStyle(document.documentElement);
    return {
      totalImgs: imgs.length,
      badAlt,
      focusVisibleRule: Array.from(document.styleSheets).some(sh => { try { return Array.from(sh.cssRules).some(r => r.selectorText && r.selectorText.includes(':focus-visible')); } catch (e) { return false; } }),
      contrastHero: (() => { const c = getComputedStyle(document.querySelector('.hero-tagline')); return c.color; })(),
      hasLang: document.documentElement.getAttribute('lang'),
      title: document.title
    };
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
```

Run:
```bash
node a11y_check.js
```
Expected: `badAlt` = 0, `focusVisibleRule` = true, `hasLang` = `es`, `title` incluye "Sector Creativo".

- [ ] **Step 4: Informe al usuario + commit final**

```bash
cd /Users/sector1/Documents/sectoradmin/Proyectos/SECTORCREATIVO.COM.MX
git add -A
git commit -m "chore: verificación integral multi-viewport y accesibilidad (rediseño profundo dark neon completo)"
```

Entregar al usuario el resumen: qué cambió, métricas de rendimiento (peso total de imágenes antes/después), checklist de accesibilidad, y recordatorio de que **aún no se sube al hosting** hasta su aviso.

---

## Self-Review

**1. Cobertura del spec (basado en el diseño aprobado en chat):**
- Preloader → Task 1 ✓
- Hero 3D con constelación, scroll reaction, DPR adaptativo, badge 30 años, H1 = "We are all Creative" → Task 2 ✓ (H1 intacto en index.php Task 1; badge añadido)
- Marquee inclinado → Task 3 ✓
- Clientes logo wall 13 reales → Task 4 ✓
- Servicios iconos draw + borde neón + esquinas chip → Task 5 ✓
- Proceso 4 pasos con rail → Task 6 ✓
- Estadísticas 30/13/8 reales → Task 7 ✓
- Portafolio bento + filtros → Task 8 ✓
- Contacto reforzado (errores inline, spinner) + footer 3 col → Task 9 ✓
- Back-to-top + scroll progress → Tasks 1 y 9 ✓
- Lightbox swipe + focus trap + data-full → Task 8 ✓
- Thumbs WebP + og-image + fuentes reducidas → Tasks 1 (fuentes) y 10 (thumbs/og) ✓
- Accesibilidad (skip-link, focus-visible, alt, ARIA) → Tasks 1, 8, 11 ✓
- No subir al hosting → constraint global ✓
- Contacto vigente intacto → index.php Task 1 conserva teléfonos/correo/dirección ✓

**2. Escaneo de placeholders:** Todos los pasos de código incluyen contenido real y completo; los nombres de selectores usados en JS coinciden con el HTML de Task 1 (verificado en Interfaces de cada tarea). La única incertidumbre documentada (no placeholder) es la categoría provisional de los proyectos, cuyo ajuste es un paso explícito (Task 11 Step 2) con opción de consulta al usuario.

**3. Consistencia de tipos/nombres:**
- `backTop` declarado en Task 1 antes de `onScrollHeader` ✓ (nota insertada)
- `#processFill` + `.process-step[data-step]` coinciden con HTML Task 1 ✓
- `.stat-num` `data-count`/`data-suffix` coinciden ✓
- `.chip[data-filter]`/`.item[data-cat]` coinciden ✓
- `data-full` añadido en Task 1 HTML y usado en Task 8 lightbox ✓
- `.field-error#err-*` y `aria-describedby` coinciden ✓
- BLOQUE A/K: el CSS de Task 1 incluye el responsive final; las tareas 2–9 insertan tras `/* ============ BLOQUE A ============ */` y antes de `prefers-reduced-motion` ✓