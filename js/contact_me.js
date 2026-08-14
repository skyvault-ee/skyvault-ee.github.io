$(function() {

    // contact_me.php answers HTTP 200 for EVERYTHING — success, validation
    // errors ("No arguments Provided!") and mail failures ("fail") alike.
    // Branching on the HTTP status therefore reported "message sent" while the
    // server had silently dropped the enquiry. Decide on the response BODY
    // instead, and fail closed: anything we do not positively recognise as a
    // success (including PHP warnings or fatal errors) is treated as a failure,
    // so we never tell a visitor their message went through when it did not.
    var SUCCESS_RESPONSE = /^(success|ok|sent|true|1)$/i;

    function serverSaidSuccess(response) {
        var body = $.trim(response == null ? '' : String(response));
        return body === '' || SUCCESS_RESPONSE.test(body);
    }

    // Kept in one place so the address is never duplicated: the contact section
    // renders it from site.email, and .js files are not run through Liquid.
    function fallbackEmail() {
        var href = $('.contact-alt a').attr('href') || '';
        return href.replace(/^mailto:/, '');
    }

    function showAlert(type, html) {
        $('#success').html(
            $('<div>')
                .addClass('alert alert-' + type)
                .append(
                    $('<button>')
                        .attr({ type: 'button', 'data-dismiss': 'alert', 'aria-hidden': 'true' })
                        .addClass('close')
                        .html('&times;')
                )
                .append(html)
        );
    }

    function showSuccess() {
        showAlert('success', $('<strong>').text('Thanks — your message has been sent.'));
    }

    // Never a dead end: if the form cannot deliver, hand over the mail address
    // so the enquiry is not lost.
    function showFailure(lead) {
        var email = fallbackEmail();
        var $msg = $('<span>').append($('<strong>').text(lead));

        if (email) {
            $msg.append(
                document.createTextNode(' Please email us directly at '),
                $('<a>').attr('href', 'mailto:' + email).text(email),
                document.createTextNode('.')
            );
        }

        showAlert('danger', $msg);
    }

    $("input,textarea").jqBootstrapValidation({
        preventSubmit: true,
        submitError: function($form, event, errors) {
            // additional error messages or events
        },
        submitSuccess: function($form, event) {
            event.preventDefault(); // prevent default submit behaviour

            var name = $("input#name").val();
            var email = $("input#email").val();
            var phone = $("input#phone").val();
            var message = $("textarea#message").val();

            $.ajax({
                url: "https://skyvault.dopice.sk/contact_me.php",
                type: "POST",
                data: {
                    name: name,
                    phone: phone,
                    email: email,
                    message: message
                },
                cache: false,
                success: function(response) {
                    if (serverSaidSuccess(response)) {
                        showSuccess();
                        $('#contactForm').trigger("reset");
                        return;
                    }

                    // HTTP 200, but the server reported a problem.
                    if (/no arguments provided/i.test(String(response))) {
                        showFailure('We could not send that — some details were missing or the email address looked invalid.');
                    } else {
                        showFailure('Sorry, your message could not be sent.');
                    }
                    // Deliberately NOT resetting the form: the visitor keeps
                    // what they typed and can retry or copy it into an email.
                },
                error: function() {
                    showFailure('Sorry, our mail server is not responding right now.');
                }
            })
        },
        filter: function() {
            return $(this).is(":visible");
        },
    });

    $("a[data-toggle=\"tab\"]").click(function(e) {
        e.preventDefault();
        $(this).tab("show");
    });
});


/*When clicking on Full hide fail/success boxes */
$('#name').focus(function() {
    $('#success').html('');
});
