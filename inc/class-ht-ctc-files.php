<?php
/**
 * files Plugin
 *  
 */

if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! class_exists( 'HT_CTC_FILES' ) ) :

class HT_CTC_FILES {

    /**
     * singleton instance
     *
     * @var HT_CTC_FILES 
     */
    private static $instance = null;
    
    /**
     * main instance - HT_CTC
     *
     * @return HT_CTC_FILES instance
     * @since 1.0
     */
    public static function instance() {
        if ( is_null( self::$instance ) ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function __clone() {
		wc_doing_it_wrong( __FUNCTION__, __( 'Cheatin&#8217; huh?', 'click-to-chat-for-whatsapp' ), '1.0' );
    }
    
    public function __wakeup() {
		wc_doing_it_wrong( __FUNCTION__, __( 'Cheatin&#8217; huh?', 'click-to-chat-for-whatsapp' ), '1.0' );
    }

    /**
     * constructor 
     * hooks()  -> run hooks 
     */
    public function __construct() {
        $this->define_constants();
        $this->hooks();
    }


    /**
     * Define Constants
     */
    private function define_constants() {
        
		$this->define( 'HT_CTC_FILES_PLUGIN_BASENAME', plugin_basename( HT_CTC_FILES_PLUGIN_FILE ) );

	}

	/**
     * @uses this->define_constants
     * @param string $name Constant name
     * @param string.. $value Constant value
     */
    private function define( $name, $value ) {
        if ( ! defined( $name ) ) {
            define( $name, $value );
        }
	}

    
    /**
     * Register hooks - when plugin activate, deactivate, uninstall
     * commented deactivation, uninstall hook - its not needed as now
     * 
     * plugins_loaded  - Check Diff - uses when plugin updates.
     * 
     * 
     * @note: Add at init - if 'values->HT_CTC_Values' is needed and works if load at init.
     */
    private function hooks() {

        include_once HT_CTC_FILES_PLUGIN_DIR .'inc/class-ht-ctc-files-register.php';
        register_activation_hook( HT_CTC_FILES_PLUGIN_FILE, array( 'HT_CTC_FILES_Register', 'activate' )  );
        register_deactivation_hook( HT_CTC_FILES_PLUGIN_FILE, array( 'HT_CTC_FILES_Register', 'deactivate' )  );
        register_uninstall_hook(HT_CTC_FILES_PLUGIN_FILE, array( 'HT_CTC_FILES_Register', 'uninstall' ) );
        
        // init
        add_action( 'init', array( $this, 'init' ), 0 );
        add_action( 'ht_ctc_ah_init_before', array( $this, 'ctc_init' ), 0 );

        // when plugin updated - check version diff
        add_action('plugins_loaded', array( 'HT_CTC_FILES_Register', 'version_check' ) );
        
        // settings page link
        if ( defined( 'HT_CTC_VERSION' ) ) {
            add_filter( 'plugin_action_links_' . HT_CTC_FILES_PLUGIN_BASENAME, array( 'HT_CTC_FILES_Register', 'plugin_action_links' ) );
        }


    }


    /**
     * Init
     * if anything to work before init call at this->basic()
     */
    public function init() {
        
        // if ( is_admin() ) {
        //     // TGM:
        //     include_once HT_CTC_FILES_PLUGIN_DIR .'inc/tools/tgm/tgm.php';
        // } else {
        // }
    }


    /**
     * CTC Init
     * @uses this->hooks() - using ht_ctc_ah_init_before hook - priority 0
     */
    public function ctc_init() {
        
        if ( is_admin() ) {
            include_once HT_CTC_FILES_PLUGIN_DIR .'admin/admin.php';
        } else {
        }


    }



}

endif; // END class_exists check