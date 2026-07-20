# Free Elementary Karate Class — Landing Page (ages 6–11)

Static landing page for a paid-ad free intro karate class aimed at **elementary
parents (children ages 6–11)**. No build step — open `index.html` in a browser
and it runs.

This is a duplicate of the preschool page (`../karate-landing-preschool/`) with
elementary-specific copy, a 6–11 age dropdown, an in-page belt-ladder graphic, and
pixel `Lead` events tagged `content_category: elementary` for ad-set attribution.
**Do not change the preschool page or the 4–12 page** — they stay live at
`/free-class-preschool` and `/free-class`.

**Stack:** HTML + HTMX + vanilla JS + CSS. Deploy target: Vercel (static).
Intended URL: `/free-class-elementary`.

## File structure

```
/
├── index.html          all markup
├── css/styles.css      :root design tokens (locked, inherited) + all styles
├── js/main.js          form validation, Formspree success swap, pixel events
├── assets/             hero.webp, class.webp, instructor.webp, review-*.webp
└── README.md           this file
```

## What differs from the preschool page

- **Message arc** rebuilt for the elementary core question — "will this fix what
  I'm seeing?" (worry → hope): hero (focus/listening/confidence), the proven
  "you've said it five times" hook verbatim + four observed behaviors, the
  "you can't lecture a kid into focus — you can train it" reframe, a 45-minute
  4-step class timeline, an always-visible **belt ladder**, outcome-matched
  testimonials, instructor, the kid-veto risk reversal, 6 elementary FAQs.
- **Belt ladder:** a new in-page graphic (built with the design system, not an
  image) showing white → first stripe → yellow → orange → up, with typical
  timeframes. Always visible, no accordion (US-4). **Timeframes are placeholders.**
- **Form fields:** parent name, child first name, child age (**6–11**), phone,
  email, preferred class time (dropdown). Plus an "Ages 3–5? This class is built
  for them →" link routing to the preschool page (US-3, one-directional — we are
  intentionally leaving the preschool page untouched).
- **Pixel:** SAME Meta Pixel ID as the other pages; `Lead` event carries
  `content_category: elementary`, plus a `ScrollDepth50` custom event (PRD §11).
- **Formspree:** a **NEW** form ID so elementary leads are segmented at the source.
- **Imagery:** hero is a single 3:2 "stands taller" child shot (chin-up, focused —
  not action/sparring). Currently reusing the preschool placeholder images — swap
  for real/AI photos in the same visual world before scaling spend.

## Placeholder register — MUST be filled before launch

Search the codebase for `TODO` to find each one in place.

| Placeholder | Where | Replace with |
|-------------|-------|--------------|
| `PIXEL_ID` | `index.html` head pixel | Meta Pixel ID (same pixel as the other pages) |
| `FORM_ID` | form `action` + `hx-post` | **New** Formspree form ID (segments elementary leads) |
| Hero image | `.hero__photo` | 3:2 "stands taller" shot (8–9 y/o, chin up, focused), ≤ ~250KB |
| Belt ladder timeframes | belt-ladder section | The school's **real** belts/stripes + typical months — not a generic ladder |
| Instructor image + name/bio/credential | instructor section | Real |
| Testimonials (quotes, names, 1:1 photos) | social proof | **Real parents** — HARD GATE before any paid traffic (FTC/deception risk) |
| Class times | `class_time` dropdown | Real elementary schedule |
| FAQ answers (changes / cost / testing fees / siblings) | FAQ | The school's real specifics — belt-testing fees especially |
| Program name | `<title>` / copy | School's actual elementary program name |
| School name / address / map link / phone | footer | Real details |

> **Don't scale ad spend past the test budget until real testimonial photos and
> quotes are in** (PRD §9 HARD GATE + pre-mortem #2). Elementary is the volume
> segment but parents comparison-shop — evidence is what converts.

## Where to paste IDs

- **Meta Pixel ID** → `index.html`, in the `fbq('init', 'PIXEL_ID')` line.
- **Formspree form ID** → `index.html`, in the form's `action` and `hx-post`
  attributes (both must match).

## Design tokens

All colors and fonts live in `:root` at the top of `css/styles.css` — identical
to the preschool / 4–12 pages' locked system (ink/paper/purple/pink/teal +
Bricolage Grotesque / Manrope / Archivo). Change once, updates everywhere.

## Deploy (Vercel)

1. Push this folder to a git repo (or drag-and-drop into Vercel) as a **separate**
   project from the preschool and 4–12 pages.
2. Vercel auto-detects a static site — no build command needed.
3. Serve at `/free-class-elementary` (keep the other two pages on their URLs).
4. Redeploy by pushing changes.

## Pre-launch QA sweep

- No lorem / no remaining `TODO`s.
- LCP ≤ 2.5s and total page weight ≤ 1.2 MB on mid-tier Android / 4G (US-5).
- Meta Pixel Helper shows exactly one `Lead` event (with `content_category:
  elementary`) on submit, plus `PageView` and `ScrollDepth50`.
- Real lead submission lands in the **new** Formspree inbox + email arrives.
- "Ages 3–5?" link goes to the live preschool page
  (`https://karate-landing-preschool.vercel.app`).
- Belt ladder is fully visible without interaction on mobile and desktop (US-4).
- Test on a real phone; check load speed and the sticky CTA.
