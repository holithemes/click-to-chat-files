# dev/ — toolchain

Everything this plugin ships is **committed** (jsDelivr serves files straight
from git tags). The toolchain exists only to *produce* two generated files and
to *check* that what is committed is correct.

Nothing here runs on a user's site. `node_modules/` is gitignored and never
shipped.

## Packages (devDependencies)

| Package | Pinned | Used by | Why it is here |
|---|---|---|---|
| `intl-tel-input` | `29.1.2` (exact) | `intl:sync` | **Provenance, not a build input.** The library is vendored into `tools/intl-2/intl-tel-input/`; npm is only where a deliberate, manual copy comes from, so `verify` can prove the committed files are byte-identical to a known release. Pinned exact — no `^` — so `npm install` can never move it. |
| `postcss` | `8.5.15` | `build:css` | Parses the library stylesheet into an AST so selectors can be rewritten (`:root` → our scope class, `.iti__x` → descendant). The v29 stylesheet uses **native CSS nesting**, which is why a real parser is required — an earlier string/regex version broke on it. |
| `terser` | `5.43.1` | `build:init` | Minifies `number-field.dev.js` → `number-field.js` in `--module` mode. |

All three are pinned exact: this plugin's output is committed and served from a
CDN, so a silent transitive change in a build tool would ship to real sites.

## Why no bundler (webpack / vite / rollup)

Not dogma — a bundler is the wrong shape for this particular job:

1. **We must NOT bundle the one import.** `number-field.js` is 2.9 KB and
   imports the library, which is 468 KB. A bundler's default job is to *inline*
   imports, so the natural output would be a ~470 KB file. That would break the
   design outright: the library has to stay a **separate, independently
   cacheable file**, and the relative specifier
   (`../../intl-tel-input/js/intlTelInputWithUtils.mjs`) is exactly what makes
   the module resolve identically whether it is served from the installed
   plugin or from jsDelivr. Getting a bundler back to "don't bundle anything"
   means configuring externals to defeat its main feature.
2. **There is no dependency graph.** One source file, one external import.
   Nothing to resolve, tree-shake, code-split, or de-duplicate.
3. **Output paths must be stable and predictable.** PHP and CDN URLs reference
   fixed paths — no hashed filenames, no asset manifest, no dist/ indirection.
4. **The vendored library is copied, not built.** It is already a published
   dist; running it through a build step would only risk changing it.
5. **It is the same minifier anyway.** webpack minifies via
   `terser-webpack-plugin` — i.e. terser. We use terser directly and skip the
   orchestration layer we get no value from.

The result is a build that is two short, auditable scripts with three pinned
dependencies, instead of a config file plus a plugin ecosystem.

### Why the main and PRO plugins *do* use webpack

Different needs, not inconsistency. Those plugins have many entry points, real
multi-file module graphs (the admin2 SPA), Babel transpilation and CSS
pipelines — that is what a bundler is for. This plugin has one 200-line module
and one stylesheet transform.

### When to revisit this decision

Switch to a bundler if any of these become true:

- `number-field.dev.js` grows into several modules that should ship as one file.
- Output needs transpilation for browsers that predate ES modules.
- More than a couple of stylesheets need processing (autoprefixing, etc.).

## Scripts

See [`tools/README.md`](../tools/README.md) for the asset generations, the full
command table, what `verify` checks, and the release procedure.
