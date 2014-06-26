/* global require */

require({
    config: {
        tpl: {
            variable: 'data'
        }
    },
    shim: {
        bootstrap: ['jquery']
    }
}, ['jquery', 'almanac'], function($, almanac) {

    almanac.ready(function() {

        var welcome = new almanac.views.Welcome();
        welcome.render();
        $('#main').html(welcome.el);

    });

});
