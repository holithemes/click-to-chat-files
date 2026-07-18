# tools/ — intl number field asset generations

The greetings form number field (Click to Chat PRO) loads the intl-tel-input
library + our field logic from this plugin (installed locally, or from this
GitHub repo via jsDelivr when the plugin isn't installed).

Assets are organized in **integration generations**. A generation is OUR
loading/design contract — not the library's version number.

| Generation | Location | Library | Consumers | Loading design |
|---|---|---|---|---|
| **1** (legacy, FROZEN) | `tools/intl/` + `inc/assets/js/intl-init.js` | intl-tel-input 24.5.0 | PRO ≤ 2.22 (hardcoded paths), old jsDelivr tags (`r1`, …), PRO ≥ 2.23 when this plugin is ≤ 1.2 (no manifest) | `window.intlTelInput` global + polling init (jQuery), stock css. Known limitation: can conflict with another intl-tel-input copy on the page (js global + `.iti` css + `:root` flag vars). |
| **2** | `tools/intl-2/` | see `tools/intl-2/intl-tel-input/VERSION` (29.1.2) | PRO ≥ 2.23 with this plugin ≥ 1.3, via the `ht_ctc_fh_intl_assets` manifest (`inc/intl/class-ht-ctc-files-intl.php`) | Conflict-safe by construction: `assets/js/number-field.js` is a self-contained ES module that imports the library RELATIVELY (no window globals ever), css is the scoped build (`assets/css/` — everything under `.ctc_intl_tel_input_container`). PRO injects the module at the configured moment (nodelay/delay). |

## Rules

1. **Generation 1 is frozen.** Never edit `tools/intl/` or
   `inc/assets/js/intl-init(.dev).js` — old PRO versions and old jsDelivr
   tags hardcode those paths and files.
2. **Generation 2+ is manifest-only.** Nothing may hardcode `tools/intl-2/`
   paths outside this repo — consumers read the `ht_ctc_fh_intl_assets`
   filter. That's what allows moving/renaming/updating files here freely.
3. **A new loading DESIGN = a new generation** (`tools/intl-3/`, bump
   `generation` in the manifest). A plain library update within the same
   design is NOT a new generation — see below.

## Generation 2 layout

```
tools/intl-2/
├── intl-tel-input/     vendored library dist, byte-verbatim (diffable vs npm)
│   └── VERSION         synced release (read by the sync guard)
└── assets/             OURS (never touched by intl:sync)
    ├── css/            intlTelInput-scoped(.min).css — built, do not edit
    └── js/             number-field(.dev).js — the field flow (ES module)
```

## Updating the library (generation 2)

```
# 1. bump the exact pin in package.json (deliberate — no ranges)
# 2.
npm install
npm run intl:sync    # dist -> tools/intl-2/intl-tel-input/ (major changes are guarded)
npm run build        # scoped css + minified number-field.js
npm run verify       # confirm nothing drifted
# 3. review number-field.dev.js if the library changed behavior; commit
```

> Toolchain — what each npm package is for, and why there is no bundler:
> [`dev/README-toolchain.md`](../dev/README-toolchain.md).

## Commands

Same command names as the main and PRO plugins, so the release ritual is
identical in all three repos.

| Command | What it does |
|---|---|
| `npm run build` | Scoped stylesheet + minified `number-field.js`. |
| `npm run intl:sync` | Copies the pinned npm package into `tools/intl-2/intl-tel-input/`. Manual by design; refuses a different MAJOR. |
| `npm run verify` | Pre-release gate — see below. Exits non-zero on failure. |
| `npm run check:cdn [tag]` | Confirms a **pushed** tag actually serves the assets over jsDelivr. Defaults to the current plugin version. |
| `npm run todo:scan` | Inventory of `todo:` / `fixme:` comments. `-- --release` exits non-zero on `todo(release):` / `todo(<version>):`. Scans only our own source — the vendored library is excluded via `dev/scripts/production-excludes.mjs`. |
| `npm run version:bump 1.4` | Updates the version in the plugin header, `HT_CTC_FILES_VERSION`, readme stable tag and `package.json`, and inserts a changelog stub. |

### What `verify` checks

Each check exists because that failure mode is **silent at runtime** — a wrong
path just 404s and the number field quietly stays a plain input:

1. **manifest** — evaluates the real `manifest()` method (php, WordPress
   stubbed) in production *and* debug mode, and asserts every URL it returns
   resolves to a file on disk. Catches renames/typos.
2. **version** — plugin header, `HT_CTC_FILES_VERSION`, readme stable tag and
   `package.json` agree, and the readme has a changelog entry for it.
3. **vendor** — `VERSION` matches the exact pin, and (when `node_modules` is
   installed) the vendored files are byte-identical to the npm package.
4. **frozen** — the generation-1 paths older consumers hardcode still exist.
5. **build** — re-runs the build and compares; fails if a committed asset is
   stale. Restores the committed files either way, so it never dirties the tree.

## Releasing

Releases are published as a **release branch** — `release/1.3`, `release/1.4`,
… — which is what jsDelivr serves and what Click to Chat PRO pins to.

1. `npm run version:bump <version>` — then write the changelog notes.
2. `npm run todo:scan -- --release` — no release-blocking todos left.
3. `npm run verify` — must pass.
4. Merge to `dev`, then create and push the release branch:
   `git branch release/1.3 dev && git push origin release/1.3`
5. `npm run check:cdn` — confirms the branch is actually live on the CDN
   (defaults to `release/<current version>`). **Do this before the Click to
   Chat PRO release that points at it**: if the ref is missing, every CDN-mode
   site silently loses the number field.
6. Click to Chat PRO's CDN fallback (files plugin not installed) pins this ref
   *and* a generation — changing what CDN users get is a PRO release decision,
   independent of this repo.

> **A release branch is mutable — treat it as frozen.** Unlike a git tag, a
> branch can be force-pushed or added to, and every CDN-mode site would pick
> the change up (jsDelivr caches a branch for up to ~7 days, so it also lands
> unpredictably). Once `release/X.Y` is pushed, never commit to it: ship the
> next release as a new branch. Fix-in-place only for a genuine emergency, and
> expect a slow, uneven rollout.
