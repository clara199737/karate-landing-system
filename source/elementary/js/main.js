/* =================================================================
   Free Elementary Karate Class — Landing Page (ages 6–11)
   Form wiring (validation + Formspree success swap) + pixel events.

   No-JS fallback: the <form action method> posts normally to Formspree,
   which shows its own confirmation. Everything below only runs when JS is on.
   ================================================================= */

(function () {
  const form = document.getElementById('lead-form');
  if (!form) return;

  // With JS on, suppress native validation bubbles and show friendly inline
  // errors instead. (Without JS, the HTML5 `required`/type rules still apply.)
  form.setAttribute('novalidate', '');

  function fieldOf(input) { return input.closest('.field'); }

  function clearError(input) {
    input.removeAttribute('aria-invalid');
    const existing = fieldOf(input).querySelector('.field__error');
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

  function validate() {
    let ok = true;
    const name = form.parent_name;
    const child = form.child_name;
    const age = form.child_age;
    const phone = form.phone;
    const email = form.email;
    const time = form.class_time;

    if (!name.value.trim()) { showError(name, 'Please enter your name.'); ok = false; }
    else clearError(name);

    if (!child.value.trim()) { showError(child, "Please enter your child's first name."); ok = false; }
    else clearError(child);

    if (!age.value) { showError(age, "Please pick your child's age."); ok = false; }
    else clearError(age);

    if (!phone.value.trim()) { showError(phone, 'We need a phone number to reach you.'); ok = false; }
    else clearError(phone);

    if (!EMAIL_RE.test(email.value.trim())) { showError(email, 'Enter a valid email address.'); ok = false; }
    else clearError(email);

    if (!time.value) { showError(time, 'Please pick a preferred class time.'); ok = false; }
    else clearError(time);

    return ok;
  }

  // Clear a field's error as soon as the parent fixes it.
  ['parent_name', 'child_name', 'child_age', 'phone', 'email', 'class_time'].forEach((n) => {
    form[n].addEventListener('input', () => clearError(form[n]));
    form[n].addEventListener('change', () => clearError(form[n]));
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
    if (!validate()) e.preventDefault();
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
      // Fire the Meta Lead conversion event, tagged for the elementary ad set.
      // (No-op until PIXEL_ID is set in index.html.)
      if (window.fbq) fbq('track', 'Lead', { content_category: 'elementary' });
    } else {
      status.textContent = "Something went wrong — please try again, or call us if it keeps happening.";
      status.hidden = false;
    }
  });

  // Hide the error the moment they start fixing things.
  form.addEventListener('input', () => { status.hidden = true; });

  // -----------------------------------------------------------------
  // Scroll-depth 50% — custom pixel event, fired once (PRD §11).
  // -----------------------------------------------------------------
  let scrollFired = false;
  function onScroll() {
    if (scrollFired) return;
    const scrolled = window.scrollY + window.innerHeight;
    const halfway = document.documentElement.scrollHeight * 0.5;
    if (scrolled >= halfway) {
      scrollFired = true;
      window.removeEventListener('scroll', onScroll);
      if (window.fbq) fbq('trackCustom', 'ScrollDepth50', { content_category: 'elementary' });
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
})();
