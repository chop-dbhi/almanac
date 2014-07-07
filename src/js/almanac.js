/* global define */

define([
    'underscore',
    './almanac/core',
    './almanac/components',
    './almanac/models',
    './almanac/models',
    './almanac/views',
    './almanac/templates',
    './almanac/setup'
], function(_, almanac, components, models, store, views, templates) {

    // Attach containers of models and ui (views) components
    almanac.components = components;
    almanac.models = models;
    almanac.store = models.store;
    almanac.views = views;
    almanac.templates = templates;

    // Update to additional asynchronous checks
    var checkReady = function() {
        return templates.ready();
    };

    // Initial check
    var ready = checkReady();

    // Takes a handler to call once Almanac has declared itself "ready".
    // Once almanac is ready, subsequent handlers will be executed
    // immediately.
    almanac.ready = function(handler) {
        if (ready) {
            if (handler) handler();
            return;
        }

        // Re-evalute ready status every 15 ms
        var intervalId = setInterval(function() {
            ready = checkReady();

            if (ready) {
                clearTimeout(timeoutId);
                clearTimeout(intervalId);
                almanac.trigger('ready', almanac);

                if (handler) handler();
            }
        }, 15);

        // Add a timeout in case there is a bug or something cause the components
        // never to be ready.
        var timeoutId = setTimeout(function() {
            clearTimeout(intervalId);

            almanac.notify({
                timeout: null,
                dismissable: false,
                level: 'error',
                header: 'Too long getting ready.',
                message: 'Sorry about that, a few of the components needed ' +
                         'to display the page took too longer to load. A ' +
                         '<a href="#" onclick="location.reload()">refresh</a> ' +
                         'sometimes resolves the issue.'
            });
        }, 500);
    };

    this.almanac = almanac;

    almanac.trigger('init', almanac);

    return almanac;

});
