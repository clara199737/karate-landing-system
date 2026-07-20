# Editing landing pages — visual editor guide

The four karate landing pages (preschool, elementary, teens, adults) all
edit through a form-based UI at `<your-domain>/admin/`. No code, no
JSON, no terminal.

Under the hood: every save is a commit to GitHub → Vercel rebuilds →
site updates in ~30 seconds. Nothing to trigger manually.

---

## First time: log in

1. Go to `https://<your-domain>/admin/`.
2. Click **Login with GitHub**.
3. Authorize the "Karate Landing Editor" GitHub app (one-time).
4. You land on the entries screen — one row per landing page.

If you don't see the four rows, check that the GitHub OAuth app is
authorized to access this repo. Details in
`docs/deployment.md` §4.

---

## Editing copy on a page

1. Click a page name (e.g. **Teens (ages 12–17)**).
2. Scroll to the section you want (Hero, Problem, Reframe, FAQ, etc.).
3. Edit the text field. Long-form fields like body copy show a
   multi-line box.
4. Click **Save** (top right).
5. Wait ~30 seconds. Refresh your live site. Change is visible.

### The `[[double brackets]]` trick

Anywhere you see a hint like *"wrap purple highlight text in [[double
brackets]]"*, put your emphasized phrase between `[[` and `]]`. The
template turns it purple.

Example headline:
```
One free class. No little kids. [[Real training.]]
```
→ renders as: One free class. No little kids. **Real training.** (last
three words in purple).

### The `<em>` and `<strong>` tags

Some longer fields (bios, FAQ answers, risk-reversal body) mention
that `<em>` and `<strong>` are allowed. Type them literally:
```
He needs the class. It <em>is</em> the getting-in-shape.
```
Anything else with a `<` fails the deploy — the build refuses HTML in
copy strings other than these two tags plus `[[…]]`.

---

## Adding an FAQ item

1. Open a page → scroll to **FAQ**.
2. Under **Questions**, click **+ Add** (bottom of the list).
3. Fill **Question** and **Answer**.
4. Save.

Reorder by dragging the handle on the left of each item. Delete via
the trash icon.

Same pattern for testimonials, benefit cards, reframe items, form
fields, and any other list.

---

## Swapping a photo

1. Click the image widget (thumbnail with an image icon).
2. Choose **Upload new** and drag your photo in — or pick from
   previously uploaded files.
3. Fill (or update) the **Alt text** underneath. Every image needs
   alt text — the build refuses without it.
4. If the photo was a placeholder, uncheck **Placeholder photo?**
   (near testimonial and instructor entries). Production ships refuse
   `Placeholder photo? = true` — that's the AI-photo safety gate.
5. Save.

Uploaded photos land in `source/<segment>/assets/` in the git repo.
Referencing them in JSON is automatic (`assets/<filename>`).

**Sizes:** the template uses whatever dimensions you provide. For the
hero image, adults + teens use 432×544, preschool + elementary use
1192×798. Match your source photo's actual dimensions.

---

## Publishing

Every **Save** publishes immediately — no draft state. The commit lands
on `main`, Vercel rebuilds, and the live site updates within ~30
seconds. No approval step. If you need one, see
`docs/deployment.md` §Editorial workflow.

---

## When the deploy fails

Sometimes an edit slips something the production gate refuses. When
that happens, the Vercel deploy fails and the live site keeps showing
the previous version (so you never accidentally ship a broken page).

**How to spot it:** Vercel emails you when a deploy fails, or you'll
see a red X on the commit in GitHub.

**Common causes and where to fix them in the editor:**

| Error message contains… | What went wrong | Where to fix |
|---|---|---|
| `missing alt text` | An image needs alt text | The **Alt text** field under the image you just changed |
| `still a placeholder photo` | You have `placeholder: true` and ran a production build | Uncheck **Placeholder photo?** on that image entry |
| `still a placeholder ("FORM_ID_…")` | The Formspree ID is still the fake one | Under **Wiring**, replace the placeholder in **Formspree form ID** |
| `stray '<'` | You used HTML that isn't `<em>` or `<strong>` | Remove the offending tag — only those two are allowed |
| `duplicate formspree_id` | Two pages point to the same Formspree form | Give each page its own form; edit **Formspree form ID** |
| `missing required field` | A required field was cleared | Field path is in the error message — fill it back in |
| `meta.segment: expected "teens"` | Someone changed the **Segment slug** on the teens page | Set it back to `teens` (the slug must match the file) |

You can also run these locally to check for issues before saving in
the CMS:
```
npm run lint          # validates all pages
npm run build:prod    # dev build + production gates
```

Both are run automatically by Vercel on every deploy, but running
`lint` locally can catch a typo before you commit.

---

## Adding a new landing page

The CMS has a **New landing page** button in the top right of the
Landing pages list. Click it → fill the form → save. Vercel builds
your new page and it's live at `/<audience-slug>` on the site within
~30 seconds.

### The fast way — duplicate an existing page

Filling every field from scratch on a new page is slow. Instead:

1. Open the Landing pages list at `/admin/`.
2. Find the segment most similar to what you're building (e.g. for a
   "Little Dragons ages 2–3" page, start from **Preschool (ages 3–5)**;
   for a "summer camp" page, start from **Elementary**).
3. Click the ⋯ menu (three dots) on that entry → **Duplicate**.
4. In the duplicated entry, first change **Head + SEO → Segment slug**
   from the old value to the new one (e.g. `little-dragons`).
   **Everything else in the JSON stays valid as long as the segment
   slug matches the filename** — Decap enforces this by using the slug
   as the filename.
5. Change the page title, hero headline, hero image, and any other
   audience-specific copy.
6. **Very important:** change **Wiring → Formspree form ID** to a
   fresh Formspree form (otherwise the new audience's leads will land
   in the wrong inbox). If you don't have one yet, use a distinct
   placeholder like `FORM_ID_little_dragons` — production build will
   refuse to ship until it's real, but preview builds will work.
7. Save. Wait ~30 seconds. Your new page is live at
   `https://karate-landing-system.vercel.app/<new-slug>`.

### The truly-fresh way — click "New landing page"

If you don't have a similar existing page to duplicate:

1. Click **New landing page** (top right).
2. Fill the required fields (marked with `*`):
   - **Head + SEO:** segment slug, page title, meta description
   - **Wiring:** Formspree form ID (unique per page)
   - **Hero:** badge, headline (use `[[double brackets]]` around the
     purple highlight text), subheadline, image (drag-and-drop),
     alt text
   - **Hero → Form card:** heading, submit button label, disclaimer,
     at least one field
   - **Thank-you swap:** lead line + body
   - **Problem:** eyebrow + headline (checklist optional)
   - **Risk reversal:** headline + body
   - **FAQ:** headline + at least one Q/A
   - **Final CTA:** headline + subheadline + button label
   - **Footer:** school name, address, phone
3. Optional sections (proof bar, benefits, reframe, instructor,
   beginner objection, sideline bridge, testimonials, how-it-works)
   can be left empty — the template just skips them.
4. Save.

### What you cannot change per-page

- **The design system** (colors, fonts, spacing) — lives in
  `templates/styles.css`, applies to all pages.
- **The page's structural layout** — lives in `templates/page.html`;
  only content differs per page.
- **Meta pixel ID** — one pixel across all pages; attribution happens
  by `Wiring → Pixel content_category`.

If a new page truly needs a totally different design temperature,
add a `body.segment-<slug> { … }` block to `templates/styles.css`
overriding the tokens you want to change.

---

## Adding a fifth or sixth landing page — advanced (JSON edits)

The button-based flow above uses the CMS. If you prefer to edit JSON
directly (or want to script the creation from another tool):

1. Copy one of the existing files in `content/` (e.g.
   `content/adults.json`) → save as `content/<new-slug>.json`.
2. Change `meta.segment` inside to `<new-slug>` (must match the
   filename).
3. Give it a unique `config.formspree_id`.
4. Update the copy.
5. Commit and push. The build produces `dist/<new-slug>/`.

You don't need to touch `admin/config.yml` — folder-mode Decap auto-
picks up any new JSON in `content/`.

---

## Not editable through the CMS

A few things live outside the CMS by design — they're system-level, not
per-page content:

- **The design system (colors, fonts, spacing)** — `templates/styles.css`
- **The page template itself** — `templates/page.html` + `templates/partials/*.html`
- **Form validation logic** — `templates/main.js`
- **The Meta Pixel ID** — `templates/page.html` (search for `PIXEL_ID`)
- **The reframe icon set** — `build.js` (the `ICONS` constant)
- **Section rendering order** — locked in the template; editor shows
  every possible section, template skips absent ones and renders present
  ones in a fixed order

To change any of these, edit the file in GitHub's code view or clone
the repo locally.
