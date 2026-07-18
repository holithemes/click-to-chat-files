/**
 * Syncs the vendored intl-tel-input library from node_modules into intl-2.
 *
 *   node_modules/intl-tel-input/dist/{css,js,img}  ->  tools/intl-2/intl-tel-input/
 *
 * tools/intl-2/ layout (integration generation 2 - consumed ONLY via the
 * ht_ctc_fh_intl_assets manifest, never hardcoded by consumers):
 *   intl-tel-input/  vendored library dist, byte-verbatim (diffable vs npm)
 *   assets/          OUR files - init js, scoped css build (never wiped here)
 *
 * Deliberately MANUAL: run `npm run intl:sync` only when updating the library
 * on purpose. The committed files are what ships (jsDelivr serves them from
 * git tags) - npm install/update never touches them, and the devDependency is
 * pinned exact in package.json so even this sync can't drift without editing
 * the pin first.
 *
 * tools/intl (24.x) is LEGACY-FROZEN - old PRO versions and old jsDelivr tags
 * hardcode those paths. This script never touches it.
 *
 * After syncing, regenerate the scoped stylesheet: npm run build:css
 */

import { cpSync, readFileSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join( dirname( fileURLToPath( import.meta.url ) ), '..', '..' );
const pkgPath = join( root, 'node_modules/intl-tel-input/package.json' );

if ( ! existsSync( pkgPath ) ) {
	console.error( 'intl-tel-input not installed - run `npm install` first.' );
	process.exit( 1 );
}

const version = JSON.parse( readFileSync( pkgPath, 'utf8' ) ).version;

// major-change guard: a new MAJOR usually changes the integration API
// (init options, hidden input behavior, locale layout). Confirm the init
// script in tools/intl-2/assets/js/ still matches before syncing it in.
const committedVersionFile = join( root, 'tools/intl-2/intl-tel-input/VERSION' );
if ( existsSync( committedVersionFile ) ) {
	const committed = readFileSync( committedVersionFile, 'utf8' ).trim();
	if ( committed.split( '.' )[ 0 ] !== version.split( '.' )[ 0 ] ) {
		console.error(
			`Committed library is ${ committed }, npm has ${ version } - a different MAJOR.\n` +
			'Review tools/intl-2/assets/js/intl-init.dev.js against the new API first,\n' +
			'then delete tools/intl-2/intl-tel-input/VERSION and re-run to proceed.'
		);
		process.exit( 1 );
	}
}

const destDir = join( root, 'tools/intl-2/intl-tel-input' );

for ( const sub of [ 'css', 'js', 'img' ] ) {
	const src = join( root, 'node_modules/intl-tel-input/dist', sub );
	const dest = join( destDir, sub );
	rmSync( dest, { recursive: true, force: true } );
	cpSync( src, dest, { recursive: true } );
	console.log( `Synced dist/${ sub } -> tools/intl-2/intl-tel-input/${ sub }` );
}

// record the synced version (also read by the major-change guard above).
writeFileSync( committedVersionFile, version + '\n' );
console.log( `\nintl-tel-input ${ version } synced (VERSION file updated).` );
console.log( 'Now run: npm run build:css  (regenerates the scoped stylesheet)' );
