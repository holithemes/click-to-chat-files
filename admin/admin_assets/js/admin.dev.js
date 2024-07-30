(function ($) {

    // ready
    $(function () {

        software_license();


        // ctc_files_activate_license
        // ctc_files_activate - error
        function software_license() {

            $(document).on('click', '#ctc_files_license_button', function (e) {

                e.preventDefault();

                var keyfield = $('#ctc_files_license_key');
                messagebox = $('.ctc_files_license_message');
                btn = $('#ctc_files_license_button');
                btn_name = btn.attr('name');
                btnval = btn.val();
                getlicense = $('.ctc_files_get_license');
                nonce = $('#ht_ctc_files_nonce').val();

                messagebox.hide();

                var key = keyfield.val();

                if ('' == key) {
                    messagebox.html('Please Enter the License key!');
                    messagebox.show(100);
                    return;
                }
                key = key.replace(/[^a-z0-9]/gi, '');


                var action = 'ctc_files_activate_license';
                if ('ctc_files_activate_btn' == btn_name) {
                    action = 'ctc_files_activate_license';
                    btn.val('Activating...');
                } else if ('ctc_files_deactivate_btn' == btn_name) {
                    action = 'ctc_files_deactivate_license';
                    btn.val('Deactivating...');
                }

                btn.css('pointer-events', 'none');

                $.ajax({
                    url: ajaxurl,
                    data: {
                        action: action,
                        key: key,
                        ht_ctc_files_nonce: nonce,
                    },
                    type: "POST",
                    success: function (response) {
                        output(response);
                    },
                    error: function ( e ) {
                        // log error
                        console.log(e);
                        btn.val(btnval);
                        btn.css('pointer-events', 'auto');
                        messagebox.css('color', 'red');
                        messagebox.html('Error: some thing wrong: please try again or please contact Us');
                        messagebox.show(100);
                    }
                });

                function output(response) {

                    data = response.data;
                    message = response.data.message;

                    if ('Activated' == message) {
                        $('#ctc_files_activated').show();
                        keyfield.hide();
                        // activated - change btn content things to deactivate
                        // btn.html('Deactivate');
                        btn.val('Deactivate License');
                        btn.attr('name', 'ctc_files_deactivate_btn');
                        btn.removeClass('ctc_files_activate_btn').addClass('ctc_files_deactivate_btn');
                        messagebox.css('color', 'green');
                        getlicense.hide();
                    } else if ('Deactivated' == message) {
                        $('#ctc_files_activated').hide();
                        keyfield.show();
                        // btn.html('Activate');
                        btn.val('Activate License');
                        btn.attr('name', 'ctc_files_activate_btn');
                        btn.removeClass('ctc_files_deactivate_btn').addClass('ctc_files_activate_btn');
                        messagebox.css('color', 'yellowgreen');
                        getlicense.show(500);
                    } else {
                        // something wrong
                        btn.val(btnval);
                        messagebox.css('color', 'red');
                        messagebox.html(message);
                        messagebox.show(100);
                        getlicense.show(500);
                    }

                    btn.css('pointer-events', 'auto');

                }
            });
        }




    });


})(jQuery);