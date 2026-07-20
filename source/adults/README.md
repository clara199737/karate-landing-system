# Free Adult Karate Class — Landing Page (adults 18+)

Static landing page for a free intro karate class aimed at **adults training for
themselves (18+)** — the first page in the funnel where the buyer and the user
are the same person. No build step — open `index.html` in a browser and it runs.

Serves two traffic temperatures on one page:
- **Cold** — Meta ads targeting adults 28–55.
- **Warm** — lobby-QR + parent-newsletter traffic (sideline parents), tagged
  `utm_source=lobby` / `utm_source=newsletter` and captured via UTM passthrough.

This is a separate page from, and does not touch, the preschool
(`../karate-landing-preschool/`), elementary (`../karate-landing-elementary/`),
teen (`../karate-landing-teens/`), or general 4–12 (`../karate-landing/`) pages.
It reuses the locked design system with adult-specific copy, a 3-field form,
a "You won't be the only beginner" first-class walkthrough, a sideline-parent
bridge, and pixel `Lead` / `ViewContent` events tagged `content_category: adult`.

**Stack:** HTML + HTMX + vanilla JS + CSS. Deploy target: Vercel (static).
Intended URL: `/adults`.

## The hard imagery rules (US-5)

1. **No subject under 18 appears anywhere on this page.** This is the top of the
   age range — a single teen or child image undercuts the "adults only" promise.
2. **No fitness-model physiques** in the hero or class imagery. The reader must
   see someone their age and their shape succeeding. Higgsfield's priors push
   toward 25-year-old athletic subjects — front-load demographic specificity in
   every prompt and audit before launch.

None of the sibling pages' photos can be reused; they all show minors.

## File structure

```
/
├── index.html          all markup
├── css/styles.css      :root design tokens (locked, inherited) + light adult temperature
├── js/main.js          form validation, UTM passthrough, Formspree success swap, pixel events
├── assets/             (adult imagery — currently empty; add before launch)
└── README.md           this file
```

## What differs from the sibling pages

- **Buyer = user.** Written in second person, present tense. No "your child"
  anywhere. Every section either builds desire or removes a self-disqualifier
  ("I'm too old", "I'm too out of shape", "I'll be the only white belt").
- **Art direction:** same `:root` tokens, but a **lighter, serious** temperature
  — a clean editorial hero (not the teen page's moody dark hero). Proof bar and
  risk-reversal stay ink-dark for gravitas.
- **New section — "You won't be the only beginner":** a numbered "your first
  class, minute by minute" walkthrough + a plain-numbers age spread. This is the
  persuasion payload of the page.
- **New section — sideline-parent bridge:** a short, low-on-page band speaking
  directly to the lobby parent watching their kid train.
- **Benefits:** four adult-outcome blocks with 1:1 thumbnails (not the teen
  split-panel).
- **Form fields:** name, phone, email — plus a hidden `segment=adult` field and
  hidden `utm_source/medium/campaign` fields. **No child fields, no age dropdown,
  no class-night dropdown.** No cross-route link (this is the top of the range).
- **UTM passthrough (new vs. siblings):** `js/main.js` copies `utm_*` from the
  query string into the hidden form fields so lobby/newsletter bookings are
  attributable without a separate page.
- **Pixel:** SAME Meta Pixel ID as the other pages; `ViewContent` on load and
  `Lead` on submit both carry `content_category: adult`, plus a `ScrollDepth50`
  custom event (§6.4 sits above the 50% mark, so it doubles as an
  "objection-killer read" signal).
- **Formspree:** a **NEW** form ID so adult leads are segmented at the source.

## Placeholder register — MUST be filled before launch

Search the codebase for `TODO` to find each one in place. Hard gates block
launch; soft gates block paid spend.

| Placeholder | Where | Gate | Replace with |
|-------------|-------|------|--------------|
| `PIXEL_ID` | `index.html` head pixel | launch | Meta Pixel ID (same pixel as the other pages) |
| `FORM_ID` | form `action` + `hx-post` | launch | **New** Formspree form ID (segments adult leads) |
| **Age spread** (youngest / oldest / median) | `.agespread` in §6.4 | **HARD** | Real numbers from the school's adult class — the section does NOT ship with brackets |
| **Adults-only schedule** | "Will I train with teenagers?" FAQ | **HARD** | The real schedule — if 16–17s share the mat, say so; never let a new student discover it in person |
| **Testimonial photos** (3) | testimonials | **HARD** | Real adult-student photos or NO photos — no AI testimonial photos live with paid spend |
| Proof-bar numbers | proof-bar section | soft | Real adults-training count, adults-only nights/week, Google rating |
| Oldest-black-belt age | proof-bar | soft | Verify or **CUT the line entirely** — never estimate an age |
| Instructor bio / photo / start-age | instructor section | soft | Real instructor (18+ subject); lead with a late start-age if true |
| Hero + section + benefit imagery | throughout | — | Higgsfield OK for launch (non-testimonial); replace with real class photos as available. 18+, ordinary builds. |
| Family-plan mention | sideline section | — | Confirm the family plan exists before the line stays; no pricing on page |
| Risk-reversal sign-off | reversal section | soft | School owner's real name |
| School name / address / map link / phone | footer | launch | Real details |

## Where to paste IDs

- **Meta Pixel ID** → `index.html`, in the `fbq('init', 'PIXEL_ID')` line.
- **Formspree form ID** → `index.html`, in the form's `action` and `hx-post`
  attributes (both must match).

## Design tokens

All colors and fonts live in `:root` at the top of `css/styles.css` — the same
locked system as the sibling pages (ink/paper/purple/pink/teal + Bricolage
Grotesque / Manrope / Archivo). Change once, updates everywhere.

## Deploy (Vercel)

1. Push this folder to a git repo (or drag-and-drop into Vercel) as a **separate**
   project from the sibling pages.
2. Vercel auto-detects a static site — no build command needed.
3. Serve at `/adults` (keep the other pages on their URLs).
4. Verify the pixel with Meta test events before launch.
5. **Lobby QR** can go live immediately (free channel, zero risk).
6. **Cold Meta campaign** goes live only after the hard gates clear. Kill-or-
   iterate review at $500 spend.

## Pre-launch QA sweep

- No lorem / no remaining `TODO`s. **All three hard gates cleared.**
- **No image of any subject under 18, and no fitness-model physiques** (US-5).
- "Adults 18+ / beginners welcome" framing visible without scrolling on mobile.
- Meta Pixel Helper shows `PageView` + `ViewContent` (both `content_category:
  adult`) on load, and exactly one `Lead` (with `content_category: adult`) on
  submit, plus `ScrollDepth50`.
- Load with `?utm_source=lobby&utm_medium=qr&utm_campaign=test` and confirm the
  hidden UTM fields land in the Formspree submission (US-3).
- Real lead submission lands in the **new** Formspree inbox + email arrives.
- The "Will I train with teenagers?" FAQ tells the truth about the real schedule.
- Confirmation copy sets the appointment tone (adults no-show free classes more
  than parents booking for kids — the school's follow-up call matters here).
- Lighthouse mobile performance ≥90, no layout shift on hero load.
- Test on a real phone; check load speed and the sticky CTA.
