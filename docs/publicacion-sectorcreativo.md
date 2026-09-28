# Mejoras y publicación

Dominio principal configurado: https://sectorcreativo.com.mx/

La copia de publicación se prepara con `build-public.ps1`. Incluye únicamente los archivos públicos, miniaturas y versiones ampliadas WebP. Excluye certificados, registros, originales PNG, herramientas de pruebas y documentación interna.

## Verificación realizada

- PHP 8.4: sintaxis correcta.
- Vistas de 360, 768 y 1440 px sin desbordamiento horizontal.
- Menú móvil, filtros, apertura por teclado, flechas y retorno de foco del visor.
- Cotización desde cada servicio y validación del formulario.
- Envío local sin correo externo, token CSRF, espera de 60 segundos por sesión y redirección después del envío.
- Navegación, fotos y estadísticas disponibles sin JavaScript.
- Versiones ampliadas: 1,314,900 bytes en total, frente a 40,583,092 bytes de los originales PNG.

## Comprobaciones en el hosting

- Usar PHP con la extensión mbstring y sesiones disponibles.
- Comprobar que el correo remitente no-reply@sectorcreativo.com.mx esté autorizado y que los mensajes lleguen a atencion1@sectorcreativo.com.mx. El transporte sigue siendo mail(); una aceptación del servidor no garantiza recepción.
- El límite de envíos implementado es por sesión; no reemplaza un límite global del servidor.
- .htaccess contiene protección para Apache. Verificar su compatibilidad con el hosting; en Nginx se necesitan reglas equivalentes.
- Configurar HTTPS y redirección de www al dominio sin www en el hosting. Las referencias canónicas ya usan el dominio sin www; no se modificó DNS.
- La página de privacidad describe el formulario implementado. Confirmar que representa también las prácticas internas reales de la empresa.

No se ha publicado ni cambiado la configuración del servidor remoto.
