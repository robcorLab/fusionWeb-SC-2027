/* ============================================================
   SECTOR CREATIVO — main.js
   Preloader · scroll progress · header scrolled · menú móvil +
   scrollspy · reveal · (bloques añadidos por tarea: hero parallax,
   iconos draw, proceso, contadores, filtros, lightbox touch,
   formulario reforzado, back-to-top)
   Design by RobCorLab
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

  /* ================= FORMULARIO REFORZADO ================= */
  var form = qs('#contactForm');
  var btnSubmit = qs('#btnSubmit');
  var btnLabel = btnSubmit ? qs('.btn-label', btnSubmit) : null;

  if (form) {
    var inputs = {
      nombre: qs('#f-nombre'),
      email: qs('#f-email'),
      telefono: qs('#f-telefono'),
      mensaje: qs('#f-mensaje')
    };

    var msgs = {
      nombre: 'Escribe tu nombre (mínimo 2 caracteres).',
      email: 'Escribe un correo válido (ej. nombre@dominio.com).',
      telefono: 'Solo dígitos, espacios, +, - o paréntesis (7–20).',
      mensaje: 'Cuéntanos algo más (mínimo 5 caracteres).'
    };

    function setError(field, hasError) {
      var el = inputs[field];
      var err = qs('#err-' + field);
      if (!el) return;
      var box = el.closest('.form-field');
      if (box) box.classList.toggle('has-error', hasError);
      if (err) {
        err.hidden = !hasError;
        err.textContent = hasError ? msgs[field] : '';
      }
    }

    function validate(field) {
      var el = inputs[field];
      if (!el) return true;
      var val = el.value.trim();
      var ok = true;
      if (field === 'nombre') ok = val.length >= 2;
      if (field === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val);
      if (field === 'telefono') ok = val === '' || /^[\d\s\-\+\(\)]{7,20}$/.test(val);
      if (field === 'mensaje') ok = val.length >= 5;
      setError(field, !ok);
      return ok;
    }

    Object.keys(inputs).forEach(function (key) {
      var el = inputs[key];
      if (!el) return;
      el.addEventListener('input', function () { validate(key); });
      el.addEventListener('blur', function () { validate(key); });
    });

    form.addEventListener('submit', function (e) {
      var hp = form.querySelector('input[name="website"]');
      if (hp && hp.value.trim() !== '') { e.preventDefault(); window.location.reload(); return; }

      var fields = Object.keys(inputs);
      var firstBad = null;
      fields.forEach(function (k) {
        if (!validate(k) && !firstBad) firstBad = inputs[k];
      });
      if (firstBad) {
        e.preventDefault();
        firstBad.focus();
        return;
      }
      // estado de envío
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.classList.add('loading');
        if (btnLabel) btnLabel.textContent = 'Enviando…';
      }
      // no preventDefault: el POST recarga la página y PHP responde
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
        var y = window.scrollY;
        heroContent.style.transform = 'translateY(' + (y * 0.18) + 'px) scale(' + (1 + y * 0.00035) + ')';
        heroContent.style.filter = 'blur(' + Math.min(8, y * 0.006) + 'px)';
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

  /* ================= FILTROS DE PORTAFOLIO ================= */
  var chips = qsa('.chip[data-filter]');
  var galItems = qsa('.galeria-bento .item[data-cat]');
  (function initFilter() {
    if (!chips.length || !galItems.length) return;
    function applyFilter(filter) {
      galItems.forEach(function (item) {
        var show = filter === 'todos' || item.getAttribute('data-cat') === filter;
        item.style.display = show ? '' : 'none';
      });
    }
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        applyFilter(chip.getAttribute('data-filter'));
      });
    });
  })();

  /* ================= LIGHTBOX (con data-full + touch) ================= */
  var lightbox = qs('#lightbox');
  var lbImg = qs('#lbImg');
  var lbCaption = qs('#lbCaption');
  var lbCounter = qs('#lbCounter');
  var lbClose = qs('#lbClose');
  var lbPrev = qs('#lbPrev');
  var lbNext = qs('#lbNext');
  var lbItems = qsa('.galeria-grid .item img');
  var current = 0;
  var lastFocus = null;
  var touchX = null;

  function showImage(index) {
    if (!lbItems.length) return;
    current = (index + lbItems.length) % lbItems.length;
    var img = lbItems[current];
    lbImg.src = img.getAttribute('data-full') || img.src;
    lbImg.alt = img.alt || '';
    lbCaption.textContent = (img.alt || '').replace(' — Sector Creativo', '');
    lbCounter.textContent = (current + 1) + ' / ' + lbItems.length;
  }

  function openLightbox(index) {
    if (!lightbox) return;
    lastFocus = doc.activeElement;
    showImage(index);
    lightbox.hidden = false;
    requestAnimationFrame(function () { lightbox.classList.add('open'); });
    doc.body.style.overflow = 'hidden';
    if (lbClose) lbClose.focus();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    doc.body.style.overflow = '';
    setTimeout(function () { lightbox.hidden = true; }, 350);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function changeImage(dir) {
    if (lbItems.length) showImage(current + dir);
  }

  if (lightbox) {
    lbItems.forEach(function (img, i) {
      img.addEventListener('click', function () { openLightbox(i); });
    });

    if (lbClose) lbClose.addEventListener('click', closeLightbox);
    if (lbPrev) lbPrev.addEventListener('click', function () { changeImage(-1); });
    if (lbNext) lbNext.addEventListener('click', function () { changeImage(1); });

    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    // Touch swipe en móvil
    var lbFigure = qs('.lightbox-figure');
    if (isTouch && lbFigure) {
      lbFigure.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
      lbFigure.addEventListener('touchend', function (e) {
        if (touchX === null) return;
        var dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 50) changeImage(dx < 0 ? 1 : -1);
        touchX = null;
      }, { passive: true });
    }

    // Focus trap
    doc.addEventListener('keydown', function (e) {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') { closeLightbox(); return; }
      if (e.key === 'ArrowLeft') { changeImage(-1); return; }
      if (e.key === 'ArrowRight') { changeImage(1); return; }
      if (e.key === 'Tab') {
        var focusables = qsa('button', lightbox).filter(function (b) { return !b.hidden; });
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
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