/* global define */

define([
    'jquery',
    './utils'
], function($, utils) {


    var defaultOptions = {

        // Run in debug mode to turn off various behaviors that impede
        // development and increase logging output to the console.
        debug: false

    };


    // Takes N number of option objects with increasing precedence and deep
    // merges them with the default options.
    var Config = function() {
        this.reset.apply(this, arguments);
    };

    Config.prototype.reset = function() {
        var options = [].slice.call(arguments);
        this.options = $.extend.apply(null, [true, {}, defaultOptions].concat(options));
    };

    Config.prototype.get = function(key, def) {
        return utils.getDotProp(this.options, key, def);
    };

    Config.prototype.set = function(key, value) {
        utils.setDotProp(this.options, key, value);
    };

    Config.prototype.unset = function(key) {
        utils.setDotProp(this.options, key, undefined);
    };


    return {
        Config: Config,
        defaultOptions: defaultOptions
    };

});
