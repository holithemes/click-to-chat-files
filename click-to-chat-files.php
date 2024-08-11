<?php
/*
Plugin Name: Click to Chat files
Plugin URI:  http://holithemes.com/plugins/click-to-chat/
Description: Files, third party tools - Addon for Click to Chat
Version:     0.8
Author:      HoliThemes
Author URI:  https://holithemes.com/plugins/click-to-chat/
Text Domain: click-to-chat-files
GitHub Plugin URI:  https://github.com/holithemes/click-to-chat-files/
*/

if ( ! defined( 'WPINC' ) ) {
	die('dont try to call this directly');
}

// ctc - Version - update version at readme above version, 'Stable tag', change log at readme.txt
if ( ! defined( 'HT_CTC_FILES_VERSION' ) ) {
	define( 'HT_CTC_FILES_VERSION', '0.8' );
}

// define HT_CTC_FILES_PLUGIN_FILE
if ( ! defined( 'HT_CTC_FILES_PLUGIN_FILE' ) ) {
	define( 'HT_CTC_FILES_PLUGIN_FILE', __FILE__ );
}

// define HT_CTC_FILES_PLUGIN_DIR
if ( ! defined( 'HT_CTC_FILES_PLUGIN_DIR' ) ) {
	define( 'HT_CTC_FILES_PLUGIN_DIR', plugin_dir_path( HT_CTC_FILES_PLUGIN_FILE ) );
}

include_once HT_CTC_FILES_PLUGIN_DIR .'inc/class-ht-ctc-files.php';

// create instance for the main file - HT_CTC_FILES
if ( class_exists( 'HT_CTC_FILES') ) {
	function ht_ctc_files() {
		return HT_CTC_FILES::instance();
	}
	ht_ctc_files();
}