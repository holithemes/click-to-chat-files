/**
 * Generates a scoped build of the intl-tel-input stylesheet.
 *
 * tools/intl-2/intl-tel-input/css/intlTelInput.css
 *   ->  tools/intl-2/assets/css/intlTelInput-scoped.css (+ .min.css)
 *
 * assets/ is OUR build output, kept apart from the vendored intl-tel-input/
 * dir (which intl:sync wipes and re-copies). Sprite/image url()s are
 * rewritten from ../img/ to ../../intl-tel-input/img/ to match the layout.
 * tools/intl (24.x legacy) is frozen — this script never touches it.
 *
 * Why: if the theme/another plugin loads its own copy of intl-tel-input, both
 * stylesheets fight over the shared `.iti` class namespace and the `:root`
 * CSS variables (which carry the flag-sprite paths) - whichever loads last
 * breaks the other widget's design/flags. The scoped build only applies inside
 * elements carrying the `ctc_intl_tel_input_container` class (dedicated scope class - the wrapper gets it via the `containerClass` init option in number-field js; ht_ctc_defaults is NOT used here, it serves a different purpose):
 *
 * Transform rules (top-level selectors only — the v29 source uses native CSS
 * nesting, and nested selectors inherit the scope from their parent rule):
 *  - `:root`              -> scope class (vars inherit to all our elements)
 *  - `.iti...` roots      -> compound: `.iti.<scope>...`
 *  - `(el).iti__child...` -> descendant: `.<scope> (el).iti__child...`
 *  - `[dir=rtl] X`        -> `[dir=rtl] ` + transformed X
 *  - `@media` / `@supports` -> recurse into their rules
 *  - `@keyframes`         -> untouched (iti-* names don't collide on class scope)
 *
 * Run: npm run build:css
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';

const root = join( dirname( fileURLToPath( import.meta.url ) ), '..', '..' );

const SCOPE = '.ctc_intl_tel_input_container';

const srcPath = join( root, 'tools/intl-2/intl-tel-input/css/intlTelInput.css' );
const outPath = join( root, 'tools/intl-2/assets/css/intlTelInput-scoped.css' );
const outMinPath = join( root, 'tools/intl-2/assets/css/intlTelInput-scoped.min.css' );

function scopeSelector ( input ) {
	const sel = input.trim();

	if ( ':root' === sel ) {
		return SCOPE;
	}

	// [dir=rtl] / [dir="rtl"] prefix: keep it, transform the remainder.
	const dirMatch = sel.match( /^(\[dir="?rtl"?\])\s+(.*)$/ );
	if ( dirMatch ) {
		return dirMatch[ 1 ] + ' ' + scopeSelector( dirMatch[ 2 ] );
	}

	// Child element classes (.iti__xxx, optionally element-qualified like
	// input.iti__tel-input): never on the wrapper/dropdown roots, so a
	// descendant prefix is correct.
	if ( /^(?:[a-z]+)?\.iti__/.test( sel ) ) {
		return SCOPE + ' ' + sel;
	}

	// Root classes (.iti / .iti--modifier, possibly compounded): the scope
	// class lives on the same element, so compound it onto the first sequence.
	const rootMatch = sel.match( /^((?:\.iti(?:--[\w-]+)?)+)(?![\w-])(.*)$/ );
	if ( rootMatch ) {
		return rootMatch[ 1 ] + SCOPE + rootMatch[ 2 ];
	}

	throw new Error( 'Unhandled selector, extend the transform: ' + sel );
}

function scopeContainer ( container ) {
	container.each( ( node ) => {
		if ( 'rule' === node.type ) {
			node.selectors = node.selectors.map( scopeSelector );
		} else if ( 'atrule' === node.type && [ 'media', 'supports' ].includes( node.name ) ) {
			scopeContainer( node );
		}
		// other at-rules (@keyframes, @charset, ...) and comments: untouched.
	} );
}

const src = readFileSync( srcPath, 'utf8' );
const cssRoot = postcss.parse( src, { from: srcPath } );
scopeContainer( cssRoot );

// image urls: source css sits next to img/ (../img/...), the scoped build
// lives in assets/css/ - point urls back into the vendored library dir.
cssRoot.walkDecls( ( decl ) => {
	if ( decl.value.includes( '../img/' ) ) {
		decl.value = decl.value.replaceAll( '../img/', '../../intl-tel-input/img/' );
	}
} );
const scopedBody = cssRoot.toString();

function minify ( css ) {
	return css
		.replace( /\/\*[\s\S]*?\*\//g, '' )
		.replace( /\s+/g, ' ' )
		.replace( /\s*([{}:;,])\s*/g, '$1' )
		.replace( /;}/g, '}' )
		.trim();
}

// Generated from the library stylesheet - not hand-written, and not the
// unminified twin of the .min file, so say so.
const banner = `/* intl-tel-input styles scoped under \`${ SCOPE }\` - generated from ` +
	`tools/intl-2/intl-tel-input/css/intlTelInput.css by dev/scripts/build-scoped-css.mjs. Do not edit. */\n`;

mkdirSync( dirname( outPath ), { recursive: true } );
writeFileSync( outPath, banner + scopedBody + '\n' );
writeFileSync( outMinPath, banner.trim() + '\n' + minify( scopedBody ) + '\n' );

console.log( 'Wrote', outPath );
console.log( 'Wrote', outMinPath );
