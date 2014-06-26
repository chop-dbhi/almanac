/* global define */

define([
    'backbone',
], function(Backbone) {

    var Model = Backbone.Model.extend({

    });

    var Collection = Backbone.Collection.extend({
        model: Model
    });


    return {
        Model: Model,
        Collection: Collection
    };

});
