# Landing Page Templating System — Lite PRD (Tier 1)

**Status:** Draft · **Owner:** Scott · **Date:** 2026-07-15
**Data model:** [`docs/specs/landing-page-content-schema.md`](../../specs/landing-page-content-schema.md) — reference, not duplicated here.

---

## 1. Problem

Five karate landing pages (`~/karate-landing`, `~/karate-landing-preschool`,
`~/karate-landing-elementary`, `~/karate-landing-teens`, `~/karate-landing-adults`)
live as independent Vercel projects with parallel HTML. Every design-system
tweak, HTMX pattern change, or pixel wiring fix is a five-place edit. Copy
changes and A/B tests carry the same tax. Divergence between pages is now
mostly accidental rather than intentional, and there is no mechanical guard
against launch-blockers like AI-generated testimonial photos or duplicated
Formspree IDs.

## 2. Why now

- Adding a sixth audience page currently means forking a page and hand-editing.
- The adult page introduced two new sections (`beginner_objection`,
  `sideline_bridge`) that the other pages should be able to opt into without
  a rewrite.
- Real-photo replacement pass is coming; we need a build-time gate that stops
  placeholder assets from reaching paid traffic.

## 3. Goals

- One master HTML template + one JSON per segment, merged at build time into
  the same static HTML we deploy today.
- Copy, images, form IDs, and pixel category are the only per-page authoring
  surface. Design system, layout, and form/HTMX plumbing are locked in the
  template.
- A new segment page = new JSON + Formspree ID + pixel category. No HTML touched.
- Build-time validation enforces §4 of the schema (Formspree uniqueness,
  required fields, alt text, `--production` placeholder gate, highlight-syntax
  guard).

## 4. Non-goals

- No runtime framework, SSR, or CMS. Output stays static HTML + HTMX + Formspree.
- No redesign. Zero visual change to any existing page.
- No copy rewrites. Existing page copy is extracted verbatim.
- No live deployment changes during this build. Vercel routing is decided
  after the system works locally (see open questions).
- No CI setup in this phase — local `npm run build` is enough.

## 5. Success criteria

1. **Zero visual diff** between the current teens page and the generated
   `dist/teens/index.html`, proven on the teens page first (whitespace aside).
2. Adding a hypothetical sixth segment requires touching zero files under
   `templates/` and zero HTML.
3. `npm run build -- --production` fails when any `placeholder: true` remains,
   any Formspree ID is duplicated, any image is missing `alt`, or any required
   section key is missing.
4. Build script is ~40 lines Node + one template dependency.

## 6. Approach (summary)

Build-time merge: `content/[segment].json` + `templates/page.html` →
`dist/[segment]/index.html`, using Mustache (logic-less — prevents layout
decisions from leaking into content; confirm choice during Phase 2). Data model
and all field semantics live in the schema spec — do not restate them here.

## 7. Rollout phases

### Phase 1 — Ingest & divergence report
- Copy each existing page verbatim into `source/[segment]/` as a frozen
  reference snapshot (preschool, elementary, teens, adults, general).
- Produce `docs/specs/landing-page-divergence-report.md`: per-section
  differences across the five pages, called out against the schema in
  `landing-page-content-schema.md`. Flags anything that the schema can't
  express yet.
- **Exit:** report reviewed; schema patched if a real gap surfaced; general
  4–12 page's fate decided (see open questions).

### Phase 2 — Template + build + teens zero-diff proof
- Author `templates/page.html` and `build.js` (Mustache confirmed or
  substituted here).
- Extract teens copy into `content/teens.json` verbatim.
- Run `build.js`; diff `dist/teens/index.html` against the source snapshot
  until the diff is empty (whitespace aside).
- **Exit:** teens page passes the zero-visual-diff acceptance test.

**Status 2026-07-16: complete.** Mustache confirmed. Schema round 2 patched
(8 fields; see schema §7 change log). `templates/page.html` + `build.js` +
`content/teens.json` shipped. `dist/teens/`: `styles.css`, `main.js`, and
every asset byte-identical to `source/teens/`; `index.html` structurally
identical (whitespace-normalized diff is empty). Remaining diff is 28 lines
of prose line-wrapping — hand-wrapped at ~78 cols in source, single-line
in generated output. Browser render is identical. Both `templates/styles.css`
and `templates/main.js` are teens-shaped verbatim copies; Phase 3
harmonizes them across segments.

### Phase 3 — Remaining pages
- Extract preschool, elementary, adults (and general if Phase 1 said yes)
  into JSON. Each must pass the same zero-diff bar against its Phase 1 snapshot.
- **Exit:** every in-scope page reproduces byte-equivalent HTML from JSON.

**Status 2026-07-17: complete for HTML/assets; CSS+JS harmonization deferred
to Phase 3.1.** Schema rounds 3 + 4 applied (13 fields: reframe
icon-grid variant, belt-ladder, expanded beginner_objection with steps +
age_spread, reshaped sideline_bridge, `<em>`/`<strong>` inline allowlist,
`how_it_works.note`, `final_cta.closing_line`, `instructor` reshape,
`proof_bar`/`benefits` marked optional, `hero.form.hidden_fields[]`,
`config.pixel_view_content`). Template refactored to use Mustache partials
under `templates/partials/` with a segment-order branch (`is_adults` flag)
because adults renders sections in a different order
(`beginner→benefits→instructor→sideline→testimonials`) from the kid pages
(`reframe→how→benefits→testimonials→instructor`). Icon SVGs live as a
static dictionary in `build.js` (schema-locked template surface), keyed
by slug from `reframe.items[].icon`. `content/preschool.json`,
`content/elementary.json`, `content/adults.json` shipped alongside a
`content/teens.json` updated to a distinct `FORM_ID_teens` placeholder so
the Formspree uniqueness check can pass. All four segments: HTML
whitespace-normalized structural diff is empty (only planned differences
remain — dropped narrative TODO comments, `<body class="segment-*">`
addition, distinct FORM_ID placeholders, prose line-wrap tolerance).
CSS + JS + assets are byte-identical to source because `build.js` copies
each segment's CSS/JS from its `source/<segment>/` snapshot directly.

**Phase 3.1 → shipped as Phase 5a on 2026-07-17.** See Phase 5 status block below.

**Phase 3.1 (deferred, original description):** merge the four CSS files into one
`templates/styles.css` scoped by `body.segment-<name>`, and rewrite
`templates/main.js` to be data-driven off `hero.form.fields[]` and
`config.*` via an injected `window.LP_CONFIG`. Scoped out of the current
delivery because the merge is a design refactor whose acceptance is
rendered-visual parity (browser eyeball match), not byte-diff, and doing
it without live browser verification carries real regression risk. The
pieces the harmonization needs are in place: `body.segment-<name>` class
is already set by the template; `hero.form.fields[]` is already the
canonical form schema; icon SVG plumbing already runs through
`build.js`. When Phase 3.1 lands, the only build.js change is swapping
the per-segment CSS/JS copy back to shared `templates/*` copies.

### Phase 4 — Validation & production gate
- Implement all §4 build rules: Formspree uniqueness, required fields, alt
  text, `[[…]]`-only markup, and the `--production` placeholder-flag gate.
- Wire `npm run build` and `npm run build -- --production` scripts.
- **Exit:** a deliberately broken JSON (duplicate Formspree ID, missing alt,
  stray `<`, lingering placeholder) fails the build with a useful message
  naming the field path.

**Status 2026-07-17: complete.** `build.js` refactored to a strict
load-all → validate-all → (production gate) → render-all → write-all
order — failed validation exits non-zero without touching `dist/`
(verified: `dist/` from a prior successful `npm run build` survives an
`npm run build:prod` failure unchanged). Schema §4 rules 1–5 fully
enforced:

- **Rule 1 (Formspree uniqueness):** cross-segment check reports both
  the segment file and the earlier-seen segment sharing the ID.
- **Rule 2 (required fields):** flat six-key top-level check replaced
  by a nested path table covering `meta.*`, `config.formspree_id`,
  `hero.badge/headline/subheadline/image.*/form.*`, per-field
  `hero.form.fields[i].{name,label,type}`, per-select
  `options[]`+`placeholder_label`, `thank_you.*`, `final_cta.*`,
  `footer.*` (including nested `address` and `phone`).
- **Rule 3 (alt text):** unchanged tree walk.
- **Rule 4 (`--production` placeholder gate):** already caught
  `placeholder: true` photos; now also refuses `config.formspree_id`
  matching `/^FORM_ID(_|$)/i`, reported one line per issue with the
  full field path.
- **Rule 5 (highlight syntax):** already caught stray `<` beyond
  `[[…]]`/`<em>`/`<strong>`.

Also added: `meta.segment` must equal the JSON filename (catches
copy-paste authoring errors — §3.1). CLI flags `--content <dir>` and
`--lint-only` support the test suite and CI-style checks.

`package.json` scripts: `build`, `build:prod`, `lint`, `test`.

`tests/run-tests.js` runs 10 cases with fresh fixture dirs under
`tests/tmp/`: **two positive controls** (baseline default build,
baseline `--lint-only`) and **eight deliberate-breakage cases**
(duplicate Formspree ID, missing required field, missing alt,
stray tag, segment mismatch, unknown reframe icon slug, production
placeholder photo, production placeholder Formspree). Each case
asserts both the exit code and a specific error substring. All pass.

**Acceptance evidence:**

- `npm run build` → exits 0; produces same `dist/` as Phase 3
  (per-segment HTML structural diff empty; CSS/JS/assets byte-identical
  to source).
- `npm run lint` → exits 0; no `dist/` written.
- `npm run build:prod` → exits 1; reports every remaining production
  blocker (7 placeholder photos + 4 Formspree placeholders across
  the four segments, 12 issues total, each with `[content/<segment>.json]
  <field.path>: …` prefix).
- `npm test` → exits 0; `10 passed, 0 failed`.

### Phase 5 — CSS/JS harmonization + Vercel config

Added post-PRD, sequenced 5a → 5b. Closes the "one file to edit"
promise and resolves Open Q1 (Vercel deployment shape).

**Status 2026-07-17: complete.**

**Phase 5a — CSS/JS harmonization:**
- `templates/main.js` rewritten as one shared data-driven file.
  Segment specifics (pixel `content_category`, UTM passthrough flag)
  ride on `window.LP_CONFIG`, injected by the template from a
  pre-stringified `data.lp_config_json` set by `normalize()`. Form
  validation is fully DOM-driven (`.field input, .field select`); no
  field-name lists cross the wire. Adding a form field in a
  content JSON just works.
- `templates/styles.css` produced by `tests/scripts/merge-css.js` — a
  one-shot Node merger that takes teens' CSS as the unscoped baseline
  and appends preschool / elementary / adults with every selector
  scoped under `body.segment-<name>`. `:root { … }` collapses to
  `body.segment-<name> { … }` (custom properties inherit). `@media` /
  `@supports` recurse; `@keyframes` / `@font-face` pass through. Merged
  file is 3974 lines — bloated relative to a hand-diffed minimum, but
  mechanically correct: teens' rules are the base, everything else
  overrides at higher specificity via the body-class prefix.
- `build.js` swapped to copy `templates/styles.css` + `templates/main.js`
  to every `dist/<segment>/`. Assets stay per-segment from
  `source/<segment>/assets/`.
- Regression test added (`shared-css-js-shipped`): builds all four
  segments and asserts `dist/<segment>/css/styles.css` and
  `dist/<segment>/js/main.js` are byte-identical to `templates/*`.
  Guards against accidentally reverting the copy path.
- HTML output unchanged — only addition is the one-line
  `<script>window.LP_CONFIG = {…};</script>` in `<head>`. All four
  segments' whitespace-normalized HTML structural diff still empty
  after the harmonization.
- Acceptance: `npm test` → `11 passed, 0 failed`. Rendered visual
  parity is a browser eyeball (both `source/` and `dist/` served
  locally for side-by-side comparison during Phase 5a).

**Phase 5b — Vercel deployment config:**
- `vercel.json` at repo root: `buildCommand: npm run build`,
  `outputDirectory: dist`, `cleanUrls: true`, `trailingSlash: false`.
- `docs/deployment.md` covers project connect (dashboard + CLI), first
  deploy verification, custom domain, root-route behavior, the
  real-IDs handoff (pixel + Formspree + placeholder photos), the
  production-gate wiring options, and the DNS transition from the
  five existing `karate-landing-*.vercel.app` projects.
- Live deploy is ops handoff — see `docs/deployment.md` §1.
- Open Q1 (deployment shape) resolved: single project, path-based
  routes on one domain.

**Acceptance evidence:**

- `npm run build` → all four segments build, HTML structural diff
  empty vs source, shared CSS/JS shipped.
- `npm test` → `11 passed, 0 failed` (includes the new `shared-css-js-shipped`
  regression guard).
- `cat vercel.json` matches the spec above.
- `docs/deployment.md` documents every step through DNS transition
  and production-gate wiring.
- PRD Open Q1 marked resolved.

### Phase 6 — Decap CMS visual editor

Added post-Phase-5 in response to a user request for a click-and-edit
interface instead of raw JSON. Decap CMS is a git-based, browser-only
CMS: no separate service, no database. Every save commits to GitHub,
Vercel rebuilds, and the site updates in ~30 seconds.

**Status 2026-07-20: complete (in-repo); user must complete the
one-time GitHub OAuth wiring per `docs/deployment.md` §2b.**

**Shipped:**
- `admin/index.html` — 15-line Decap loader.
- `admin/config.yml` — full field spec (~440 lines of YAML). Every
  JSON key across all four segments maps to a Decap widget. YAML
  anchor (`_field_definitions: &segment_fields`) shares the field
  spec across all four files so the schema is defined once. Icon
  slugs and select field types are constrained to their known values.
  Media folders configured per-file so uploads land in the correct
  `source/<segment>/assets/`.
- `build.js` copies `admin/` → `dist/admin/` after builds.
- `docs/authoring.md` (new) — the everyday CMS guide: editing copy,
  adding FAQ items, swapping photos, publishing, and the full error →
  fix table for every gate the production build enforces.
- `docs/deployment.md` §2b (new) — GitHub OAuth App + decapbridge.com
  broker setup, ~5 minutes user work; optional editorial workflow
  toggle.

**Acceptance evidence:**
- `npm run build` → `dist/admin/{index.html,config.yml}` present.
- `python3 -c 'import yaml; yaml.safe_load(open("admin/config.yml"))'`
  → parses clean, `backend: github`, `collections: 1`, `files: 4`.
- `npm test` → still `11 passed, 0 failed` (tests untouched; admin/
  copy only fires when `admin/` exists, which the tmp test fixtures
  don't include).
- HTML structural diff on all four segments still empty (no template
  or content change).

**User-side hookup (deferred, documented):**
- Push repo to GitHub.
- Create a GitHub OAuth App and copy the Client ID.
- Sign up decapbridge.com, register a site with that Client ID, copy
  the `site_id`.
- Replace three placeholders in `admin/config.yml` (`TODO_OWNER/TODO_REPO`,
  `TODO_SITE_ID`) with real values, commit, push.
- Visit `<domain>/admin/` → log in with GitHub → edit.

**Open questions after Phase 6:**
- **Editorial workflow (draft → review → publish)** — off by default;
  can be flipped in `admin/config.yml`. Ops decision.
- **WYSIWYG preview** — Decap's default preview is generic. A
  live-site preview would need a mini-renderer that loads the real
  template + CSS. Phase 7 candidate if the school owner asks.
- **Multi-user editing** — anyone with GitHub repo write access can
  edit. To onboard non-technical editors, use decapbridge invite
  tokens (they never see GitHub).

## 8. Decision log

Locked, do not reopen without a new PRD revision:

- **Stack:** Static HTML + HTMX + Formspree on Vercel. No runtime framework.
- **Build:** Node script (~40 lines) doing a build-time merge; Mustache
  preferred, confirmed during Phase 2 extraction.
- **Data model:** Defined in `docs/specs/landing-page-content-schema.md`.
  This PRD references it; changes to the model happen in the spec, not here.
- **Acceptance bar:** Zero visual diff between existing pages and generated
  output, proven on the teens page first.
- **Build rules:** All five rules in §4 of the schema, including the
  `--production` placeholder gate.
- **Copy handling:** Extracted verbatim from existing pages. No rewriting
  during extraction; copy edits are a separate, later pass.

## 9. Open questions

To resolve in-flight, not blockers to starting:

1. ~~**Vercel deployment shape.** Consolidate vs. keep five projects.~~
   **Resolved 2026-07-17 (Phase 5b):** single Vercel project, path-based
   routes (`/preschool`, `/elementary`, `/teens`, `/adults`) on one
   domain. `vercel.json` + `docs/deployment.md` shipped. Actual
   `vercel deploy` and DNS transition are ops handoff — see
   `docs/deployment.md`.
2. ~~**General 4–12 page.** Retrofit vs. hand-maintained~~
   **Resolved 2026-07-15 (Phase 1 exit):** stays hand-maintained. Section
   order, folded `proof_bar`/`testimonials` block, missing `instructor`,
   older JS, and it's the only page with a live Formspree ID — retrofit
   cost is high, reversion risk is real. `source/general/` remains as a
   frozen reference; no `content/general.json` in Phase 3. See divergence
   report §7 for the full rationale.

## 10. Risks

- **Hidden per-page HTML that isn't just copy** (custom scripts, one-off
  markup, ad-hoc styles) may force schema additions or template branches.
  Mitigated by Phase 1's divergence report — surfaced before template work
  starts.
- **Whitespace churn in the zero-diff test** could make the acceptance bar
  noisy. Normalize both sides (or diff at the DOM level) if literal
  byte-compare proves impractical.
- **Formspree ID handling during extraction** — real IDs must be transcribed
  correctly; a typo silently reroutes leads. The uniqueness check catches
  duplicates but not typos; spot-check each JSON against the source page.
