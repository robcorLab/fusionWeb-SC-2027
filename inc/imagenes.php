<?php
// ============================================================
// SECTOR CREATIVO — Procesamiento de imágenes subidas
// Valida el archivo real (no la extensión), corrige la rotación
// de fotos de celular y genera dos WebP: miniatura 800×600
// (recorte centrado, para el carrusel) y ampliada ≤1920 px
// (para el visor). El original nunca se guarda ni se sirve.
// Design by RobCorLab
// ============================================================
if (!defined('SC_ROOT')) {
    define('SC_ROOT', dirname(__DIR__));
}

define('SC_UPLOAD_MAX_BYTES', 15 * 1024 * 1024);
define('SC_UPLOAD_MAX_PIXELS', 40000000); // ~40 MP: protege la memoria del hosting

function sc_gd_disponible()
{
    return function_exists('imagecreatetruecolor') && function_exists('imagewebp');
}

function sc_error_subida($codigo)
{
    $msgs = [
        UPLOAD_ERR_INI_SIZE   => 'el archivo supera el límite del servidor (upload_max_filesize)',
        UPLOAD_ERR_FORM_SIZE  => 'el archivo es demasiado grande',
        UPLOAD_ERR_PARTIAL    => 'la subida se interrumpió',
        UPLOAD_ERR_NO_FILE    => 'no se eligió archivo',
        UPLOAD_ERR_NO_TMP_DIR => 'el servidor no tiene carpeta temporal',
        UPLOAD_ERR_CANT_WRITE => 'el servidor no pudo escribir el archivo',
        UPLOAD_ERR_EXTENSION  => 'una extensión de PHP bloqueó la subida',
    ];
    return isset($msgs[$codigo]) ? $msgs[$codigo] : 'error desconocido';
}

/**
 * Procesa un archivo de $_FILES. Devuelve ['thumb'=>..., 'large'=>...]
 * (rutas relativas a la raíz del sitio) o lanza RuntimeException.
 */
function sc_procesar_imagen($tmp, $nombreOriginal)
{
    if (!sc_gd_disponible()) {
        throw new RuntimeException('el servidor no tiene GD con soporte WebP');
    }
    if (!is_uploaded_file($tmp) && PHP_SAPI !== 'cli') {
        throw new RuntimeException('archivo no válido');
    }
    if (filesize($tmp) > SC_UPLOAD_MAX_BYTES) {
        throw new RuntimeException('supera 15 MB');
    }

    $mime = '';
    if (function_exists('finfo_open')) {
        $f = finfo_open(FILEINFO_MIME_TYPE);
        $mime = (string)finfo_file($f, $tmp);
        if (PHP_VERSION_ID < 80100) {
            finfo_close($f); // desde 8.1 se libera solo (y en 8.5 está obsoleto)
        }
    }
    $info = @getimagesize($tmp);
    if (!$info) {
        throw new RuntimeException('no es una imagen');
    }
    if ($mime === '') {
        $mime = $info['mime'];
    }
    $permitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!in_array($mime, $permitidos, true) || !in_array($info['mime'], $permitidos, true)) {
        throw new RuntimeException('formato no admitido (usa JPG, PNG o WebP)');
    }
    if ($info[0] * $info[1] > SC_UPLOAD_MAX_PIXELS) {
        throw new RuntimeException('resolución demasiado grande (máx. ~40 megapíxeles)');
    }

    @ini_set('memory_limit', '512M');
    @set_time_limit(60);

    switch ($info['mime']) {
        case 'image/jpeg': $src = @imagecreatefromjpeg($tmp); break;
        case 'image/png':  $src = @imagecreatefrompng($tmp);  break;
        default:           $src = @imagecreatefromwebp($tmp); break;
    }
    if (!$src) {
        throw new RuntimeException('no se pudo leer la imagen');
    }

    // Fotos de celular: aplicar la orientación EXIF.
    if ($info['mime'] === 'image/jpeg' && function_exists('exif_read_data')) {
        $exif = @exif_read_data($tmp);
        $o = isset($exif['Orientation']) ? (int)$exif['Orientation'] : 1;
        $rot = [3 => 180, 6 => -90, 8 => 90];
        if (isset($rot[$o])) {
            $r = imagerotate($src, $rot[$o], 0);
            if ($r) { sc_liberar($src); $src = $r; }
        }
    }

    $w = imagesx($src);
    $h = imagesy($src);

    $dirThumb = SC_ROOT . '/img/uploads/thumbs';
    $dirLarge = SC_ROOT . '/img/uploads/large';
    foreach ([$dirThumb, $dirLarge] as $d) {
        if (!is_dir($d) && !@mkdir($d, 0755, true)) {
            sc_liberar($src);
            throw new RuntimeException('no se pudo crear la carpeta img/uploads');
        }
    }

    $base = 'proyecto-' . date('Ymd-His') . '-' . bin2hex(random_bytes(3));

    // Ampliada: ajustar a 1920 px de lado mayor, sin agrandar.
    $esc = min(1, 1920 / max($w, $h));
    $lw = max(1, (int)round($w * $esc));
    $lh = max(1, (int)round($h * $esc));
    $large = sc_lienzo($lw, $lh);
    imagecopyresampled($large, $src, 0, 0, 0, 0, $lw, $lh, $w, $h);

    // Miniatura: recorte centrado 4:3 a 800×600 (mismo formato del carrusel).
    $tw = 800; $th = 600;
    $ratio = $tw / $th;
    if ($w / $h > $ratio) {
        $ch = $h; $cw = (int)round($h * $ratio); $cx = (int)(($w - $cw) / 2); $cy = 0;
    } else {
        $cw = $w; $ch = (int)round($w / $ratio); $cx = 0; $cy = (int)(($h - $ch) / 2);
    }
    $thumb = sc_lienzo($tw, $th);
    imagecopyresampled($thumb, $src, 0, 0, $cx, $cy, $tw, $th, $cw, $ch);
    sc_liberar($src);

    $rutaLarge = $dirLarge . '/' . $base . '.webp';
    $rutaThumb = $dirThumb . '/' . $base . '.webp';
    $ok = imagewebp($large, $rutaLarge, 82) && imagewebp($thumb, $rutaThumb, 78);
    sc_liberar($large);
    sc_liberar($thumb);
    if (!$ok) {
        @unlink($rutaLarge);
        @unlink($rutaThumb);
        throw new RuntimeException('no se pudo guardar la imagen convertida');
    }

    return [
        'thumb' => 'img/uploads/thumbs/' . $base . '.webp',
        'large' => 'img/uploads/large/' . $base . '.webp',
    ];
}

/** imagedestroy() no hace nada desde PHP 8.0 y está obsoleto en 8.5. */
function sc_liberar($im)
{
    if (PHP_VERSION_ID < 80000 && $im) {
        imagedestroy($im);
    }
}

function sc_lienzo($w, $h)
{
    $im = imagecreatetruecolor($w, $h);
    imagealphablending($im, false);
    imagesavealpha($im, true);
    imagefill($im, 0, 0, imagecolorallocatealpha($im, 0, 0, 0, 127));
    imagealphablending($im, true);
    return $im;
}

/** Borra los archivos de un proyecto solo si viven en img/uploads (las fotos de fábrica se conservan). */
function sc_borrar_archivos(array $p)
{
    foreach (['thumb', 'large'] as $k) {
        if (empty($p[$k]) || strpos($p[$k], 'img/uploads/') !== 0 || strpos($p[$k], '..') !== false) {
            continue;
        }
        $ruta = SC_ROOT . '/' . $p[$k];
        if (is_file($ruta)) {
            @unlink($ruta);
        }
    }
}
