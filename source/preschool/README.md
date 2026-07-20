# Free Preschool Karate Class — Landing Page (ages 3–5)

Static landing page for a paid-ad free intro karate class aimed at **preschool
parents (children ages 3–5)**. No build step — open `index.html` in a browser
and it runs.

This is a duplicate of the 4–12 page (`../karate-landing/`) with preschool-specific
copy, a 3/4/5 age dropdown, a preferred-class-time field, and pixel `Lead` events
tagged `content_category: preschool` for ad-set attribution. **Do not change the
4–12 page** — it stays live at `/free-class`.

**Stack:** HTML + HTMX + vanilla JS + CSS. Deploy target: Vercel (static).
Intended URL: `/free-class-preschool`.

## File structure

```
/
├── index.html          all markup
├── css/styles.css      :root design tokens (locked, inherited) + all styles
├── js/main.js          form validation, Formspree success swap, pixel events
├── assets/             hero.jpg, instructor.jpg, testimonial-*.jpg (add before launch)
└── README.md           this file
```

## What differs from the 4–12 page

- **Message arc** rebuilt for the "too young?" objection (worry → hope): hero,
  three parent-voice worries, "readiness is the output" reframe, 30-minute class
  timeline, "I thought she was too young" testimonials, instructor, come-back-free
  risk reversal, 6 age-specific FAQs.
- **Form fields:** parent name, child first name, child age (**3/4/5 only**),
  phone, email, preferred class time (dropdown). Plus a "Child older than 5?
  Start here →" link routing to the 4–12 page (US-3).
- **Pixel:** SAME Meta Pixel ID as the parent page; `Lead` event carries
  `content_category: preschool`, plus a `ScrollDepth50` custom event (PRD §11).
- **Formspree:** a **NEW** form ID so preschool leads are segmented at the source.
- **Imagery:** hero is a single 4:5 child shot (only above-fold image). Currently
  dashed placeholders — swap for real/AI photos before scaling spend.

## Placeholder register — MUST be filled before launch

Search the codebase for `TODO` to find each one in place.

| Placeholder | Where | Replace with |
|-------------|-------|--------------|
| `PIXEL_ID` | `index.html` head pixel | Meta Pixel ID (same pixel as the 4–12 page) |
| `FORM_ID` | form `action` + `hx-post` | **New** Formspree form ID (segments preschool leads) |
| Route link `href` | below the form | Live 4–12 page URL (`/free-class`) |
| Hero image | `.hero__photo` placeholder | 4:5 child shot (3–4 y/o mid-laugh, oversized gi), compressed ≤ ~250KB |
| Instructor image + name/bio/credential | instructor section | Real |
| Testimonials (quotes, names, 1:1 photos) | social proof | **Real parents** — AI photos are a scaling blocker |
| Class times | `class_time` dropdown | Real preschool schedule |
| Potty-training policy | FAQ #5 | Ask the school — real preschool-parent question |
| Program name | `<title>` / copy | e.g. "Little Dragons" — school's actual program name |
| School name / address / map link / phone | footer | Real details |

> **Don't scale ad spend past the test budget until real testimonial photos are in.**
> Preschool parents are the most trust-sensitive segment (PRD pre-mortem #2).

## Where to paste IDs

- **Meta Pixel ID** → `index.html`, in the `fbq('init', 'PIXEL_ID')` line.
- **Formspree form ID** → `index.html`, in the form's `action` and `hx-post`
  attributes (both must match).

## Design tokens

All colors and fonts live in `:root` at the top of `css/styles.css` — identical
to the 4–12 page's locked system (ink/paper/purple/pink/teal + Bricolage
Grotesque / Manrope / Archivo). Change once, updates everywhere.

## Deploy (Vercel)

1. Push this folder to a git repo (or drag-and-drop into Vercel) as a **separate**
   project from the 4–12 page.
2. Vercel auto-detects a static site — no build command needed.
3. Serve at `/free-class-preschool` (keep `/free-class` for the 4–12 page).
4. Redeploy by pushing changes.

## Pre-launch QA sweep

- No lorem / no remaining `TODO`s.
- LCP ≤ 2.5s and total page weight ≤ 1.2 MB on mid-tier Android / 4G (US-4).
- Meta Pixel Helper shows exactly one `Lead` event (with `content_category:
  preschool`) on submit, plus `PageView` and `ScrollDepth50`.
- Real lead submission lands in the **new** Formspree inbox + email arrives.
- "Child older than 5?" link goes to the live 4–12 page.
- Test on a real phone; check load speed and the sticky CTA.
