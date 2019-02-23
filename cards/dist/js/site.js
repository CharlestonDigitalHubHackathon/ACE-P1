$(document).ready(function() {

    $('.run-script-button').click(function(e) {
        // Popup a Message
        alert('A Button was Clicked');

        e.preventDefault();
        return false;
    })

});