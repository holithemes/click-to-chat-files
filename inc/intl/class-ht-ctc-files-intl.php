<?php
/**
 * Intl-tel-input asset manifest - this plugin's declaration of what it ships.
 *
 * THIS FILE IS THE SOURCE OF TRUTH for the intl-tel-input asset layout.
 * The consumer (Click to Chat PRO >= 2.23) reads the 'ht_ctc_fh_intl_assets'
 * filter instead of hardcoding paths - so files here can be moved, renamed
 * or upgraded without a matching PRO release.
 *
 * Layout rules (compatibility with older consumers):
 *  - tools/intl (24.x) is FROZEN - old PRO versions hardcode those paths.
 *  - a future library MAJOR ships in a NEW dir (e.g. tools/intl_<major>/) +
 *    its own init script; update 'generation' + the URLs here. Never
 *    repurpose an existing dir - old consumers (and old jsDelivr tags)
 *    must keep working.
 *
 * @package Click_To_Chat_Files
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'HT_CTC_FILES_Intl' ) ) :

	/**
	 * Declares the intl-tel-input asset manifest.
	 */
	class HT_CTC_FILES_Intl {

		/**
		 * Constructor - register the manifest filter.
		 */
		public function __construct() {
			add_filter( 'ht_ctc_fh_intl_assets', array( $this, 'manifest' ) );
		}

		/**
		 * Intl-tel-input asset manifest (consumed by Click to Chat PRO).
		 *
		 * Declares generation 2 - tools/intl-2/:
		 *  - intl-tel-input/  vendored library dist (verbatim; VERSION file
		 *    records the synced release - currently 29.1.2).
		 *  - assets/css/      scoped stylesheet: every selector and the :root
		 *    vars (flag sprite paths) apply only inside .ht_ctc_defaults, so
		 *    another intl-tel-input copy on the page can't clash either way.
		 *  - assets/js/       intl-input.js: self-contained ES module - imports
		 *    the library RELATIVELY (no window globals at all, conflict-safe by
		 *    construction), manages the hidden form field, locale, country lookup.
		 *
		 * The consumer must load init_js as a module (script type="module").
		 * 'js' / 'locale_url' / 'utils_js' are '' on generation 2 - the module
		 * resolves the library and locale files itself via relative imports.
		 *
		 * Library updates inside intl-2: npm run intl:sync + npm run build
		 * (exact-pinned in package.json; major changes are guarded).
		 *
		 * generation = INTEGRATION generation (not the library major):
		 *  1 = legacy era (tools/intl, inc/assets/js/intl-init.js - frozen).
		 *  2 = tools/intl-2. Old PRO versions (pre-manifest) never read this
		 *      filter and keep loading the frozen generation-1 paths.
		 *
		 * @param array $assets Incoming manifest (empty unless another handler set it).
		 * @return array {
		 *     @type int    $generation Integration generation (see above).
		 *     @type string $css        Stylesheet URL.
		 *     @type string $js         Library URL ('' when init_js resolves it itself).
		 *     @type string $init_js    Init/flow script URL.
		 *     @type string $locale_url Base dir for locale files ('' when self-resolved).
		 *     @type string $utils_js   utils.js URL ('' when the bundle includes utils).
		 *     @type string $version    This plugin's version (cache busting).
		 * }
		 */
		public function manifest( $assets ) {

			$base = HT_CTC_FILES_PLUGIN_FILE;

			// dev (unminified) init script when debug_mode is on (HT Commons owns this option).
			$os      = get_option( 'ht_ctc_othersettings' );
			$init_js = ( isset( $os['debug_mode'] ) ) ? 'intl-input.dev.js' : 'intl-input.js';

			return array(
				'generation' => 2,
				'css'        => plugins_url( 'tools/intl-2/assets/css/intlTelInput-scoped.min.css', $base ),
				'js'         => '',
				'init_js'    => plugins_url( 'tools/intl-2/assets/js/' . $init_js, $base ),
				'locale_url' => '',
				'utils_js'   => '',
				'version'    => HT_CTC_FILES_VERSION,
			);
		}
	}

	new HT_CTC_FILES_Intl();

endif; // END class_exists check
