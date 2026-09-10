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

  /* ================= BACK TO TOP (botón visible >600px) ================= */
  var backTop = qs('#backTop');
  if (backTop) {
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  }

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

  /* ================= FORMULARIO (validación) ================= */
  var contactForm = qs('#contactForm');
  if (contactForm) {
    var fields = {
      nombre:   { el: qs('#f-nombre'),   err: qs('#err-nombre') },
      email:    { el: qs('#f-email'),    err: qs('#err-email') },
      telefono: { el: qs('#f-telefono'), err: qs('#err-telefono') },
      mensaje:  { el: qs('#f-mensaje'),  err: qs('#err-mensaje') }
    };
    var messages = {
      nombre:   'Escribe tu nombre (mínimo 2 caracteres).',
      email:    'Escribe un correo válido (ej. nombre@dominio.com).',
      telefono: 'Teléfono no válido (solo dígitos, espacios, +, -, paréntesis).',
      mensaje:  'Escribe un mensaje de al menos 5 caracteres.'
    };

    function setError(name, show) {
      var f = fields[name];
      if (!f || !f.el) return;
      var wrap = f.el.closest('.form-field');
      if (show) {
        wrap && wrap.classList.add('has-error');
        if (f.err) {
          f.err.textContent = messages[name];
          f.err.hidden = false;
        }
      } else {
        wrap && wrap.classList.remove('has-error');
        if (f.err) {
          f.err.textContent = '';
          f.err.hidden = true;
        }
      }
    }

    function validateField(name) {
      var f = fields[name];
      if (!f || !f.el) return true;
      var val = f.el.value.trim();
      var ok = true;
      if (name === 'nombre') ok = val.length >= 2;
      if (name === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val);
      if (name === 'telefono') ok = val === '' || /^[\d\s\-\+\(\)]{7,20}$/.test(val);
      if (name === 'mensaje') ok = val.length >= 5;
      setError(name, !ok);
      return ok;
    }

    Object.keys(fields).forEach(function (name) {
      var f = fields[name];
      if (!f.el) return;
      f.el.addEventListener('input', function () { validateField(name); });
      f.el.addEventListener('blur', function () { validateField(name); });
    });

    contactForm.addEventListener('submit', function (e) {
      var allOk = Object.keys(fields).every(validateField);
      if (!allOk) e.preventDefault();
    });
  }

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