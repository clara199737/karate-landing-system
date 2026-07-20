// tests/scripts/merge-css.js — one-shot CSS merger for Phase 5a.
//
// Produces templates/styles.css by taking teens' source CSS as the unscoped base
// and appending the other three segments' rules scoped inside body.segment-<name>.
// The scoping rewrite:
//   - Every selector list gets `body.segment-<name>` prepended per selector,
//     UNLESS the selector is `:root` or starts with `body`, in which case the
//     `body.segment-<name>` itself becomes the selector (custom properties on
//     the body still inherit through the whole tree).
//   - @media, @supports, and other at-rules with bodies recurse into their block.
//   - @keyframes and @font-face are copied through unchanged (they don't need scoping).
//
// The result: teens renders exactly as before (its rules are unscoped),
// preschool/elementary/adults get teens' rules AS BASE and then override with their
// own rules at higher specificity via the body-class prefix.
//
// Run: `node tests/scripts/merge-css.js`. This produces templates/styles.css and exits.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SEG_SOURCE = (seg) => path.join(ROOT, 'source', seg, 'css', 'styles.css');
const OUT = path.join(ROOT, 'templates', 'styles.css');

// Rewrite a single selector to be scoped under `body.segment-<name>`.
// :root and body selectors collapse to just body.segment-<name>.
function scopeSelector(sel, scope) {
  const trimmed = sel.trim();
  if (!trimmed) return trimmed;
  if (trimmed === ':root') return scope;
  if (/^body(\b|[.:\[#\s>])/.test(trimmed)) {
    // Replace leading `body` with `body.segment-<name>` so combined selectors like
    // `body.hero` become `body.segment-<name>.hero`. `body ` (with descendant)
    // becomes `body.segment-<name> `.
    return trimmed.replace(/^body/, scope);
  }
  return `${scope} ${trimmed}`;
}

// Rewrite a comma-separated selector list.
function scopeSelectorList(list, scope) {
  return list.split(',').map((s) => scopeSelector(s, scope)).join(',\n');
}

// Tokenize a CSS string into a stream of rule blocks: { header, body }.
// The header is what comes before `{` (possibly a selector list or an @-rule),
// the body is everything between the matching braces.
function parseBlocks(css) {
  const out = [];
  let i = 0;
  while (i < css.length) {
    // Skip whitespace and comments before the next block.
    while (i < css.length) {
      if (css[i] === '/' && css[i + 1] === '*') {
        const end = css.indexOf('*/', i + 2);
        if (end === -1) { i = css.length; break; }
        out.push({ kind: 'comment', text: css.slice(i, end + 2) });
        i = end + 2;
      } else if (/\s/.test(css[i])) {
        i++;
      } else {
        break;
      }
    }
    if (i >= css.length) break;

    // Consume until we hit `{` or `;` (for at-rules without bodies, e.g. @import).
    const start = i;
    while (i < css.length && css[i] !== '{' && css[i] !== ';') {
      if (css[i] === '/' && css[i + 1] === '*') {
        const end = css.indexOf('*/', i + 2);
        i = end === -1 ? css.length : end + 2;
      } else {
        i++;
      }
    }
    if (i >= css.length) break;

    const header = css.slice(start, i).trim();

    if (css[i] === ';') {
      out.push({ kind: 'statement', header });
      i++;
      continue;
    }

    // Consume matching-brace body.
    i++; // skip {
    const bodyStart = i;
    let depth = 1;
    while (i < css.length && depth > 0) {
      if (css[i] === '/' && css[i + 1] === '*') {
        const end = css.indexOf('*/', i + 2);
        i = end === -1 ? css.length : end + 2;
      } else if (css[i] === '{') { depth++; i++; }
      else if (css[i] === '}') { depth--; i++; }
      else { i++; }
    }
    const body = css.slice(bodyStart, i - 1); // exclude the closing }
    out.push({ kind: 'block', header, body });
  }
  return out;
}

// Given parsed blocks, emit CSS scoped under `body.segment-<name>` (where meaningful).
function emitScoped(blocks, scope) {
  const out = [];
  for (const b of blocks) {
    if (b.kind === 'comment') {
      out.push(b.text);
    } else if (b.kind === 'statement') {
      // Pass through @import, @charset, etc.
      out.push(`${b.header};`);
    } else if (b.kind === 'block') {
      const h = b.header;
      if (/^@keyframes\b/i.test(h) || /^@font-face\b/i.test(h)) {
        // Global by nature — don't scope, but only emit once (dedupe not handled here).
        out.push(`${h} {\n${b.body}\n}`);
      } else if (/^@media\b/i.test(h) || /^@supports\b/i.test(h)) {
        // Recurse: scope the inner blocks, keep the outer @-rule.
        const inner = emitScoped(parseBlocks(b.body), scope);
        out.push(`${h} {\n${inner}\n}`);
      } else {
        // Regular rule — prefix selectors with the scope.
        out.push(`${scopeSelectorList(h, scope)} {\n${b.body}\n}`);
      }
    }
  }
  return out.join('\n\n');
}

// ---------------------------------------------------------------
// Assemble the merged file.
// ---------------------------------------------------------------
const teensBase = readFileSync(SEG_SOURCE('teens'), 'utf8');

const banner = (name) => `\n\n/* =================================================================
   segment-${name} overrides
   Every rule below applies only when <body class="segment-${name}">.
   Base rules above (from teens' baseline) still apply; anything defined
   here wins by higher specificity (body-class prefix).
   ================================================================= */\n\n`;

const segments = ['preschool', 'elementary', 'adults'];
let out = teensBase.replace(/\s+$/, '') + '\n';
for (const seg of segments) {
  const src = readFileSync(SEG_SOURCE(seg), 'utf8');
  const scope = `body.segment-${seg}`;
  out += banner(seg) + emitScoped(parseBlocks(src), scope) + '\n';
}

writeFileSync(OUT, out);
console.log(`wrote ${OUT} (${out.split('\n').length} lines)`);
