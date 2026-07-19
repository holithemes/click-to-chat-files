/**
 * Minifies this plugin's JavaScript.
 *
 *   tools/intl-2/intl-tel-input/js/intlTelInput.mjs
 *     -> tools/intl-2/assets/js/intl-tel-input.min.mjs
 *   tools/intl-2/assets/js/number-field.dev.js
 *     -> tools/intl-2/assets/js/number-field.js
 *
 * No banner on number-field.js: the .dev.js source sits next to it, which says
 * where the readable version is more plainly than a comment would.
 * intl-tel-input.min.mjs does get one - it is third-party MIT code (attribution
 * required) and, unlike the others, has no unminified sibling in the same
 * folder, so the source location is worth stating.
 *
 * Why the library is minified here at all: upstream ships a minified UMD build
 * but no minified ES module - only the unminified .mjs. See also
 * dev/README-toolchain.md.
 *
 * Run: npm run build:js  (or npm run build)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { minify } from 'terser';

const root = join( dirname( fileURLToPath( import.meta.url ) ), '..', '..' );
const REPO = 'https://github.com/holithemes/click-to-chat-files';

const versionPath = join( root, 'tools/intl-2/intl-tel-input/VERSION' );
const libVersion = existsSync( versionPath ) ? readFileSync( versionPath, 'utf8' ).trim() : '';

const targets = [
	{
		src: 'tools/intl-2/intl-tel-input/js/intlTelInput.mjs',
		out: 'tools/intl-2/assets/js/intl-tel-input.min.mjs',
		// Third-party: keep upstream's attribution (their .mjs build, unlike
		// their .min.js, carries no banner of its own) and name the source,
		// which lives in another folder rather than next to this file.
		banner: ( src ) => `/*
 * International Telephone Input v${ libVersion }
 * https://github.com/jackocnr/intl-tel-input
 * Licensed under the MIT license
 *
 * Minified from ${ src } by ${ REPO }
 */
`,
	},
	{
		src: 'tools/intl-2/assets/js/number-field.dev.js',
		out: 'tools/intl-2/assets/js/number-field.js',
		// No banner - number-field.dev.js is right beside it.
		banner: () => '',
	},
];

const kb = ( n ) => Math.round( n / 1024 ) + ' KB';

for ( const target of targets ) {
	const srcPath = join( root, target.src );
	if ( ! existsSync( srcPath ) ) {
		console.error( `Source missing: ${ target.src }` );
		process.exit( 1 );
	}

	const code = readFileSync( srcPath, 'utf8' );
	const result = await minify( code, {
		module: true,
		compress: {
			drop_console: true,
		},
		mangle: true,
		format: { comments: false },
	} );

	if ( ! result.code ) {
		console.error( `Minification produced no output for ${ target.src }` );
		process.exit( 1 );
	}

	const outPath = join( root, target.out );
	mkdirSync( dirname( outPath ), { recursive: true } );
	writeFileSync( outPath, target.banner( target.src ) + result.code + '\n' );

	console.log( `${ target.out }  (${ kb( code.length ) } -> ${ kb( readFileSync( outPath ).length ) })` );
}
