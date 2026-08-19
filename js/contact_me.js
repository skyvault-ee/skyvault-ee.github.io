$(function() {

    // contact_me.php answers HTTP 200 for EVERYTHING — success, validation
    // errors ("No arguments Provided!") and mail failures ("fail") alike.
    // Branching on the HTTP status therefore reported "message sent" while the
    // server had silently dropped the enquiry. Decide on the response BODY
    // instead, and fail closed: anything we do not positively recognise as a
    // success (including PHP warnings or fatal errors) is treated as a failure,
    // so we never tell a visitor their message went through when it did not.
    var SUCCESS_RESPONSE = /^(success|ok|sent|true|1)$/i;

    // User-facing strings come from data attributes on #contactForm so they
    // follow the page's language (see _includes/contact.html). The English
    // fallbacks only apply if the markup is missing an attribute.
    function msg(key, fallback) {
        var value = $('#contactForm').data(key);
        return value == null || value === '' ? fallback : String(value);
    }

    function serverSaidSuccess(response) {
        var body = $.trim(response == null ? '' : String(response));
        return body === '' || SUCCESS_RESPONSE.test(body);
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
        showAlert('success', $('<strong>').text(
            msg('msgSuccess', 'Thanks — your message has been sent.')));
    }

    // The form is the only contact channel on the page, so a failure message
    // must not be a dead end: say plainly that it did not send, and invite a
    // retry rather than implying the enquiry is on its way.
    function showFailure(lead, advice) {
        showAlert('danger', $('<span>')
            .append($('<strong>').text(lead))
            .append(document.createTextNode(' ' + advice)));
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
                        showFailure(
                            msg('msgInvalidLead', 'We could not send that.'),
                            msg('msgInvalidAdvice', 'Please check your details — the email address in particular — and try again.')
                        );
                    } else {
                        showFailure(
                            msg('msgFailLead', 'Sorry, your message could not be sent.'),
                            msg('msgFailAdvice', 'Please try again in a few minutes.')
                        );
                    }
                    // Deliberately NOT resetting the form: the visitor keeps
                    // what they typed and can retry without retyping it.
                },
                error: function() {
                    showFailure(
                        msg('msgOfflineLead', 'Sorry, our mail server is not responding right now.'),
                        msg('msgOfflineAdvice', 'Please try again in a few minutes.')
                    );
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
