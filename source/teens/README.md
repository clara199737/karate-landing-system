# Free Teen Karate Class — Landing Page (ages 12–17)

Static landing page for a paid-ad free intro karate class aimed at **parents of
teens (ages 12–17)**. No build step — open `index.html` in a browser and it runs.

This is a separate page from, and does not touch, the preschool
(`../karate-landing-preschool/`), elementary (`../karate-landing-elementary/`),
or general 4–12 (`../karate-landing/`) pages. It duplicates the locked design
system with teen-specific copy, a 12–17 age dropdown, a "This isn't little-kid
karate" section, a parent/teen split-panel, and pixel `Lead` events tagged
`content_category: teens` for ad-set attribution.

**Stack:** HTML + HTMX + vanilla JS + CSS. Deploy target: Vercel (static).
Intended URL: `/teens`.

## The one hard rule

**No imagery of any child under 12 appears anywhere on this page.** One picture
of a little kid ends the teen's willingness to walk in. This is enforced in the
acceptance criteria — every image slot (hero, class wide shot, testimonials,
benefit thumbs) must show a subject visibly 12+. None of the sibling pages'
photos can be reused; they all show younger kids.

## File structure

```
/
├── index.html          all markup
├── css/styles.css      :root design tokens (locked, inherited) + darker teen override
├── js/main.js          form validation, Formspree success swap, pixel events
├── assets/             (teen imagery — currently empty; slots use CSS placeholders)
└── README.md           this file
```

## What differs from the sibling pages

- **Two audiences, one page.** Every section is written for the parent but
  art-directed to survive the teen's over-the-shoulder read. The headline sells
  the parent; the imagery and proof points pass the teen's inspection.
- **Hero headline:** "One free class. No little kids. Real training." — the
  teen-proof variant that kills the "that's for little kids" veto above the fold.
- **New section — "This isn't little-kid karate":** a crossed-out → real-thing
  swap list, written second-person *to the teen*. The forwardable
  "show this to your teen" moment.
- **New section — parent/teen split panel:** "what you see" (parent column) vs.
  "what he gets" (teen column).
- **Art direction:** same `:root` tokens, but a **darker, moodier** temperature —
  dark hero, dark teen-facing sections, higher contrast. The palette holds; the
  backgrounds and photo direction do the age-shift.
- **Form fields:** parent name, phone, email, **teen first name, teen age
  (12–17), preferred class night**. Plus an "Under 12? This class is built for
  them →" link routing to the elementary page (one-directional — the elementary
  page is intentionally left untouched).
- **Pixel:** SAME Meta Pixel ID as the other pages; `Lead` event carries
  `content_category: teens`, plus a `ScrollDepth50` custom event.
- **Formspree:** a **NEW** form ID so teen leads are segmented at the source.
- **Imagery:** all slots currently render CSS placeholder blocks (darker teen
  fill). Swap for real/AI teen photos in the darker visual world before scaling
  spend.

## Placeholder register — MUST be filled before launch

Search the codebase for `TODO` to find each one in place.

| Placeholder | Where | Replace with |
|-------------|-------|--------------|
| `PIXEL_ID` | `index.html` head pixel | Meta Pixel ID (same pixel as the other pages) |
| `FORM_ID` | form `action` + `hx-post` | **New** Formspree form ID (segments teen leads) |
| Hero image | `.hero__photo` slot | 4:5 teen (~15) mid-technique, dramatic side light, ≤ ~250KB. No under-12. |
| Class wide shot | `.how__photo` slot | 3:2 teens-only, 6–8 mixed-gender teens, all 12–17 — the "no little kids" proof |
| Proof-bar numbers | proof-bar section | Real teens-training count, class nights/week, Google rating |
| Testimonials (parent + teen quotes, names, photos) | social proof | **Real students** — HARD GATE before any paid traffic (FTC/deception risk) |
| Sparring FAQ answer | FAQ | The school's real sparring/gear policy — don't promise what it doesn't run |
| `[N]` girls training | FAQ | Real count from school records |
| Risk-reversal sign-off | reversal section | School owner's real name (Caveat-font signature variant) |
| Class nights | `class_night` dropdown | Real teens-only schedule |
| Program name | `<title>` / copy | School's actual teen program name |
| School name / address / map link / phone | footer | Real details |

> **Don't scale ad spend past the test budget until real testimonial photos and
> quotes are in.** The teen testimonial is the segment-unique asset — a teen in
> his own words ("I thought it would be babyish") is what converts the veto.

## Where to paste IDs

- **Meta Pixel ID** → `index.html`, in the `fbq('init', 'PIXEL_ID')` line.
- **Formspree form ID** → `index.html`, in the form's `action` and `hx-post`
  attributes (both must match).

## Design tokens

All colors and fonts live in `:root` at the top of `css/styles.css` — the same
locked system as the sibling pages (ink/paper/purple/pink/teal + Bricolage
Grotesque / Manrope / Archivo). The teen page adds darker `--ink-800/900` surface
tokens on top for the moodier temperature. Change once, updates everywhere.

## Deploy (Vercel)

1. Push this folder to a git repo (or drag-and-drop into Vercel) as a **separate**
   project from the preschool, elementary, and 4–12 pages.
2. Vercel auto-detects a static site — no build command needed.
3. Serve at `/teens` (keep the other pages on their URLs).
4. Verify the pixel with Meta test events before launch.
5. Launch one ad set (parents of teens) at low budget → validate CPL against
   target before scaling.
6. Redeploy by pushing changes.

## Pre-launch QA sweep

- No lorem / no remaining `TODO`s.
- **No image of any child under 12 anywhere on the page** (the hard rule).
- Teens-only framing (headline/subhead) visible without scrolling on mobile.
- Meta Pixel Helper shows exactly one `Lead` event (with `content_category:
  teens`) on submit, plus `PageView` and `ScrollDepth50`.
- Real lead submission lands in the **new** Formspree inbox + email arrives.
- "Under 12?" link goes to the live elementary page.
- Every claim in "This isn't little-kid karate" is true for the actual school
  (no promised sparring/programs the school doesn't run).
- Lighthouse mobile performance ≥90, no layout shift on hero load.
- Test on a real phone; check load speed and the sticky CTA.
