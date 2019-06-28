$(function() {

    $("input,textarea").jqBootstrapValidation({
        preventSubmit: true,
        submitError: function($form, event, errors) {
            // additional error messages or events
            console.log(errors)
        },
        submitSuccess: function($form, event) {
            event.preventDefault(); // prevent default submit behaviour
            // get values from FORM
            var name = $("input#inputFullname3").val();
            var email = $("input#inputEmail3").val();
            var startDate = $("input#inputStartDate3").val();
            var fullTime = $("input#gridCheck1").is(':checked')
            var partTime = $("input#gridCheck2").is(':checked')
            var onSite = $("input#gridCheck3").is(':checked')
            var offSite = $("input#gridCheck4").is(':checked')
            var slovakRepublic = $("input#gridCheck5").is(':checked')
            var czechRepublic = $("input#gridCheck6").is(':checked')
            var abroad = $("input#gridCheck7").is(':checked')
            var file  = document.querySelector('input[type=file]').files[0];
            var message = $("textarea#additional-info").val();            
            var consent = $("textarea#gridCheck8").is(':checked')


            var formData = new FormData(); 
            formData.append('name', name);
            formData.append('email', email);
            formData.append('startDate', startDate);

            formData.append('fullTime', fullTime);
            formData.append('partTime', partTime);
            formData.append('onSite', onSite);
            formData.append('offSite', offSite);

            formData.append('slovakRepublic', slovakRepublic);
            formData.append('czechRepublic', czechRepublic);
            formData.append('abroad', abroad);

            formData.append('file', file);
            formData.append('message', message);
            formData.append('consent', consent);

            var firstName = name; // For Success/Failure Message
            // Check for white space in name for Success/Fail message
            if (firstName.indexOf(' ') >= 0) {
                firstName = name.split(' ').slice(0, -1).join(' ');
            }
            $('#submit').attr('disabled', 'disabled');
            $.ajax({
                url: "https://skyvault.dopice.sk/send_cv.php",
                type: "POST",
                data: formData,
                dataType: 'text',
                cache: false,
                processData: false,
                contentType: false,
                success: function() {
                    // Success message
                    $('#success').html("<div class='alert alert-success'>");
                    $('#success > .alert-success').html("<button type='button' class='close' data-dismiss='alert' aria-hidden='true'>&times;")
                        .append("</button>");
                    $('#success > .alert-success')
                        .append("<strong>Your CV has been sent. Thank you " + firstName + "! </strong>");
                    $('#success > .alert-success')
                        .append('</div>');

                    $('#submit').hide(100);
                },
                error: function() {
                    // Fail message
                    $('#success').html("<div class='alert alert-danger'>");
                    $('#success > .alert-danger').html("<button type='button' class='close' data-dismiss='alert' aria-hidden='true'>&times;")
                        .append("</button>");
                    $('#success > .alert-danger').append("<strong>Sorry " + firstName + ", it seems that my mail server is not responding. Please try again later!");
                    $('#success > .alert-danger').append('</div>');

                    $('#submit').removeAttr('disabled');
                },
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
