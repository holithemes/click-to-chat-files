<?php
/**
 * hooks
 */

if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! class_exists( 'HT_CTC_Files_Admin_Hooks' ) ) :

class HT_CTC_Files_Admin_Hooks {

    public function __construct() {
        $this->hooks();
    }


    public function hooks() {

        // 2019 admin UI
        add_action( 'ht_ctc_ah_admin_scripts_start', array($this, 'admin_scripts') );

        // 2026 admin UI (admin2) - fires a different enqueue action, and the
        // license field lives in the License tab instead of the sidebar.
        add_action( 'ht_ctc_ah_before_admin_enqueue_scripts', array($this, 'admin_scripts') );

    }




    /**
     * admin scripts hook
     */
    public function admin_scripts() {

        $os = get_option('ht_ctc_othersettings');
        
        // js
        $js = 'admin.js';

        if ( isset($os['debug_mode']) ) {
            $js = 'admin.dev.js';
        }

        if ( defined( 'HT_CTC_FILES_PLUGIN_FILE' ) ) {
            wp_enqueue_script( 'ctc_files_admin_js', plugins_url( "admin/admin_assets/js/$js", HT_CTC_FILES_PLUGIN_FILE ), array( 'jquery' ), HT_CTC_FILES_VERSION, true );
        }
    }
















}

new HT_CTC_Files_Admin_Hooks();

endif; // END class_exists check