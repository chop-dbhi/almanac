/* global define */

define([
    'underscore',
    'backbone',
    'marionette',
    './core'
], function(_, Backbone, Marionette) {


    var LoadingView = Marionette.ItemView.extend({
        template: 'loading',

        options: {
            message: 'Loading...'
        },

        serializeData: function() {
            return {
                message: this.options.message
            };
        }
    });

    var EmptyView = Marionette.ItemView.extend({
        template: 'empty',

        options: {
            message: 'Nothing to display'
        },

        serializeData: function() {
            return {
                message: this.options.message
            };
        }
    });

    var ErrorView = Marionette.ItemView.extend({
        template: 'error',

        serializeData: function() {
            return {
                header: this.options.header,
                message: this.options.message
            };
        }
    });


    var ErrorPage = Marionette.ItemView.extend({
        template: 'pages/error',

        serializeData: function() {
            return {
                header: this.options.header,
                message: this.options.message
            };
        }
    });


    var ObjectNotFound = ErrorView.extend({
        options: {
            header: 'Object not found'
        }
    });


    var NavigationError = ErrorView.extend({
        options: {
            header: 'Navigation error'
        }
    });


    var CollectionView = Marionette.CollectionView.extend({
        options: {
            loadingMessage: 'Loading...',
            emptyMessage: 'No data available',
            errorMessage: 'Error loading data'
        },

        getEmptyView: function() {
            if (this.collection) {
                if (this.collection.fetchError) {
                    return ErrorView;
                }
                else if (this.collection.fetching) {
                    return LoadingView;
                }
            }

            return EmptyView;
        },

        emptyViewOptions: function() {
            if (this.collection) {
                if (this.collection.fetchError) {
                    return {
                        message: this.options.errorMessage
                    };
                }
                else if (this.collection.fetching) {
                    return {
                        message: this.options.loadingMessage
                    };
                }
            }

            return {
                message: this.options.emptyMessage
            };
        }
    });


    var RevisionItem = Marionette.ItemView.extend({
        tagName: 'li',

        template: 'revision-item'
    });


    var Index = Marionette.ItemView.extend({
        template: 'index',

        className: 'index'
    });


    var ResourceItem = Marionette.LayoutView.extend({
        template: 'resource-item',

        className: 'item resource-item',

        regions: {
            types: '[data-region=types]'
        },

        onRender: function() {
            var types = new ComponentTypeList({
                collection: this.model.component_types  // jshint ignore:line
            });

            this.types.show(types);
        }
    });


    var ResourceList = CollectionView.extend({
        childView: ResourceItem,

        className: 'card-layout',

        options: {
            loadingMessage: 'Fetching resources...',
            emptyMessage: 'No resources have been created.'
        }
    });


    var CollectionItem = Marionette.ItemView.extend({
        template: 'collection-item',

        className: 'item collection-item'
    });


    var CollectionList = CollectionView.extend({
        childView: CollectionItem,

        className: 'card-layout',

        options: {
            loadingMessage: 'Fetching collections...',
            emptyMessage: 'No collections have been created.'
        }
    });


    var CollectionPage = Marionette.LayoutView.extend({
        template: 'pages/collection',

        className: 'page',

        regions: {
            resources: '[data-region=resources]'
        },

        onRender: function() {
            var resources = new ResourceList({
                collection: this.model.resources
            });

            this.resources.show(resources);

            this.model.resources.ensure();
        }
    });



    var CollectionsPage = Marionette.LayoutView.extend({
        template: 'pages/collections',

        className: 'page',

        regions: {
            collections: '[data-region=collections]'
        },

        onRender: function() {
            var collections = new CollectionList({
                collection: this.collection
            });

            this.collections.show(collections);

            this.collection.ensure();
        }
    });

    var ComponentItem = Marionette.ItemView.extend({
        template: 'component-item',

        className: 'item component-item'
    });

    var ComponentList = Marionette.CollectionView.extend({
        childView: ComponentItem,

        className: 'card-layout'
    });

    var ReferencedRelationshipItem = Marionette.ItemView.extend({
        template: 'relationship-item',

        initialize: function(options) {
            this.reference = options.reference;
        },

        serializeData: function() {
            var data = this.model.toJSON();

            data.outgoing = this.reference.get('uuid') === data.start.uuid;

            return data;
        }
    });


    var ReferencedRelationshipList = CollectionView.extend({
        childView: ReferencedRelationshipItem,

        options: {
            loadingMessage: 'Loading relationships...',
            emptyMessage: 'No related components'
        },

        initialize: function(options) {
            this.reference = options.reference;
        },

        childViewOptions: function(model, index) {
            return {
                model: model,
                index: index,
                reference: this.reference
            };
        }
    });

    var ResourcesPage = Marionette.LayoutView.extend({
        template: 'pages/resources',

        className: 'page',

        regions: {
            resources: '[data-region=resources]'
        },

        onRender: function() {
            var resources = new ResourceList({
                collection: this.collection
            });

            this.resources.show(resources);
        }
    });


    /*
    Grammar:
    - optional prefix [+-]
    - optional property name, quoted if contains whitespace
    - property value, quoted if contains whitespace

    Examples:
    - 'foo'
    - '-foo'
    - '+origins:type="foo bar"
    */

    /* jshint ignore:start */

    var searchRegex = /(?:([+-])?(?:([^\s"']+|"[^"]+"|'[^']+')=)?([^\s"']+|"[^"]+"|'[^']+'))+/ig;

    var parseInputString = function(text) {
        var matches = [], match = searchRegex.exec(text);

        while (match) {
            matches.push({
                operator: match[1],
                property: match[2],
                value: match[3]
            });

            match = searchRegex.exec(text);
        }

        return matches;
    };

    /* jshint ignore:end */

    var SearchInput = Marionette.View.extend({
        tagName: 'input',

        className: 'form-control',

        attributes: {
            type: 'search',
            autocomplete: 'off',
            placeholder: 'Search...'
        },

        events: {
            'input': '_handleChange',
            'keypress': '_submit'
        },

        initialize: function() {
            this._handleChange = _.debounce(this.handleChange, 400);
            // Fire the first call and debounce all the rest
            this._submit = _.debounce(this.submit, 400, true);
        },

        handleChange: function(event) {
            event.preventDefault();
            this.trigger('search', this.el.value);
        },

        submit: function(event) {
            if (event.which === 13) {
                this.trigger('search', this.el.value);
            }
        },

        set: function(value) {
            if (this.el.value !== value) {
                this.el.value = value;
                this.trigger('search', value);
            }
        }
    });


    var SearchResults = ComponentList.extend({});


    var SearchPage = Marionette.LayoutView.extend({
        template: 'pages/search',

        className: 'page',

        regions: {
            results: '[data-region=results]'
        },

        onRender: function() {
            var results = new SearchResults({
                collection: this.collection
            });

            this.results.show(results);
        }
    });


    var ResourcePage = Marionette.LayoutView.extend({
        template: 'pages/resource',

        className: 'page',

        regions: {
            types: '[data-region=types]',
            components: '[data-region=components]'
        },

        onRender: function() {
            var types = new ComponentTypeList({
                collection: this.model.component_types  // jshint ignore:line
            });

            var components = new ComponentList({
                collection: this.model.components
            });

            this.types.show(types);
            this.components.show(components);
        }
    });

    var ComponentTypeItem = Marionette.ItemView.extend({
        template: 'component-type-item',
    });


    var ComponentTypeList = Marionette.CollectionView.extend({
        childView: ComponentTypeItem
    });


    var PropertiesTable = Marionette.ItemView.extend({
        template: 'properties-table'
    });

    var ComponentSourceItem = Marionette.ItemView.extend({
        template: 'component-source-item'
    });

    var ComponentSourceList = CollectionView.extend({
        childView: ComponentSourceItem,

        options: {
            loadingMessage: 'Loading sources...',
            emptyMessage: 'Component does not have any sources.'
        }
    });


    var TimelineListItem = Marionette.ItemView.extend({
        template: 'timeline-list-item'
    });


    var TimelineList = CollectionView.extend({
        childView: TimelineListItem,

        options: {
            loadingMessage: 'Loading timeline...',
            emptyMessage: 'Timeline not available.'
        }
    });


    var PathItem = Marionette.ItemView.extend({
        template: 'path-item'
    });


    var PathBreadcrumbs = Marionette.CollectionView.extend({
        className: 'breadcrumbs',

        childView: PathItem
    });


    var ComponentPage = Marionette.LayoutView.extend({
        template: 'pages/component',

        className: 'page component-page',

        regions: {
            path: '[data-region=path]',
            properties: '[data-region=properties]',
            relationships: '[data-region=relationships]',
            revisions: '[data-region=revisions]',
            timeline: '[data-region=timeline]',
            sources: '[data-region=sources]'
        },

        onRender: function() {
            var path = new PathBreadcrumbs({
                collection: this.model.path
            });

            var properties = new PropertiesTable({
                model: this.model.properties
            });

            var relationships = new ReferencedRelationshipList({
                collection: this.model.relationships,
                reference: this.model
            });

            var sources = new ComponentSourceList({
                collection: this.model.sources
            });

            var timeline = new TimelineList({
                collection: this.model.timeline
            });

            var revisions = new ComponentList({
                tagName: 'ul',
                childView: RevisionItem,
                collection: this.model.revisions
            });

            // Ensure the related items are fetched
            this.model.relationships.ensure();
            this.model.sources.ensure();
            //this.model.timeline.ensure();
            this.model.revisions.ensure();

            this.path.show(path);
            this.revisions.show(revisions);
            this.properties.show(properties);
            this.relationships.show(relationships);
            this.timeline.show(timeline);
            this.sources.show(sources);
        }
    });


    return {
        Index: Index,
        ErrorView: ErrorView,
        EmptyView: EmptyView,
        LoadingView: LoadingView,
        ErrorPage: ErrorPage,
        SearchInput: SearchInput,
        ObjectNotFound: ObjectNotFound,
        NavigationError: NavigationError,
        SearchPage: SearchPage,
        CollectionItem: CollectionItem,
        CollectionList: CollectionList,
        CollectionPage: CollectionPage,
        CollectionsPage: CollectionsPage,
        ResourcesPage: ResourcesPage,
        ResourceItem: ResourceItem,
        ResourceList: ResourceList,
        ResourcePage: ResourcePage,
        ComponentItem: ComponentItem,
        ComponentList: ComponentList,
        ComponentPage: ComponentPage
    };

});
