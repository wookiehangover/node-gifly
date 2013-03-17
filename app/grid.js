define(function(require, exports, module){

  var _ = require('underscore');
  var Backbone = require('backbone');
  var Cell = require('cell');
  var Uploader = require('upload');

  require('plugins/jquery.isotope');
  require('plugins/jquery.imagesloaded');

  module.exports = Backbone.View.extend({

    el: $('#gif-grid'),

    initialize: function( options ){
      var self = this;

      if( !this.collection ){
        throw new Error('You must provide a collection');
      }

      this.collection.view = this;

      this.collection.on('add', function( m ){
        var model = this.collection.get( m.cid );
        model.view = new Cell({ model: model });

        if( model.get('cover_url') ){
          model.view.addToGrid();
        }
      }, this);

      this.collection.fetch().done(function( collection ){

        self.collection.each(function( model ){
          var el = self.$('[data-id="'+ model.id +'"]');

          if( el.length ){
            model.view = new Cell({ model: model, el: el.parent() });
          }
        });

        self.render();

      });

      this.uploader = new Uploader( this );
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
      var height = $window.height();
      var last_page = false;

      var prevScrollPos = $window.scrollTop();

      var lazyLoad = _.debounce(function(){

        self.collection.current_page += 1;

        $.getJSON( self.collection.url(), function(results){
          if( !results.length ){
            self.collection.current_page--;
            last_page = true;
            return;
          }
          Backbone.history.navigate('page/'+ self.collection.current_page);
          self.collection.add(results);
        });

      }, 2000, true);

      $window.on('scroll', function(){
        var scrollPos = $window.scrollTop();
        if( !last_page && scrollPos + height >= self.$el.height() - 300 ){
          lazyLoad();
        }
        prevScrollPos = scrollPos;
      });
    }

  });

});
