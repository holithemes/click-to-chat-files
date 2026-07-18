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

/**
 * Generation 1 is what Click to Chat PRO requests in CDN mode today, so it is
 * REQUIRED on any tag PRO points at. Generation 2 only exists on tags cut from
 * 1.3 onwards - reported for information, and required once PRO's CDN fallback
 * is moved to generation 2.
 */
const groups = [
	{
		name: 'generation 1 (required - PRO CDN mode uses these today)',
		required: true,
		paths: [
			'tools/intl/css/intlTelInput.min.css',
			'tools/intl/js/intlTelInput.min.js',
			'tools/intl/js/utils.js',
			'tools/intl/js/i18n/de/index.js',
			'inc/assets/js/intl-init.js',
		],
	},
	{
		name: 'generation 2 (tools/intl-2 - present on tags >= 1.3)',
		required: false,
		paths: [
			'tools/intl-2/assets/css/intlTelInput-scoped.min.css',
			'tools/intl-2/assets/js/number-field.js',
			'tools/intl-2/intl-tel-input/js/intlTelInputWithUtils.mjs',
			'tools/intl-2/intl-tel-input/img/flags.webp',
			'tools/intl-2/intl-tel-input/js/locale/de.js',
		],
	},
];

console.log( `Checking jsDelivr tag: ${ tag }\n${ base }` );

let requiredMissing = 0;
const summary = [];

for ( const group of groups ) {
	console.log( `\n${ group.name }` );
	let miss = 0;
	for ( const p of group.paths ) {
		let status;
		try {
			const res = await fetch( base + p, { method: 'HEAD' } );
			status = res.status;
			if ( ! res.ok ) {
				miss++;
			}
		} catch ( e ) {
			status = 'ERR';
			miss++;
		}
		const mark = ( 200 === status ) ? 'PASS' : ( group.required ? 'FAIL' : '----' );
		console.log( `  ${ mark }  ${ status }  ${ p }` );
	}
	if ( group.required ) {
		requiredMissing += miss;
	}
	summary.push( `${ group.paths.length - miss }/${ group.paths.length } ${ group.required ? 'required' : 'optional' }` );
}

console.log( `\n${ summary.join( ' · ' ) }` );
if ( requiredMissing ) {
	console.log( `\n${ requiredMissing } REQUIRED asset(s) missing on tag "${ tag }" - push the tag before the PRO release.` );
} else {
	console.log( `\nTag "${ tag }" serves everything PRO needs in CDN mode.` );
}
process.exit( requiredMissing ? 1 : 0 );
