// build.js — merge content/<segment>.json + templates/page.html → dist/<segment>/index.html
//
// Phase 4 ordering: load all JSONs → validate all → (if --production) production-gate → normalize
// → render → write. Fail-fast: if any validator produces an error, ALL errors are printed and
// the build exits non-zero WITHOUT touching dist/, keeping it atomic.
//
// CLI:
//   node build.js                     # dev build of every content/*.json
//   node build.js teens               # single-segment build
//   node build.js --production        # enable production placeholder gates
//   node build.js --lint-only         # validators only, no render/write
//   node build.js --content <dir>     # override content directory (used by tests)

import { readFileSync, writeFileSync, mkdirSync, cpSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Mustache from 'mustache';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES = path.join(ROOT, 'templates');
const PARTIALS = path.join(TEMPLATES, 'partials');
const DEFAULT_CONTENT = path.join(ROOT, 'content');
const SETTINGS = path.join(ROOT, 'settings');
const SOURCE = path.join(ROOT, 'source');
const DIST = path.join(ROOT, 'dist');

// ---------------------------------------------------------------
// Site theme — colors + fonts + radius, editable via /admin/.
// Falls back to the current design system defaults if settings/site.json
// is missing or a field is unset.
// ---------------------------------------------------------------
const THEME_DEFAULTS = {
  colors: {
    ink: '#141414',
    paper: '#FAFAFA',
    purple: '#7C3AED',
    pink: '#EC4899',
    pink_ink: '#BE185D',
    teal: '#0D9488',
    field_bg: '#FFFFFF',
  },
  fonts: {
    heading: 'Bricolage Grotesque',
    body: 'Manrope',
    accent: 'Archivo',
  },
  radius: 12,
};

function loadTheme() {
  const p = path.join(SETTINGS, 'site.json');
  if (!existsSync(p)) return THEME_DEFAULTS;
  const raw = JSON.parse(readFileSync(p, 'utf8'));
  return {
    colors: { ...THEME_DEFAULTS.colors, ...(raw.colors || {}) },
    fonts:  { ...THEME_DEFAULTS.fonts,  ...(raw.fonts  || {}) },
    radius: raw.radius ?? THEME_DEFAULTS.radius,
  };
}

// Emit an inline <style> block that overrides the design tokens. Uses
// `body[class*="segment-"]` selector so it ties on specificity with the
// per-segment override blocks in templates/styles.css and wins by cascade
// order (this <style> tag comes AFTER the linked stylesheet in the head).
// :root selector alone loses to body.segment-<name>.
function themeCSS(theme) {
  const c = theme.colors;
  return `:root,body[class*="segment-"]{--ink:${c.ink};--paper:${c.paper};--purple:${c.purple};--pink:${c.pink};--pink-ink:${c.pink_ink};--teal:${c.teal};--field-bg:${c.field_bg};--font-head:'${theme.fonts.heading}',sans-serif;--font-body:'${theme.fonts.body}',sans-serif;--font-accent:'${theme.fonts.accent}',sans-serif;--radius:${theme.radius}px;}body[class*="segment-"] .lead-form input,body[class*="segment-"] .lead-form select{color:${c.ink};}`;
}

// Build the Google Fonts CSS2 URL for the three chosen families.
// Requests weights 400;500;600;700 across the board — covers the range
// the template uses without asking the CMS author to pick weights.
function fontsUrl(theme) {
  const families = [theme.fonts.heading, theme.fonts.body, theme.fonts.accent];
  const seen = new Set();
  const uniq = families.filter((f) => (seen.has(f) ? false : (seen.add(f), true)));
  const parts = uniq.map((f) => 'family=' + encodeURIComponent(f).replace(/%20/g, '+') + ':wght@400;500;600;700');
  return 'https://fonts.googleapis.com/css2?' + parts.join('&') + '&display=swap';
}

// ---------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------
const args = process.argv.slice(2);
const production = args.includes('--production');
const lintOnly = args.includes('--lint-only');

const contentFlagIdx = args.indexOf('--content');
const contentDir = contentFlagIdx >= 0 ? path.resolve(args[contentFlagIdx + 1]) : DEFAULT_CONTENT;

const explicitSegment = args.find((a, i) => {
  if (a.startsWith('--')) return false;
  if (args[i - 1] === '--content') return false;
  return true;
});

if (!existsSync(contentDir)) {
  process.stderr.write(`[build] content dir not found: ${contentDir}\n`);
  process.exit(1);
}

const segments = explicitSegment
  ? [explicitSegment]
  : readdirSync(contentDir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));

// ---------------------------------------------------------------
// Reframe icon-grid SVG dictionary (locked template surface).
// ---------------------------------------------------------------
const ICONS = {
  listening: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 0 0-9 9v5a2 2 0 0 0 2 2h1a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H3"/><path d="M12 3a9 9 0 0 1 9 9v5a2 2 0 0 1-2 2h-1a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3"/></svg>',
  'taking-turns': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>',
  'following-directions': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  focus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/></svg>',
  'self-control': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 12h8"/><circle cx="12" cy="12" r="10"/></svg>',
  confidence: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 15 8.5 22 9.5 17 14.5 18.5 21.5 12 18 5.5 21.5 7 14.5 2 9.5 9 8.5z"/></svg>',
};

// ---------------------------------------------------------------
// Validators (schema §4)
// ---------------------------------------------------------------

// Rule 5: permitted inline markup is [[…]], <em>...</em>, <strong>...</strong>.
// Anything else with a '<' fails.
function guardStrings(node, fieldPath, tag) {
  if (Array.isArray(node)) return node.forEach((v, i) => guardStrings(v, `${fieldPath}[${i}]`, tag));
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) guardStrings(v, fieldPath ? `${fieldPath}.${k}` : k, tag);
    return;
  }
  if (typeof node === 'string') {
    const stripped = node
      .replace(/\[\[([^\]]+)\]\]/g, '')
      .replace(/<em>[\s\S]*?<\/em>/g, '')
      .replace(/<strong>[\s\S]*?<\/strong>/g, '');
    if (stripped.includes('<')) {
      throw new Error(`${tag} stray '<' in string at ${fieldPath} — only [[…]], <em>, <strong> allowed (schema §4 rule 5).`);
    }
  }
}

// Rule 3: every image object (anything with a `src`) must have `alt`.
function assertAltText(node, fieldPath, tag) {
  if (Array.isArray(node)) return node.forEach((v, i) => assertAltText(v, `${fieldPath}[${i}]`, tag));
  if (node && typeof node === 'object') {
    if ('src' in node && !('alt' in node)) {
      throw new Error(`${tag} ${fieldPath}: missing alt text (schema §4 rule 3).`);
    }
    for (const [k, v] of Object.entries(node)) assertAltText(v, fieldPath ? `${fieldPath}.${k}` : k, tag);
  }
}

// Rule 2: required fields per the schema. Full nested path table.
const REQUIRED_PATHS = [
  'meta.segment', 'meta.page_title', 'meta.meta_description',
  'config.formspree_id',
  'hero.badge', 'hero.headline', 'hero.subheadline',
  'hero.image.src', 'hero.image.alt', 'hero.image.width', 'hero.image.height',
  'hero.form.heading', 'hero.form.button_label', 'hero.form.disclaimer',
  'hero.form.fields',
  'thank_you.lead', 'thank_you.body',
  'final_cta.headline', 'final_cta.subheadline', 'final_cta.button_label',
  'footer.school_name',
  'footer.address.text', 'footer.address.href',
  'footer.phone.text', 'footer.phone.href',
];

function getPath(obj, dotted) {
  return dotted.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

function assertRequired(data, tag) {
  // Outer guard: whole top-level sections that hold required fields.
  const topLevel = ['meta', 'config', 'hero', 'final_cta', 'thank_you', 'footer'];
  for (const key of topLevel) {
    if (data[key] == null) {
      throw new Error(`${tag} ${key}: missing required field (schema §4 rule 2).`);
    }
  }
  // Nested required paths.
  for (const p of REQUIRED_PATHS) {
    const v = getPath(data, p);
    if (v == null || v === '') {
      throw new Error(`${tag} ${p}: missing required field (schema §4 rule 2).`);
    }
  }
  // hero.form.fields[] must be a non-empty array; each field must have name/label/type;
  // select fields must have a non-empty options[] and a placeholder_label.
  const fields = data.hero.form.fields;
  if (!Array.isArray(fields) || fields.length === 0) {
    throw new Error(`${tag} hero.form.fields: must be a non-empty array (schema §3.3).`);
  }
  fields.forEach((f, i) => {
    for (const k of ['name', 'label', 'type']) {
      if (f[k] == null || f[k] === '') {
        throw new Error(`${tag} hero.form.fields[${i}].${k}: missing required field (schema §3.3).`);
      }
    }
    if (f.type === 'select') {
      if (!Array.isArray(f.options) || f.options.length === 0) {
        throw new Error(`${tag} hero.form.fields[${i}].options: required for type="select" (schema §3.3).`);
      }
      if (!f.placeholder_label) {
        throw new Error(`${tag} hero.form.fields[${i}].placeholder_label: required for type="select" (schema §3.3).`);
      }
    }
  });
}

// meta.segment must match the JSON filename it was loaded from.
function assertSegmentMatch(data, segment, tag) {
  if (data.meta.segment !== segment) {
    throw new Error(`${tag} meta.segment: expected "${segment}", got "${data.meta.segment}" (schema §3.1).`);
  }
}

// ---------------------------------------------------------------
// Normalize — derive Mustache-friendly fields; also enforces the
// mutually-exclusive shape rules (reframe swaps/items, benefits split/grid).
// ---------------------------------------------------------------
function renderHighlights(str) {
  return str.replace(/\[\[([^\]]+)\]\]/g, '<span class="accent-purple">$1</span>');
}

function normalize(data, tag) {
  data.hero.headline_html = renderHighlights(data.hero.headline);

  for (const f of data.hero.form.fields) {
    f.is_select = f.type === 'select';
  }

  if (data.reframe) {
    if (!data.reframe.variant) data.reframe.variant = 'reframe';
    const hasSwaps = Array.isArray(data.reframe.swaps) && data.reframe.swaps.length;
    const hasItems = Array.isArray(data.reframe.items) && data.reframe.items.length;
    if (hasSwaps && hasItems) {
      throw new Error(`${tag} reframe: cannot have both swaps[] and items[] (schema §3.5b).`);
    }
    data.reframe.wrap_narrow = hasSwaps;
    if (hasItems) {
      data.reframe.cta_label = data.hero.form.button_label;
      data.reframe.items.forEach((item, i) => {
        if (!ICONS[item.icon]) {
          throw new Error(`${tag} reframe.items[${i}].icon: "${item.icon}" is not in the ICONS dictionary.`);
        }
        item.icon_svg = ICONS[item.icon];
      });
    }
  }

  if (data.benefits) {
    const hasCols = Array.isArray(data.benefits.columns) && data.benefits.columns.length;
    const hasItems = Array.isArray(data.benefits.items) && data.benefits.items.length;
    if (hasCols === hasItems) {
      throw new Error(`${tag} benefits: must have exactly one of columns[] or items[] (schema §3.7).`);
    }
    data.benefits.is_split = hasCols;
    data.benefits.is_grid = hasItems;
    data.benefits.cta_label = data.hero.form.button_label;
  }

  if (data.testimonials) {
    data.testimonials.cta_label = data.hero.form.button_label;
    data.testimonials.items.forEach((item, i) => { item._first = i === 0; });
  }

  if (data.how_it_works) {
    data.how_it_works.steps.forEach((s, i) => { s.step_num = i + 1; });
  }

  if (data.beginner_objection && Array.isArray(data.beginner_objection.steps)) {
    data.beginner_objection.steps.forEach((s, i) => { s.step_num = i + 1; });
  }

  data.is_adults = data.meta.segment === 'adults';

  // Runtime config that main.js reads via window.LP_CONFIG. Kept minimal — only
  // what varies per segment and can't be inferred from the DOM: pixel category
  // and the UTM passthrough flag. Field validation is DOM-driven, so no field
  // list needs to cross the wire.
  data.lp_config_json = JSON.stringify({
    pixel_content_category: data.config.pixel_content_category || null,
    utm_passthrough: data.config.utm_passthrough === true,
  });

  return data;
}

// ---------------------------------------------------------------
// Cross-segment validators (schema §4 rules 1 + 4)
// ---------------------------------------------------------------
function crossValidate(parsed) {
  const errors = [];

  // Rule 1: formspree_id uniqueness.
  const ids = new Map();
  for (const p of parsed) {
    const id = p.raw.config?.formspree_id;
    if (!id) continue;  // missing config caught by assertRequired earlier
    if (ids.has(id)) {
      errors.push(
        `[content/${p.segment}.json] config.formspree_id: duplicate formspree_id "${id}" ` +
        `(also used by ${ids.get(id)}; schema §4 rule 1).`
      );
    } else {
      ids.set(id, p.segment);
    }
  }

  return errors;
}

// Rule 4: --production placeholder gates (photos + Formspree IDs).
function productionGate(parsed) {
  const errors = [];

  // Photo placeholders — walk each JSON for `placeholder: true`.
  for (const p of parsed) {
    const tag = `[content/${p.segment}.json]`;
    const walk = (node, fieldPath) => {
      if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${fieldPath}[${i}]`));
      if (node && typeof node === 'object') {
        if (node.placeholder === true) {
          errors.push(`${tag} ${fieldPath}: still a placeholder photo — production build refused (schema §4 rule 4).`);
        }
        for (const [k, v] of Object.entries(node)) walk(v, fieldPath ? `${fieldPath}.${k}` : k);
      }
    };
    walk(p.raw, '');

    // Formspree placeholder — real IDs are opaque strings; anything matching FORM_ID
    // (case-insensitive, optional _suffix) is a placeholder.
    const id = p.raw.config?.formspree_id;
    if (id && /^FORM_ID(_|$)/i.test(id)) {
      errors.push(`${tag} config.formspree_id: still a placeholder ("${id}") — production build refused (schema §4 rule 4).`);
    }
  }

  return errors;
}

// ---------------------------------------------------------------
// Load + validate all
// ---------------------------------------------------------------
const parsed = [];
const errors = [];

for (const segment of segments) {
  const jsonPath = path.join(contentDir, `${segment}.json`);
  const tag = `[content/${segment}.json]`;
  let raw;
  try {
    raw = JSON.parse(readFileSync(jsonPath, 'utf8'));
  } catch (e) {
    errors.push(`${tag} JSON parse error: ${e.message}`);
    continue;
  }
  parsed.push({ segment, raw });

  // Per-segment validators — first violation per segment stops that segment,
  // but other segments still run so multi-segment errors report together.
  try {
    assertRequired(raw, tag);
    assertSegmentMatch(raw, segment, tag);
    assertAltText(raw, '', tag);
    guardStrings(raw, '', tag);
    normalize(raw, tag);
  } catch (e) {
    errors.push(e.message);
  }
}

// Cross-segment validation runs even if individual segments had errors,
// so duplicate-ID reports still surface.
errors.push(...crossValidate(parsed));

if (production) {
  errors.push(...productionGate(parsed));
}

if (errors.length) {
  for (const err of errors) process.stderr.write(err + '\n');
  process.exit(1);
}

if (lintOnly) {
  console.log(`lint ok (${parsed.length} segments)`);
  process.exit(0);
}

// ---------------------------------------------------------------
// Render + write (only reached when validation passed)
// ---------------------------------------------------------------
const template = readFileSync(path.join(TEMPLATES, 'page.html'), 'utf8');
const partials = {};
for (const f of readdirSync(PARTIALS).filter((n) => n.endsWith('.html'))) {
  partials[f.replace(/\.html$/, '')] = readFileSync(path.join(PARTIALS, f), 'utf8');
}

// Load once — theme applies uniformly across every segment.
const theme = loadTheme();
const themeCssStr = themeCSS(theme);
const fontsUrlStr = fontsUrl(theme);

for (const p of parsed) {
  // Attach the shared theme values so the template can render them.
  p.raw.theme_css = themeCssStr;
  p.raw.fonts_url = fontsUrlStr;
  const html = Mustache.render(template, p.raw, partials);

  const outDir = path.join(DIST, p.segment);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, 'index.html'), html);

  // Phase 5a: ship the shared harmonized CSS + JS from templates/.
  // Assets remain per-segment from the source snapshot (photos, SVGs).
  mkdirSync(path.join(outDir, 'css'), { recursive: true });
  cpSync(path.join(TEMPLATES, 'styles.css'), path.join(outDir, 'css', 'styles.css'));
  mkdirSync(path.join(outDir, 'js'), { recursive: true });
  cpSync(path.join(TEMPLATES, 'main.js'), path.join(outDir, 'js', 'main.js'));
  // Segment's assets folder is optional — a page created via the CMS
  // (Duplicate or New) doesn't get one until the author uploads photos.
  // Missing folder = create an empty dist/<segment>/assets/ so the site
  // still deploys. Images referenced in the JSON will 404 until real
  // photos are uploaded via the CMS or copied in by hand.
  const srcAssets = path.join(SOURCE, p.segment, 'assets');
  const distAssets = path.join(outDir, 'assets');
  if (existsSync(srcAssets)) {
    cpSync(srcAssets, distAssets, { recursive: true });
  } else {
    mkdirSync(distAssets, { recursive: true });
  }

  console.log(`built dist/${p.segment}/index.html`);
}

// Phase 6: Decap CMS admin UI. Copies admin/ to dist/admin/ so the site
// serves the editor at /admin/. Only runs when admin/ exists (tests build
// against tmp content dirs that don't include it).
const ADMIN = path.join(ROOT, 'admin');
if (existsSync(ADMIN)) {
  cpSync(ADMIN, path.join(DIST, 'admin'), { recursive: true });
  console.log('copied admin/ to dist/admin/');
}

console.log(production ? 'production build ok' : 'build ok');
