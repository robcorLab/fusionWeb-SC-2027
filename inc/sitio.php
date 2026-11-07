<?php
// ============================================================
// SECTOR CREATIVO — Capa de datos del sitio
// Contenido editable desde /admin guardado en data/sitio.php
// (JSON protegido: el archivo empieza con un exit de PHP, así que
// nunca se sirve aunque el hosting ignore .htaccess).
// Design by RobCorLab
// ============================================================
if (!defined('SC_ROOT')) {
    define('SC_ROOT', dirname(__DIR__));
}
define('SC_DATA_DIR', SC_ROOT . '/data');
define('SC_GUARD', "<?php http_response_code(404); exit; ?>\n");

/** Contenido de fábrica: el sitio funciona igual aunque data/ esté vacío. */
function sc_defaults()
{
    $proyectos = [
        [1,  'Letreros',        'Letrero exterior 3D de fachada — Unidad Médica San Gerardo — Sector Creativo'],
        [2,  'Letreros',        'Letrero 3D de urgencias en fachada — Sector Creativo'],
        [3,  'Letreros',        'Letrero de identificación en acrílico — Cubículo — Sector Creativo'],
        [4,  'Letreros',        'Letrero 3D de urgencias 24/7 en acrílico — Sector Creativo'],
        [5,  'Letreros',        'Letrero de estación de agua purificada — Sector Creativo'],
        [6,  'Rotulación',      'Rotulación de semi-trailer — gráfica corporativa — Sector Creativo'],
        [7,  'Rotulación',      'Rotulación de flota de camiones — livery corporativa — Sector Creativo'],
        [8,  'Rotulación',      'Rotulación de camión revolvedor — Grupo Monalar — Sector Creativo'],
        [9,  'Rotulación',      'Rotulación de fachada y muro — Ferretería Fronteriza — Sector Creativo'],
        [10, 'Impresión Láser', 'Reconocimiento impreso — Medline 0 incidentes — Sector Creativo'],
    ];
    $lista = [];
    foreach ($proyectos as $p) {
        $lista[] = [
            'id'      => 'p' . $p[0],
            'cat'     => $p[1],
            'alt'     => $p[2],
            'thumb'   => 'img/thumbs/proyecto' . $p[0] . '.webp',
            'large'   => 'img/large/proyecto' . $p[0] . '.webp',
            'visible' => true,
        ];
    }

    return [
        'general' => [
            'nombre'        => 'Sector Creativo',
            'razon_social'  => 'Sector Creativo, S.A. de C.V.',
            'hero_kicker'   => 'Servicios de Comunicación Visual',
            'hero_badge'    => '30 años creando',
            'seo_titulo'    => 'Sector Creativo | Comunicación Visual — Diseño, Impresión, Rotulación, CNC y Láser',
            'seo_descripcion' => 'Sector Creativo, Nuevo Laredo: comunicación visual de alto impacto desde hace 30 años. Diseño gráfico, impresión gran formato y digital, rotulación vehicular, corte CNC, grabado láser, serigrafía y letreros luminosos.',
            'og_descripcion'  => '30 años de diseño, impresión, rotulación, CNC, láser, serigrafía y letreros luminosos en Nuevo Laredo, Tamaulipas.',
            'footer_texto'  => 'Sector Creativo es una empresa especializada en Diseño, Impresión y Producción de material Publicitario, en la ciudad de Nuevo Laredo, Tamaulipas.',
            'fundacion'     => '1996',
        ],
        'contacto' => [
            'telefono1'  => '+52 867 217 9046',
            'telefono2'  => '+52 867 719 4445',
            'whatsapp'   => '+52 867 217 9046',
            'wa_mensaje' => 'Hola Sector Creativo, quiero cotizar un proyecto.',
            'email'      => 'atencion1@sectorcreativo.com.mx',
            'calle'      => 'Venustiano Carranza 2800, Col. Guerrero',
            'cp'         => '88240',
            'ciudad'     => 'Nuevo Laredo',
            'estado'     => 'Tamaulipas',
            'estado_abrev' => 'Tamps.',
            'mapa_url'   => 'https://maps.app.goo.gl/WUXCeJtFhZ1yJd9FA',
        ],
        'redes' => [
            'facebook'  => 'https://www.facebook.com/screativomx/',
            'instagram' => 'https://www.instagram.com/screativomx/',
            'tiktok'    => 'https://www.tiktok.com/@screativomx',
        ],
        'stats' => [
            ['num' => 30, 'suffix' => '',  'label' => 'años creando'],
            ['num' => 33, 'suffix' => '+', 'label' => 'clientes corporativos'],
            ['num' => 10, 'suffix' => '',  'label' => 'servicios especializados'],
        ],
        'clientes' => [
            'AGUA LIV', 'FARMACIAS CALDERON', 'MEDLINE', 'RHEEM', 'CHROMALOX',
            'TELEFLEX', 'HOSPITAL SAN GERARDO', 'MARISCOS LA LAGUNA', 'CEVICHE 76',
            'ALITAS & TARROS', 'LA BOTANERIA', 'MUNICIPIO DE NUEVO LAREDO', 'CENTRO CULTURAL',
            'HR MOTORS', 'STI', 'QUIROGA', 'GRUPO 100', 'CLUB CAMPESTRE',
            'COLEGIO DE ARQUITECTOS DE NUEVO LAREDO', 'MONALAR', 'FEMA', 'MAG ENTERTAIMENT',
            'OISHI SUSHI', 'NOTARIA 196', 'TORTILLAS SANTOS', 'QUINTO SOL', 'TENL',
            'TRACTOMAC', 'PROSANO', 'PANADERIA LA NACIONAL', 'AAANLD',
            'INSTITUTO ANGLO ESPAÑOL', 'DERECHOS HUMANOS',
        ],
        'proyectos' => $lista,
        'actualizado' => null,
    ];
}

/** Lee un archivo de datos protegido; devuelve null si no existe o está dañado. */
function sc_leer($nombre)
{
    $ruta = SC_DATA_DIR . '/' . $nombre . '.php';
    if (!is_file($ruta)) {
        return null;
    }
    $raw = file_get_contents($ruta);
    if ($raw === false) {
        return null;
    }
    $pos = strpos($raw, "\n");
    $json = $pos === false ? '' : substr($raw, $pos + 1);
    $data = json_decode($json, true);
    return is_array($data) ? $data : null;
}

/** Escritura atómica (archivo temporal + rename) con bloqueo. */
function sc_escribir($nombre, array $data)
{
    if (!is_dir(SC_DATA_DIR) && !@mkdir(SC_DATA_DIR, 0755, true)) {
        return false;
    }
    $ruta = SC_DATA_DIR . '/' . $nombre . '.php';
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        return false;
    }
    $tmp = $ruta . '.' . bin2hex(random_bytes(4)) . '.tmp';
    if (file_put_contents($tmp, SC_GUARD . $json, LOCK_EX) === false) {
        return false;
    }
    if (!@rename($tmp, $ruta)) {
        // Windows no reemplaza con rename si el destino existe.
        @unlink($ruta);
        if (!@rename($tmp, $ruta)) {
            @unlink($tmp);
            return false;
        }
    }
    return true;
}

/** Contenido vigente: lo guardado encima de los valores de fábrica. */
function sc_load()
{
    static $cache = null;
    if ($cache !== null) {
        return $cache;
    }
    $base = sc_defaults();
    $guardado = sc_leer('sitio');
    if ($guardado) {
        foreach (['general', 'contacto', 'redes'] as $grupo) {
            if (isset($guardado[$grupo]) && is_array($guardado[$grupo])) {
                $base[$grupo] = array_merge($base[$grupo], $guardado[$grupo]);
            }
        }
        foreach (['stats', 'clientes', 'proyectos'] as $lista) {
            if (isset($guardado[$lista]) && is_array($guardado[$lista])) {
                $base[$lista] = array_values($guardado[$lista]);
            }
        }
        $base['actualizado'] = isset($guardado['actualizado']) ? $guardado['actualizado'] : null;
    }
    $cache = $base;
    return $cache;
}

/** Guarda el sitio dejando un respaldo del estado anterior (últimos 20). */
function sc_save(array $data)
{
    $previo = SC_DATA_DIR . '/sitio.php';
    if (is_file($previo)) {
        $dir = SC_DATA_DIR . '/respaldos';
        if (is_dir($dir) || @mkdir($dir, 0755, true)) {
            @copy($previo, $dir . '/sitio-' . date('Ymd-His') . '-' . bin2hex(random_bytes(2)) . '.php');
            $viejos = glob($dir . '/sitio-*.php') ?: [];
            sort($viejos);
            while (count($viejos) > 20) {
                @unlink(array_shift($viejos));
            }
        }
    }
    $data['actualizado'] = date('c');
    return sc_escribir('sitio', $data);
}

/* ---------- Helpers de presentación ---------- */
function sc_e($s)
{
    return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
}

/** Solo dígitos y + inicial, para tel: y wa.me */
function sc_digitos($tel)
{
    return preg_replace('/\D+/', '', (string)$tel);
}

function sc_tel_href($tel)
{
    return 'tel:+' . sc_digitos($tel);
}

function sc_wa_url($tel, $mensaje = '')
{
    $url = 'https://wa.me/' . sc_digitos($tel);
    return $mensaje !== '' ? $url . '?text=' . rawurlencode($mensaje) : $url;
}

/** Acepta solo URLs http(s); cualquier otra cosa se descarta. */
function sc_url_segura($url)
{
    $url = trim((string)$url);
    return preg_match('#^https?://[^\s<>"]+$#i', $url) ? $url : '';
}

function sc_proyectos_visibles(array $sitio)
{
    return array_values(array_filter($sitio['proyectos'], function ($p) {
        return !empty($p['visible']);
    }));
}
