/**
 * Pre-release / pre-commit sanity checks for this plugin.
 *
 *   npm run verify
 *
 * This plugin is small, but it has a few failure modes that are SILENT at
 * runtime (a wrong path just 404s and the number field quietly stays a plain
 * input). Each check below exists because that class of bug actually happened:
 *
 *  1. manifest paths      - a renamed/moved asset the manifest still points at.
 *  2. build freshness     - committed scoped css / minified js older than source.
 *  3. version consistency - plugin header, constant, readme, package.json.
 *  4. vendored library    - VERSION file vs the exact pin in package.json
 *                           (and vs node_modules when installed).
 *  5. frozen generation 1 - the legacy paths old consumers hardcode must exist.
 *
 * Exits non-zero if anything fails, so it can gate a release.
 */

import { readFileSync, existsSync, copyFileSync, rmSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = join( dirname( fileURLToPath( import.meta.url ) ), '..', '..' );
const results = [];
const ok = ( m ) => results.push( { pass: true, m } );
const fail = ( m ) => results.push( { pass: false, m } );

const read = ( p ) => readFileSync( join( root, p ), 'utf8' );

// ---------------------------------------------------------------- 1. manifest
/**
 * The manifest declares every asset the consumer loads. A path that does not
 * resolve is invisible until a user opens the widget - so assert them here.
 */
function checkManifest() {
	// Runs the REAL manifest method through php with WordPress stubbed out, so
	// this validates whatever the code actually returns - not a regex guess at
	// it. Checked in both modes, since debug mode serves the .dev variants.
	const modes = [
		{ label: 'production', debug: false },
		{ label: 'debug', debug: true },
	];

	for ( const mode of modes ) {
		const stub = `<?php
			define( 'ABSPATH', __DIR__ );
			define( 'HT_CTC_FILES_PLUGIN_FILE', __DIR__ . '/click-to-chat-files.php' );
			define( 'HT_CTC_FILES_VERSION', '0' );
			${ mode.debug ? "define( 'HT_CTC_DEBUG_MODE', true );" : '' }
			function plugins_url( $path = '', $plugin = '' ) { return '::/' . $path; }
			function add_filter() {}
			function get_option() { return array(); }
			require __DIR__ . '/inc/intl/class-ht-ctc-files-intl.php';
			$m = ( new HT_CTC_FILES_Intl() )->manifest( array() );
			echo json_encode( $m );
		`;

		let manifest;
		try {
			const out = execFileSync( 'php', [ '-r', stub.replace( /^\s*<\?php/, '' ) ], {
				cwd: root,
				encoding: 'utf8',
			} );
			manifest = JSON.parse( out );
		} catch ( e ) {
			fail( `manifest (${ mode.label }): could not evaluate - ${ String( e.message ).split( '\n' )[ 0 ] }` );
			continue;
		}

		// every non-empty url key must resolve to a real file; locale_url is a
		// directory, so probe a known locale inside it.
		const urls = Object.entries( manifest )
			.filter( ( [ k, v ] ) => 'string' === typeof v && v.startsWith( '::/' ) && 'version' !== k );

		if ( ! urls.length ) {
			fail( `manifest (${ mode.label }): no asset urls returned` );
			continue;
		}

		let bad = 0;
		for ( const [ key, url ] of urls ) {
			let rel = url.replace( '::/', '' );
			if ( rel.endsWith( '/' ) ) {
				rel += 'en.js'; // locale dir - probe a locale that must exist
			}
			if ( ! existsSync( join( root, rel ) ) ) {
				fail( `manifest (${ mode.label }): ${ key } -> missing file: ${ rel }` );
				bad++;
			}
		}
		if ( ! bad ) {
			ok( `manifest (${ mode.label }): all ${ urls.length } declared assets exist (generation ${ manifest.generation })` );
		}
	}
}

// --------------------------------------------------------------- 2. freshness
/**
 * Re-runs the builds and compares against what is committed. Originals are
 * restored either way, so this never leaves the tree modified.
 */
function checkBuildFreshness() {
	const outputs = [
		'tools/intl-2/assets/css/intlTelInput-scoped.css',
		'tools/intl-2/assets/css/intlTelInput-scoped.min.css',
		'tools/intl-2/assets/js/number-field.js',
	];

	const missing = outputs.filter( ( p ) => ! existsSync( join( root, p ) ) );
	if ( missing.length ) {
		missing.forEach( ( p ) => fail( `build: output missing -> ${ p } (run: npm run build)` ) );
		return;
	}

	const backups = outputs.map( ( p ) => {
		const b = join( root, p + '.verify-bak' );
		copyFileSync( join( root, p ), b );
		return b;
	} );

	try {
		execFileSync( 'npm', [ 'run', 'build' ], { cwd: root, stdio: 'pipe' } );

		const stale = outputs.filter( ( p, i ) =>
			readFileSync( join( root, p ), 'utf8' ) !== readFileSync( backups[ i ], 'utf8' )
		);

		// restore committed versions - verify must not change the tree.
		outputs.forEach( ( p, i ) => copyFileSync( backups[ i ], join( root, p ) ) );

		if ( stale.length ) {
			stale.forEach( ( p ) => fail( `build: STALE -> ${ p } (run: npm run build)` ) );
		} else {
			ok( `build: all ${ outputs.length } built assets are up to date` );
		}
	} catch ( e ) {
		fail( 'build: build failed - ' + String( e.message ).split( '\n' )[ 0 ] );
		outputs.forEach( ( p, i ) => copyFileSync( backups[ i ], join( root, p ) ) );
	} finally {
		backups.forEach( ( b ) => rmSync( b, { force: true } ) );
	}
}

// ----------------------------------------------------------------- 3. version
function checkVersions() {
	const main = read( 'click-to-chat-files.php' );
	const readme = read( 'readme.txt' );
	const pkg = JSON.parse( read( 'package.json' ) );

	const header = main.match( /^Version:\s*(.+)$/m )?.[ 1 ].trim();
	const constant = main.match( /HT_CTC_FILES_VERSION',\s*'([^']+)'/ )?.[ 1 ];
	const stable = readme.match( /^Stable tag:\s*(.+)$/m )?.[ 1 ].trim();
	const pkgShort = pkg.version.split( '.' ).slice( 0, 2 ).join( '.' );

	const all = { header, constant, stable };
	const bad = Object.entries( all ).filter( ( [ , v ] ) => v !== header );

	if ( ! header ) {
		fail( 'version: could not read Version from the plugin header' );
	} else if ( bad.length ) {
		fail( `version: mismatch -> header=${ header } constant=${ constant } readme=${ stable }` );
	} else if ( pkgShort !== header ) {
		fail( `version: package.json (${ pkg.version }) does not match plugin version ${ header }` );
	} else {
		ok( `version: ${ header } consistent (header, constant, readme, package.json)` );
	}

	// changelog entry for the current version
	if ( header && ! new RegExp( `^=\\s*${ header.replace( '.', '\\.' ) }\\s*=`, 'm' ).test( readme ) ) {
		fail( `version: readme.txt has no changelog section for = ${ header } =` );
	}
}

// ------------------------------------------------------------------ 4. vendor
function checkVendoredLibrary() {
	const versionFile = 'tools/intl-2/intl-tel-input/VERSION';
	if ( ! existsSync( join( root, versionFile ) ) ) {
		fail( `vendor: ${ versionFile } missing (run: npm run intl:sync)` );
		return;
	}
	const committed = read( versionFile ).trim();
	const pin = JSON.parse( read( 'package.json' ) ).devDependencies[ 'intl-tel-input' ];

	if ( committed !== pin ) {
		fail( `vendor: committed library ${ committed } != package.json pin ${ pin }` );
	} else {
		ok( `vendor: intl-tel-input ${ committed } matches the exact pin` );
	}

	// if installed, confirm the committed copy is byte-identical to the package
	const dist = join( root, 'node_modules/intl-tel-input/dist' );
	if ( ! existsSync( dist ) ) {
		return;
	}
	// OS/editor cruft is not part of the package - never compare it.
	const ignore = [ '.DS_Store', 'Thumbs.db', '.gitkeep' ];

	const diffs = [];
	const walk = ( dir, rel ) => {
		for ( const entry of readdirSync( dir ) ) {
			if ( ignore.includes( entry ) ) {
				continue;
			}
			const src = join( dir, entry );
			const dst = join( root, 'tools/intl-2/intl-tel-input', rel, entry );
			if ( statSync( src ).isDirectory() ) {
				walk( src, join( rel, entry ) );
			} else if ( ! existsSync( dst ) || ! readFileSync( src ).equals( readFileSync( dst ) ) ) {
				diffs.push( join( rel, entry ) );
			}
		}
	};
	walk( dist, '' );
	if ( diffs.length ) {
		fail( `vendor: ${ diffs.length } vendored file(s) differ from npm (e.g. ${ diffs[ 0 ] }) - run: npm run intl:sync` );
	} else {
		ok( 'vendor: vendored files are byte-identical to the npm package' );
	}
}

// ------------------------------------------------------------- 5. frozen gen 1
/**
 * Older Click to Chat PRO versions and older jsDelivr tags hardcode these
 * paths. They must never disappear - see tools/README-asset-generations.md.
 */
function checkFrozenGeneration1() {
	const frozen = [
		'tools/intl/css/intlTelInput.min.css',
		'tools/intl/js/intlTelInput.min.js',
		'tools/intl/js/utils.js',
		'tools/intl/js/i18n/en/index.js',
		'inc/assets/js/intl-init.js',
		'inc/assets/js/intl-init.dev.js',
	];
	const missing = frozen.filter( ( p ) => ! existsSync( join( root, p ) ) );
	if ( missing.length ) {
		missing.forEach( ( p ) => fail( `frozen: generation-1 asset removed -> ${ p } (old consumers break)` ) );
	} else {
		ok( 'frozen: generation-1 assets intact' );
	}
}

// ---------------------------------------------------------------------- run
checkManifest();
checkVersions();
checkVendoredLibrary();
checkFrozenGeneration1();
checkBuildFreshness();

const failed = results.filter( ( r ) => ! r.pass );
results.forEach( ( r ) => console.log( `${ r.pass ? 'PASS' : 'FAIL' }  ${ r.m }` ) );
console.log( failed.length ? `\n${ failed.length } check(s) failed.` : `\nAll ${ results.length } checks passed.` );
process.exit( failed.length ? 1 : 0 );
