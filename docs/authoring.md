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

## Adding a fifth landing page

1. Copy one of the existing files in `content/` (e.g.
   `content/adults.json`) → save as `content/<new-slug>.json`.
2. Edit `admin/config.yml`: under `collections[0].files`, duplicate one
   of the existing entries and change `name`, `label`, `file`, and
   `media_folder` to the new slug.
3. Update the copy inside the new JSON (change `meta.segment` to
   match the new filename).
4. Give it a unique `config.formspree_id`.
5. Commit and push. The editor picks up the new page automatically on
   next load; the build produces `dist/<new-slug>/`.

The template renders it the same way as the existing four. No HTML,
CSS, or template code has to change.

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
