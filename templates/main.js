/* =================================================================
   Shared landing-page runtime — all four segments.
   Per-segment config lives on window.LP_CONFIG (injected by the template):
     { pixel_content_category: string|null, utm_passthrough: boolean }
   Everything else — which fields to validate, which selects exist — is
   read directly from the DOM. Adding a new field in content JSON is
   automatically picked up here.

   No-JS fallback: the <form action method> posts normally to Formspree,
   which shows its own confirmation. Everything below only runs when JS is on.
   ================================================================= */

(function () {
  const cfg = window.LP_CONFIG || {};
  const form = document.getElementById('lead-form');
  if (!form) return;

  // UTM passthrough (adults) — copy utm_* from the query string into the
  // hidden form fields so lobby-QR / newsletter bookings are attributable
  // without a separate page. Runs before any submit.
  if (cfg.utm_passthrough) {
    const params = new URLSearchParams(window.location.search);
    ['utm_source', 'utm_medium', 'utm_campaign'].forEach((key) => {
      const field = form.elements[key];
      if (field) field.value = params.get(key) || '';
    });
  }

  // With JS on, suppress native validation bubbles and show friendly inline
  // errors instead. (Without JS, the HTML5 `required`/type rules still apply.)
  form.setAttribute('novalidate', '');

  function fieldOf(input) { return input.closest('.field'); }

  function clearError(input) {
    input.removeAttribute('aria-invalid');
    const wrap = fieldOf(input);
    if (!wrap) return;
    const existing = wrap.querySelector('.field__error');
    if (existing) existing.remove();
  }

  function showError(input, msg) {
    clearError(input);
    input.setAttribute('aria-invalid', 'true');
    const err = document.createElement('p');
    err.className = 'field__error';
    err.textContent = msg;
    fieldOf(input).appendChild(err);
  }

  const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

  // Every visible required <input>/<select> inside a .field wrapper. Skips the
  // honeypot (which sits outside .field) and any hidden fields.
  function visibleFields() {
    return Array.from(form.querySelectorAll('.field input, .field select'));
  }

  // Human-friendly label for error messages — falls back to the field's name
  // if the .field__label span is missing.
  function labelFor(el) {
    const wrap = fieldOf(el);
    const span = wrap && wrap.querySelector('.field__label');
    return (span ? span.textContent : el.name || 'this field').trim();
  }

  function validateField(el) {
    if (el.tagName === 'SELECT') {
      if (!el.value) { showError(el, 'Please pick ' + labelFor(el).toLowerCase() + '.'); return false; }
    } else if (el.type === 'email') {
      if (!EMAIL_RE.test(el.value.trim())) { showError(el, 'Enter a valid email address.'); return false; }
    } else {
      if (!el.value.trim()) { showError(el, 'Please enter ' + labelFor(el).toLowerCase() + '.'); return false; }
    }
    clearError(el);
    return true;
  }

  function validateAll() {
    return visibleFields().reduce((ok, el) => validateField(el) && ok, true);
  }

  // Clear a field's error as soon as the visitor fixes it.
  visibleFields().forEach((el) => {
    el.addEventListener('input', () => clearError(el));
    el.addEventListener('change', () => clearError(el));
  });

  // Formspree's CORS policy rejects HTMX's custom HX-* headers. Sending them
  // forces a CORS preflight that fails, so the POST silently dies (status 0).
  // Stripping them keeps the request CORS-simple while preserving Accept +
  // Content-Type, so Formspree accepts it.
  form.addEventListener('htmx:configRequest', (e) => {
    ['HX-Request', 'HX-Current-URL', 'HX-Target', 'HX-Trigger', 'HX-Trigger-Name', 'HX-Boosted']
      .forEach((h) => delete e.detail.headers[h]);
  });

  // Block the HTMX request if the form is invalid, and surface the messages.
  form.addEventListener('htmx:beforeRequest', (e) => {
    if (!validateAll()) e.preventDefault();
  });

  const status = form.querySelector('.form-status');
  const sticky = document.getElementById('sticky-cta');
  const formWrap = document.getElementById('book');

  // Mobile sticky CTA: show it only once the hero form has scrolled off screen,
  // hide it whenever the form is visible. (CSS hides the bar entirely on desktop.)
  if (sticky && formWrap && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => sticky.classList.toggle('is-visible', !en.isIntersecting));
    }, { rootMargin: '0px 0px -35% 0px' });
    io.observe(formWrap);
  }

  // On submit, swap to the thank-you panel — or surface an error if it failed.
  document.body.addEventListener('htmx:afterRequest', (e) => {
    if (e.detail.elt.id !== 'lead-form') return;
    if (e.detail.successful) {
      form.hidden = true;
      document.getElementById('thanks').hidden = false;
      if (sticky) sticky.classList.remove('is-visible'); // no need to nag after success
      // Fire the Meta Lead conversion event, tagged for this segment's ad set.
      // (No-op until PIXEL_ID is set in index.html.)
      if (window.fbq) {
        if (cfg.pixel_content_category) fbq('track', 'Lead', { content_category: cfg.pixel_content_category });
        else fbq('track', 'Lead');
      }
    } else {
      status.textContent = "Something went wrong — please try again, or call us if it keeps happening.";
      status.hidden = false;
    }
  });

  // Hide the error the moment they start fixing things.
  form.addEventListener('input', () => { status.hidden = true; });

  // -----------------------------------------------------------------
  // Scroll-depth 50% — custom pixel event, fired once. Skipped when no
  // content_category is configured (matches general 4–12's no-op behavior).
  // -----------------------------------------------------------------
  if (cfg.pixel_content_category) {
    let scrollFired = false;
    function onScroll() {
      if (scrollFired) return;
      const scrolled = window.scrollY + window.innerHeight;
      const halfway = document.documentElement.scrollHeight * 0.5;
      if (scrolled >= halfway) {
        scrollFired = true;
        window.removeEventListener('scroll', onScroll);
        if (window.fbq) fbq('trackCustom', 'ScrollDepth50', { content_category: cfg.pixel_content_category });
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  }
})();
