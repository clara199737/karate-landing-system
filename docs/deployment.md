# Deployment — Vercel, one project, path-based routes

This system deploys as a single Vercel project. `npm run build` produces
`dist/` containing one folder per segment; `vercel.json` tells Vercel to
serve `dist/` as static, with clean URLs. Result:

| URL                     | Serves                        |
|-------------------------|-------------------------------|
| `/preschool`            | `dist/preschool/index.html`   |
| `/elementary`           | `dist/elementary/index.html`  |
| `/teens`                | `dist/teens/index.html`       |
| `/adults`               | `dist/adults/index.html`      |
| `/<segment>/css/…`      | per-segment CSS               |
| `/<segment>/assets/…`   | per-segment images            |
| `/` (root)              | 404 — see §Root route         |

The `general` 4–12 page stays hand-maintained on its existing Vercel
project (Phase 1 decision) and is **not** part of this deployment.

---

## 1. First deploy

### Vercel dashboard route

1. **Create a new Vercel project** and connect it to this repo.
2. **Framework preset:** `Other` (Vercel auto-detects `vercel.json`).
3. **Build & Output Settings:** leave everything on default —
   `vercel.json` supplies `buildCommand: npm run build` and
   `outputDirectory: dist`.
4. **Environment variables:** none required at build time. The pixel
   ID (`PIXEL_ID` in the template) and Formspree IDs
   (`FORM_ID_<segment>` in each `content/*.json`) are content-time
   placeholders, not env vars. See §Real IDs.
5. **Deploy.** Vercel builds and returns a preview URL like
   `https://karate-landing-<hash>.vercel.app`.

### CLI route

```bash
npm install -g vercel
vercel login
vercel                       # creates the project (interactive)
vercel deploy --prod         # promotes to production
```

Same `vercel.json` drives both flows.

---

## 2. What to verify on the preview URL

- `/preschool` renders, form is visible, images load.
- Same for `/elementary`, `/teens`, `/adults`.
- CSS + JS are served from `/<segment>/css/styles.css` +
  `/<segment>/js/main.js`. (They're actually the same shared file
  copied into each folder; that's fine and expected.)
- Client-side form validation fires (submit with an empty field).
- Meta pixel base fires `PageView` on load (Facebook Pixel Helper
  extension shows the event even with `PIXEL_ID` as placeholder — it
  won't attribute, but the fire path is real).
- Formspree submission **fails** — that's expected until real IDs
  land. The client-side validation should still gate the submit.

---

## 2b. Enable the visual editor (Decap CMS)

Decap CMS runs entirely in the browser at `<your-domain>/admin/`.
No server, no separate service — it commits directly to this GitHub
repo via a small OAuth broker.

### Steps (do this once, right after first deploy)

1. **Create a GitHub OAuth App**
   - Go to github.com → **Settings** → **Developer settings** →
     **OAuth Apps** → **New OAuth App**
   - **Application name:** `Karate Landing Editor` (or anything)
   - **Homepage URL:** `https://<your-vercel-domain>`
   - **Authorization callback URL:** `https://api.decapbridge.com/oauth/callback`
   - Register. Copy the **Client ID** on the next screen.

2. **Sign up decapbridge.com**
   - Free tier is fine.
   - Click **New site** → give it a name → paste the GitHub Client ID
     from step 1.
   - decapbridge gives you a **site_id** string. Copy it.

3. **Update `admin/config.yml`** in the repo:
   ```yaml
   backend:
     name: github
     repo: <YOUR_GITHUB_OWNER>/<YOUR_REPO>
     branch: main
     base_url: https://api.decapbridge.com
     site_id: <YOUR_DECAPBRIDGE_SITE_ID>
   ```
   Commit and push. Vercel redeploys.

4. **Test:** visit `https://<your-vercel-domain>/admin/`. You should
   see a **Login with GitHub** button. Log in, authorize the OAuth
   App once, and you land on the entries screen with four landing
   pages listed.

### What the editor actually is

The full authoring guide is in `docs/authoring.md`. In short:
form-based edit → save → Vercel rebuilds → live in ~30 seconds.

### Editorial workflow (optional)

Every save publishes immediately. If you want a draft → review →
publish gate, in `admin/config.yml` change:
```yaml
publish_mode: simple
```
to:
```yaml
publish_mode: editorial_workflow
```
This creates a "Drafts / In review / Ready" board in the CMS.
Saves land as drafts until you explicitly publish. Adds a small
amount of setup complexity (Decap opens a PR per draft instead of
committing to main).

---

## 3. Custom domain

Attach the school's domain (or a new marketing subdomain) in the
Vercel dashboard: **Project → Settings → Domains**.

Vercel handles the TLS. `cleanUrls: true` in `vercel.json` means
`funnel.example.com/adults` (no trailing slash) is the canonical URL.

---

## 4. Root route (`/`)

Segments live under `/preschool`, `/elementary`, `/teens`, `/adults`.
Ad campaigns land traffic directly on the segment URL. There's no
organic reason to visit `/`, so it currently returns 404.

If you want `/` to redirect (or serve a "choose your class" page),
add a redirect to `vercel.json`:

```json
{
  "redirects": [
    { "source": "/", "destination": "/adults", "permanent": false }
  ]
}
```

Or add `dist/index.html` with a manual "pick your class" page (needs a
new content file + a small template change — do this only if organic
traffic patterns demand it).

---

## 5. Real IDs — the last things blocking `build:prod`

Right now `npm run build:prod` refuses to build. It reports 12 issues:

- Four `config.formspree_id` values still `FORM_ID_<segment>`.
- Eight `placeholder: true` photos (instructor + testimonials on all
  four pages, plus adults' hero image).

Both are **content-time**, not deploy-time. To fix:

- **Formspree IDs:** create four Formspree forms (one per segment),
  copy the `xxxx` id from each Formspree URL, replace
  `FORM_ID_<segment>` in the corresponding `content/<segment>.json`
  with the real id.
- **Pixel ID:** `PIXEL_ID` is currently hardcoded in
  `templates/page.html`. Replace with the real Meta Pixel id (same
  pixel across all four segments — attribution is by
  `content_category`).
- **Placeholder photos:** capture real school photos and swap the
  `placeholder: true` flags to `false` (or drop the flag) in each
  `content/<segment>.json` once the real image lands in the
  corresponding `source/<segment>/assets/`.

When those three land, `npm run build:prod` will exit 0.

### Wiring the production gate into Vercel

Two options once real content is in:

1. **Swap `buildCommand`** to `npm run build:prod` in `vercel.json`.
   Every deploy fails until content is clean. Safest.
2. **Keep `buildCommand: npm run build`** for preview deploys and
   only run `build:prod` on the `main` branch via Vercel's "protected
   production branch" feature. Lets you iterate on preview URLs with
   partial content but blocks production ship until clean.

Recommend option 1 once all content is real. Until then, keep the
current dev-build command so preview URLs are usable.

---

## 6. DNS transition from the five existing `karate-landing-*.vercel.app` projects

The four segments in this system currently have their own Vercel
projects (`karate-landing-preschool.vercel.app`,
`karate-landing-teens.vercel.app`, etc.) plus the general 4–12
project (`karate-landing.vercel.app`), all referenced from live ad
campaigns.

**Transition sequence:**

1. Ship the consolidated project to a preview URL. Confirm each
   `/<segment>` route matches the corresponding old vercel.app URL
   visually and functionally.
2. Attach the school's custom domain to the consolidated project.
3. Update ad-campaign destination URLs to the new paths
   (`funnel.example.com/adults`, etc.).
4. Let the old projects continue serving for a decay window (2–4
   weeks) so any external links or bookmarks still resolve.
5. Add redirects on each old project pointing to the new path (Vercel
   dashboard → Project → Settings → Redirects), or replace the old
   project's `index.html` with a meta-refresh redirect.
6. Decommission the old projects once analytics confirm zero traffic.

Do not decommission the old projects before ad campaigns are updated
and running clean — it invalidates ad-campaign attribution and can
break in-flight campaigns.

The general 4–12 project stays live throughout (out of scope for this
system).

---

## 7. Quick reference

```bash
npm run build         # dev build → dist/
npm run lint          # validators only, no writes
npm run build:prod    # dev build + production gates (fails until content is real)
npm test              # deliberate-breakage suite
vercel deploy         # first deploy (needs `vercel login` once)
vercel deploy --prod  # promote to production alias
```
