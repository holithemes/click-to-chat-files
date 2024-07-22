<?php
/**
 * software license
 * 
 * Thing to change
 * 
 * sl.php
 *  HT_CTC_FILES_SL_STORE_URL
 *  HT_CTC_FILES_SL_ITEM_ID
 *  HT_CTC_FILES_SL_ITEM_NAME
 *  HT_CTC_FILES_LICENSE_PAGE
 * 
 *  ht_ctc_files_license_key
 *       
 *  class-ht-ctc-files-admin-sl.php - admin license settings
 *  HT_CTC_Files_Updater - class name, included file
 */

if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! class_exists( 'HT_CTC_FILES_SL' ) ) :

class HT_CTC_FILES_SL {

    public function __construct() {
        $this->define_constants();
        $this->hooks();
    }
    
    /**
     * Define Constants
     */
    private function define_constants() {
        
        // $this->define( 'HT_CTC_FILES_SL_STORE_URL', 'https://holithemes.com/shop/' );
        // $this->define( 'HT_CTC_FILES_SL_ITEM_ID', 5501 );
        // $this->define( 'HT_CTC_FILES_SL_ITEM_NAME', 'Click to Chat Files' );
        
        // todo
        // https://staging.techponder.com/
        // testing license key: 2658f3b3616878c0ac25a631f0ed2a48
        $this->define( 'HT_CTC_FILES_SL_STORE_URL', 'https://staging.techponder.com/' );
        $this->define( 'HT_CTC_FILES_SL_ITEM_ID', 65 );
        $this->define( 'HT_CTC_FILES_SL_ITEM_NAME', 'Ctc Files' );

        


        $this->define( 'HT_CTC_FILES_LICENSE_PAGE', 'click-to-chat' );

	}

	/**
     * @uses this->define_constants
     * @param string $name Constant name
     * @param string.. $value Constant value
     */
    function define( $name, $value ) {
        if ( ! defined( $name ) ) {
            define( $name, $value );
        }
	}

    function hooks() {
        add_action( 'init', array($this, 'plugin_updater') );
        
        add_action( 'ht_ctc_ah_admin_includes', function() {
            // software license - using ajax way (calls only in click to chat admin settings pages)
            include_once HT_CTC_FILES_PLUGIN_DIR . 'tools/sl/class-ht-ctc-files-admin-sl.php';
        } );
    }



    function plugin_updater() {

        $doing_cron = defined( 'DOING_CRON' ) && DOING_CRON;
        if ( ! current_user_can( 'manage_options' ) && ! $doing_cron ) {
            return;
        }

        if( !class_exists( 'HT_CTC_Files_Updater' ) ) {
            include_once HT_CTC_FILES_PLUGIN_DIR . 'tools/sl/class-ctc-files-updater.php';
        }

        $license_key = trim( get_option( 'ht_ctc_files_license_key' ) );

        // setup the updater
        if (false !== $license_key) {
            $updater = new HT_CTC_Files_Updater( HT_CTC_FILES_SL_STORE_URL, HT_CTC_FILES_PLUGIN_FILE,
                array(
                    'version' => HT_CTC_FILES_VERSION,             // current version number
                    'license' => $license_key,                     // license key
                    'item_id' => HT_CTC_FILES_SL_ITEM_ID,  // ID of the product
                    'item_name'  => urlencode( HT_CTC_FILES_SL_ITEM_NAME ),
                    'author'  => 'HoliThemes',                     // author of this plugin
                    'beta'    => false,
                )
            );
        }

    }


}

new HT_CTC_FILES_SL();

endif; // END class_exists check