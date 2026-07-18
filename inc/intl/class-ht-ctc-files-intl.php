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
		 * Declares the current assets (tools/intl, 24.x) - identical files to
		 * what production loads today, just resolved through the manifest
		 * instead of hardcoded paths in PRO.
		 *
		 * UPGRADE PATH: when a newer library version ships (in its own new
		 * dir + init script), bump 'generation' and the URLs here - that is
		 * the only place to touch.
		 *
		 * @param array $assets Incoming manifest (empty unless another handler set it).
		 * @return array {
		 *     @type int    $generation Library major generation. Integer -
		 *                              scales when future majors arrive.
		 *     @type string $css        Stylesheet URL.
		 *     @type string $js         Library URL.
		 *     @type string $init_js    Init script URL (initialises the fields).
		 *     @type string $locale_url Base dir for locale files; consumer
		 *                              appends the generation-specific suffix.
		 *     @type string $utils_js   utils.js URL ('' if a future bundle includes utils).
		 *     @type string $version    This plugin's version (cache busting).
		 * }
		 */
		public function manifest( $assets ) {

			$base = HT_CTC_FILES_PLUGIN_FILE;

			// dev (unminified) init script when debug_mode is on (HT Commons owns this option).
			$os      = get_option( 'ht_ctc_othersettings' );
			$init_js = ( isset( $os['debug_mode'] ) ) ? 'intl-init.dev.js' : 'intl-init.js';

			return array(
				'generation' => 24,
				'css'        => plugins_url( 'tools/intl/css/intlTelInput.min.css', $base ),
				'js'         => plugins_url( 'tools/intl/js/intlTelInput.min.js', $base ),
				'init_js'    => plugins_url( 'inc/assets/js/' . $init_js, $base ),
				'locale_url' => plugins_url( 'tools/intl/js/i18n/', $base ),
				'utils_js'   => plugins_url( 'tools/intl/js/utils.js', $base ),
				'version'    => HT_CTC_FILES_VERSION,
			);
		}
	}

	new HT_CTC_FILES_Intl();

endif; // END class_exists check
