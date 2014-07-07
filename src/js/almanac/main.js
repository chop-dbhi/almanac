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
}, [
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'almanac'
], function($, _, Backbone, Marionette, almanac) {

    var app = new Marionette.LayoutView({
        el: 'body',

        regions: {
            main: '#main'
        }
    });

    var Router = Backbone.Router.extend({
        routes: {
            '': 'index',
            'collections(/)': 'collections',
            'collections/:uuid(/)': 'collection',
            'resources(/)': 'resources',
            'resources/:uuid(/)': 'resource',
            'components/:uuid(/)': 'component',
            'search(/)': 'search'
        },

        index: function() {
            var view = new almanac.views.Index();

            app.main.show(view);
        },

        search: function() {
            var view = new almanac.views.SearchPage({
                collection: almanac.store.results
            });

            app.main.show(view);
        },

        collections: function() {
            var view = new almanac.views.CollectionsPage({
                collection: almanac.store.collections
            });

            app.main.show(view);
        },

        collection: function(uuid) {
            var view;

            if (!almanac.store.collections.fetched) {
                if (!almanac.store.collections.fetching) {
                    almanac.store.collections.ensure();
                }

                this.listenToOnce(almanac.store.collections, 'sync error', function() {
                    this.collection(uuid);
                });

                view = new almanac.views.LoadingView({
                    message: 'Fetching collection ' + uuid
                });
            }
            else {
                var model = almanac.store.collections.get(uuid);

                if (!model) {
                    view = new almanac.views.ObjectNotFound({
                        message: 'Collection ' + uuid + ' not found :('
                    });
                } else {
                    model.resources.ensure();

                    view = new almanac.views.CollectionPage({
                        model: model
                    });
                }
            }

            app.main.show(view);
        },

        resources: function() {
            var view = new almanac.views.ResourcesPage({
                collection: almanac.store.resources
            });

            almanac.store.resources.ensure();

            app.main.show(view);
        },

        resource: function(uuid) {
            var view;

            if (!almanac.store.resources.fetched) {
                if (!almanac.store.resources.fetching) {
                    almanac.store.resources.ensure();
                }

                this.listenToOnce(almanac.store.resources, 'sync error', function() {
                    this.resource(uuid);
                });

                view = new almanac.views.LoadingView({
                    message: 'Fetching resource ' + uuid
                });
            }
            else {
                var model = almanac.store.resources.get(uuid);

                if (!model) {
                    view = new almanac.views.ObjectNotFound({
                        message: 'Resource ' + uuid + ' not found :('
                    });
                } else {
                    model.components.ensure();

                    view = new almanac.views.ResourcePage({
                        model: model
                    });
                }
            }

            app.main.show(view);
        },

        component: function(uuid) {
            var view, model = almanac.store.components.get(uuid);

            if (model) {
                view = new almanac.views.ComponentPage({
                    model: model
                });

                app.main.show(view);
                return;
            }

            // Cache not populated, get the model
            if (uuid) {
                model = new almanac.models.Component({uuid: uuid});

                view = new almanac.views.LoadingView({
                    message: 'Fetching component ' + uuid
                });

                var _this = this;

                model.fetch()
                    .done(function() {
                        almanac.store.components.add(model);
                        _this.component(uuid);
                    })
                    .error(function() {
                        _this.error({
                            header: 'Component not found :(',
                            message: uuid
                        });
                    });

                return;
            }

            this.error({
                header: 'Component not found :(',
                message: uuid
            });
        },

        error: function(options) {
            var view;

            if (_.isPlainObject(options)) {
                view = new almanac.views.ErrorPage(options);
            }
            else {
                view = options;
            }

            app.main.show(view);
        }

    });

    almanac.ready(function() {

        var api = new almanac.models.Api(null, {url: almanac.config.get('api')}),
            router = new Router();

        api.fetch().done(function() {
            almanac.urls = api.get('_links');

            var options = almanac.config.get('history');

            // Initialize global search element that can be bound to across
            // different contexts
            almanac.search = new almanac.views.SearchInput({
                el: '#search'
            });

            almanac.search.on('search', function(query) {
                var url = 'search/?' + $.param({query: query});
                almanac.store.results.search(query);

                var trigger = true;

                if (history.getFragment().slice(0, 7) === 'search/') {
                    trigger = false;
                }

                Backbone.history.navigate(url, {trigger: trigger});
            });

            router.on('route:search', function() {
                var search  = document.location.search.slice(1),
                    params = almanac.utils.deparam(search);

                almanac.search.set(params.query);
            });

            if (!Backbone.history.start(options)) {
                router.navigate('/', {trigger: true});
            }

           // Route based on the URL
            $(document).on('click', 'a', function(event) {
                // Path of the target link
                var path = this.pathname;

                // Handle IE quirk
                if (path.charAt(0) !== '/') path = '/' + path;

                // Trim off the root on the path if present
                var root = Backbone.history.root || '/';

                if (path.slice(0, root.length) === root) {
                    path = path.slice(root.length);
                }

                // If this is a valid route then go ahead and navigate to it,
                // otherwise let the event process normally to load the new
                // location.
                var cancel;

                try {
                    cancel = Backbone.history.navigate(path, {trigger: true});
                } catch (e) {
                    var view = almanac.views.NavigationError({
                        message: 'There was a problem navigating to the ' +
                                 path + ' page.'
                    });

                    app.main.show(view);
                    cancel = true;
                }

                // Either a succesful match occurred or this is the same page
                if (cancel || cancel === undefined) {
                    event.preventDefault();
                }
            });
        });

    });

});
