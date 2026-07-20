# Landing Page Divergence Report

**Phase:** Phase 1 of `docs/prds/lite/landing-page-templating-system.md`
**Baseline schema:** `docs/specs/landing-page-content-schema.md`
**Captured:** 2026-07-15
**Status:** Draft for review — schema patches proposed in §4 and §9 pending sign-off.

This report catalogs how the five hand-maintained karate landing pages differ
from each other and from the schema, and flags every gap the schema cannot
currently express. It is the acceptance evidence for Phase 1's exit.

---

## 1. Snapshot manifest

Frozen copies under `source/<segment>/`, byte-for-byte identical to origin
(`diff -r --exclude='.git' --exclude='.vercel' --exclude='.DS_Store'` returns
empty for all five).

| Segment    | Origin                                       | `index.html` lines | `assets/` files |
|------------|----------------------------------------------|-------------------:|---------------:|
| general    | `/Users/Clara/karate-landing/`               | 396                | 12             |
| preschool  | `/Users/Clara/karate-landing-preschool/`     | 445                | 7              |
| elementary | `/Users/Clara/karate-landing-elementary/`    | 505                | 13             |
| teens      | `/Users/Clara/karate-landing-teens/`         | 491                | 5              |
| adults     | `/Users/Clara/karate-landing-adults/`        | 556                | 7              |

All five share the same top-level shape (`index.html`, `assets/`, `css/`,
`js/`, `README.md`, `.gitignore`), same stack (HTMX 2.0.4 + Google Fonts +
one `main.js` + one `styles.css` + one inline Meta pixel snippet). No
`package.json`, no `vercel.json`, no build step exists in any of them today.

---

## 2. Per-page section inventory

Column values indicate presence + the HTML section class used. `–` means
absent. `folded` means the schema section exists but is combined with another.

| Schema section (§)           | general      | preschool   | elementary  | teens         | adults       |
|------------------------------|--------------|-------------|-------------|---------------|--------------|
| `meta` (3.1)                 | ✓            | ✓           | ✓           | ✓             | ✓            |
| `config` (3.2)               | ✓ (real ID)  | ✓ placeholder | ✓ placeholder | ✓ placeholder | ✓ placeholder |
| `hero` (3.3)                 | ✓            | ✓           | ✓           | ✓             | ✓            |
| `proof_bar` (3.4)            | folded into `proof` | –    | –           | ✓ `proof-bar` | ✓ `proof-bar`|
| `problem` (3.5)              | ✓            | ✓           | ✓           | ✓             | ✓            |
| `how_it_works` (3.6)         | ✓ `how`      | ✓ `how`     | ✓ `how`     | ✓ `how`       | –            |
| `benefits` (3.7)             | ✓ `gains`    | –           | –           | ✓ `benefits`  | ✓ `benefits` |
| `beginner_objection` (3.8)   | –            | –           | –           | –             | ✓ `beginner` |
| `testimonials` (3.9)         | folded into `proof` | ✓ `proof` | ✓ `proof` | ✓ `proof`     | ✓ `proof`    |
| `instructor` (3.10)          | –            | ✓           | ✓           | –             | ✓            |
| `sideline_bridge` (3.11)     | –            | –           | –           | –             | ✓ `sideline` |
| `faq` (3.12)                 | ✓            | ✓           | ✓           | ✓             | ✓            |
| `risk_reversal` (3.13)       | ✓ `reversal` | ✓ `reversal`| ✓ `reversal`| ✓ `reversal`  | ✓ `reversal` |
| `final_cta` (3.14)           | ✓            | ✓           | ✓           | ✓             | ✓            |
| `thank_you` (3.15)           | ✓ inline `#thanks` | ✓ inline | ✓ inline | ✓ inline      | ✓ inline     |
| `footer` (3.16)              | ✓            | ✓           | ✓           | ✓             | ✓            |
| **`reframe` / `notkid` (NOT IN SCHEMA)** | –    | ✓ `reframe` | ✓ `reframe`| ✓ `notkid`    | –            |

---

## 3. Section-order divergence

Real page order, top to bottom, with schema-known sections named after their
schema keys and unknown sections named after their class:

| Pos | general              | preschool           | elementary          | teens               | adults              |
|-----|----------------------|---------------------|---------------------|---------------------|---------------------|
| 1   | hero                 | hero                | hero                | hero                | hero                |
| 2   | proof (stats+test)   | problem             | problem             | proof_bar           | proof_bar           |
| 3   | problem              | **reframe**         | **reframe**         | problem             | problem             |
| 4   | how_it_works         | how_it_works        | how_it_works        | **notkid**          | beginner_objection  |
| 5   | benefits (`gains`)   | testimonials        | testimonials        | how_it_works        | benefits            |
| 6   | faq                  | instructor          | instructor          | benefits            | instructor          |
| 7   | risk_reversal        | risk_reversal       | risk_reversal       | testimonials        | sideline_bridge     |
| 8   | final_cta            | faq                 | faq                 | risk_reversal       | testimonials        |
| 9   | footer               | final_cta           | final_cta           | faq                 | risk_reversal       |
| 10  |                      | footer              | footer              | final_cta           | faq                 |
| 11  |                      |                     |                     | footer              | final_cta           |
| 12  |                      |                     |                     |                     | footer              |

Three ordering findings:

1. **`risk_reversal` precedes `faq`** on every page except `general`.
   The schema's implicit order (§3.12 `faq` before §3.13 `risk_reversal`)
   contradicts every newer page. Fix by reordering the schema's implied
   template order to put `risk_reversal` before `faq`.

2. **A "bridge" section sits between `problem` and the walkthrough** on three
   of the five pages: `reframe` (preschool, elementary — parent-perspective
   reframe) and `notkid` (teens — "you're not a kid anymore" bridge). Same
   slot, same shape (headline + body + optional image), page-audience-flavored.
   Schema does not model this. Fix by adding an optional `reframe` section.

3. **`general` puts `testimonials` at position 2**, folded into a combined
   stats+quotes block. Every newer page puts them mid/late. This is the
   single largest structural gap for `general` and the primary reason to
   leave it hand-maintained for now (§7).

---

## 4. Schema gaps (proposed patches)

Enumerated so §6 (schema patch) can act on them directly. Each gap includes
a proposed minimal edit to `docs/specs/landing-page-content-schema.md`.

### 4.1 `hero.form.fields` — per-audience form fields (BLOCKING)

Different pages ask for different information. The schema's `hero.form` block
only names `heading`, `button_label`, `disclaimer` — the fields themselves
are implicit. Real state:

| Segment    | Visible required fields (in order)                                              |
|------------|---------------------------------------------------------------------------------|
| general    | parent_name, email, phone, child_age                                            |
| preschool  | parent_name, child_name, child_age, phone, email, class_time                    |
| elementary | (same as preschool, sampled — verify during Phase 2 extraction)                 |
| teens      | parent_name, phone, email, teen_name, teen_age, class_night                     |
| adults     | name, phone, email                                                              |

**Patch:** add `hero.form.fields[]` to schema §3.3 — an ordered array of
`{ name, label, type, autocomplete, required, options?[] }` objects. Template
renders them in order; `main.js` validates the field set data-driven off this
array rather than hardcoded names. This is the only way one template can serve
all four (or five) audiences.

### 4.2 Section ordering — swap `risk_reversal` and `faq`

Schema currently implies numeric order (§3.12 `faq` then §3.13 `risk_reversal`).
Every newer page reverses this.

**Patch:** in schema §1, add an explicit "Template render order" list with
`risk_reversal` before `faq`. Renumber §3.12 and §3.13 to match, or add a
note under §3.12/§3.13 clarifying the render order.

### 4.3 Add optional `reframe` section

**Patch:** add §3.5b (between `problem` and `how_it_works`) — optional
`reframe` with `headline`, `body`, optional `image`. Handles both the
parenting-perspective reframe (preschool, elementary) and the "not-a-kid"
teen bridge under one key.

### 4.4 Simplify `thank_you` schema — remove `next_steps[]`

Actual thank-you content across all five pages is two paragraphs: a lead
line (`You're in! 🎉` / `You're booked. 🥋` / `He's booked. 🥋`) and one
follow-up sentence about what happens next. No list.

**Patch:** replace §3.15 fields with `lead` (string) + `body` (string).
Drop `next_steps[]`. Also note that thank-you lives inline in the hero as
`#thanks` (revealed by `main.js`), not as separate swap DOM — clarify §3.15's
current "swap content" language.

### 4.5 CSS/JS are per-segment (schema currently treats them as locked)

Substantive divergence:

- **CSS:** every page redefines design tokens (`--ink-900`, `--on-dark`,
  `--hero-tint`, `--purple-lift`, `.img-placeholder` block, hero
  `aspect-ratio`/`object-position`, section-specific overrides). Teens is
  intentionally darker; adults intentionally lighter; general has a
  placeholder-tile pattern the others don't. This is design-system art
  direction, not sloppy drift.
- **JS:** form validation is hardcoded to each page's field set; pixel
  `content_category` differs per page; `general` has no `ScrollDepth50`
  event and no `content_category`; `adults` has UTM-passthrough logic and
  fires an extra `ViewContent` on load.

Two viable fixes; recommend the first:

**Patch (recommended):** template ships **one** `styles.css` with tokens
overridden inside `body.segment-<name> { ... }` scopes and **one**
`main.js` that reads `meta.segment` off a body dataset and drives form
validation from `hero.form.fields[]` (see §4.1). Add a schema note under
§2 stating that CSS/JS live in `templates/` and are locked; per-segment
overrides ride on the `body.segment-<name>` class.

**Alternative:** template ships per-segment `css/` and `js/` files. Rejected
because it multiplies the surface every design-system tweak has to update
five times — the exact tax this project exists to remove.

### 4.6 `pixel_content_category` values

Actual values in use: `preschool`, `elementary`, `teens`, `adult` (singular
for adults). `general` fires `fbq('track', 'Lead')` with no category.

**Patch:** two lines in schema §3.2 — clarify that (a) omitting
`pixel_content_category` fires `Lead` without a category (the general-page
behavior); (b) the value is opaque to the schema — pages can pick whatever
matches their existing pixel setup (hence `adult` singular for the adults
page even though the folder is plural).

### 4.7 `testimonials` `descriptor` is optional in practice

`general` has no descriptor per quote (just `— Sarah M.`); newer pages
may have them (verify during Phase 2 extraction). Schema §3.9 shows
`descriptor` as if it's always present.

**Patch:** mark `descriptor` optional; template omits the `<span>` if
absent.

### 4.8 `proof_bar` folded into `proof` on general — no schema fix needed

Structural: general combines stats and testimonials into one section.
Newer pages separate them. This is a general-page-only quirk and is
addressed by leaving general hand-maintained (§7). No schema change.

---

## 5. CSS/JS findings (detail)

Pairwise diffs (all sample-checked, not exhaustively byte-diffed):

- `css/styles.css`: five distinct files. Shared skeleton (same `:root`
  base tokens, same fonts, same base component styles), diverging in
  audience-temperature overrides and one-off component styles listed in
  §4.5. Line counts: general 630, preschool 653, elementary 760, teens
  767, adults 739.
- `js/main.js`: five distinct files. Shared skeleton (HTMX submit +
  Formspree swap + pixel Lead fire), diverging in form field validation
  lists, pixel `content_category` values, scroll-depth event presence,
  and (adults only) UTM passthrough. Line counts: general 108, preschool
  133, elementary 133, teens 133, adults 143.

The general page is JS-older (no `ScrollDepth50`, no `content_category`
on `Lead`) — another data point for leaving it hand-maintained.

---

## 6. Formspree + Meta pixel audit

| Segment    | Formspree action                             | Pixel init  | `Lead` category | Other pixel events              |
|------------|----------------------------------------------|-------------|------------------|---------------------------------|
| general    | `https://formspree.io/f/xgojaznw` ✓ real     | `PIXEL_ID`  | none             | —                               |
| preschool  | `https://formspree.io/f/FORM_ID` ✗ placeholder | `PIXEL_ID`  | `preschool`      | `ScrollDepth50` custom          |
| elementary | `https://formspree.io/f/FORM_ID` ✗ placeholder | `PIXEL_ID`  | `elementary`     | `ScrollDepth50` custom          |
| teens      | `https://formspree.io/f/FORM_ID` ✗ placeholder | `PIXEL_ID`  | `teens`          | `ScrollDepth50` custom          |
| adults     | `https://formspree.io/f/FORM_ID` ✗ placeholder | `PIXEL_ID`  | `adult`          | `ScrollDepth50` custom + `ViewContent` on load |

**Findings:**

1. **Four of five pages lack real Formspree IDs.** This is either because
   those pages never went live, or the real IDs are held elsewhere (a
   secret manager, notes file, Formspree dashboard). Phase 4's Formspree
   uniqueness check operates on whatever is in `content/<segment>.json`
   — placeholders would pass the uniqueness check only for the first
   segment file that uses them, so the check will (correctly) refuse to
   ship four pages with the literal string `FORM_ID`. Real IDs must be
   sourced before those pages can pass `npm run build -- --production`.
   **Not a Phase 1 blocker** — Phase 2 extracts whatever's in the HTML;
   Phase 4's validator will flag it.

2. **Pixel is shared across all pages** — one `PIXEL_ID` per the inline
   comments. Attribution segmentation happens through `content_category`.
   This matches the schema's design; the only patch needed is §4.6
   (allow empty category, treat value as opaque).

3. **Adults `content_category` is `adult` (singular)**, even though the
   folder and JSON file would be `adults`. This is intentional and lives
   in the pixel setup — do not force alignment. Schema §4.6 patch covers.

---

## 7. Recommendation: general 4–12 page — leave hand-maintained

The general page diverges from the four segmented pages in ways that
cannot be resolved by patching the schema:

- **Section order is different** in a way that changes the funnel logic —
  testimonials at position 2 (right after the hero) rather than mid-page.
  Moving it would be a copy/UX change, not a technical refactor.
- **`proof_bar` and `testimonials` are one combined section**, not two —
  splitting them touches layout and copy.
- **No `instructor` or `benefits`-per-segment section pair** — the page
  uses a single `gains` block plus a stats block folded into `proof`.
- **JS is a generation older** — no `ScrollDepth50`, no
  `content_category` on `Lead`.
- **It's the only page with a real Formspree ID**, meaning it's the only
  one currently taking live submissions — highest reversion risk if we
  touch it.

Retrofit cost is high, upside is low: the four segmented pages are the
ones getting paid traffic and needing rapid iteration. Recommendation:
**do not retrofit `general` into the templating system**. Keep the
snapshot in `source/general/` as reference only; do not create
`content/general.json` in Phase 3.

If general later needs to enter the system, treat it as a copy rewrite,
not a template extraction.

---

## 8. Naming recommendation — patch schema to plurals

Schema §2 example filenames use singular (`teen.json`, `adult.json`);
folder names are plural (`karate-landing-teens`, `-adults`). Source
snapshots are plural. The pixel `content_category` for adults is
`adult` (singular, ships live) — that stays as-is because it's an
external identifier.

Recommendation: patch schema §2 file layout example to use
`teens.json` / `adults.json`, matching folders and source snapshots.
Don't retrofit the naming into `pixel_content_category` values —
that's an external key and separate from filename convention.

---

## 9. Proposed schema patches — summary

Ordered so §6 of the plan (Step 6 — Schema patch) can execute them in one pass:

1. §2 example filenames → `teens.json`, `adults.json` (plural). (§8)
2. §3.2 `pixel_content_category` — mark optional; note value is opaque. (§4.6)
3. §3.3 add `hero.form.fields[]` array. (§4.1) **Blocking for Phase 2.**
4. Insert new **§3.5b `reframe`** — optional, `{ headline, body, image? }`. (§4.3)
5. §3.9 `testimonials.items[].descriptor` — mark optional. (§4.7)
6. §3.15 `thank_you` — replace `headline`/`body`/`next_steps` with
   `lead`/`body`; clarify inline `#thanks` reveal (not DOM swap). (§4.4)
7. §1 (or new §3 preface) — add explicit template render order with
   `risk_reversal` before `faq`. (§4.2)
8. §2 file layout — add `templates/styles.css` + `templates/main.js`,
   note per-segment overrides via `body.segment-<name>` class. (§4.5)

The general 4–12 gaps (§7) do not require schema patches — they're
addressed by keeping general out of the system.

---

## 10. Phase 1 exit checklist

- [x] Five snapshots captured, byte-identical to origin.
- [x] Every schema section (§3.1–§3.16) has a row in §2 with per-page
      presence.
- [x] Section-order divergence documented (§3).
- [x] Non-schema sections surfaced: `reframe`, `notkid` (§2, §4.3).
- [x] CSS/JS divergence characterized (§5).
- [x] Formspree + pixel audit complete (§6).
- [x] general 4–12 fate decided: **leave hand-maintained** (§7).
- [x] Naming decision: **patch schema to plurals** (§8).
- [x] Schema patch list finalized (§9) — pending sign-off before applying.
