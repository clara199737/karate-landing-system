# `source/` — frozen reference snapshots

Captured 2026-07-15 during Phase 1 of the templating-system rollout
(`docs/prds/lite/landing-page-templating-system.md`).

Each subfolder is a byte-for-byte copy of the corresponding hand-maintained
landing page in the user's home directory (`.git/`, `.vercel/`, and `.DS_Store`
excluded). These snapshots are the **acceptance baseline** for `dist/<segment>/`
output produced by the build script: zero visual diff between the two is the
Phase 2 exit criterion.

Do not edit these files. If a landing page needs a copy or asset change,
either edit `content/<segment>.json` (post-Phase 2) or update the source
folder and re-run the snapshot step from Phase 1.

| Snapshot           | Origin                                    |
|--------------------|-------------------------------------------|
| `source/general/`  | `/Users/Clara/karate-landing/`            |
| `source/preschool/`| `/Users/Clara/karate-landing-preschool/`  |
| `source/elementary/`| `/Users/Clara/karate-landing-elementary/`|
| `source/teens/`    | `/Users/Clara/karate-landing-teens/`      |
| `source/adults/`   | `/Users/Clara/karate-landing-adults/`     |
