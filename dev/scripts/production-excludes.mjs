/**
 * Shared definition of paths that are NOT this plugin's own source.
 *
 * Same API as the main/PRO plugins (`isExcluded`), so scripts can be copied
 * between the repos unchanged. Used by:
 *   - dev/scripts/todo-scan.mjs
 *
 * What differs here: most of this plugin by file count is a VENDORED library
 * (`tools/intl-2/intl-tel-input/`, plus the frozen `tools/intl/`). Those are
 * third-party dist files - their TODOs are not ours, and they must never be
 * edited. Excluding them keeps reports about code we actually own.
 */

export const EXCLUDE_PATTERNS = [
	// Development & tooling
	/^node_modules\//,
	/^dev\//,
	/^\.github\//,
	/^\.vscode\//,
	/^\.claude\//,

	// Config / meta
	/^\.gitignore$/,
	/^package(-lock)?\.json$/,

	// Vendored third-party library (generation 2) - copied verbatim from npm.
	/^tools\/intl-2\/intl-tel-input\//,

	// Frozen generation-1 assets - vendored library + the legacy init script.
	// Never edited; see tools/README-asset-generations.md.
	/^tools\/intl\//,
	/^inc\/assets\/js\/intl-init(\.dev)?\.js$/,

	// Generated output (built by npm run build, reviewed via its source).
	/^tools\/intl-2\/assets\/css\/intlTelInput-scoped(\.min)?\.css$/,
	/^tools\/intl-2\/assets\/js\/number-field\.js$/,
];

/**
 * Is this path outside the plugin's own authored source?
 *
 * @param {string} filePath Repo-relative path (forward slashes).
 * @return {boolean} True when the file should be skipped.
 */
export function isExcluded( filePath ) {
	return EXCLUDE_PATTERNS.some( ( re ) => re.test( filePath ) );
}
