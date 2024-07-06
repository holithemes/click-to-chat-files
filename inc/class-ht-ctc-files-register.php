<?php
/**
 * Activate
 * deactivate (no custom post types or so.. to flush rewrite rules)
 * uninstall ( delete if set )
 * 
 * @package ctc
 * @subpackage pro
 * @since 3.3
 */

if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! class_exists( 'HT_CTC_FILES_Register' ) ) :

class HT_CTC_FILES_Register {

    // when plugin activate
    public static function activate($call_back = 'activate') {

        if( version_compare( get_bloginfo('version'), '3.1.0', '<') )  {
            wp_die( 'please update WordPress' );
        }

        
        // // add default values to options db 
        // include_once( HT_CTC_FILES_PLUGIN_DIR . '/inc/class-ht-ctc-pro-db.php' );

        // if ( isset($call_back) && !empty( $call_back) ) {
        //     self::plugin_data($call_back);
        // } else {
        //     self::plugin_data('Activate');
        // }
        
    }
    
    // when plugin deactivate
    public static function deactivate() {

        // self::plugin_data('deactivate');
    }

    // when plugin uninstall 
    public static function uninstall() {

        // self::plugin_data('uninstall');

        // clear cache
        if ( function_exists('wp_cache_flush') ) {
            wp_cache_flush();
        }

    }

    // for plugin updates - run on plugins_loaded 
    public static function version_check() {
        
        // $ht_ctc_pro_plugin_details = get_option('ht_ctc_pro_plugin_details');

        // if ( !isset($ht_ctc_pro_plugin_details['version']) || HT_CTC_PRO_VERSION !== $ht_ctc_pro_plugin_details['version'] ) {
        //     //  to update the plugin - just like activate plugin
        //     self::activate('version change');
        // }
    }

    // add settings page links in plugins page - at plugin
    public static function plugin_action_links( $links ) {
		$new_links = array(
			'settings' => '<a href="' . admin_url( 'admin.php?page=click-to-chat' ) . '">' . __( 'Settings' , 'click-to-chat-for-whatsapp' ) . '</a>',
		);

		return array_merge( $new_links, $links );
	}
    

    public static function plugin_data($call_back = '') {
        
        // $call_back = $call_back;

        // $license_key = get_option( 'ht_ctc_pro_license_key' );
        // $license_status = get_option( 'ht_ctc_pro_license_status' );

        // $ht_ctc_plugin_details = get_option('ht_ctc_plugin_details');
        // $ht_ctc_pro_plugin_details = get_option('ht_ctc_pro_plugin_details');


        // $licenseKey = '';
        // if ( isset( $license_key ) && '' !== $license_key ) {
        //     $licenseKey = esc_attr( $license_key );
        // }
        // $licenseStatus = '';
        // if ( isset( $license_status ) && '' !== $license_status ) {
        //     $licenseStatus = esc_attr( $license_status );
        // }

        // $server_name = '';
        // if ( !empty ( $_SERVER['SERVER_NAME'] ) ) {
        //     $server_name = $_SERVER['SERVER_NAME'];
        // }

        // $http_host = '';
        // if ( !empty ( $_SERVER['HTTP_HOST'] ) ) {
        //     $http_host = $_SERVER['HTTP_HOST'];
        // }

        // $version = '';
        // if ( defined( 'HT_CTC_PRO_VERSION' ) ) {
        //     $version = HT_CTC_PRO_VERSION;
        // }
        
        // $ctc_version = ( defined( 'HT_CTC_VERSION' ) ) ? HT_CTC_VERSION : 1;
        // $ctc_first = (isset($ht_ctc_plugin_details['first_install_time'])) ? esc_attr($ht_ctc_plugin_details['first_install_time']) : 1;
        // $ctc_pro_first = ( isset( $ht_ctc_pro_plugin_details['first_install_time']) ) ? esc_attr($ht_ctc_pro_plugin_details['first_install_time']) : '';

        // $ctc_data = [
        //     'SERVER_NAME' => $server_name,
        //     'callBack' => $call_back,
        //     'Version' => $version,
        //     'HTTP_HOST' => $http_host,
        //     'License_Key' => $licenseKey,
        //     'License_Status' => $licenseStatus,
        //     'ctc_version' => $ctc_version,
        //     'ctc_first' => $ctc_first,
        //     'ctc_pro_first' => $ctc_pro_first
        // ];

        // $data = [
        //     'body' => [
        //         'ctc_data' => $ctc_data,
        //     ]
        // ];

        // $url = "https://holithemes.com/shop/";

        // wp_remote_post( $url, $data );


    }

    

}

endif; // END class_exists check