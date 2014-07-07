/* global define, require */

define([
    'underscore',
    'loglevel',

    'tpl!templates/index.html',
    'tpl!templates/error.html',
    'tpl!templates/empty.html',
    'tpl!templates/loading.html',

    'tpl!templates/search-input.html',
    'tpl!templates/component-type-item.html',

    'tpl!templates/notification.html',

    'tpl!templates/revision-item.html',

    'tpl!templates/properties-table.html',

    'tpl!templates/pages/search.html',

    'tpl!templates/pages/collections.html',
    'tpl!templates/pages/resources.html',

    'tpl!templates/relationship-item.html',

    'tpl!templates/pages/collection.html',
    'tpl!templates/pages/resource.html',
    'tpl!templates/pages/component.html',

    'tpl!templates/collection-item.html',

    'tpl!templates/resource-item.html',

    'tpl!templates/component-item.html',
    'tpl!templates/component-source-item.html',

    'tpl!templates/timeline-list-item.html',

    'tpl!templates/path-item.html'
], function(_, loglevel) {

    // Registers all built-in templates using the augmented _moduleName from
    // a modified version of the RequireJS tpl plugin.
    var templates = [].slice.call(arguments, 2);

    // Built-in templates and application-defined templates
    var defaultTemplates = {},
        customTemplates = {};

    // Derives a template id from the template's path. This is an internal
    // function that assumes the base directory is under templates/
    var pathToId = function(name) {
        // Remove leading slash
        if (name.charAt(0) === '/') {
            name = name.substr(1);
        }

        // Remove relative paths
        name = name.replace(/\.\.\//g, '');

        // Remove templates prefix, strip extension
        return name.replace(/templates\//, '').replace(/\.html$/, '');
    };

    _.each(templates, function(func) {
        func.templateId = pathToId(func._moduleName);
        defaultTemplates[func.templateId] = func;
    });

    // Templates can be registered as AMD modules which will be immediately
    // fetched to obtain the resulting compiled template function. This is
    // count of the number of pending AMD modules that have not been fetched.
    var pendingRemotes = 0;

    // Loads the remote template and adds it to the custom cache.
    var loadRemote = function(id, module) {
        pendingRemotes++;

        require([
            module
        ], function(func) {
            // No id, anonymous function, assume loaded via the tpl! plugin
            if (!id) {
                id = func;
                func = null;
            }

            _set(id, func);

            pendingRemotes--;
        }, function(err) {
            loglevel.debug(err);
            pendingRemotes--;
        });
    };

    // Handles the case when the registered function is *not* a function.
    var _set = function(id, func) {
        // Assume template loaded via the tpl! plugin
        if (typeof id === 'function') {
            func = id;
            if (!func._moduleName) {
                throw new Error('cannot register anonymous template');
            }
            id = pathToId(func._moduleName);
        }
        // Assume bare id is a remote path
        else if (!func) {
            func = id;
            id = null;
        }

        switch (typeof func) {
            case 'function':
                customTemplates[id] = func;
                break;
            case 'string':
                loadRemote(id, func);
                break;
            default:
                throw new Error('template must be a function or AMD module');
        }
    };

    return {
        // Get the template function by id. Checks the custom cache and falls back
        // to the built-in cache.
        get: function(id) {
            return customTemplates[id] || defaultTemplates[id];
        },

        // Sets a template in cache.
        set: function(id, func) {
            if (_.isArray(id)) {
                _.each(id, function(func) {
                    this.set(func);
                }, this);
            }
            else if (_.isFunction(id)) {
                _set(id);
            }
            else if (_.isObject(id)) {
                _.each(id, function(func, key) {
                    this.set(key, func);
                }, this);
            }
            else {
                _set(id, func);
            }
        },

        // Returns a boolean denoting if all AMD-based templates have been loaded.
        ready: function() {
            return pendingRemotes === 0;
        },

        // Clears the custom templates
        clear: function() {
            customTemplates = {};
        }
    };

});
