# Free Karate Class — Landing Page

Static landing page for a paid-ad free intro karate class. No build step —
open `index.html` in a browser and it runs.

**Stack:** HTML + HTMX + vanilla JS + CSS. Deploy target: Vercel (static).

## File structure

```
/
├── index.html          all markup
├── css/styles.css      :root design tokens + all styles
├── js/main.js          form success handler, pixel event, sticky bar, FAQ toggles
├── assets/             hero.jpg, logo.svg, favicon.ico, proof/
└── README.md           this file
```

## Build phases

- [x] **Phase 1** — Scaffold + design tokens (fonts + HTMX + pixel base wired)
- [x] **Phase 2** — Hero + form markup
- [x] **Phase 3** — Down-page sections
- [x] **Phase 4** — Form wiring (Formspree + HTMX + thank-you swap)
- [x] **Phase 5** — Tracking (Meta `Lead` event fires on submit success)
- [x] **Phase 6** — Polish (mobile sticky CTA, focus-visible states, smooth scroll
      + reduced-motion guard). Decision: **no hero image** — hero is text + form only.
      A **Lighthouse run** is still pending (do it once deployed, Phase 7).
- [~] **Phase 7** — Deployed to Vercel: https://free-karate-landing.vercel.app
      (repo: github.com/clara199737/free-karate-landing). Remaining: real-device
      submit test, Pixel Helper check, Lighthouse, and the placeholder swaps below.

## Placeholder register — MUST be replaced before launch

Search the codebase for `TODO` to find each one in place.

| Placeholder | Where | Replace with |
|-------------|-------|--------------|
| `PIXEL_ID` | `index.html` head pixel | Meta Pixel ID |
| `FORM_ID` | form `action` + `hx-post` (Phase 4) | Formspree form ID |
| `24 hours` | thank-you panel | confirm it matches school's real follow-up speed |
| `hundreds of first-timers` | hero bullet (Phase 2) | real instructor stat |
| `hero.jpg` | hero image (Phase 2) | real class photo |
| Testimonials / rating / family count | social proof (Phase 3) | real proof |
| School name / address / phone | header + footer | real details |
| Headline | hero (Phase 2) | the one matching the live ad |
| `favicon.ico` / title / meta description | head | real branding |

> The chosen headline MUST match the ad that drives the click. Launch blocker.
> Default headline is the **Confidence** variant.

## Where to paste IDs

- **Meta Pixel ID** → `index.html`, in the `fbq('init', 'PIXEL_ID')` line.
- **Formspree form ID** → `index.html`, in the form's `action` and `hx-post`
  attributes (both must match). Added in Phase 4.

## Design tokens

All colors and fonts live in `:root` at the top of `css/styles.css`. Change a
value once and it updates everywhere.

## Deploy (Vercel)

1. Push this folder to a git repo (or drag-and-drop the folder into Vercel).
2. Vercel auto-detects a static site — no build command needed.
3. Attach a custom domain (or use the Vercel subdomain for soft launch).
4. Redeploy any time by pushing changes — takes seconds.

## Pre-launch QA sweep

- No lorem / no `@yourhandle` / no remaining `TODO`s.
- Meta Pixel Helper shows exactly one `Lead` event on submit.
- Real lead submission lands in Formspree + email arrives.
- Test on a real phone; check load speed.
