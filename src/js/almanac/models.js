/* global define */

define([
    'underscore',
    'backbone',
    'jquery',
    'url-template',
    'loglevel',
    './core'
], function(_, Backbone, $, url, logger, almanac) {

    // Placeholder object for reference. This will be populated with the
    // collection instances below.
    var store = {};


    var Api = Backbone.Model.extend({
        initialize: function(attrs, options) {
            this.url = options.url;
        }
    });


    // Returns an event handler bound to a store collection that synchronizes
    // the contents of passed data into the collection.
    var createSyncHandler = function(name) {
        return function(event, obj) {
            logger.debug('syncing', obj, 'on', event);

            switch (event) {
                case 'reset':
                    store[name].set(obj.models, {'remove': false});
                    break;
                case 'add':
                    store[name].add(obj);
                    break;
                case 'remove':
                    store[name].remove(obj);
                    break;
            }
        };
    };


    var relationshipsSyncHandler = createSyncHandler('relationships'),
        resourcesSyncHandler = createSyncHandler('resources'),
        collectionsSyncHandler = createSyncHandler('collections'),
        componentsSyncHandler = createSyncHandler('components');


    // Initializes instances to data linked by the model. The
    // URL function of the instance is set to use the model's
    // corresponding URL in the `_links` attribute
    var bindLinkedData = function(model, mapping) {
        _.each(mapping, function(klass, key) {
            if (model[key]) {
                throw new Error('model property "' + key + '" already defined');
            }

            var instance = new klass();

            model[key] = instance;

            instance.url = function() {
                return model.get('_links')[key].href;
            };
        });
    };


    // Initializes instances to data nested in this model.
    // A change event handler is defined to update the instace
    // on model attribute changes.
    var bindNestedData = function(model, mapping) {
        _.each(mapping, function(klass, key) {
            if (model[key]) {
                throw new Error('model property "' + key + '" already defined');
            }

            var instance = new klass(model.get(key));

            model[key] = instance;

            // Bind change event handler to parent
            instance.listenTo(model, 'change:' + key, function(obj, value) {
                this.set(value);
            });
        });
    };


    var BaseModel = Backbone.Model.extend({
        linked: {},

        nested: {},

        constructor: function(attributes, options) {
            var attrs = attributes || {};
            options = options || {};

            this.cid = _.uniqueId('c');
            this.attributes = {};

            this.fetched = false;
            this.fetching = false;
            this.fetchError = null;

            this.on('request', function(model, xhr) {
                this._xhr = xhr;
                this.fetching = true;
            });

            this.on('sync', function() {
                this.fetching = false;
                this.fetched = true;
            });

            this.on('error', function(obj, resp) {
                this.fetching = false;
                this.fetchError = resp;
            });

            if (options.collection) this.collection = options.collection;
            if (options.parse) attrs = this.parse(attrs, options) || {};

            attrs = _.defaults({}, attrs, _.result(this, 'defaults'));

            this.set(attrs, options);

            this.changed = {};

            bindLinkedData(this, _.result(this, 'linked'));
            bindNestedData(this, _.result(this, 'nested'));

            this.initialize.apply(this, arguments);
        },

        ensure: function(options) {
            if (this._xhr) return this._xhr;

            options = _.extend({reset: true}, options);

            return this.fetch(options);
        },

        parse: function(attrs) {
            if (attrs && attrs.timestamp) {
                attrs.parsedTimestamp = new Date(attrs.timestamp);
            }

            return attrs;
        }
    });

    var BaseCollection = Backbone.Collection.extend({
        constructor: function() {
            this.fetched = false;
            this.fetching = false;
            this.fetchError = null;

            this.on('request', function(collection, xhr) {
                this._xhr = xhr;
                this.fetching = true;
            });

            // This appears to be an odd handler, however when a fetch/reset occurs
            // the reset event triggers before the sync event, so this flag would not
            // in the correct state if downstream consumers relied on it. The solution
            // is to update the flags if the collection is in the process of fetching.
            this.on('reset sync', function() {
                if (this.fetching) {
                    this.fetching = false;
                    this.fetched = true;
                }
            });

            this.on('error', function(obj, resp) {
                this.fetching = false;
                this.fetchError = resp;
            });

            Backbone.Collection.prototype.constructor.apply(this, arguments);
        },

        ensure: function(options) {
            if (this._xhr) return this._xhr;

            options = _.extend({reset: true}, options);

            return this.fetch(options);
        }
    });


    var Component = BaseModel.extend({
        idAttribute: 'uuid',

        linked: function() {
            return {
                relationships: Relationships,
                revisions: Components,
                sources: Components,
                timeline: BaseCollection
            };
        },

        nested: function() {
            return {
                properties: BaseModel,
                path: Components
            };
        },

        url: function() {
            var t = url.parse(almanac.urls.component.href);
            return t.expand({uuid: this.get('uuid')});
        }
    });


    var Components = BaseCollection.extend({
        model: Component,

        initialize: function(models, options) {
            if (options && !options.nosync) {
                this.on('all', componentsSyncHandler);
            }
        },

        url: function() {
            return almanac.urls.components.href;
        },

        search: function(query) {
            // Reference the original URL the first time this is accessed
            if (!this._url) this._url = this.url;

            // Abort previous request if present
            if (this._xhr) this._xhr.abort();

            if (query) {
                var _this = this;

                this.url = function() {
                    return _.result(_this, '_url') + '?' + $.param({query: query});
                };

                this.fetch({reset: true});
            }
            else {
                this.url = this._url;
                this.reset(this.previousModels);
            }
        }
    });


    var Relationship = BaseModel.extend({
        idAttribute: 'uuid',

        nested: {
            properties: BaseModel
        },

        url: function() {
            var t = url.parse(almanac.urls.relationship.href);
            return t.expand({uuid: this.get('uuid')});
        }
    });


    var Relationships = BaseCollection.extend({
        model: Relationship,

        initialize: function(models, options) {
            if (options && !options.nosync) {
                this.on('all', relationshipsSyncHandler);
            }
        },

        url: function() {
            return almanac.urls.relationships.href;
        }
    });


    var Resource = BaseModel.extend({
        idAttribute: 'uuid',

        linked: {
            relationships: Relationships,
            components: Components
        },

        nested: {
            properties: BaseModel,
            component_types: BaseCollection  // jshint ignore:line
        },

        initialize: function() {
            this.component_types.constructor.prototype.comparator = 'count';  // jshint ignore:line
        },

        url: function() {
            var t = url.parse(almanac.urls.resource.href);
            return t.expand({uuid: this.get('uuid')});
        }
    });


    var Resources = BaseCollection.extend({
        model: Resource,

        initialize: function(models, options) {
            if (options && !options.nosync) {
                this.on('all', resourcesSyncHandler);
            }
        },

        url: function() {
            return almanac.urls.resources.href;
        }
    });


    var Collection = BaseModel.extend({
        idAttribute: 'uuid',

        linked: {
            resources: Resources
        },

        url: function() {
            var t = url.parse(almanac.urls.collections.href);
            return t.expand({uuid: this.get('uuid')});
        }
    });


    var Collections = BaseCollection.extend({
        model: Collection,

        initialize: function(models, options) {
            if (options && !options.nosync) {
                this.on('all', collectionsSyncHandler);
            }
        },

        url: function() {
            return almanac.urls.collections.href;
        }
    });


    // Initialize collections caches
    store.relationships = new Relationships(null, {
        comparator: 'label',
        nosync: true
    });

    store.components = new Components(null, {
        comparator: 'label',
        nosync: true
    });

    store.resources = new Resources(null, {
        comparator: 'label',
        nosync: true
    });

    store.collections = new Collections(null, {
        comparator: 'label',
        nosync: true
    });

    // Search results, currently just components
    store.results = new Components(null, {
        comparator: 'label'
    });

    return {
        Api: Api,
        Collections: Collections,
        Collection: Collection,
        Resources: Resources,
        Resource: Resource,
        Components: Components,
        Component: Component,
        Relationships: Relationships,
        Relationship: Relationship,
        store: store
    };
});
