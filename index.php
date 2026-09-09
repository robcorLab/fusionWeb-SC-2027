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