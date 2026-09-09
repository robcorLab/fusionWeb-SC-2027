/* ============================================================
   SECTOR CREATIVO — main.js
   Header scrolled · menú móvil · scroll reveal · tilt 3D ·
   lightbox · validación de formulario
   ============================================================ */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header con scroll ---------- */
  var header = document.getElementById('header');
  function onScrollHeader() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---------- Logo → inicio ---------- */
  var logo = document.getElementById('logoHome');
  if (logo) {
    logo.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Menú hamburguesa ---------- */
  var hamburger = document.getElementById('hamburger');
  var navMenu = document.getElementById('navMenu');

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

    // Cerrar al hacer clic en un enlace (en móvil) y scroll suave
    navMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          var target = document.querySelector(href);
          if (target) {
            var y = target.getBoundingClientRect().top + window.scrollY - (header ? header.offsetHeight : 0) - 6;
            window.scrollTo({ top: y, behavior: reducedMotion ? 'auto' : 'smooth' });
          }
          closeMenu();
        }
      });
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
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

  /* ---------- Tilt 3D en tarjetas ---------- */
  var tiltEls = document.querySelectorAll('.tilt');
  if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) {
    tiltEls.forEach(function (card) {
      var icon = card.querySelector('.service-icon');

      function onMove(e) {
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;

        var rx = (0.5 - py) * 10;   // rotación X
        var ry = (px - 0.5) * 12;   // rotación Y

        card.style.transform =
          'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');

        if (icon) {
          icon.style.transform =
            'translateZ(30px) rotateX(' + (-rx * 0.6).toFixed(2) + 'deg) rotateY(' + (ry * 0.6).toFixed(2) + 'deg)';
        }
      }

      function onLeave() {
        card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
        if (icon) icon.style.transform = 'translateZ(0)';
      }

      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
    });
  }

  /* ---------- Lightbox ---------- */
  var lightbox = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  var lbCaption = document.getElementById('lbCaption');
  var lbCounter = document.getElementById('lbCounter');
  var lbClose = document.getElementById('lbClose');
  var lbPrev = document.getElementById('lbPrev');
  var lbNext = document.getElementById('lbNext');
  var items = Array.prototype.slice.call(document.querySelectorAll('.galeria-grid .item img'));
  var current = 0;

  function showImage(index) {
    if (!items.length) return;
    current = (index + items.length) % items.length;
    var img = items[current];
    lbImg.src = img.src;
    lbImg.alt = img.alt || '';
    lbCaption.textContent = img.alt || '';
    lbCounter.textContent = (current + 1) + ' / ' + items.length;
  }

  function openLightbox(index) {
    if (!lightbox) return;
    showImage(index);
    lightbox.hidden = false;
    requestAnimationFrame(function () { lightbox.classList.add('open'); });
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(function () { lightbox.hidden = true; }, 350);
  }

  function changeImage(dir) {
    if (items.length) showImage(current + dir);
  }

  if (lightbox) {
    items.forEach(function (img, i) {
      img.addEventListener('click', function () { openLightbox(i); });
    });

    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbPrev) lbPrev.addEventListener('click', function () { changeImage(-1); });
    if (lbNext) lbNext.addEventListener('click', function () { changeImage(1); });

    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', function (e) {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') changeImage(-1);
      if (e.key === 'ArrowRight') changeImage(1);
    });
  }

  /* ---------- Validación del formulario ---------- */
  var form = document.getElementById('contactForm');
  if (form) {
    var inputs = {
      nombre: document.getElementById('f-nombre'),
      email: document.getElementById('f-email'),
      telefono: document.getElementById('f-telefono'),
      mensaje: document.getElementById('f-mensaje')
    };

    function validate(field) {
      var el = inputs[field];
      if (!el) return true;
      var val = el.value.trim();
      var ok = true;

      if (field === 'nombre') ok = val.length >= 2;
      if (field === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val);
      if (field === 'telefono') ok = val === '' || /^[\d\s\-\+\(\)]{7,20}$/.test(val);
      if (field === 'mensaje') ok = val.length >= 5;

      el.classList.toggle('invalid', !ok);
      return ok;
    }

    Object.keys(inputs).forEach(function (key) {
      var el = inputs[key];
      if (!el) return;
      el.addEventListener('input', function () { validate(key); });
      el.addEventListener('blur', function () { validate(key); });
    });

    form.addEventListener('submit', function (e) {
      var allOk = Object.keys(inputs).every(validate);
      // Honeypot: si el bot llega lleno, fingimos éxito (no enviar)
      var hp = form.querySelector('input[name="website"]');
      if (hp && hp.value.trim() !== '') {
        e.preventDefault();
        window.location.reload();
        return;
      }
      if (!allOk) e.preventDefault();
    });
  }
})();