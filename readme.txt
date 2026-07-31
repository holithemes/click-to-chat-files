=== Click to Chat Files ===
Requires at least: 4.6
Tested up to: 6.6.2
Requires PHP: 5.6
Contributors: holithemes
Stable tag: 1.3
Tags: whatsapp, whatsapp business, click to chat, whatsapp chat, WooCommerce WhatsApp
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

To host large files for the click-to-chat-pro plugin.

== Description ==

To host large files. 

Some plugin features are required to add large files. (but that feature may used by a very few users)
Instead of adding all the files to the pro plugin, we created a plugin to host large files.

There are two ways the pro plugin can call these files

1. [Click to Chat Files](https://holithemes.com/shop/downloads/click-to-chat-files/) plugin (or)
2. public repository at [github](https://github.com/holithemes/click-to-chat-files). 

If Click to Chat Files plugin is installed on the same site, click to chat pro plugin calls files from same site. i.e. form this plugin. Otherwise, it calls from a public repository hosted at github using jsdelivr CDN.


== Number (Intltel input) field ==

Number field with country code with flag.
Number placeholder as per country code.
localization.

This all required a lot of files to be hosted. instead of adding all these files directly to the pro plugin. we added a separate plugin to host all these files.



== Installation ==

== Frequently Asked Questions ==

== Upgrade Notice ==

== Changelog ==

= 1.3 =
* Added intl asset manifest (ht_ctc_fh_intl_assets filter) - this plugin now declares its own file layout, so Click to Chat PRO no longer hardcodes paths; future library updates need only a change here
* New asset generation 2 (tools/intl-2, see tools/README.md): intl-tel-input 29.1.2, conflict-safe by design - number-field.js loads the library as an ES module (no window globals, so another intl-tel-input copy on the page can't clash) and the stylesheet is scoped under .ctc_intl_container
* Generation 1 (tools/intl, intl-init.js) stays frozen - older Click to Chat PRO versions keep working unchanged
* License activation now works in the new (2026) admin interface - it appears in the License tab. Previously it only rendered in the classic admin sidebar, so the plugin could not be activated from the new UI
* Fixed __clone/__wakeup guard calling a WooCommerce-only function

= 1.2 =
* Added ht_ctc_defaults class name to the number field for better styling

= 1.1 =
* Updated Intltel Input library

= 1.0 =
* Initial release