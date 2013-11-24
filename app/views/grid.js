define(function(require, exports, module){

  var _ = require('underscore');
  var Backbone = require('backbone');
  var Cell = require('views/cell');
  var Uploader = require('lib/upload');

  require('plugins/jquery.isotope');
  require('plugins/jquery.imagesloaded');

  module.exports = Backbone.View.extend({

    el: $('#gif-grid'),

    initialize: function( params ){
      var self = this;

      if( !this.collection ){
        throw new Error('You must provide a collection');
      }

      this.collection.view = this;

      this.listenTo( this.collection, 'add', this.addModel, this);
      this.listenToOnce( this.collection, 'sync', this.render, this);

      this.uploader = new Uploader( this );
    },

    addModel: function( model ){
      var params = { model: model };
      var el = this.$('[data-id="'+ model.id +'"]').parent();

      if( el.length ){
        params.el = el;
      }

      model.view = new Cell( params );

      if( !el.length && model.get('cover_url') ){
        model.view.addToGrid();
      }
    },

    render: function(){
      var self = this;

      self.$el.imagesLoaded(function(){
        self.$el.isotope({
          itemSelector: 'article',
          getSortData: {
            createdAt: function( $elem ){
              var model = self.collection.get( $elem.find('figure').data('id') );
              return -model.get('createdAt');
            }
          },
          sortBy: 'createdAt'
        });
      });

      var $window = $(window);
      var windowHeight = $window.height();
      var lastPage = false;

      var prevScrollPos = $window.scrollTop();

      var lazyLoad = _.throttle(function(){

        $.getJSON( self.collection.url(self.collection.current_page + 1), function(results){
          if( !results.length ){
            lastPage = true;
            return;
          }
          self.collection.current_page += 1;
          // Backbone.history.navigate('page/'+ self.collection.current_page);
          self.collection.add(results);
        });

      }, 1000);

      $window.on('scroll', _.debounce(function(){
        var scrollPos = $window.scrollTop();

        if( !lastPage && scrollPos + windowHeight >= self.$el.height() - 350 ){
          lazyLoad();
        }
        prevScrollPos = scrollPos;
      }, 100, true));
    }

  });

});
