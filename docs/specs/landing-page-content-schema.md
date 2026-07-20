# Landing Page Content Schema — JSON Templating System

**Status:** Draft for review · **Feeds:** Templating-system PRD (data model section)
**Applies to:** Four segmented karate landing pages — `preschool`, `elementary`,
`teens`, `adults`. (The `general` 4–12 page stays hand-maintained; see divergence
report §7.)
**Repo home:** `docs/specs/landing-page-content-schema.md` · content files in `content/[segment].json`

---

## 1. Core principle: what is data vs. what is locked

The JSON is a **content authoring layer only**. The template owns everything that is
locked across the funnel. If changing a value would break visual consistency or the
design system, it does not belong in the JSON.

| Locked in template (never in JSON) | Variable in JSON |
|---|---|
| Fonts (Bricolage Grotesque / Manrope / Archivo) | All headlines, body copy, bullets |
| Palette (ink / paper / purple / pink / teal) | Image paths + alt text |
| Layout archetypes per section | Formspree form ID |
| HTMX submit pattern (`hx-swap="none"` + `htmx:afterRequest`) | Pixel `content_category` value |
| Honeypot field, form markup structure | Stats, testimonials, FAQ items |
| Meta pixel base snippet | CTA labels, thank-you copy |
| Section order | Which optional sections appear |

**Section order is locked in the template.** A section renders if its key exists in
the JSON and is omitted if the key is absent. No ordering config — this is how the
adult page gets its two extra sections without any layout logic leaking into content.

**Template render order** (top to bottom, optional sections skipped when absent):

1. `hero` (§3.3)
2. `proof_bar` (§3.4)
3. `problem` (§3.5)
4. `reframe` (§3.5b) — optional
5. `how_it_works` (§3.6)
6. `benefits` (§3.7)
7. `beginner_objection` (§3.8) — optional
8. `testimonials` (§3.9)
9. `instructor` (§3.10)
10. `sideline_bridge` (§3.11) — optional
11. `risk_reversal` (§3.13)
12. `faq` (§3.12)
13. `final_cta` (§3.14)
14. `footer` (§3.16)

`thank_you` (§3.15) does not render as a standalone section — it lives inline
inside the hero as a hidden `#thanks` block that `main.js` reveals on submit
success. Its schema entry defines that block's copy, not a separate DOM slot.

---

## 2. File layout

```
content/
  preschool.json
  elementary.json
  teens.json
  adults.json
templates/
  page.html          ← single master template
  styles.css         ← shared CSS; per-segment tokens under body.segment-<name>
  main.js            ← shared JS; reads meta.segment + hero.form.fields[]
build.js             ← merge script (~40 lines, Node, no deps beyond a template lib)
dist/
  adults/index.html  ← generated output, deploys to Vercel as-is
```

One JSON per segment. The build script validates, merges, writes static HTML.
Output is byte-for-byte the same kind of static page you deploy today.

`templates/styles.css` and `templates/main.js` are locked template assets —
they don't appear in the JSON. Per-segment art-direction overrides (darker
teen palette, lighter adult palette, etc.) ride on a `body.segment-<name>`
class the template sets from `meta.segment`. `main.js` is data-driven:
form validation reads `hero.form.fields[]`, pixel `Lead` reads
`config.pixel_content_category`, UTM passthrough activates when
`config.utm_passthrough` is true.

The `general` 4–12 page stays hand-maintained (see Phase 1 divergence
report §7) and does not have a `content/general.json`.

---

## 3. Schema

Annotated field-by-field. Every image everywhere is `{ "src": "...", "alt": "..." }` —
alt text is required, the build fails without it.

### 3.1 `meta` — head + SEO

```json
"meta": {
  "segment": "adults",
  "page_title": "Free Adult Karate Class | [School Name]",
  "meta_description": "…",
  "canonical_url": "https://…/adults",
  "og_image": { "src": "/images/adults/og.jpg", "alt": "…" }
}
```

`segment` is the internal identifier — it must match the JSON filename
(`adults.json` → `"segment": "adults"`), the `body.segment-<name>` CSS class,
and the `dist/<segment>/` output folder. This is distinct from
`config.pixel_content_category` (§3.2), which is an external identifier and
may differ (e.g. pixel category `adult` on the adults page).

### 3.2 `config` — wiring (the attribution-critical block)

```json
"config": {
  "formspree_id": "TODO_ADULT_FORM_ID",
  "pixel_content_category": "adult",
  "pixel_view_content": true,
  "utm_passthrough": true
}
```

- `formspree_id` — **must be unique across all segment files.** Build fails on duplicates.
  This enforces the isolated-form-IDs rule mechanically instead of by memory.
- `pixel_content_category` — **optional.** Injected into the pixel `Lead` event only
  (and `ScrollDepth50` custom + `ViewContent` when the template emits them); base
  snippet stays in the template. Value is opaque — pages pick whatever matches their
  existing pixel setup (e.g. `adult` singular on the adults page even though the
  file is `adults.json`). Omit the field to fire `Lead` without a category.
- `pixel_view_content` — **optional (default `false`).** When `true`, template
  emits `fbq('track','ViewContent',{content_category: '<pixel_content_category>'})`
  right after the base `PageView` fires. Adults uses this today; teens does not.
- `utm_passthrough` — when `true`, template renders the hidden UTM fields and
  `main.js` copies `utm_source` / `utm_medium` / `utm_campaign` from the query
  string into them before submit (adult page today; free to enable on siblings
  later without touching HTML).

### 3.3 `hero`

```json
"hero": {
  "eyebrow": "FREE FIRST CLASS",
  "headline": "…",
  "subheadline": "…",
  "image": { "src": "/images/adult/hero.jpg", "alt": "…" },
  "trust_items": ["Ages 12–17", "Teens-only class", "No experience needed"],
  "route_link": { "label": "Under 12? This class is built for them →", "href": "https://…" },
  "form": {
    "heading": "…",
    "subheading": "Takes 60 seconds. We'll email to confirm your time.",
    "button_label": "Claim My Free Class",
    "disclaimer": "…",
    "fields": [
      { "name": "name",  "label": "Your name",  "type": "text",  "autocomplete": "name",  "required": true },
      { "name": "phone", "label": "Phone",      "type": "tel",   "autocomplete": "tel",   "required": true },
      { "name": "email", "label": "Email",      "type": "email", "autocomplete": "email", "required": true }
    ]
  }
}
```

`trust_items` — **optional.** Ordered short strings rendered as inline pills
under the subhead. Present on teens today; template hides the strip when
absent.

`route_link` — **optional.** Small link rendered below the form pointing to a
sibling landing page (teens uses it to route under-12 clicks to elementary).
Omit entirely to hide.

`form.subheading` — **optional.** One-line line under `form.heading`
(e.g. "Takes 60 seconds. We'll email to confirm your time.").

Headline is a plain string. If a page needs the highlighted-line treatment
(carousel-style emphasis), mark it inline: `"He still isn't moving."` →
`"[[He still isn't moving.]]"` — template converts `[[…]]` to the highlight span.
One micro-syntax, no HTML in JSON.

`form.fields[]` — **required, ordered.** Different audiences ask for different
information (adults: name/phone/email; preschool: parent_name/child_name/
child_age/phone/email/class_time; teens: parent_name/phone/email/teen_name/
teen_age/class_night). Template renders them in array order; `main.js`
validates the field set data-driven off this array rather than hardcoded names.
Per-field shape:

- `name` — HTML `name` attribute. Also the key `main.js` uses for validation.
- `label` — visible label text.
- `type` — one of `text`, `tel`, `email`, `select`.
- `autocomplete` — HTML autocomplete token; use `off` for kid-name fields
  and anything else the browser shouldn't pre-fill.
- `required` — boolean.
- `options[]` — required when `type: "select"`. Array of
  `{ "value": "…", "label": "…" }` in menu order. First option is rendered
  as a disabled `<option value="" disabled selected>` placeholder using the
  select's own `label`.

Optional `hidden_fields[]` list on `form` — each entry
`{ name, value }` renders as `<input type="hidden" name="…" value="…">`
between the visible fields and the honeypot. Adults uses this for a
literal `<input type="hidden" name="segment" value="adult">`. UTM
inputs are separately gated by `config.utm_passthrough` (they render
whenever it's `true`, regardless of `hidden_fields[]`).

The `final_cta` re-uses the hero form (§3.14), so `fields[]` is defined
once per page.

### 3.4 `proof_bar` — OPTIONAL

```json
"proof_bar": {
  "stats": [
    { "value": "14 yrs", "label": "teaching adults" },
    { "value": "32–61", "label": "current student age range" },
    { "value": "4.9★", "label": "Google rating" }
  ]
}
```

Present on teens + adults; **absent on preschool + elementary** (those pages
skip the section entirely). Omit the key to skip.

Age-spread numbers are a hard gate on the adult page — see `placeholder` handling in §4.

### 3.5 `problem`

```json
"problem": {
  "eyebrow": "PROBLEM",
  "headline": "…",
  "body": "…",
  "checklist": ["…", "…", "…"],
  "closing": "…"
}
```

`checklist` optional — omit for pages using the reframe/vignette variant.
`closing` optional — a tail paragraph rendered after the checklist
(teens uses this to land the "you already know which one" beat).

### 3.5b `reframe` — OPTIONAL

```json
"reframe": {
  "eyebrow": "Read this part yourself",
  "headline": "This isn't little-kid karate.",
  "body": "…",
  "variant": "notkid",
  "swaps": [
    { "from": "Kiddie games and pool-noodle \"hi-ya\"", "to": "Real technique, drilled until it's yours" }
  ],
  "reassurance": "…",
  "image": { "src": "…", "alt": "…" }
}
```

An audience-perspective bridge that sits between `problem` and `how_it_works`
when present. Preschool and elementary use it as a parent-perspective reframe
("what your kid needs isn't discipline, it's…"); teens use it as the "you're
not a kid anymore" pivot. Same slot, page-audience-flavored copy.

- `eyebrow` — optional short label above the headline.
- `variant` — optional. Controls the `class` attribute the template writes
  on the section (`class="section {{variant}}"`). Defaults to `"reframe"`;
  teens uses `"notkid"` to preserve its existing CSS hook.
- `swaps[]` — optional. Renders as a `<ul class="swap">` list of
  strikethrough → arrow → replacement rows (teens' variant).
- `items[]` — optional alternative to `swaps[]`. Each item is
  `{ icon, title, description }` where `icon` is a slug (e.g. `"listening"`,
  `"focus"`) that maps to an inline SVG in the template's icon dictionary.
  Preschool + elementary use this variant to render a
  `.reframe__grid > .reframe__item` three-column icon grid. Provide only
  one of `swaps[]` or `items[]`.
- `reassurance` — optional tail paragraph after the swap/grid list.
- `image` — optional. Reserved for a future image variant; not used today.

Section is omitted entirely if the top-level key is absent (adults, general
do not use it).

### 3.6 `how_it_works` — first-class walkthrough

```json
"how_it_works": {
  "headline": "…",
  "intro": "…",
  "steps": [
    { "time": "0:00", "title": "…", "body": "…" },
    { "time": "0:10", "title": "…", "body": "…" }
  ],
  "image": { "src": "…", "alt": "…" }
}
```

`time` optional per step — adult page uses the minute-by-minute variant, kid pages
use plain 3-step. Same structure, template renders `time` if present.

Optional `note` — a tail paragraph rendered after the step list
(preschool has `<p class="how__note">…</p>` here noting parent presence).

Optional `belt_ladder` sub-block, rendered after the step list + note
(elementary only today):

```json
"how_it_works": {
  "…": "…",
  "note": "The instructor is trained specifically for this age group, and <strong>you stay in the room the whole time</strong>.",
  "belt_ladder": {
    "caption": "Progress you <em>and</em> your kid can both see",
    "rungs": [
      { "color": "#ffffff", "line": "#c9c9c9", "name": "White belt", "time": "Day one" },
      { "color": "#ffffff", "line": "#c9c9c9", "striped": true, "name": "First stripe", "time": "TODO: ~weeks" },
      { "color": "#f2c200", "line": "#d4a900", "name": "Yellow belt", "time": "TODO: ~months" },
      { "color": "#2a9d3f", "line": "#1f7a30", "more": true, "name": "…and up", "time": "Keep going" }
    ],
    "note": "Every stripe and belt is a milestone your child earns…"
  }
}
```

Each rung renders as an `<li class="belt-rung">` with:
- `<span class="belt-chip"[ belt-chip--striped]" style="--belt:{color};--belt-line:{line};">`
- `<span class="belt-rung__name">{name}</span>`
- `<span class="belt-rung__time">{time}</span>`

Setting `more: true` adds the `belt-rung--more` modifier (for the trailing
"…and up" rung). `striped: true` adds the `belt-chip--striped` chip modifier.

Omit `belt_ladder` on pages that don't visualize progression.

### 3.7 `benefits`

```json
"benefits": {
  "eyebrow": "…",
  "headline": "…",
  "items": [
    {
      "thumbnail": { "src": "/images/adult/benefit-1.jpg", "alt": "…" },
      "title": "…",
      "body": "…"
    }
  ]
}
```

Or, for the split (two-column, no thumbnails) variant:

```json
"benefits": {
  "eyebrow": "Two people have to say yes",
  "headline": "One class. What each of you actually gets.",
  "columns": [
    { "title": "What you see",   "items": ["…", "…"] },
    { "title": "What he gets",   "items": ["…", "…"] }
  ]
}
```

`eyebrow` — optional.

Two layout variants, selected by which key you provide:

- `items[]` — renders as the thumbnail card grid (`.gains__grid`, 3–6 items,
  4 is the standing pattern). Adults uses this.
- `columns[]` — exactly two entries, each with a `title` and `items[]` of
  short strings. Renders as the two-column `.split` layout (parent-view
  and audience-view). Teens uses this. No thumbnails.

Provide exactly one of `items[]` or `columns[]` when the section is present.
Build fails if both are set. **The whole section is optional** — preschool
and elementary omit it entirely (they don't render a benefits block at all).

### 3.8 `beginner_objection` — OPTIONAL (adult only today)

```json
"beginner_objection": {
  "eyebrow": "Your first class, minute by minute",
  "headline": "You won't be the only beginner in the room.",
  "body": "…",
  "image": { "src": "…", "alt": "…", "width": 1692, "height": 1148 },
  "steps": [
    { "title": "You're paired, not thrown in", "body": "…" }
  ],
  "age_spread": {
    "caption": "Our adult class right now",
    "stats": [
      { "value": "TODO: [N]", "label": "youngest" },
      { "value": "TODO: [N]", "label": "oldest" },
      { "value": "TODO: ~[N]", "label": "median" }
    ],
    "line": "You will fit."
  }
}
```

Fields:
- `eyebrow`, `headline`, `body` — required when the section is present.
- `image` — optional supporting image (reuses `.beginner__photo`).
- `steps[]` — optional 4-step first-class timeline (reuses
  `.steps.steps--timeline` markup).
- `age_spread` — optional stats box that closes the section with a
  "you will fit" line. Any number of stats; three is the standing pattern.

Replaces the previous `proof_points[]` shape (unused in practice; adults
uses the richer structure above).

### 3.9 `testimonials`

```json
"testimonials": {
  "eyebrow": "…",
  "headline": "…",
  "items": [
    {
      "quote": "…",
      "name": "…",
      "descriptor": "Parent of two students",
      "avatar": { "src": "…", "alt": "…" },
      "variant": "teen",
      "placeholder": true
    }
  ]
}
```

`eyebrow` — optional short label above the headline.

`placeholder: true` = AI-generated photo. **This flag is the mechanical version of
the hard gate.** See §4.

`descriptor` is optional — omit when the page only credits the person by name
(e.g. `— Sarah M.`). Template drops the descriptor `<span>` when absent.
`avatar` is also optional — some quotes ship without a photo at all.

`variant` — optional. When present, template appends `quote--<variant>` to the
blockquote class (e.g. teens' second quote uses `"variant": "teen"` → renders
`<blockquote class="quote quote--teen">`).

### 3.10 `instructor` — OPTIONAL

```json
"instructor": {
  "eyebrow": "Who's teaching",
  "name": "TODO: Instructor name",
  "bio": "…",
  "photo": { "src": "…", "alt": "…", "width": 1181, "height": 787, "placeholder": true },
  "credential_line": "…"
}
```

The `name` is embedded into the section title as
`Meet <span class="accent-purple">{{name}}</span>` — no separate `headline`
field. `eyebrow` is optional.

Absent on teens (teens has no instructor block); present on preschool,
elementary, and adults.

### 3.11 `sideline_bridge` — OPTIONAL (adult only today)

```json
"sideline_bridge": {
  "eyebrow": "If you've been watching from the bench",
  "body": "You've watched them bow in three nights a week for months, and every time you've thought about it. This is the sign. <strong>Your first class is free too</strong> — and yes, there's a schedule that works around drop-off.",
  "note": "Ask about the family plan when you come in."
}
```

- `eyebrow` — required label (the section has no `<h2>`; the eyebrow is
  the visual anchor).
- `body` — required. Rendered as HTML (`{{{}}}`), so the literal
  `<strong>…</strong>` inline is preserved. This is the only inline
  HTML the schema permits outside `[[…]]` (see §4 rule 5 note).
- `note` — optional tail line.

### 3.12 `faq`

```json
"faq": {
  "eyebrow": "Good questions",
  "headline": "…",
  "items": [
    { "q": "…", "a": "…" }
  ]
}
```

`eyebrow` — optional.

Renders as the native `<details>` accordion — markup lives in the template.

### 3.13 `risk_reversal`

```json
"risk_reversal": {
  "headline": "…",
  "body": "…",
  "not_list": ["No contract today", "No gear to buy", "No pressure pitch"],
  "signature": { "name": "…", "title": "…" }
}
```

`not_list` and `signature` both optional — covers the promise-badge, NOT-list, and
signed-promise variants across siblings with one structure. When `signature.title`
is empty (teens today), template renders `— {name}` alone with no comma or title
suffix.

### 3.14 `final_cta`

```json
"final_cta": {
  "headline": "…",
  "subheadline": "…",
  "button_label": "…",
  "closing_line": "The class runs Tuesday whether you're there or not. Twenty years from now it'll still be running. The only variable is you."
}
```

Final CTA re-uses the hero form (same Formspree ID, template handles it) — no
second form config to drift out of sync.

`closing_line` — optional tail paragraph rendered below the button. Adults
uses this to land the "the only variable is you" beat.

### 3.15 `thank_you`

```json
"thank_you": {
  "lead": "You're booked. 🥋",
  "body": "Check your email — we're saving you a spot with the instructor and we'll confirm your class time shortly."
}
```

- `lead` — one-line confirmation (`You're in! 🎉`, `He's booked. 🥋`,
  `You're booked. 🥋`). Sets the appointment tone; the emoji is part of the
  copy, not a template concern.
- `body` — one paragraph on what happens next.

This is **not** a separate section. It renders as a hidden `<div id="thanks">`
inside the hero form area, revealed by `main.js` on Formspree submit success
(the `htmx:afterRequest` handler). No `next_steps[]` list — every existing
page uses the two-string shape above.

### 3.16 `footer`

```json
"footer": {
  "school_name": "…",
  "address": "…",
  "phone": "…",
  "fine_print": "…"
}
```

---

## 4. Build rules (validation the script enforces)

1. **Formspree uniqueness** — build fails if two segment files share a `formspree_id`.
2. **Required fields** — `meta`, `config`, `hero`, `final_cta`, `thank_you`, `footer`
   must exist; missing = build fails with the field path named.
3. **Alt text required** on every image object.
4. **Placeholder gate** — `npm run build` warns on any `placeholder: true`;
   `npm run build -- --production` **fails** if any remain. The AI-testimonial hard
   gate becomes something the tooling enforces, not something you remember at launch.
5. **Permitted inline markup in copy strings:**
   - `[[…]]` — highlight micro-syntax; template renders as `<span class="accent-purple">…</span>`.
   - `<em>…</em>` — emphasis. Used in reframe lead, belt-ladder caption, FAQ
     answers, instructor bio.
   - `<strong>…</strong>` — strong emphasis. Used in `sideline_bridge.body`,
     `instructor.credential_line`, `risk_reversal.body`, `how_it_works.note`.

   Any other `<` in a copy string fails validation — keeps layout markup
   out of the content layer.

---

## 5. What this unlocks

- **Page five and beyond:** copy `teens.json`, rewrite the strings, add a Formspree ID
  and pixel category — no HTML touched.
- **Headline A/B tests:** swap one string, rebuild, redeploy.
- **The real-photo pass:** flip `placeholder` flags to `false` as real assets land;
  production build tells you exactly what's still blocking paid spend.

---

## 6. Open questions for the PRD (decide in Claude Code planning, not before)

1. Template library: recommend **Mustache** (logic-less — can't sneak layout decisions
   into content) over Handlebars/EJS. Claude Code confirms during extraction.
2. ~~Whether `general.json` gets retrofitted or stays hand-maintained~~
   **Resolved 2026-07-15:** stays hand-maintained. See divergence report §7
   (`docs/specs/landing-page-divergence-report.md`).
3. Zero-visual-diff acceptance test: render old vs. generated HTML for one page and
   diff — the extraction is done when the diff is empty (whitespace aside).

## 7. Change log

- **2026-07-15** — Phase 1 divergence report applied. Patches: template render
  order made explicit (§1); §2 file layout switched to plural
  `teens.json`/`adults.json`, removed `general.json`, added
  `templates/styles.css` + `templates/main.js` + `body.segment-<name>`
  convention; `config.pixel_content_category` marked optional and opaque;
  `hero.form.fields[]` added; new §3.5b `reframe` inserted;
  `testimonials.items[].descriptor` and `.avatar` marked optional;
  `thank_you` rewritten as `lead`/`body` with inline `#thanks` clarification.
- **2026-07-16** — Phase 3 round-4 patches (small): §4 rule 5 rewritten to
  permit `<em>` and `<strong>` inline broadly (previously only `<strong>`
  in sideline_bridge). §3.6 `how_it_works` gained optional `note` (preschool
  parents-stay tail). §3.6 `belt_ladder` shape refined to match reality:
  `caption`, `rungs[{ color, line, name, time, striped?, more? }]`, `note`.
  §3.14 `final_cta` gained optional `closing_line` (adults' "only variable is
  you" tail).
- **2026-07-16** — Phase 3 round-3 patches from deep read of `source/{preschool,elementary,adults}/`.
  §3.4 `proof_bar` marked optional. §3.7 `benefits` marked optional
  (whole section can be omitted). §3.5b `reframe` gained `items[]`
  icon-grid alternative to `swaps[]`. §3.6 `how_it_works` gained
  optional `belt_ladder` sub-block (elementary only). §3.8
  `beginner_objection` rewritten: kept `eyebrow`/`headline`/`body`,
  dropped unused `proof_points[]`, added optional `image`, `steps[]`,
  and `age_spread { caption, stats[], line }`. §3.10 `instructor`
  dropped `headline` (name embedded into title as `Meet {name}`).
  §3.11 `sideline_bridge` rewritten: dropped `headline`/`cta_label`,
  added `eyebrow` and `note`; `body` now permits inline `<strong>`.
  §3.3 `hero.form` gained optional `hidden_fields[]` for adults'
  `segment` hidden input. §4 rule 5 updated to allow inline
  `<strong>` in `sideline_bridge.body` only.
- **2026-07-16** — Phase 2 round-2 patches from deep read of `source/teens/`.
  §3.3 `hero` gained optional `trust_items[]`, `route_link`, and
  `form.subheading`. §3.5 `problem` gained optional `closing`. §3.5b
  `reframe` expanded with optional `eyebrow`, `swaps[]`, `reassurance`,
  and `variant` (default `"reframe"`, teens uses `"notkid"`). §3.7
  `benefits` gained optional `eyebrow` and `columns[]` as an alternative
  to `items[]` (grid vs split). §3.9 `testimonials` gained optional
  `eyebrow` and per-item `variant`. §3.12 `faq` gained optional `eyebrow`.
  §3.13 `risk_reversal` clarified the empty-`title` signature case.
  §3.2 `config` gained optional `pixel_view_content` (default `false`).
