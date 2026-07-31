<?php
/**
 * Click to Chat Files license - admin2 (2026 UI) markup.
 *
 * Deliberately reuses the SAME element ids/classes as the 2019 admin field in
 * tools/sl/class-ht-ctc-files-admin-sl.php, so admin/admin_assets/js/admin.js
 * drives both interfaces with no changes:
 *   #ctc_files_license_key, #ctc_files_activated, #ctc_files_license_button,
 *   .ctc_files_license_message, .ctc_files_get_license
 * and the ht_ctc_files_nonce field.
 *
 * Expects from the caller: $key, $status, $is_active, $hide.
 *
 * @package Click to Chat Files
 * @subpackage Admin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>
<div class="ctc-card" style="margin-top: 8px;">
	<div class="ctc-card-content">

		<h3 style="margin: 0 0 4px 0;">
			<?php esc_html_e( 'Click to Chat Files', 'click-to-chat-for-whatsapp' ); ?>
		</h3>
		<p class="description" style="margin-bottom: 12px;">
			<?php esc_html_e( 'Activate to receive updates for the Click to Chat Files plugin.', 'click-to-chat-for-whatsapp' ); ?>
		</p>

		<p class="description ctc_files_license_message" style="display:none; margin-bottom: 12px;"></p>

		<div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px;">
			<?php
			// data-ctc-no-track: keeps SettingsManager.js from flagging the page
			// as having unsaved changes - the key is stored by the ajax handler
			// (HT_CTC_FILES_Admin_SL::activate_license), not by the settings save.
			?>
			<input type="text" required id="ctc_files_license_key" name="ht_ctc_files_license_key"
				class="regular-text" data-ctc-no-track="true"
				value="<?php echo esc_attr( $key ); ?>"
				placeholder="<?php esc_attr_e( 'License Key', 'click-to-chat-for-whatsapp' ); ?>"
				autocomplete="off" spellcheck="false"
				style="flex: 1; margin: 0; max-width: none; <?php echo $is_active ? esc_attr( $hide ) : ''; ?>" />

			<input type="text" id="ctc_files_activated" class="regular-text" readonly
				data-ctc-no-track="true"
				value="<?php esc_attr_e( 'Activated', 'click-to-chat-for-whatsapp' ); ?>"
				style="flex: 1; margin: 0; max-width: none; color: var(--success); cursor: default; <?php echo $is_active ? '' : esc_attr( $hide ); ?>" />

			<?php wp_nonce_field( 'ht_ctc_files_nonce', 'ht_ctc_files_nonce' ); ?>

			<?php
			// Must stay an <input type="submit">: admin/admin_assets/js/admin.js
			// drives the label with .val() ("Activating...", then
			// "Deactivate License"), which is a no-op on a <button> element.
			// There is no surrounding <form>, and the handler preventDefaults,
			// so nothing is ever submitted.
			?>
			<input type="submit" id="ctc_files_license_button"
				name="<?php echo $is_active ? 'ctc_files_deactivate_btn' : 'ctc_files_activate_btn'; ?>"
				class="<?php echo $is_active ? 'ctc_files_deactivate_btn' : 'ctc_files_activate_btn'; ?> button button-secondary"
				style="margin: 0; white-space: nowrap;"
				value="<?php echo $is_active ? esc_attr__( 'Deactivate License', 'click-to-chat-for-whatsapp' ) : esc_attr__( 'Activate License', 'click-to-chat-for-whatsapp' ); ?>" />
		</div>

		<p class="ctc_files_get_license" style="<?php echo $is_active ? esc_attr( $hide ) : ''; ?>">
			<span class="ctc-help-links-group">
				<a href="https://holithemes.com/shop/downloads/click-to-chat-files/" target="_blank" class="external-link external-link--block">
					<?php esc_html_e( 'Get License', 'click-to-chat-for-whatsapp' ); ?>
					<span class="dashicons dashicons-external"></span>
				</a>
				<a href="https://holithemes.com/shop/" target="_blank" class="external-link external-link--block">
					<?php esc_html_e( 'My Account', 'click-to-chat-for-whatsapp' ); ?>
					<span class="dashicons dashicons-external"></span>
				</a>
			</span>
		</p>

	</div>
</div>
