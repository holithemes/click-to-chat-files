/**
 * Verifies a released tag actually serves the assets over jsDelivr.
 *
 *   npm run check:cdn            # checks the current plugin version as the tag
 *   npm run check:cdn -- 1.3     # checks a specific tag/branch
 *
 * Why: when the Click to Chat Files plugin is NOT installed, Click to Chat PRO
 * loads these assets from this repo over jsDelivr, pinned to a TAG. If the tag
 * was never pushed, every one of those sites silently loses the number field
 * (the request 404s and the input stays a plain text field).
 *
 * Run this AFTER pushing the tag and BEFORE the PRO release that points at it.
 * Note: jsDelivr caches aggressively; a brand-new tag can take a moment.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join( dirname( fileURLToPath( import.meta.url ) ), '..', '..' );
const main = readFileSync( join( root, 'click-to-chat-files.php' ), 'utf8' );
const version = main.match( /^Version:\s*(.+)$/m )?.[ 1 ].trim();

const tag = process.argv[ 2 ] || version;
if ( ! tag ) {
	console.error( 'Could not determine a tag - pass one: npm run check:cdn -- 1.3' );
	process.exit( 1 );
}

const base = `https://cdn.jsdelivr.net/gh/holithemes/click-to-chat-files@${ tag }/`;

// Generation 2 (tools/intl-2) + the frozen generation 1 paths older PRO
// versions and older tags still request.
const paths = [
	'tools/intl-2/assets/css/intlTelInput-scoped.min.css',
	'tools/intl-2/assets/js/number-field.js',
	'tools/intl-2/intl-tel-input/js/intlTelInputWithUtils.mjs',
	'tools/intl-2/intl-tel-input/img/flags.webp',
	'tools/intl-2/intl-tel-input/js/locale/de.js',
	'tools/intl/css/intlTelInput.min.css',
	'tools/intl/js/intlTelInput.min.js',
	'tools/intl/js/utils.js',
	'inc/assets/js/intl-init.js',
];

console.log( `Checking jsDelivr tag: ${ tag }\n${ base }\n` );

let failed = 0;
for ( const p of paths ) {
	try {
		const res = await fetch( base + p, { method: 'HEAD' } );
		const okStatus = res.ok;
		if ( ! okStatus ) {
			failed++;
		}
		console.log( `${ okStatus ? 'PASS' : 'FAIL' }  ${ res.status }  ${ p }` );
	} catch ( e ) {
		failed++;
		console.log( `FAIL  ERR  ${ p } - ${ e.message }` );
	}
}

console.log( failed
	? `\n${ failed } asset(s) not reachable on tag "${ tag }". Push the tag before the PRO release.`
	: `\nAll ${ paths.length } assets are served from tag "${ tag }".` );
process.exit( failed ? 1 : 0 );
