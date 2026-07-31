<?php
/**
 * Click to Chat Files license - admin2 (2026 UI) tab integration.
 *
 * The 2019 admin renders the license field into the settings sidebar via
 * 'ht_ctc_ah_admin_sidebar_contact'. That hook does not exist in the 2026 UI,
 * so without this the license field is simply invisible there and the plugin
 * cannot be activated (which also means no update notices).
 *
 * Rather than adding a second "License" nav item next to Click to Chat PRO's,
 * this APPENDS to the existing License tab, so one screen holds both licenses.
 * That tab is registered by PRO (HT_CTC_Pro_Settings_License); if PRO is
 * inactive or predates it, the filter never runs and nothing is rendered -
 * no fatal, the 2019 UI still works.
 *
 * @package Click to Chat Files
 * @subpackage Admin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'HT_CTC_FILES_Settings_License' ) ) {

	/**
	 * Adds the Click to Chat Files license block to the admin2 License tab.
	 */
	class HT_CTC_FILES_Settings_License {

		/**
		 * Append the license block to the License tab fields.
		 *
		 * Hooked to 'ht_ctc_fh_settings_fields_license' at a priority AFTER
		 * PRO's own handler, which returns a fresh array and would otherwise
		 * discard anything added earlier.
		 *
		 * @param array $fields Fields already registered for the tab.
		 * @return array
		 */
		public static function fields( $fields ) {

			$license_key    = get_option( 'ht_ctc_files_license_key' );
			$license_status = get_option( 'ht_ctc_files_license_status' );

			$key    = ( false !== $license_key ) ? esc_attr( $license_key ) : '';
			$status = ( false !== $license_status ) ? esc_attr( $license_status ) : '';

			$is_active = ( 'valid' === $status );
			$hide      = 'display: none;';

			$panel = HT_CTC_FILES_PLUGIN_DIR . 'admin2/views/panels/license.php';
			if ( ! file_exists( $panel ) ) {
				return $fields;
			}

			ob_start();
			include $panel;
			$html_content = ob_get_clean();

			if ( ! is_array( $fields ) ) {
				$fields = array();
			}

			$fields[] = array(
				'field_type' => 'block_raw_html',
				'content'    => $html_content,
				'variables'  => true,
			);

			return $fields;
		}
	}
}
