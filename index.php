<?php
// ============================================================
// SECTOR CREATIVO — Formulario de contacto seguro
// Design by RobCorLab
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
    'ALITAS & TARROS', 'LA BOTANERIA', 'MUNICIPIO DE NUEVO LAREDO', 'CENTRO CULTURAL',
    'HR MOTORS', 'STI', 'QUIROGA', 'GRUPO 100', 'CLUB CAMPESTRE',
    'COLEGIO DE ARQUITECTOS DE NUEVO LAREDO', 'MONALAR', 'FEMA', 'MAG ENTERTAIMENT',
    'OISHI SUSHI', 'NOTARIA 196', 'TORTILLAS SANTOS', 'QUINTO SOL', 'TENL',
    'TRACTOMAC', 'PROSANO', 'PANADERIA LA NACIONAL', 'AAANLD',
    'INSTITUTO ANGLO ESPAÑOL', 'DERECHOS HUMANOS'
];

$stats = [
    ['num' => 30, 'suffix' => '',  'label' => 'años creando'],
    ['num' => 33, 'suffix' => '+', 'label' => 'clientes corporativos'],
    ['num' => 10, 'suffix' => '',  'label' => 'servicios especializados'],
];

$procesos = [
    ['01', 'Escucha',      'Entendemos tu marca, tu mercado y el objetivo real de cada pieza.'],
    ['02', 'Diseño',       'Conceptualizamos y validamos la propuesta visual contigo.'],
    ['03', 'Producción',   'Impresión, corte, grabado y acabados en nuestros talleres.'],
    ['04', 'Instalación',  'Entrega, montaje e instalación en sitio cuando lo requiere.'],
];

// Categorías confirmadas visualmente (visor local + OCR, Task 11)
$proyectos = [
    ['n' => 1,  'cat' => 'Letreros',     'alt' => 'Letrero exterior 3D de fachada — Unidad Médica San Gerardo — Sector Creativo'],
    ['n' => 2,  'cat' => 'Rotulación',   'alt' => 'Rotulación de fachada con letrero 3D — Sector Creativo'],
    ['n' => 3,  'cat' => 'Letreros',     'alt' => 'Letrero de identificación en acrílico — Cubículo — Sector Creativo'],
    ['n' => 4,  'cat' => 'Letreros',     'alt' => 'Letrero 3D de urgencias 24/7 en acrílico — Sector Creativo'],
    ['n' => 5,  'cat' => 'Letreros',     'alt' => 'Letrero de estación de agua purificada — Sector Creativo'],
    ['n' => 6,  'cat' => 'Rotulación',   'alt' => 'Rotulación de semi-trailer — gráfica corporativa — Sector Creativo'],
    ['n' => 7,  'cat' => 'Rotulación',   'alt' => 'Rotulación de flota de camiones — livery corporativa — Sector Creativo'],
    ['n' => 8,  'cat' => 'Letreros',     'alt' => 'Letrero de fachada — Grupo Monalar — Sector Creativo'],
    ['n' => 9,  'cat' => 'Rotulación',   'alt' => 'Rotulación de fachada y muro — Ferretería Fronteriza — Sector Creativo'],
    ['n' => 10, 'cat' => 'Impresión Láser','alt' => 'Reconocimiento impreso — Medline 0 incidentes — Sector Creativo'],
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
  <img src="logo_sc_3.svg" alt="Sector Creativo" width="150" height="45">
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
    <p class="hero-eyebrow">Servicios de Comunicación Visual</p>
    <h1 class="hero-title"><span>We are all</span><span class="grad-text">Creative</span></h1>
    <div class="hero-badge" role="text">30 años creando</div>
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
      <span>Impresión Láser</span><span>✦</span>
      <span>Rotulación</span><span>✦</span>
      <span>Corte CNC</span><span>✦</span>
      <span>Corte y Grabado Láser</span><span>✦</span>
      <span>Impresión DTF</span><span>✦</span>
      <span>Letreros Luminosos</span><span>✦</span>
      <span>Acabados Especiales</span><span>✦</span>
      <span>Impresión 3D</span><span>✦</span>
      <span>Diseño Gráfico</span><span>✦</span>
      <span>Impresión Gran Formato</span><span>✦</span>
      <span>Impresión Láser</span><span>✦</span>
      <span>Rotulación</span><span>✦</span>
      <span>Corte CNC</span><span>✦</span>
      <span>Corte y Grabado Láser</span><span>✦</span>
      <span>Impresión DTF</span><span>✦</span>
      <span>Letreros Luminosos</span><span>✦</span>
      <span>Acabados Especiales</span><span>✦</span>
      <span>Impresión 3D</span><span>✦</span>
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
    <p class="section-sub">Comunicación visual, desde la conceptualización hasta la producción final.</p>
  </div>

  <div class="services-grid">
    <?php
    $servicios = [
        'Diseño Gráfico' => [
            'Identidad corporativa', 'Diseño editorial', 'Publicidad y redes',
            'M12,2 L19,9 L12,16 L5,9 Z M12,2 L12,16 M5,9 L12,16 L12,2 Z'
        ],
        'Impresión Gran Formato' => [
            'Lonas y vinilos', 'Pendones y roll-ups', 'Vallas publicitarias', 'Materiales rígidos',
            'M4,4 L9,4 L15,10 L20,10 L20,20 L4,20 Z M9,4 L9,10 L15,10 M4,12 L8,12 M4,16 L8,16'
        ],
        'Impresión Láser' => [
            'Tarjetas de presentación', 'Volantes y flyers', 'Catálogos', 'Formatos hasta 33×48 cm',
            'M6,3 L14,3 L18,7 L18,21 L6,21 Z M14,3 L14,7 L18,7 M9,12 L15,12 M9,16 L15,16 M9,8 L11,8'
        ],
        'Rotulación' => [
            'Wraps vehiculares', 'Vidrios y fachadas', 'Vinilo textil y microperforado', 'Letreros corpóreos',
            'M12,3 C7,3 4,6 4,10 C4,14 7,16 12,21 C17,16 20,14 20,10 C20,6 17,3 12,3 Z M12,10 m-2,0 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0'
        ],
        'Corte CNC' => [
            'Precisión en MDF y acrílico', 'Troqueles y moldes', 'Prototipado 3D',
            'M12,8 a4,4 0 1,0 0.001,0 Z M12,2 L15,6 L9,6 Z M12,22 L15,18 L9,18 Z M2,12 L6,9 L6,15 Z M22,12 L18,9 L18,15 Z'
        ],
        'Corte y Grabado Láser' => [
            'Acrílico, madera, metal, vidrio', 'Trofeos y placas', 'Reconocimientos', 'Letreros grabados',
            'M4,20 L20,4 M10,14 L14,10 M7,12 L12,7 M13,17 L17,13'
        ],
        'Impresión DTF' => [
            'Impresión directa a film', 'Playeras y textiles', 'Alta durabilidad y color',
            'M8,2 L16,2 L18,4 L20,4 L20,8 L18,8 L18,22 L6,22 L6,8 L4,8 L4,4 L6,4 Z M9,8 L15,8 L15,12 L9,12 Z M10,14 L14,14 M10,17 L14,17'
        ],
        'Letreros Luminosos' => [
            'Neón', 'Cajas de luz', 'Fachadas iluminadas', 'Anuncios luminosos',
            'M3,12 C7,6 11,6 14,10 C17,14 20,14 21,12 M7,21 L21,7 M12,21 L21,12'
        ],
        'Acabados Especiales' => [
            'Troquel y repujado', 'Laminados', 'Encuadernación', 'Lujo en cada detalle',
            'M12,3 L14.5,8.5 L20,9 L16,13 L17,19 L12,16 L7,19 L8,13 L4,9 L9.5,8.5 Z'
        ],
        'Impresión 3D' => [
            'Prototipado rápido', 'Figuras y piezas personalizadas', 'Modelado y diseño 3D', 'Materiales PLA y resina',
            'M12,3 L20,7 L20,17 L12,21 L4,17 L4,7 Z M12,3 L12,21 M4,7 L12,11 L20,7 M12,11 L20,17'
        ],
    ];
    $i = 0;
    foreach ($servicios as $nombre => $datos):
        $icon  = $datos[count($datos) - 1];
        $items = array_slice($datos, 0, count($datos) - 1);
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
      <img src="img/thumbs/proyecto<?= $p['n'] ?>.webp" data-full="img/proyecto<?= $p['n'] ?>.png" alt="<?= htmlspecialchars($p['alt'], ENT_QUOTES, 'UTF-8') ?>" loading="lazy" decoding="async" width="800" height="600">
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
        <a href="https://www.facebook.com/screativomx/" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/></svg></a>
        <a href="https://www.instagram.com/screativomx/" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/></svg></a>
        <a href="https://www.tiktok.com/@screativomx" target="_blank" rel="noopener" aria-label="TikTok"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg></a>
        <a href="https://www.youtube.com" target="_blank" rel="noopener" aria-label="YouTube"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></a>
        <a href="https://wa.me/528672179046" target="_blank" rel="noopener" aria-label="WhatsApp"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg></a>
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
        <p class="form-note">Gracias por hacernos parte de tus proyectos.</p>
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
      <p>Sector Creativo es una empresa especializada en Diseño, Impresión y Producción de material Publicitario, en la ciudad de Nuevo Laredo, Tamaulipas.</p>
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
      <span>Diseño Gráfico</span><span>Impresión Gran Formato</span><span>Impresión Láser</span><span>Rotulación</span><span>Corte CNC</span><span>Corte y Grabado Láser</span><span>Impresión DTF</span><span>Letreros Luminosos</span><span>Acabados Especiales</span><span>Impresión 3D</span>
    </div>
  </div>
  <div class="footer-bottom">
    <p>&copy; 2027 Sector Creativo, S.A. de C.V. · Nuevo Laredo, Tamaulipas</p>
    <p class="footer-credits">Design by <span class="robcor">RobCorLab</span></p>
  </div>
</footer>

<!-- ================= LIGHTBOX ================= -->
<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Visor de proyectos" hidden>
  <button class="lightbox-close" id="lbClose" aria-label="Cerrar">&times;</button>
  <button class="lightbox-nav prev" id="lbPrev" aria-label="Anterior">&#10094;</button>
  <figure class="lightbox-figure">
    <img class="lightbox-img" src="" alt="Imagen ampliada del proyecto" id="lbImg">
    <figcaption class="lightbox-caption" id="lbCaption"></figcaption>
  </figure>
  <button class="lightbox-nav next" id="lbNext" aria-label="Siguiente">&#10095;</button>
  <span class="lightbox-counter" id="lbCounter"></span>
</div>

<!-- Back to top -->
<button id="backTop" aria-label="Volver arriba" hidden>&#8593;</button>

<!-- WhatsApp flotante -->
<a class="wa-float" href="https://wa.me/528672179046?text=Hola%20Sector%20Creativo%2C%20quiero%20una%20cotizaci%C3%B3n." target="_blank" rel="noopener" aria-label="Cotizar por WhatsApp">
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
</a>

<!-- Three.js desde CDN con carga diferida -->
<script defer src="https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js" onerror="window.__THREE_FAILED__=true"></script>
<script defer src="js/hero3d.js"></script>
<script defer src="js/main.js"></script>
</body>
</html>