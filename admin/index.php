<?php
// ============================================================
// SECTOR CREATIVO — Panel de administración
// Galería (subir, ordenar, ocultar, borrar), información global,
// clientes, cifras y cuenta. Sin base de datos: todo vive en
// data/ como JSON protegido.
//
// Seguridad: contraseña con password_hash, sesión propia con
// cookie HttpOnly/SameSite=Strict, CSRF en cada POST, límite de
// intentos de acceso, CSP estricta y alta inicial protegida por
// un código que solo se lee desde el Administrador de archivos.
// Design by RobCorLab
// ============================================================
define('SC_ROOT', dirname(__DIR__));
require SC_ROOT . '/inc/sitio.php';
require SC_ROOT . '/inc/imagenes.php';

header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');
header("Content-Security-Policy: default-src 'self'; img-src 'self' data: blob:; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'");

$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
$cookiePath = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/') . '/';
session_name('sc_admin');
session_set_cookie_params([
    'lifetime' => 0,
    'path'     => $cookiePath,
    'secure'   => $https,
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();

$esLocal = PHP_SAPI === 'cli-server' && in_array(isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '', ['127.0.0.1', '::1'], true);

const INACTIVIDAD = 7200;       // 2 h
const MAX_INTENTOS = 5;
const VENTANA_INTENTOS = 900;   // 15 min
const MIN_PASSWORD = 10;
const ERROR_GUARDAR = 'No se pudo guardar. Revisa que la carpeta data/ tenga permisos de escritura.';

/* ================= UTILIDADES ================= */
function a_csrf()
{
    if (empty($_SESSION['csrf_admin'])) {
        $_SESSION['csrf_admin'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_admin'];
}

function a_csrf_ok()
{
    $t = isset($_POST['csrf']) && is_string($_POST['csrf']) ? $_POST['csrf'] : '';
    return !empty($_SESSION['csrf_admin']) && hash_equals($_SESSION['csrf_admin'], $t);
}

function a_flash($tipo, $msg)
{
    $_SESSION['flash'][] = [$tipo, $msg];
}

function a_redirigir($seccion = '')
{
    header('Location: ./' . ($seccion !== '' ? '?s=' . rawurlencode($seccion) : ''), true, 303);
    exit;
}

function a_txt($clave, $max = 300)
{
    $v = isset($_POST[$clave]) && is_string($_POST[$clave]) ? $_POST[$clave] : '';
    $v = trim(strip_tags($v));
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v);
    return function_exists('mb_substr') ? mb_substr($v, 0, $max) : substr($v, 0, $max);
}

function a_arr($clave)
{
    return isset($_POST[$clave]) && is_array($_POST[$clave]) ? $_POST[$clave] : [];
}

function a_limpio($v, $max)
{
    $v = is_string($v) ? trim(strip_tags($v)) : '';
    return function_exists('mb_substr') ? mb_substr($v, 0, $max) : substr($v, 0, $max);
}

function a_ip_clave()
{
    $ip = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'desconocida';
    return hash('sha256', $ip . '|sc-admin');
}

function a_bloqueado()
{
    $int = sc_leer('intentos') ?: [];
    $k = a_ip_clave();
    if (empty($int[$k])) {
        return 0;
    }
    list($n, $desde) = $int[$k];
    if (time() - $desde > VENTANA_INTENTOS) {
        return 0;
    }
    return $n >= MAX_INTENTOS ? (VENTANA_INTENTOS - (time() - $desde)) : 0;
}

function a_registrar_fallo()
{
    $int = sc_leer('intentos') ?: [];
    $ahora = time();
    foreach ($int as $k => $v) {           // limpieza de entradas vencidas
        if ($ahora - $v[1] > VENTANA_INTENTOS) {
            unset($int[$k]);
        }
    }
    $k = a_ip_clave();
    $int[$k] = isset($int[$k]) ? [$int[$k][0] + 1, $int[$k][1]] : [1, $ahora];
    sc_escribir('intentos', $int);
    usleep(400000);
}

function a_limpiar_fallos()
{
    $int = sc_leer('intentos') ?: [];
    unset($int[a_ip_clave()]);
    sc_escribir('intentos', $int);
}

function a_codigo_instalacion()
{
    $d = sc_leer('instalacion');
    if (!$d || empty($d['codigo'])) {
        $abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        $c = '';
        for ($i = 0; $i < 10; $i++) {
            $c .= $abc[random_int(0, strlen($abc) - 1)];
        }
        $d = ['codigo' => $c, 'nota' => 'Codigo de instalacion del panel. Se borra al crear la cuenta.'];
        sc_escribir('instalacion', $d);
    }
    return $d['codigo'];
}

/** Lista de categorías actuales (para el autocompletado). */
function a_categorias(array $sitio)
{
    $c = [];
    foreach ($sitio['proyectos'] as $p) {
        if ($p['cat'] !== '') {
            $c[$p['cat']] = true;
        }
    }
    return array_keys($c);
}

/* ================= ESTADO DE SESIÓN ================= */
$cuenta = sc_leer('admin');
$logueado = false;
if ($cuenta && !empty($_SESSION['admin'])) {
    $huella = hash('sha256', isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '');
    if ($_SESSION['admin'] === $cuenta['usuario']
        && isset($_SESSION['huella']) && hash_equals($_SESSION['huella'], $huella)
        && time() - $_SESSION['ultimo'] < INACTIVIDAD
        && isset($_SESSION['pwd_ver']) && $_SESSION['pwd_ver'] === substr($cuenta['hash'], -12)) {
        $logueado = true;
        $_SESSION['ultimo'] = time();
    } else {
        $_SESSION = [];
        session_regenerate_id(true);
        a_flash('info', 'Tu sesión terminó. Vuelve a entrar.');
    }
}

$seccion = isset($_GET['s']) && is_string($_GET['s']) ? $_GET['s'] : 'galeria';
if (!in_array($seccion, ['galeria', 'general', 'clientes', 'cuenta'], true)) {
    $seccion = 'galeria';
}

/* ================= ACCIONES (POST) ================= */
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Subida que excede post_max_size: PHP vacía $_POST sin avisar.
    if (empty($_POST) && !empty($_SERVER['CONTENT_LENGTH'])) {
        a_flash('error', 'Lo que intentaste subir excede el límite del servidor (' . ini_get('post_max_size') . '). Sube menos imágenes a la vez.');
        a_redirigir($seccion);
    }
    if (!a_csrf_ok()) {
        a_flash('error', 'La página expiró. Intenta de nuevo.');
        a_redirigir($seccion);
    }
    $accion = isset($_POST['accion']) && is_string($_POST['accion']) ? $_POST['accion'] : '';

    /* ---------- Instalación inicial ---------- */
    if ($accion === 'instalar' && !$cuenta) {
        $codigo = strtoupper(a_txt('codigo', 20));
        $usuario = a_txt('usuario', 40);
        $p1 = isset($_POST['password']) && is_string($_POST['password']) ? $_POST['password'] : '';
        $p2 = isset($_POST['password2']) && is_string($_POST['password2']) ? $_POST['password2'] : '';
        if (a_bloqueado()) {
            a_flash('error', 'Demasiados intentos. Espera unos minutos.');
        } elseif (!hash_equals(a_codigo_instalacion(), $codigo)) {
            a_registrar_fallo();
            a_flash('error', 'El código de instalación no coincide.');
        } elseif (!preg_match('/^[A-Za-z0-9._-]{3,40}$/', $usuario)) {
            a_flash('error', 'El usuario debe tener de 3 a 40 letras, números, punto, guion o guion bajo.');
        } elseif (strlen($p1) < MIN_PASSWORD) {
            a_flash('error', 'La contraseña debe tener al menos ' . MIN_PASSWORD . ' caracteres.');
        } elseif ($p1 !== $p2) {
            a_flash('error', 'Las contraseñas no coinciden.');
        } else {
            sc_escribir('admin', ['usuario' => $usuario, 'hash' => password_hash($p1, PASSWORD_DEFAULT), 'creado' => date('c')]);
            @unlink(SC_DATA_DIR . '/instalacion.php');
            a_flash('ok', 'Cuenta creada. Ya puedes entrar.');
        }
        a_redirigir();
    }

    /* ---------- Acceso ---------- */
    if ($accion === 'entrar' && $cuenta) {
        $usuario = a_txt('usuario', 40);
        $pass = isset($_POST['password']) && is_string($_POST['password']) ? $_POST['password'] : '';
        $espera = a_bloqueado();
        if ($espera) {
            a_flash('error', 'Demasiados intentos fallidos. Intenta de nuevo en ' . ceil($espera / 60) . ' min.');
        } elseif (hash_equals($cuenta['usuario'], $usuario) && password_verify($pass, $cuenta['hash'])) {
            if (password_needs_rehash($cuenta['hash'], PASSWORD_DEFAULT)) {
                $cuenta['hash'] = password_hash($pass, PASSWORD_DEFAULT);
                sc_escribir('admin', $cuenta);
            }
            a_limpiar_fallos();
            session_regenerate_id(true);
            $_SESSION['admin'] = $cuenta['usuario'];
            $_SESSION['huella'] = hash('sha256', isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '');
            $_SESSION['ultimo'] = time();
            $_SESSION['pwd_ver'] = substr($cuenta['hash'], -12);
            unset($_SESSION['csrf_admin']);
        } else {
            a_registrar_fallo();
            a_flash('error', 'Usuario o contraseña incorrectos.');
        }
        a_redirigir();
    }

    if (!$logueado) {
        a_redirigir();
    }

    $sitio = sc_load();

    if ($accion === 'salir') {
        $_SESSION = [];
        session_regenerate_id(true);
        a_flash('ok', 'Sesión cerrada.');
        a_redirigir();
    }

    /* ---------- Galería: subir ---------- */
    if ($accion === 'subir') {
        $files = isset($_FILES['imagenes']) ? $_FILES['imagenes'] : null;
        $cat = a_txt('cat', 40);
        $alt = a_txt('alt', 160);
        $alInicio = a_txt('posicion', 10) !== 'final';
        if ($cat === '') {
            a_flash('error', 'Escribe o elige una categoría para las imágenes.');
            a_redirigir('galeria');
        }
        if (!$files || !is_array($files['name'])) {
            a_flash('error', 'Elige al menos una imagen.');
            a_redirigir('galeria');
        }
        $nuevos = [];
        $errores = [];
        $total = min(count($files['name']), 20);
        for ($i = 0; $i < $total; $i++) {
            $nombre = (string)$files['name'][$i];
            if ($files['error'][$i] === UPLOAD_ERR_NO_FILE) {
                continue;
            }
            if ($files['error'][$i] !== UPLOAD_ERR_OK) {
                $errores[] = $nombre . ': ' . sc_error_subida($files['error'][$i]);
                continue;
            }
            try {
                $rutas = sc_procesar_imagen($files['tmp_name'][$i], $nombre);
                $nuevos[] = [
                    'id'      => 'u' . bin2hex(random_bytes(5)),
                    'cat'     => $cat,
                    'alt'     => $alt !== '' ? $alt : $cat . ' — ' . $sitio['general']['nombre'],
                    'thumb'   => $rutas['thumb'],
                    'large'   => $rutas['large'],
                    'visible' => true,
                    'subido'  => date('c'),
                ];
            } catch (RuntimeException $e) {
                $errores[] = $nombre . ': ' . $e->getMessage();
            }
        }
        if (count($files['name']) > 20) {
            $errores[] = 'Solo se procesan 20 imágenes por subida.';
        }
        if ($nuevos) {
            $sitio['proyectos'] = $alInicio
                ? array_merge($nuevos, $sitio['proyectos'])
                : array_merge($sitio['proyectos'], $nuevos);
            if (sc_save($sitio)) {
                a_flash('ok', count($nuevos) === 1 ? 'Se agregó 1 imagen a la galería.' : 'Se agregaron ' . count($nuevos) . ' imágenes a la galería.');
            } else {
                foreach ($nuevos as $n) {
                    sc_borrar_archivos($n);
                }
                a_flash('error', ERROR_GUARDAR);
            }
        }
        foreach ($errores as $err) {
            a_flash('error', $err);
        }
        a_redirigir('galeria');
    }

    /* ---------- Galería: editar, y además mover o borrar ----------
       Todos los botones de la lista envían el formulario completo,
       así nunca se pierden ediciones al reordenar o borrar. */
    $partes = explode('|', $accion);
    if (in_array($partes[0], ['galeria_guardar', 'mover', 'borrar'], true)) {
        $alts = a_arr('alt');
        $cats = a_arr('cat');
        $vis = a_arr('visible');
        $enForm = a_arr('ids');
        foreach ($sitio['proyectos'] as &$p) {
            $id = $p['id'];
            if (!in_array($id, $enForm, true)) {
                continue; // agregado en otra pestaña después de cargar este formulario
            }
            $v = a_limpio(isset($alts[$id]) ? $alts[$id] : '', 160);
            if ($v !== '') {
                $p['alt'] = $v;
            }
            $v = a_limpio(isset($cats[$id]) ? $cats[$id] : '', 40);
            if ($v !== '') {
                $p['cat'] = $v;
            }
            $p['visible'] = isset($vis[$id]);
        }
        unset($p);

        $ids = array_column($sitio['proyectos'], 'id');
        $borrado = null;
        $msg = 'Cambios de la galería guardados.';
        if ($partes[0] === 'mover' && count($partes) === 3) {
            $idx = array_search($partes[1], $ids, true);
            $dest = $partes[2] === 'arriba' ? $idx - 1 : $idx + 1;
            if ($idx !== false && $dest >= 0 && $dest < count($ids)) {
                $tmp = $sitio['proyectos'][$dest];
                $sitio['proyectos'][$dest] = $sitio['proyectos'][$idx];
                $sitio['proyectos'][$idx] = $tmp;
            }
            $msg = 'Orden actualizado.';
        } elseif ($partes[0] === 'borrar' && count($partes) === 2) {
            $idx = array_search($partes[1], $ids, true);
            if ($idx !== false) {
                $borrado = $sitio['proyectos'][$idx];
                array_splice($sitio['proyectos'], $idx, 1);
                $msg = 'Imagen eliminada.';
            }
        }
        if (sc_save($sitio)) {
            if ($borrado) {
                sc_borrar_archivos($borrado);
            }
            a_flash('ok', $msg);
        } else {
            a_flash('error', ERROR_GUARDAR);
        }
        a_redirigir('galeria');
    }

    /* ---------- Información general ---------- */
    if ($accion === 'general_guardar') {
        $g = $sitio['general'];
        $c = $sitio['contacto'];
        $r = $sitio['redes'];
        $errores = [];

        $g['nombre']          = a_txt('nombre', 80) ?: $g['nombre'];
        $g['razon_social']    = a_txt('razon_social', 120);
        $g['hero_kicker']     = a_txt('hero_kicker', 80);
        $g['hero_badge']      = a_txt('hero_badge', 60);
        $g['seo_titulo']      = a_txt('seo_titulo', 120) ?: $g['seo_titulo'];
        $g['seo_descripcion'] = a_txt('seo_descripcion', 300);
        $g['og_descripcion']  = a_txt('og_descripcion', 300);
        $g['footer_texto']    = a_txt('footer_texto', 400);
        $anio = a_txt('fundacion', 4);
        if (preg_match('/^\d{4}$/', $anio)) {
            $g['fundacion'] = $anio;
        }

        foreach (['telefono1', 'telefono2', 'whatsapp'] as $t) {
            $v = a_txt($t, 25);
            if ($v !== '' && !preg_match('/^[\d\s\-\+\(\)]{7,25}$/', $v)) {
                $errores[] = 'Teléfono no válido: ' . $v;
            } elseif ($v !== '' || $t === 'telefono2') {
                $c[$t] = $v;
            }
        }
        if (strlen(sc_digitos($c['whatsapp'])) < 10) {
            $errores[] = 'El WhatsApp debe incluir la lada de país (ej. +52 867 ...).';
        }
        $c['wa_mensaje'] = a_txt('wa_mensaje', 200);
        $email = a_txt('email', 254);
        if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $c['email'] = $email;
        } else {
            $errores[] = 'El correo no es válido; se conservó el anterior.';
        }
        foreach (['calle' => 160, 'cp' => 10, 'ciudad' => 80, 'estado' => 80, 'estado_abrev' => 20] as $k => $max) {
            $c[$k] = a_txt($k, $max);
        }

        $enlaces = ['mapa_url' => 'Google Maps', 'facebook' => 'Facebook', 'instagram' => 'Instagram', 'tiktok' => 'TikTok'];
        foreach ($enlaces as $k => $etiqueta) {
            $v = a_txt($k, 300);
            if ($v !== '' && sc_url_segura($v) === '') {
                $errores[] = 'Enlace de ' . $etiqueta . ' no válido: debe empezar con https://';
                continue;
            }
            if ($k === 'mapa_url') {
                $c[$k] = $v;
            } else {
                $r[$k] = $v;
            }
        }

        $sitio['general'] = $g;
        $sitio['contacto'] = $c;
        $sitio['redes'] = $r;
        $ok = sc_save($sitio);
        a_flash($ok ? 'ok' : 'error', $ok ? 'Información del sitio guardada.' : ERROR_GUARDAR);
        foreach ($errores as $e) {
            a_flash('error', $e);
        }
        a_redirigir('general');
    }

    /* ---------- Clientes y cifras ---------- */
    if ($accion === 'clientes_guardar') {
        $texto = isset($_POST['clientes']) && is_string($_POST['clientes']) ? $_POST['clientes'] : '';
        $clientes = [];
        foreach (preg_split('/\r\n|\r|\n/', $texto) as $l) {
            $l = a_limpio($l, 80);
            if ($l !== '' && !in_array($l, $clientes, true)) {
                $clientes[] = $l;
            }
        }
        $sitio['clientes'] = array_slice($clientes, 0, 200);

        $nums = a_arr('stat_num');
        $sufs = a_arr('stat_suffix');
        $labs = a_arr('stat_label');
        $stats = [];
        for ($i = 0; $i < 4; $i++) {
            $label = a_limpio(isset($labs[$i]) ? $labs[$i] : '', 40);
            if ($label === '') {
                continue;
            }
            $stats[] = [
                'num'    => max(0, min(1000000, (int)(isset($nums[$i]) ? $nums[$i] : 0))),
                'suffix' => a_limpio(isset($sufs[$i]) ? $sufs[$i] : '', 3),
                'label'  => $label,
            ];
        }
        if ($stats) {
            $sitio['stats'] = $stats;
        } else {
            a_flash('error', 'Debe quedar al menos una cifra; se conservaron las anteriores.');
        }
        $ok = sc_save($sitio);
        a_flash($ok ? 'ok' : 'error', $ok ? 'Clientes y cifras guardados.' : ERROR_GUARDAR);
        a_redirigir('clientes');
    }

    /* ---------- Cuenta ---------- */
    if ($accion === 'password') {
        $actual = isset($_POST['actual']) && is_string($_POST['actual']) ? $_POST['actual'] : '';
        $p1 = isset($_POST['password']) && is_string($_POST['password']) ? $_POST['password'] : '';
        $p2 = isset($_POST['password2']) && is_string($_POST['password2']) ? $_POST['password2'] : '';
        if (!password_verify($actual, $cuenta['hash'])) {
            a_registrar_fallo();
            a_flash('error', 'La contraseña actual no es correcta.');
        } elseif (strlen($p1) < MIN_PASSWORD) {
            a_flash('error', 'La nueva contraseña debe tener al menos ' . MIN_PASSWORD . ' caracteres.');
        } elseif ($p1 !== $p2) {
            a_flash('error', 'Las contraseñas nuevas no coinciden.');
        } else {
            $cuenta['hash'] = password_hash($p1, PASSWORD_DEFAULT);
            $cuenta['cambiado'] = date('c');
            if (sc_escribir('admin', $cuenta)) {
                // La huella cambia: cualquier otra sesión abierta queda cerrada.
                $_SESSION['pwd_ver'] = substr($cuenta['hash'], -12);
                session_regenerate_id(true);
                a_flash('ok', 'Contraseña actualizada.');
            } else {
                a_flash('error', ERROR_GUARDAR);
            }
        }
        a_redirigir('cuenta');
    }

    a_redirigir($seccion);
}

/* ================= VISTA ================= */
$flash = isset($_SESSION['flash']) ? $_SESSION['flash'] : [];
unset($_SESSION['flash']);
$csrf = a_csrf();
$sitio = sc_load();

function a_campo($nombre, $etiqueta, $valor, $tipo = 'text', $extra = '', $ayuda = '')
{
    $id = 'f-' . $nombre;
    echo '<div class="campo"><label for="' . $id . '">' . sc_e($etiqueta) . '</label>';
    if ($tipo === 'textarea') {
        echo '<textarea id="' . $id . '" name="' . sc_e($nombre) . '" rows="3" ' . $extra . '>' . sc_e($valor) . '</textarea>';
    } else {
        echo '<input id="' . $id . '" type="' . $tipo . '" name="' . sc_e($nombre) . '" value="' . sc_e($valor) . '" ' . $extra . '>';
    }
    if ($ayuda !== '') {
        echo '<small>' . sc_e($ayuda) . '</small>';
    }
    echo '</div>';
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>Panel · <?= sc_e($sitio['general']['nombre']) ?></title>
<link rel="icon" href="../favicon.ico">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Outfit:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="admin.css?v=2">
<script defer src="admin.js?v=1"></script>
</head>
<body class="<?= $logueado ? 'app' : 'acceso' ?>">

<?php if (!$logueado): ?>
<main class="caja-acceso">
  <img src="../logo_sc_3.svg" alt="<?= sc_e($sitio['general']['nombre']) ?>" class="logo" width="170" height="51">
  <?php foreach ($flash as $f): ?>
  <p class="aviso <?= sc_e($f[0]) ?>" role="<?= $f[0] === 'error' ? 'alert' : 'status' ?>"><?= sc_e($f[1]) ?></p>
  <?php endforeach; ?>

  <?php if (!$cuenta): $codigoInstalacion = a_codigo_instalacion(); // crea data/instalacion.php si falta ?>
  <h1>Configura el panel</h1>
  <p class="nota">Por seguridad, la primera cuenta se crea con un <strong>código de instalación</strong>. Ábrelo en cPanel → Administrador de archivos → <code>data/instalacion.php</code>.</p>
  <?php if ($esLocal): ?><p class="nota local">Copia local: el código es <code><?= sc_e($codigoInstalacion) ?></code></p><?php endif; ?>
  <form method="post" autocomplete="off">
    <input type="hidden" name="csrf" value="<?= sc_e($csrf) ?>">
    <input type="hidden" name="accion" value="instalar">
    <?php a_campo('codigo', 'Código de instalación', '', 'text', 'required maxlength="20" autocapitalize="characters" spellcheck="false"'); ?>
    <?php a_campo('usuario', 'Usuario', '', 'text', 'required minlength="3" maxlength="40" pattern="[A-Za-z0-9._\-]{3,40}" autocomplete="username"'); ?>
    <?php a_campo('password', 'Contraseña (mín. ' . MIN_PASSWORD . ' caracteres)', '', 'password', 'required minlength="' . MIN_PASSWORD . '" autocomplete="new-password"'); ?>
    <?php a_campo('password2', 'Repite la contraseña', '', 'password', 'required minlength="' . MIN_PASSWORD . '" autocomplete="new-password"'); ?>
    <button class="btn primario" type="submit">Crear cuenta</button>
  </form>
  <?php else: ?>
  <h1>Panel de administración</h1>
  <form method="post">
    <input type="hidden" name="csrf" value="<?= sc_e($csrf) ?>">
    <input type="hidden" name="accion" value="entrar">
    <?php a_campo('usuario', 'Usuario', '', 'text', 'required autocomplete="username" autofocus'); ?>
    <?php a_campo('password', 'Contraseña', '', 'password', 'required autocomplete="current-password"'); ?>
    <button class="btn primario" type="submit">Entrar</button>
  </form>
  <?php endif; ?>
  <a class="volver" href="../">← Volver al sitio</a>
</main>

<?php else:
  $secciones = ['galeria' => 'Galería', 'general' => 'Información', 'clientes' => 'Clientes y cifras', 'cuenta' => 'Cuenta'];
  $cats = a_categorias($sitio);
?>
<header class="barra">
  <a class="marca" href="./"><img src="../logo_sc_3.svg" alt="" width="120" height="36"><span>Panel</span></a>
  <nav aria-label="Secciones del panel">
    <?php foreach ($secciones as $k => $t): ?>
    <a href="?s=<?= $k ?>" <?= $k === $seccion ? 'aria-current="page"' : '' ?>><?= $t ?></a>
    <?php endforeach; ?>
  </nav>
  <div class="barra-acciones">
    <a class="btn fantasma" href="../" target="_blank" rel="noopener">Ver sitio ↗</a>
    <form method="post">
      <input type="hidden" name="csrf" value="<?= sc_e($csrf) ?>">
      <button class="btn fantasma" name="accion" value="salir">Salir</button>
    </form>
  </div>
</header>

<main class="contenido">
  <div class="avisos">
    <?php foreach ($flash as $f): ?>
    <p class="aviso <?= sc_e($f[0]) ?>" role="<?= $f[0] === 'error' ? 'alert' : 'status' ?>"><?= sc_e($f[1]) ?></p>
    <?php endforeach; ?>
  </div>

<?php if ($seccion === 'galeria'):
  $visibles = count(sc_proyectos_visibles($sitio)); ?>
  <section class="panel">
    <div class="panel-cab">
      <h1>Galería de proyectos</h1>
      <p><?= count($sitio['proyectos']) ?> imágenes · <?= $visibles ?> visibles en el sitio</p>
    </div>

    <form class="subida" method="post" enctype="multipart/form-data" id="formSubida">
      <input type="hidden" name="csrf" value="<?= sc_e($csrf) ?>">
      <input type="hidden" name="accion" value="subir">
      <label class="zona" for="f-imagenes">
        <input type="file" id="f-imagenes" name="imagenes[]" accept="image/jpeg,image/png,image/webp" multiple required>
        <strong>Arrastra imágenes aquí o haz clic para elegir</strong>
        <span>JPG, PNG o WebP · hasta 15 MB cada una · máx. 20 por subida. Se optimizan solas.</span>
      </label>
      <div class="previas" id="previas" aria-live="polite"></div>
      <div class="fila">
        <div class="campo">
          <label for="f-cat">Categoría</label>
          <input id="f-cat" name="cat" list="lista-cats" required maxlength="40" placeholder="Ej. Rotulación">
        </div>
        <div class="campo ancho">
          <label for="f-alt">Descripción <span class="opc">(opcional, ayuda a Google y accesibilidad)</span></label>
          <input id="f-alt" name="alt" maxlength="160" placeholder="Ej. Rotulación de camión de reparto — Cliente">
        </div>
        <div class="campo">
          <label for="f-posicion">Posición</label>
          <select id="f-posicion" name="posicion">
            <option value="inicio">Al inicio</option>
            <option value="final">Al final</option>
          </select>
        </div>
      </div>
      <button class="btn primario" type="submit">Subir a la galería</button>
    </form>
    <datalist id="lista-cats">
      <?php foreach ($cats as $c): ?><option value="<?= sc_e($c) ?>"><?php endforeach; ?>
    </datalist>
  </section>

  <section class="panel">
    <form method="post" id="formGaleria">
      <input type="hidden" name="csrf" value="<?= sc_e($csrf) ?>">
      <div class="panel-cab">
        <h2>Imágenes publicadas</h2>
        <p>El orden aquí es el orden del carrusel. Desmarca “Visible” para ocultar sin borrar.</p>
      </div>
      <?php if (!$sitio['proyectos']): ?>
      <p class="vacio">Aún no hay imágenes. Sube la primera arriba.</p>
      <?php endif; ?>
      <ol class="rejilla">
        <?php foreach ($sitio['proyectos'] as $i => $p): $id = sc_e($p['id']); ?>
        <li class="tarjeta<?= empty($p['visible']) ? ' oculta' : '' ?>">
          <input type="hidden" name="ids[]" value="<?= $id ?>">
          <a class="miniatura" href="../<?= sc_e($p['large']) ?>" target="_blank" rel="noopener">
            <img src="../<?= sc_e($p['thumb']) ?>" alt="" loading="lazy" width="400" height="300">
            <span class="num"><?= $i + 1 ?></span>
          </a>
          <div class="campo">
            <label for="cat-<?= $id ?>">Categoría</label>
            <input id="cat-<?= $id ?>" name="cat[<?= $id ?>]" value="<?= sc_e($p['cat']) ?>" list="lista-cats" maxlength="40">
          </div>
          <div class="campo">
            <label for="alt-<?= $id ?>">Descripción</label>
            <input id="alt-<?= $id ?>" name="alt[<?= $id ?>]" value="<?= sc_e($p['alt']) ?>" maxlength="160">
          </div>
          <div class="acciones">
            <label class="check"><input type="checkbox" name="visible[<?= $id ?>]" value="1" <?= !empty($p['visible']) ? 'checked' : '' ?>> Visible</label>
            <span class="grupo">
              <button class="icono" name="accion" value="mover|<?= $id ?>|arriba" aria-label="Mover antes" title="Mover antes" <?= $i === 0 ? 'disabled' : '' ?>>↑</button>
              <button class="icono" name="accion" value="mover|<?= $id ?>|abajo" aria-label="Mover después" title="Mover después" <?= $i === count($sitio['proyectos']) - 1 ? 'disabled' : '' ?>>↓</button>
              <button class="icono peligro" name="accion" value="borrar|<?= $id ?>" data-confirmar="¿Eliminar esta imagen de la galería? No se puede deshacer." aria-label="Eliminar" title="Eliminar">✕</button>
            </span>
          </div>
        </li>
        <?php endforeach; ?>
      </ol>
      <?php if ($sitio['proyectos']): ?>
      <div class="pie-form"><button class="btn primario" name="accion" value="galeria_guardar">Guardar cambios</button></div>
      <?php endif; ?>
    </form>
  </section>

<?php elseif ($seccion === 'general'):
  $g = $sitio['general']; $c = $sitio['contacto']; $r = $sitio['redes']; ?>
  <form class="panel" method="post">
    <input type="hidden" name="csrf" value="<?= sc_e($csrf) ?>">
    <div class="panel-cab">
      <h1>Información del sitio</h1>
      <p>Se refleja en la portada, contacto, pie de página, botones de WhatsApp y resultados de Google.</p>
    </div>

    <fieldset>
      <legend>Empresa</legend>
      <div class="fila">
        <?php a_campo('nombre', 'Nombre comercial', $g['nombre'], 'text', 'required maxlength="80"'); ?>
        <?php a_campo('razon_social', 'Razón social', $g['razon_social'], 'text', 'maxlength="120"'); ?>
        <?php a_campo('fundacion', 'Año de fundación', $g['fundacion'], 'text', 'inputmode="numeric" pattern="\d{4}" maxlength="4"'); ?>
      </div>
      <?php a_campo('footer_texto', 'Texto del pie de página', $g['footer_texto'], 'textarea', 'maxlength="400"'); ?>
    </fieldset>

    <fieldset>
      <legend>Portada</legend>
      <div class="fila">
        <?php a_campo('hero_kicker', 'Texto superior', $g['hero_kicker'], 'text', 'maxlength="80"'); ?>
        <?php a_campo('hero_badge', 'Lema bajo el título', $g['hero_badge'], 'text', 'maxlength="60"'); ?>
      </div>
    </fieldset>

    <fieldset>
      <legend>Contacto</legend>
      <div class="fila">
        <?php a_campo('telefono1', 'Teléfono principal', $c['telefono1'], 'tel', 'required maxlength="25"'); ?>
        <?php a_campo('telefono2', 'Teléfono secundario', $c['telefono2'], 'tel', 'maxlength="25"', 'Déjalo vacío para ocultarlo.'); ?>
        <?php a_campo('whatsapp', 'WhatsApp', $c['whatsapp'], 'tel', 'required maxlength="25"', 'Con lada de país: +52 ...'); ?>
      </div>
      <?php a_campo('wa_mensaje', 'Mensaje prellenado de WhatsApp', $c['wa_mensaje'], 'text', 'maxlength="200"'); ?>
      <?php a_campo('email', 'Correo (recibe los mensajes del formulario)', $c['email'], 'email', 'required maxlength="254"'); ?>
    </fieldset>

    <fieldset>
      <legend>Dirección</legend>
      <?php a_campo('calle', 'Calle, número y colonia', $c['calle'], 'text', 'maxlength="160"'); ?>
      <div class="fila">
        <?php a_campo('cp', 'C.P.', $c['cp'], 'text', 'maxlength="10"'); ?>
        <?php a_campo('ciudad', 'Ciudad', $c['ciudad'], 'text', 'maxlength="80"'); ?>
        <?php a_campo('estado', 'Estado', $c['estado'], 'text', 'maxlength="80"'); ?>
        <?php a_campo('estado_abrev', 'Abreviatura', $c['estado_abrev'], 'text', 'maxlength="20"'); ?>
      </div>
      <?php a_campo('mapa_url', 'Enlace de Google Maps', $c['mapa_url'], 'url', 'maxlength="300" placeholder="https://maps.app.goo.gl/..."'); ?>
    </fieldset>

    <fieldset>
      <legend>Redes sociales <span class="opc">(vacío = se oculta el icono)</span></legend>
      <div class="fila">
        <?php a_campo('facebook', 'Facebook', $r['facebook'], 'url', 'maxlength="300"'); ?>
        <?php a_campo('instagram', 'Instagram', $r['instagram'], 'url', 'maxlength="300"'); ?>
        <?php a_campo('tiktok', 'TikTok', $r['tiktok'], 'url', 'maxlength="300"'); ?>
      </div>
    </fieldset>

    <fieldset>
      <legend>Google y redes (SEO)</legend>
      <?php a_campo('seo_titulo', 'Título de la página', $g['seo_titulo'], 'text', 'maxlength="120" data-contador="60"', 'Ideal: hasta 60 caracteres.'); ?>
      <?php a_campo('seo_descripcion', 'Descripción para Google', $g['seo_descripcion'], 'textarea', 'maxlength="300" data-contador="160"', 'Ideal: 120–160 caracteres.'); ?>
      <?php a_campo('og_descripcion', 'Descripción al compartir en redes', $g['og_descripcion'], 'textarea', 'maxlength="300"'); ?>
    </fieldset>

    <div class="pie-form"><button class="btn primario" name="accion" value="general_guardar">Guardar información</button></div>
  </form>

<?php elseif ($seccion === 'clientes'): ?>
  <form class="panel" method="post">
    <input type="hidden" name="csrf" value="<?= sc_e($csrf) ?>">
    <div class="panel-cab">
      <h1>Clientes y cifras</h1>
      <p>Los clientes aparecen en la cinta “Marcas que confían”; las cifras, en la franja de estadísticas.</p>
    </div>
    <fieldset>
      <legend>Cifras</legend>
      <p class="nota">Hasta 4. Deja la etiqueta vacía para quitar una.</p>
      <?php $st = array_pad($sitio['stats'], 4, ['num' => '', 'suffix' => '', 'label' => '']);
      foreach ($st as $i => $s): ?>
      <div class="fila cifra">
        <div class="campo corto"><label for="sn<?= $i ?>">Número</label><input id="sn<?= $i ?>" name="stat_num[]" type="number" min="0" max="1000000" value="<?= sc_e($s['num']) ?>"></div>
        <div class="campo corto"><label for="ss<?= $i ?>">Sufijo</label><input id="ss<?= $i ?>" name="stat_suffix[]" maxlength="3" value="<?= sc_e($s['suffix']) ?>" placeholder="+"></div>
        <div class="campo ancho"><label for="sl<?= $i ?>">Etiqueta</label><input id="sl<?= $i ?>" name="stat_label[]" maxlength="40" value="<?= sc_e($s['label']) ?>"></div>
      </div>
      <?php endforeach; ?>
    </fieldset>
    <fieldset>
      <legend>Clientes</legend>
      <div class="campo">
        <label for="f-clientes">Un cliente por línea (<?= count($sitio['clientes']) ?> actualmente)</label>
        <textarea id="f-clientes" name="clientes" rows="14"><?= sc_e(implode("\n", $sitio['clientes'])) ?></textarea>
      </div>
    </fieldset>
    <div class="pie-form"><button class="btn primario" name="accion" value="clientes_guardar">Guardar</button></div>
  </form>

<?php else: ?>
  <form class="panel estrecho" method="post">
    <input type="hidden" name="csrf" value="<?= sc_e($csrf) ?>">
    <input type="hidden" name="accion" value="password">
    <div class="panel-cab">
      <h1>Cuenta</h1>
      <p>Usuario: <strong><?= sc_e($cuenta['usuario']) ?></strong><?php if ($sitio['actualizado']): ?> · Última edición del sitio: <?= sc_e(date('d/m/Y H:i', strtotime($sitio['actualizado']))) ?><?php endif; ?></p>
    </div>
    <fieldset>
      <legend>Cambiar contraseña</legend>
      <?php a_campo('actual', 'Contraseña actual', '', 'password', 'required autocomplete="current-password"'); ?>
      <?php a_campo('password', 'Nueva contraseña (mín. ' . MIN_PASSWORD . ')', '', 'password', 'required minlength="' . MIN_PASSWORD . '" autocomplete="new-password"'); ?>
      <?php a_campo('password2', 'Repite la nueva contraseña', '', 'password', 'required minlength="' . MIN_PASSWORD . '" autocomplete="new-password"'); ?>
    </fieldset>
    <div class="pie-form"><button class="btn primario" type="submit">Actualizar contraseña</button></div>
    <p class="nota">Cada cambio del sitio guarda un respaldo automático (últimos 20) en <code>data/respaldos/</code>.</p>
  </form>
<?php endif; ?>
</main>
<?php endif; ?>
</body>
</html>
