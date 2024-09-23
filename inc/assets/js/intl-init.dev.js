(function ($) {
    // ready
    $(function () {
        
        var className = 'ctc_intl_number';
        
        var limit_check_intl_loaded = 24;
        var is_check_intl_loaded_fn_called = 'n';

        var initial_country = '';
        var ht_ctc_pro_number_field_lang = [];

        var ht_ctc_storage = {};

        function getStorageData() {
            // console.log('getStorageData');
            if (localStorage.getItem('ht_ctc_storage')) {
                ht_ctc_storage = localStorage.getItem('ht_ctc_storage');
                ht_ctc_storage = JSON.parse(ht_ctc_storage);
                // console.log(ht_ctc_storage);
            }
        }
        getStorageData();

        // get items from ht_ctc_storage
        function ctc_getItem(item) {
            // console.log('ctc_getItem');
            return (ht_ctc_storage[item]) ? ht_ctc_storage[item] : false;
        }

        // set items to ht_ctc_storage storage
        function ctc_setItem(name, value) {
            // console.log(ht_ctc_storage);
            getStorageData();
            console.log(ht_ctc_storage);
            // console.log('ctc_setItem: name: ' + name + ' value: ' + value);
            ht_ctc_storage[name] = value;
            // console.log(ht_ctc_storage);
            var newValues = JSON.stringify(ht_ctc_storage);
            localStorage.setItem('ht_ctc_storage', newValues);
        }


        // initial_country
        if (ht_ctc_variables.intl_initial_country && '' !== ht_ctc_variables.intl_initial_country) {
            initial_country = ht_ctc_variables.intl_initial_country;
            console.log('initial_country: ' + initial_country);
        }

        // get the current country code from local storage.. if not exists.. then fetch.. and assign to initial_country..
        if ('auto' == initial_country) {
            console.log('initial_country is auto..');

            console.log(ctc_getItem('country_code_date'));
            console.log(ctc_getItem('country_code'));

            var country_code_date = new Date().toDateString();
            var country_code = (ctc_getItem('country_code_date') == country_code_date) ? ctc_getItem('country_code') : '';
            console.log('country_code: ' + country_code);

            if (country_code && '' !== country_code) {
                initial_country = country_code;
                console.log('initial_country: ' + initial_country);
            } else {
                console.log('fetch country code');

                var fetch_country = $.get("https://ipinfo.io", function () { }, "jsonp").always(function (resp) {
                    console.log(resp);
                    country_code = (resp && resp.country) ? resp.country : "";
                    ctc_setItem('country_code', country_code);
                    ctc_setItem('country_code_date', country_code_date);
                    initial_country = country_code;
                    console.log('fetch: done..');
                    console.log('initial_country: ' + initial_country);
                    // another .always is added at intl_init function
                });
            }
        }

        // language..
        if (ht_ctc_variables.intl_language_path && '' !== ht_ctc_variables.intl_language_path) {
            console.log('intl_language_path: ' + ht_ctc_variables.intl_language_path);
            try {
                import(ht_ctc_variables.intl_language_path)
                    .then((module) => {
                        console.log('module');

                        console.log(module);
                        console.log(module.default);

                        ht_ctc_pro_number_field_lang[ht_ctc_variables.intl_language] = module.default;
                        console.log(ht_ctc_pro_number_field_lang);
                        check_intl_loaded();
                    })
                    .catch((e) => {
                        console.log(e);
                        check_intl_loaded();
                    });
            } catch (e) {
                console.log(e);
                check_intl_loaded();
            }
        } else {
            console.log('intl_language_path not added..');
            check_intl_loaded();
        }


        // check_intl_loaded();

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

            // $(v).removeAttr('name');


            var hidden_input = $(v).attr("data-name") ? $(v).attr("data-name") : 'ctc_form_number';
            console.log('hidden_input: ' + hidden_input);

            // for email filed name have to match.
            var filed_name = $(v).attr("name") ? $(v).attr("name") : 'no_field_name';
            console.log('filed_name: ' + filed_name);

            var add_to_prefilled = $(v).hasClass('ctc_g_field_add_to_prefilled') ? 'y' : 'n';
            console.log('add_to_prefilled: ' + add_to_prefilled);
            // remove class.. ctc_g_field_add_to_prefilled to input field. after_intltel_inialised adds to hidden input field..
            $(v).removeClass('ctc_g_field_add_to_prefilled');


            console.log('initial_country: ' + initial_country);

            var is_call_intl = 'no';

            // if initial_country is auto. 
            if ('auto' == initial_country && typeof fetch_country == 'object' && fetch_country.always ) {
                console.log('initial_country is auto..');

                // if featch takes long time.
                var fetch_time = 1;
                var fetch_interval = setInterval(function () {
                    console.log('fetch_time: ' + fetch_time);

                    if (5 < fetch_time) {
                        console.log('fetch_time: ' + fetch_time);
                        if ('yes' !== is_call_intl) {
                            is_call_intl = 'yes';
                            call_intl();
                        }
                        clearInterval(fetch_interval);
                    }
                    
                    fetch_time++;
                }, 1000);


                // after fetch the country..
                fetch_country.always(function () {
                    console.log('fetch_country.always');
                    console.log('initial_country: ' + initial_country);
                    if ('yes' !== is_call_intl) {
                        is_call_intl = 'yes';
                        call_intl();
                    }
                });

            } else {
                console.log('initial_country is fetched or not auto..');
                call_intl();
            }


            // call_intl();

            var intl = '';
            function call_intl() {

                console.log('call_intl() - intlTelInput()..');

                console.log('initial_country: ' + initial_country);

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
                    containerClass: 'intl_tel_input_container ht_ctc_defaults',
                }

                // separate_dialcode
                if (ht_ctc_variables.intl_separate_dialcode) {
                    values.separateDialCode = true;
                    console.log('separate_dialcode is true');
                }

                // add i18n
                if (ht_ctc_pro_number_field_lang && ht_ctc_variables.intl_language && '' !== ht_ctc_variables.intl_language) {
                    values.i18n = ht_ctc_pro_number_field_lang[ht_ctc_variables.intl_language];
                }

                // add utilsScript
                if (ht_ctc_variables.intl_utils_js) {
                    values.utilsScript = ht_ctc_variables.intl_utils_js;
                }
               

                console.log(values);

                // initialise
                intl = intlTelInput(v, values);

                // try {
                //     // adding z-index to country dropdown.. .iti--container class works when dropdown is opened.. or add css.. directly..
                //     // todo: ctc_number_padding { padding: 9px; }
                //     v.addEventListener('open:countrydropdown', function (e) {
                //         console.log('open:countrydropdown');
                //         var z_index = (ht_ctc_chat_var && ht_ctc_chat_var.z_index) ? ht_ctc_chat_var.z_index : 99999999;
                //         z_index = parseInt(z_index) + 5;
                //         $('.iti--container')[0].style.zIndex = z_index;
                //     });
                // } catch (e) {}

                after_intltel_inialised();

            }


            // after intltelinput is initialised..
            function after_intltel_inialised() {
                console.log('after_intltel_inialised()');

                // ctc_intl_number

                // intlTelInput instance
                console.log(intl);

                intl.hiddenInput.classList.add('ht_ctc_g_form_field');

                if ('y' == add_to_prefilled) {
                    intl.hiddenInput.classList.add('ctc_g_field_add_to_prefilled');
                }

                // add attribute.. data-name
                intl.hiddenInput.setAttribute('data-name', hidden_input);

                // change name attribute..
                intl.hiddenInput.setAttribute('name', filed_name);
            }

            return intl;
        }

        function scripts_styles() {

            var z_index = (ht_ctc_chat_var && ht_ctc_chat_var.z_index) ? ht_ctc_chat_var.z_index : 99999999;
            z_index = parseInt(z_index) + 5;

            // fallback if greeting-pro-1 internal css not loaded.. due to cache.. or any other reason..
            var style = document.createElement('style');
            style.innerHTML = '.iti { z-index: ' + z_index + ' }';
            style.innerHTML += '.ctc_number_padding, .iti__search-input { padding: 9px; }';
            style.innerHTML += '[dir="rtl"] .iti__dropdown-content { left: 0; }';
            document.head.appendChild(style);

        }
        scripts_styles();



    });
})(jQuery);