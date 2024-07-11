(function ($) {
    // ready
    $(function () {

        console.log('ctc-init-intel.js loaded');

        var className = 'ctc_intl_number';
        var ht_ctc_storage = {};

        var limit_check_intl_loaded = 16;
        var is_check_intl_loaded_fn_called = 'n';
        var initial_country = '';


        var utils_js = '';
        var separate_dialcode = false;

        var ht_ctc_pro_number_field_lang = [];


        // todo
        var ctc_getItem = function (name, value) { return false };
        var ctc_setItem = function (item) { return false };



        if (ht_ctc_variables.intl_utils_js) {
            utils_js = ht_ctc_variables.intl_utils_js;
            console.log('utils js: ' + utils_js);
        }

        // separate_dialcode
        if (ht_ctc_variables.intl_separate_dialcode) {
            separate_dialcode = true;
            console.log('separate_dialcode is true');
        }


        check_intl_loaded();


        /**
         * check if intlTelInput exists.. if not exists.. then check after 500ms.. upto 16 times..
         */
        function check_intl_loaded() {
            console.log('check_intl_loaded()');

            // check if this function alreay called.. if called.. then return..
            if ('y' == is_check_intl_loaded_fn_called) {
                console.log('check_intl_loaded already called..');
                return;
            }
            is_check_intl_loaded_fn_called = 'y';


            var interval = setInterval(function () {
                if (typeof intlTelInput !== 'undefined') {
                    console.log('intlTelInput exists..');
                    clearInterval(interval);
                    intl_loaded();
                } else {
                    console.log('intlTelInput not exists..');
                    console.log('limit_check_intl_loaded: ' + limit_check_intl_loaded);
                    if (limit_check_intl_loaded <= 0) {
                        console.log('clearInterval: limit_check_intl_loaded reached..');
                        clearInterval(interval);
                    }
                }
                limit_check_intl_loaded--;
            }, 500);

        }

        // intl loaded.. then call foreach intl_init('classname')..
        function intl_loaded() {
            console.log('intl_loaded()');
            $('.' + className).each(function () {
                console.log('each: calling intl_init()..');
                console.log(this);
                var i = intl_init(this);
            });
        }





        // intl
        function intl_init(v) {

            console.log('intl_init()');

            // remove placeholder attribute..
            $(v).removeAttr('placeholder');


            // // padding left, right unset
            // $(v).css('padding-left', 'unset');
            // $(v).css('padding-right', 'unset');

            var hidden_input = $(v).attr("data-name") ? $(v).attr("data-name") : 'ctc_form_number';
            console.log('hidden_input: ' + hidden_input);

            // for email filed name have to match.
            var filed_name = $(v).attr("name") ? $(v).attr("name") : 'no_field_name';
            console.log('filed_name: ' + filed_name);

            // todo
            // hidden_input = "some[phone]";

            // $(v).removeAttr('name');

            if (ht_ctc_variables.intl_initial_country && '' !== ht_ctc_variables.intl_initial_country) {
                initial_country = ht_ctc_variables.intl_initial_country;
                console.log('initial_country: ' + initial_country);
            }


            /**
             * var country_code: get the current country code from local storage.. if not exists.. then fetch.. and assign to initial_country..
             */
            if ('auto' == initial_country) {
                console.log('initial_country is auto..');


                // todo: issue always fetching.. not saving in local storage..

                console.log(ctc_getItem);
                console.log(ctc_getItem('country_code_date'));
                console.log(ctc_getItem('country_code'));

                var country_code_date = new Date().toDateString();
                var country_code = (ctc_getItem('country_code_date') == country_code_date) ? ctc_getItem('country_code') : '';
                console.log('country_code: ' + country_code);

                if (country_code && '' !== country_code) {
                    initial_country = country_code;
                    call_intl();
                } else {
                    console.log('fetch country code..');

                    // fall back..
                    initial_country = 'us';

                    // todo.. test.. if not working.. 
                    $.get("https://ipinfo.io", function () { }, "jsonp").always(function (resp) {
                        country_code = (resp && resp.country) ? resp.country : "us";
                        ctc_setItem('country_code', country_code);
                        ctc_setItem('country_code_date', country_code_date);
                        initial_country = country_code;
                        call_intl();
                    });
                }


            } else {
                console.log('initial_country is not auto..');
                call_intl();
            }



            var intl = '';
            function call_intl() {

                console.log('call_intl() - intlTelInput()..');

                console.log('initial_country: ' + initial_country);

                // this works with CTC version: 4.6 (intltel version: 23.1.0)
                // if intl version is changed, this code might need to change..
                var values = {
                    // 'autoHideDialCode': false,
                    initialCountry: initial_country,
                    dropdownContainer: document.body,
                    hiddenInput: function () {
                        // return hidden_input;
                        return {
                            phone: hidden_input,
                            // country: 'ctc_form_country'
                        };
                    },
                    // nationalMode: false,
                    autoPlaceholder: "polite",
                    // placeholderNumberType: "MOBILE",
                    separateDialCode: separate_dialcode,
                    containerClass: 'intl_tel_input_container',
                }

                if (ht_ctc_pro_number_field_lang && ht_ctc_variables.intl_language && '' !== ht_ctc_variables.intl_language) {
                    values.i18n = ht_ctc_pro_number_field_lang[ht_ctc_variables.intl_language];
                }

                values.utilsScript = utils_js;

                console.log(values);

                // initialise
                intl = intlTelInput(v, values);

                after_intltelinialised();

            }


            // after intltelinput is initialised..
            function after_intltelinialised() {
                console.log('after_intltelinialised()');

                // ctc_intl_number

                // intlTelInput instance
                console.log(intl);

                // todo: add ctc_g_field_add_to_prefilled based on settings..
                intl.hiddenInput.classList.add('ht_ctc_g_form_field');
                intl.hiddenInput.classList.add('ctc_g_field_add_to_prefilled');

                // add attribute.. data-name
                intl.hiddenInput.setAttribute('data-name', hidden_input);

                // change name attribute..
                intl.hiddenInput.setAttribute('name', filed_name);
            }

            return intl;
        }



    });
})(jQuery);