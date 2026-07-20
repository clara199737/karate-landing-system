// tests/run-tests.js — deliberate-breakage suite for build.js validators.
//
// Each test copies the baseline content/ set into a per-test tmp dir, applies
// a mutation, then invokes `node build.js --content <tmp/content>` (plus
// `--production` for gate tests). We assert:
//   - exit code matches expectation (non-zero for broken cases, 0 for positives)
//   - stderr contains the expected error substring (proves the right rule fired)
//
// Run: `npm test`. Exits 0 iff every test passes.

import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE = path.join(ROOT, 'tests/fixtures/baseline');
const TMP = path.join(ROOT, 'tests/tmp');
const BUILD = path.join(ROOT, 'build.js');

// Fresh tmp per run.
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

// ---------------------------------------------------------------
// Fixture setup: copy baseline into a per-test tmp dir, optionally mutate.
// ---------------------------------------------------------------
function setup(name, mutate) {
  const dir = path.join(TMP, name, 'content');
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync(BASELINE)) {
    cpSync(path.join(BASELINE, f), path.join(dir, f));
  }
  if (mutate) mutate(dir);
  return dir;
}

// Load, mutate, save a JSON in the tmp content dir.
function edit(dir, segment, fn) {
  const p = path.join(dir, `${segment}.json`);
  const data = JSON.parse(readFileSync(p, 'utf8'));
  fn(data);
  writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}

// For photo-placeholder tests: strip every `placeholder: true` from the tree
// so a NEW placeholder can be added in isolation.
function stripPlaceholders(node) {
  if (Array.isArray(node)) return node.forEach(stripPlaceholders);
  if (node && typeof node === 'object') {
    delete node.placeholder;
    for (const v of Object.values(node)) stripPlaceholders(v);
  }
}

// Replace the placeholder FORM_ID_* strings with fake real IDs so isolated
// tests aren't tripped by the production Formspree gate.
function realFormspreeIds(dir) {
  for (const f of readdirSync(dir)) {
    edit(dir, f.replace(/\.json$/, ''), (d) => {
      d.config.formspree_id = 'real_' + d.meta.segment;
    });
  }
}

// ---------------------------------------------------------------
// Run build.js as a subprocess and capture exit + stderr.
// ---------------------------------------------------------------
function runBuild(contentDir, extraArgs = []) {
  const r = spawnSync('node', [BUILD, '--content', contentDir, ...extraArgs], {
    encoding: 'utf8',
    cwd: ROOT,
  });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

// ---------------------------------------------------------------
// Test definitions
// ---------------------------------------------------------------
const cases = [
  // Positive controls: baseline builds and lints cleanly.
  {
    name: 'positive-baseline-build',
    dir: setup('positive-baseline-build'),
    args: [],
    expectCode: 0,
  },
  {
    name: 'positive-baseline-lint',
    dir: setup('positive-baseline-lint'),
    args: ['--lint-only'],
    expectCode: 0,
  },

  // Negative cases — one per schema §4 rule the PRD names.
  {
    name: 'dup-formspree',
    dir: setup('dup-formspree', (dir) => {
      edit(dir, 'teens', (d) => { d.config.formspree_id = 'FORM_ID_preschool'; });
    }),
    args: [],
    expectCode: 1,
    expectStderr: 'duplicate formspree_id',
  },
  {
    name: 'missing-required',
    dir: setup('missing-required', (dir) => {
      edit(dir, 'preschool', (d) => { delete d.hero.form.button_label; });
    }),
    args: [],
    expectCode: 1,
    expectStderr: 'hero.form.button_label: missing required field',
  },
  {
    name: 'missing-alt',
    dir: setup('missing-alt', (dir) => {
      edit(dir, 'teens', (d) => { delete d.testimonials.items[0].avatar.alt; });
    }),
    args: [],
    expectCode: 1,
    expectStderr: 'testimonials.items[0].avatar: missing alt text',
  },
  {
    name: 'stray-tag',
    dir: setup('stray-tag', (dir) => {
      edit(dir, 'teens', (d) => { d.problem.body = 'He <div>broke</div> the schema.'; });
    }),
    args: [],
    expectCode: 1,
    expectStderr: "stray '<' in string at problem.body",
  },
  {
    name: 'segment-mismatch',
    dir: setup('segment-mismatch', (dir) => {
      edit(dir, 'teens', (d) => { d.meta.segment = 'adults'; });
    }),
    args: [],
    expectCode: 1,
    expectStderr: 'meta.segment: expected "teens", got "adults"',
  },
  {
    name: 'unknown-icon',
    dir: setup('unknown-icon', (dir) => {
      edit(dir, 'preschool', (d) => { d.reframe.items[0].icon = 'nonsense'; });
    }),
    args: [],
    expectCode: 1,
    expectStderr: 'not in the ICONS dictionary',
  },
  {
    name: 'placeholder-photo',
    dir: setup('placeholder-photo', (dir) => {
      // Start from a clean tree, then plant exactly one placeholder photo.
      for (const f of readdirSync(dir)) {
        edit(dir, f.replace(/\.json$/, ''), (d) => stripPlaceholders(d));
      }
      realFormspreeIds(dir);
      edit(dir, 'teens', (d) => { d.hero.image.placeholder = true; });
    }),
    args: ['--production'],
    expectCode: 1,
    expectStderr: 'hero.image: still a placeholder photo',
  },
  {
    name: 'placeholder-formspree',
    dir: setup('placeholder-formspree', (dir) => {
      // Strip photo placeholders so the ONLY remaining production issue is the Formspree ID.
      for (const f of readdirSync(dir)) {
        edit(dir, f.replace(/\.json$/, ''), (d) => stripPlaceholders(d));
      }
    }),
    args: ['--production'],
    expectCode: 1,
    expectStderr: 'still a placeholder ("FORM_ID_',
  },
];

// ---------------------------------------------------------------
// Runner
// ---------------------------------------------------------------
let passed = 0;
let failed = 0;

for (const c of cases) {
  const r = runBuild(c.dir, c.args);
  const codeOk = r.code === c.expectCode;
  const stderrOk = c.expectStderr ? r.stderr.includes(c.expectStderr) : true;
  const ok = codeOk && stderrOk;

  if (ok) {
    console.log(`  ok  ${c.name}`);
    passed++;
  } else {
    console.log(`FAIL  ${c.name}`);
    console.log(`      expected code=${c.expectCode}, got ${r.code}`);
    if (c.expectStderr && !stderrOk) {
      console.log(`      expected stderr to contain: ${JSON.stringify(c.expectStderr)}`);
      console.log(`      actual stderr:\n${r.stderr.split('\n').map((l) => '        ' + l).join('\n')}`);
    }
    failed++;
  }
}

// ---------------------------------------------------------------
// Phase 5a positive check: every dist/<segment>/css/styles.css and
// dist/<segment>/js/main.js is byte-identical to templates/. Proves
// the shared harmonized file is actually what shipped — regression
// guard against accidentally reverting build.js to per-segment source copies.
// ---------------------------------------------------------------
{
  const name = 'shared-css-js-shipped';
  // The other cases produced dist under /tests/tmp; for THIS check we need a
  // build against the real content/ directory so all four segments exist.
  const realBuildDir = path.join(TMP, name);
  mkdirSync(realBuildDir, { recursive: true });
  const r = spawnSync('node', ['build.js'], { encoding: 'utf8', cwd: ROOT, env: process.env });
  const codeOk = r.status === 0;
  const templatesCss = readFileSync(path.join(ROOT, 'templates/styles.css'), 'utf8');
  const templatesJs  = readFileSync(path.join(ROOT, 'templates/main.js'), 'utf8');
  let mismatches = [];
  for (const seg of ['teens', 'preschool', 'elementary', 'adults']) {
    const cssPath = path.join(ROOT, 'dist', seg, 'css', 'styles.css');
    const jsPath  = path.join(ROOT, 'dist', seg, 'js', 'main.js');
    if (readFileSync(cssPath, 'utf8') !== templatesCss) mismatches.push(`${seg}/css/styles.css`);
    if (readFileSync(jsPath, 'utf8')  !== templatesJs)  mismatches.push(`${seg}/js/main.js`);
  }
  if (codeOk && mismatches.length === 0) {
    console.log(`  ok  ${name}`);
    passed++;
  } else {
    console.log(`FAIL  ${name}`);
    if (!codeOk) console.log(`      build failed: ${r.stderr}`);
    if (mismatches.length) console.log(`      not identical to templates/: ${mismatches.join(', ')}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
