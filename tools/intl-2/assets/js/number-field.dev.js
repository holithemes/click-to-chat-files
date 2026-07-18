/**
 * number-field (intl-2, generation 2): the greetings form number field flow - initialises intl-tel-input on the Click to Chat greetings
 * form number field(s) (.ctc_intl_number).
 *
 * ES MODULE - the whole conflict-safe design in one file:
 *  - imports the library RELATIVELY from ../../intl-tel-input/ (works the
 *    same from the installed plugin and from jsDelivr). The constructor is
 *    module-scoped: window.intlTelInput is never read or written, so another
 *    intl-tel-input copy loaded by the theme/a plugin can't be picked up by
 *    mistake and can't be clobbered - no noConflict dance needed.
 *  - WithUtils bundle - utils built in, no separate utils.js coordination.
 *  - styles come from ../css/intlTelInput-scoped.css (all selectors and the
 *    :root vars scoped under .ctc_intl_tel_input_container - see dev/scripts/build-scoped-css.mjs).
 *
 * Loader contract (Click to Chat PRO, generation 2 flow): PRO loads THIS one
 * file as a module (script type="module" / dynamic import) at the configured
 * moment (nodelay / delay_1 / delay_2) - this file does the rest.
 *
 * Notes vs the legacy intl-init.js (tools/intl era):
 *  - vanilla JS, no jQuery, no polling.
 *  - manages its own hidden input: v29 only syncs its hidden inputs on a
 *    native form submit and does not expose them, but the greetings form
 *    reads .ht_ctc_g_form_field values on the WhatsApp CTA click. So the
 *    full number (E.164 via getNumber()) is synced here on input/countrychange.
 *  - v29 option names: dropdownParent, uiTranslations, countryNameLocale,
 *    initialCountryLookup (replaces the manual ipinfo pre-fetch).
 *
 * Localized data consumed from ht_ctc_variables (set by Click to Chat PRO):
 *  intl_initial_country, intl_separate_dialcode, intl_language.
 */

import intlTelInput from '../../intl-tel-input/js/intlTelInputWithUtils.mjs';

const CLASS_NAME = 'ctc_intl_number';
const SCOPE_CLASS = 'ctc_intl_tel_input_container';

// filled at init() - ht_ctc_variables may be printed after this module loads.
let vars = {};

function log( msg, data ) {
	if ( window.ht_ctc_debug || vars.debug ) {
		console.log( '[ht-ctc intl-2] ' + msg, ( 'undefined' !== typeof data ) ? data : '' );
	}
}

function init() {

	vars = ( 'undefined' !== typeof window.ht_ctc_variables ) ? window.ht_ctc_variables : {};

	const fields = document.querySelectorAll( '.' + CLASS_NAME );
	if ( ! fields.length ) {
		return;
	}

	addStyles();

	fields.forEach( ( field ) => {
		if ( '1' === field.getAttribute( 'data-ht-ctc-intl' ) ) {
			return; // already initialised
		}
		field.setAttribute( 'data-ht-ctc-intl', '1' );

		loadTranslations().then( ( uiTranslations ) => {
			initField( field, uiTranslations );
		} );
	} );
}

/**
 * uiTranslations: locale files are ES modules next to the library
 * (../../intl-tel-input/js/locale/{lang}.js, default export).
 * Loaded once, shared by all fields. Country names themselves come from
 * Intl.DisplayNames via countryNameLocale - no extra files needed.
 */
let translationsPromise = null;
function loadTranslations() {
	const lang = ( vars.intl_language && '' !== vars.intl_language ) ? vars.intl_language : '';
	if ( '' === lang || 'en' === lang ) {
		return Promise.resolve( null );
	}
	if ( ! translationsPromise ) {
		const localeUrl = new URL( `../../intl-tel-input/js/locale/${ lang }.js`, import.meta.url );
		translationsPromise = import( /* webpackIgnore: true */ localeUrl.href )
			.then( ( module ) => module.default || null )
			.catch( ( e ) => {
				log( 'locale load failed', e );
				return null;
			} );
	}
	return translationsPromise;
}

function initField( field, uiTranslations ) {

	log( 'init field', field );

	// placeholder comes from the library (example number per country)
	field.removeAttribute( 'placeholder' );

	const dataName = field.getAttribute( 'data-name' ) || 'ctc_form_number';
	const fieldName = field.getAttribute( 'name' ) || 'no_field_name';
	const addToPrefilled = field.classList.contains( 'ctc_g_field_add_to_prefilled' );

	// the hidden input carries the form-field markers; the visible input
	// holds whatever the user typed (national format).
	field.classList.remove( 'ctc_g_field_add_to_prefilled' );

	const country = initialCountry();

	const options = {
		dropdownParent: document.body,
		/**
		 * Two classes, two purposes:
		 *  - SCOPE_CLASS: our css scoping hook (the scoped stylesheet applies
		 *    only inside it).
		 *  - ht_ctc_defaults: opts this subtree OUT of the greetings box css
		 *    reset in the free plugin (`.ht_ctc_chat_greetings_box
		 *    *:not(...):not(.ht_ctc_defaults *) { padding:0; margin:0 }`).
		 *    Without it that reset strips the library's internal padding and
		 *    the flag/dial code lose their spacing.
		 */
		containerClass: SCOPE_CLASS + ' ht_ctc_defaults',
		initialCountry: ( 'auto' === country ) ? '' : country,
		initialCountryLookup: ( 'auto' === country ) ? countryLookup : null,
		hiddenInputs: null,
	};

	if ( vars.intl_separate_dialcode ) {
		options.separateDialCode = true;
	}

	if ( uiTranslations ) {
		options.uiTranslations = uiTranslations;
	}

	if ( vars.intl_language && '' !== vars.intl_language ) {
		// country names via Intl.DisplayNames - no country-name files needed.
		options.countryNameLocale = vars.intl_language;
	}

	const iti = intlTelInput( field, options );

	// own hidden input: full number in E.164, kept in sync. This is the
	// field the greetings form reads (ht_ctc_g_form_field / data-name).
	const hidden = document.createElement( 'input' );
	hidden.type = 'hidden';
	hidden.name = fieldName;
	hidden.setAttribute( 'data-name', dataName );
	hidden.classList.add( 'ht_ctc_g_form_field' );
	if ( addToPrefilled ) {
		hidden.classList.add( 'ctc_g_field_add_to_prefilled' );
	}
	field.parentNode.appendChild( hidden );

	function sync() {
		let number = '';
		try {
			number = iti.getNumber() || '';
		} catch {
			number = '';
		}
		hidden.value = ( '' !== number ) ? number : field.value;
	}
	field.addEventListener( 'input', sync );
	field.addEventListener( 'countrychange', sync );
	sync();

	return iti;
}

// ---- initial country ----

function initialCountry() {
	const c = ( vars.intl_initial_country && '' !== vars.intl_initial_country ) ? vars.intl_initial_country : '';
	return c.toLowerCase();
}

/**
 * Async lookup for initialCountry 'auto' (v29 initialCountryLookup).
 * Cached in localStorage (ht_ctc_storage) for the day, like the legacy init.
 */
function countryLookup() {
	const storage = getStorage();
	const today = new Date().toDateString();

	if ( storage.country_code && storage.country_code_date === today ) {
		log( 'country from cache: ' + storage.country_code );
		return Promise.resolve( storage.country_code.toLowerCase() );
	}

	return fetch( 'https://ipinfo.io/json' )
		.then( ( res ) => res.json() )
		.then( ( resp ) => {
			const code = ( resp && resp.country ) ? resp.country : '';
			setStorageItems( { country_code: code, country_code_date: today } );
			log( 'country fetched: ' + code );
			return code.toLowerCase();
		} )
		.catch( ( e ) => {
			log( 'country lookup failed', e );
			return '';
		} );
}

function getStorage() {
	try {
		return JSON.parse( localStorage.getItem( 'ht_ctc_storage' ) ) || {};
	} catch {
		return {};
	}
}

function setStorageItems( items ) {
	try {
		const storage = getStorage();
		Object.keys( items ).forEach( ( key ) => {
			storage[ key ] = items[ key ];
		} );
		localStorage.setItem( 'ht_ctc_storage', JSON.stringify( storage ) );
	} catch ( e ) {
		log( 'storage write failed', e );
	}
}

// ---- styles ----

/**
 * z-index fallback so the widget/dropdown layers above the page content
 * (the scoped stylesheet may be cached/blocked). Scoped to our class.
 */
function addStyles() {
	let zIndex = ( window.ht_ctc_chat_var && window.ht_ctc_chat_var.z_index ) ? window.ht_ctc_chat_var.z_index : 99999999;
	zIndex = parseInt( zIndex, 10 ) + 5;

	const style = document.createElement( 'style' );
	// z-index only. Deliberately does NOT touch the library's internals: v29
	// computes its own padding (the search input reserves room for the search
	// icon), so overriding padding here - as the v24-era init did - breaks it.
	style.textContent = '.iti.' + SCOPE_CLASS + ' { z-index: ' + zIndex + '; }';
	document.head.appendChild( style );
}

// module scripts are deferred; when injected dynamically the DOM may already
// be ready - handle both.
if ( 'loading' === document.readyState ) {
	document.addEventListener( 'DOMContentLoaded', init );
} else {
	init();
}
