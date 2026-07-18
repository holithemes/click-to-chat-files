#!/usr/bin/env node

/**
 * Version Bump — updates the plugin version everywhere `npm run verify` checks.
 *
 * Usage:
 *   npm run version:bump 1.4
 *
 * Updates:
 *   1. click-to-chat-files.php  → "Version:" header + HT_CTC_FILES_VERSION constant
 *   2. readme.txt               → "Stable tag:"
 *   3. readme.txt               → inserts a changelog stub "= X.X =" if missing
 *   4. package.json             → "version" (as X.X.0)
 *
 * The changelog stub is a placeholder — write the real notes before releasing.
 * Run `npm run verify` afterwards to confirm consistency.
 *
 * Note: this plugin's version is also the jsDelivr TAG consumers pin to, so a
 * bump means a new release branch must be pushed — see tools/README-asset-generations.md.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT_DIR = path.resolve( path.dirname( fileURLToPath( import.meta.url ) ), '../../' );

const version = process.argv[ 2 ];
if ( ! version || ! /^\d+\.\d+(\.\d+)?$/.test( version ) ) {
	console.error( 'Usage: npm run version:bump <version>   e.g. 1.4' );
	process.exit( 1 );
}

const changed = [];

function update( file, fn ) {
	const p = path.join( ROOT_DIR, file );
	const before = fs.readFileSync( p, 'utf8' );
	const after = fn( before );
	if ( after !== before ) {
		fs.writeFileSync( p, after );
		changed.push( file );
	}
}

// 1. main plugin file - header + constant
update( 'click-to-chat-files.php', ( s ) => s
	.replace( /^(Version:\s*)([\d.]+)/m, `$1${ version }` )
	.replace( /(HT_CTC_FILES_VERSION',\s*')([\d.]+)(')/, `$1${ version }$3` )
);

// 2 + 3. readme - stable tag and changelog stub
update( 'readme.txt', ( s ) => {
	let out = s.replace( /^(Stable tag:\s*)([\d.]+)/m, `$1${ version }` );

	const hasEntry = new RegExp( `^=\\s*${ version.replace( /\./g, '\\.' ) }\\s*=`, 'm' ).test( out );
	if ( ! hasEntry ) {
		// keep one blank line between the heading, the new entry and the
		// previous entry - readme.txt entries are separated by blank lines.
		out = out.replace(
			/^== Changelog ==[ \t]*\n\s*/m,
			`== Changelog ==\n\n= ${ version } =\n* todo: changelog\n\n`
		);
	}
	return out;
} );

// 4. package.json - keep it as X.Y.0 (npm requires semver)
update( 'package.json', ( s ) => {
	const semver = /^\d+\.\d+$/.test( version ) ? `${ version }.0` : version;
	return s.replace( /("version":\s*")([\d.]+)(")/, `$1${ semver }$3` );
} );

if ( changed.length ) {
	console.log( `Bumped to ${ version }:` );
	changed.forEach( ( f ) => console.log( `  - ${ f }` ) );
	console.log( '\nNext: write the changelog notes, then `npm run verify`.' );
} else {
	console.log( `Nothing changed - already at ${ version }?` );
}
