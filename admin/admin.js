/* ============================================================
   SECTOR CREATIVO — Panel de administración (mejoras progresivas)
   Todo funciona sin JavaScript; esto solo agrega: vista previa
   de subida con arrastrar y soltar, confirmación al borrar,
   contadores de caracteres y aviso de cambios sin guardar.
   Design by RobCorLab
   ============================================================ */
(function () {
  'use strict';

  var MAX_BYTES = 15 * 1024 * 1024;
  var TIPOS = ['image/jpeg', 'image/png', 'image/webp'];

  /* ---------- Subida: vista previa + arrastrar y soltar ---------- */
  var input = document.getElementById('f-imagenes');
  var previas = document.getElementById('previas');
  var zona = input ? input.closest('.zona') : null;

  function pintarPrevias() {
    if (!previas) return;
    previas.textContent = '';
    Array.prototype.forEach.call(input.files, function (f) {
      var fig = document.createElement('figure');
      var ok = TIPOS.indexOf(f.type) !== -1 && f.size <= MAX_BYTES;
      if (!ok) fig.className = 'mal';
      var img = document.createElement('img');
      img.alt = '';
      if (TIPOS.indexOf(f.type) !== -1) {
        img.src = URL.createObjectURL(f);
        img.onload = function () { URL.revokeObjectURL(img.src); };
      }
      var cap = document.createElement('figcaption');
      cap.textContent = ok ? f.name : (f.size > MAX_BYTES ? 'Más de 15 MB' : 'Formato no válido');
      fig.appendChild(img);
      fig.appendChild(cap);
      previas.appendChild(fig);
    });
  }

  if (input && zona) {
    input.addEventListener('change', pintarPrevias);
    ['dragenter', 'dragover'].forEach(function (ev) {
      zona.addEventListener(ev, function () { zona.classList.add('sobre'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      zona.addEventListener(ev, function () { zona.classList.remove('sobre'); });
    });
    // El input cubre la zona, así que el drop nativo ya asigna los archivos;
    // solo refrescamos la vista previa.
    zona.addEventListener('drop', function () { setTimeout(pintarPrevias, 0); });
  }

  /* ---------- Estado "enviando" en formularios ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('form'), function (form) {
    form.addEventListener('submit', function (e) {
      var btn = e.submitter;
      if (btn && btn.dataset.confirmar && !window.confirm(btn.dataset.confirmar)) {
        e.preventDefault();
        return;
      }
      sucio = false;
      if (form.id === 'formSubida' && btn) {
        btn.classList.add('cargando');
        btn.textContent = 'Subiendo y optimizando…';
      }
    });
  });

  /* ---------- Contadores de caracteres (SEO) ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-contador]'), function (el) {
    var ideal = parseInt(el.dataset.contador, 10);
    var ayuda = el.parentNode.querySelector('small');
    if (!ayuda) return;
    var base = ayuda.textContent;
    function act() {
      var n = el.value.length;
      ayuda.textContent = base + ' Ahora: ' + n + '.';
      ayuda.classList.toggle('excede', n > ideal);
    }
    el.addEventListener('input', act);
    act();
  });

  /* ---------- Aviso de cambios sin guardar ---------- */
  var sucio = false;
  Array.prototype.forEach.call(document.querySelectorAll('form.panel, #formGaleria'), function (form) {
    var pie = form.querySelector('.pie-form');
    form.addEventListener('input', function () {
      sucio = true;
      if (pie) pie.classList.add('pendiente');
    });
    // Visible: reflejar el estado en la tarjeta al instante.
    form.addEventListener('change', function (e) {
      if (e.target.matches('.tarjeta input[type="checkbox"]')) {
        e.target.closest('.tarjeta').classList.toggle('oculta', !e.target.checked);
        sucio = true;
        if (pie) pie.classList.add('pendiente');
      }
    });
  });
  window.addEventListener('beforeunload', function (e) {
    if (!sucio) return;
    e.preventDefault();
    e.returnValue = '';
  });

  /* Los avisos de éxito se desvanecen solos; los errores se quedan. */
  Array.prototype.forEach.call(document.querySelectorAll('.contenido .aviso.ok'), function (el) {
    setTimeout(function () { el.remove(); }, 5000);
  });
})();
