/* global define */

define([
    'marionette'
], function(Marionette) {

    var Welcome = Marionette.ItemView.extend({
        template: 'welcome',

        serializeData: function() {
            return {
                projectLabel: 'Almanac'
            };
        }
    });

    return {
        Welcome: Welcome
    };

});
