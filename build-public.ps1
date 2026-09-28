$ErrorActionPreference = 'Stop'
$destination = Join-Path $PSScriptRoot 'deploy/sectorcreativo-public'
if (Test-Path -LiteralPath $destination) {
    throw 'La carpeta de publicación ya existe. Revísala antes de generar otra versión.'
}
New-Item -ItemType Directory -Path $destination | Out-Null
foreach ($file in @('index.php', 'privacidad.html', 'robots.txt', 'sitemap.xml', '.htaccess', 'favicon.ico', 'logo_sc_3.svg', 'symbol_sc_2.svg', 'og-image.png')) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot $file) -Destination $destination
}
foreach ($folder in @('css', 'js', 'img/thumbs', 'img/large', 'sc-card')) {
    $target = Join-Path $destination $folder
    New-Item -ItemType Directory -Path $target -Force | Out-Null
    Copy-Item -Path (Join-Path $PSScriptRoot "$folder/*") -Destination $target -Recurse
}
Write-Output "Publicación preparada en $destination"
