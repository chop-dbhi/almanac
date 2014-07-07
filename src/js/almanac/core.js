/* global define */

define([
    'underscore',
    'backbone',
    './config',
    './utils',
], function(_, Backbone, config, utils) {

    var almanac = {
        // Version of almanac
        version: '0.1.0-beta',

        // Initialize the session manager and default configuration
        config: new config.Config(this.almanac),

        // Attach commonly used utilities
        utils: utils,

        urls: {}
    };

    // Give the almanac events
    _.extend(almanac, Backbone.Events);

    return almanac;
});
