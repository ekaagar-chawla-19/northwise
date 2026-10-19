/* =============================================================
   NORTHWISE, shared JS: nav, theme switch, nav lens, scroll reveal,
   FAQ accordion, signup forms, footer year
   ============================================================= */
(function () {
  'use strict';

  /* ---- Mobile nav toggle ---- */
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  toggle.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  // Close menu when a link is tapped (mobile)
  links.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---- Navbar shadow on scroll ---- */
  var nav = document.getElementById('nav');
  var onScroll = function () {
    nav.classList.toggle('scrolled', window.scrollY > 10);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---- Dark / light theme switch (elastic slider) ---- */
  (function () {
    var root = document.documentElement;
    var sw = document.getElementById('themeSwitch');
    if (!sw) return;
    function sync() {
      sw.setAttribute('aria-checked', root.getAttribute('data-theme') === 'dark' ? 'true' : 'false');
    }
    sync();
    sw.addEventListener('click', function () {
      var toDark = root.getAttribute('data-theme') !== 'dark';
      root.classList.add('theme-animating');            // enable smooth cross-fade
      if (toDark) root.setAttribute('data-theme', 'dark');
      else root.removeAttribute('data-theme');
      try { localStorage.setItem('nw-theme', toDark ? 'dark' : 'light'); } catch (e) {}
      sync();
      clearTimeout(sw._t);
      sw._t = setTimeout(function () { root.classList.remove('theme-animating'); }, 600);
    });
  })();

  /* ---- FluidGlass hover lens over the nav titles ---- */
  (function () {
    var navLinks = document.getElementById('navLinks');
    if (!navLinks || !window.matchMedia('(min-width: 821px)').matches) return;
    var lens = document.createElement('span');
    lens.className = 'nav-lens';
    navLinks.insertBefore(lens, navLinks.firstChild);
    var items = Array.prototype.slice.call(navLinks.querySelectorAll('a.navlink'));
    var PAD = 12;
    function moveTo(el) {
      lens.style.width = (el.offsetWidth + PAD) + 'px';
      lens.style.left = (el.offsetLeft - PAD / 2) + 'px';
      lens.classList.add('show');
    }
    items.forEach(function (a) {
      a.addEventListener('pointerenter', function () { moveTo(a); });
    });
    navLinks.addEventListener('pointerleave', function () { lens.classList.remove('show'); });
  })();

  /* ---- Scroll reveal ---- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var reveals = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var revObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { revObserver.observe(el); });
  }

  /* ---- FAQ accordion: single-open (uses native <details>) ---- */
  var faqItems = Array.prototype.slice.call(document.querySelectorAll('.faq-item'));
  faqItems.forEach(function (item) {
    item.addEventListener('toggle', function () {
      if (item.open) {
        faqItems.forEach(function (other) {
          if (other !== item) other.open = false;
        });
      }
    });
  });

  /* ---- Signup forms ----
     If the <form> has a data-endpoint URL (e.g. a Formspree form URL), answers
     are POSTed there and the visitor stays on the page.
     If data-endpoint is empty, it falls back to mailto: the answers are
     serialized as "Label: value" lines and opened in the visitor's email app.
     Long answers can exceed what some email apps accept in a mailto link,
     so the endpoint is the better option. */
  var RECIPIENT = 'ekaagar.chawla@gmail.com';

  function labelFor(el) {
    if (el.dataset.label) return el.dataset.label;
    var label = el.labels && el.labels[0];
    if (!label) return el.name;
    var clone = label.cloneNode(true);
    clone.querySelectorAll('.opt').forEach(function (n) { n.remove(); });
    return clone.textContent.replace(/\s+/g, ' ').trim();
  }

  function sendToEndpoint(form, subject, status) {
    var btn = form.querySelector('[type="submit"]');
    var data = new FormData();
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.type === 'submit') return;
      data.append(labelFor(el), el.type === 'checkbox' ? (el.checked ? 'Yes' : 'No') : (el.value || '').trim());
    });
    data.append('_subject', subject);
    var reply = form.querySelector('input[type="email"]');
    if (reply) data.append('_replyto', reply.value.trim());

    btn.disabled = true;
    status.textContent = 'Sending...';
    fetch(form.dataset.endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error(res.status);
        form.reset();
        status.textContent = 'Thank you. Your answers were sent, and we will email you soon.';
      })
      .catch(function () {
        status.textContent = 'Something went wrong and your answers were not sent. ' +
          'Please try again, or email us at ' + RECIPIENT + '.';
      })
      .then(function () { btn.disabled = false; });
  }

  document.querySelectorAll('form[data-mailto-subject]').forEach(function (form) {
    var status = form.querySelector('.form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;

      var who = (form.elements[form.dataset.mailtoNameField] || {}).value || '';
      var subject = form.dataset.mailtoSubject + (who ? ': ' + who.trim() : '');
      if (form.dataset.endpoint) { sendToEndpoint(form, subject, status); return; }

      var lines = [];
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name || el.type === 'submit') return;
        var value = el.type === 'checkbox' ? (el.checked ? 'Yes' : 'No') : (el.value || '').trim();
        lines.push(labelFor(el) + ':\n' + (value || '(left blank)') + '\n');
      });

      window.location.href = 'mailto:' + RECIPIENT +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(lines.join('\n'));

      if (status) {
        status.textContent = 'Your email app should open with your answers filled in. ' +
          'Press send to submit. If nothing opened, email us at ' + RECIPIENT + '.';
      }
    });
  });

  /* ---- Footer year ---- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
