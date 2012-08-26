define([
  'underscore',
  'backbone',
  'cell',
  'upload',
  'plugins/jquery.imagesloaded'
], function( _, Backbone, Cell, Uploader){

  var Grid = Backbone.View.extend({

    el: $('#grid'),

    initialize: function( options ){
      var self = this;

      if( !options.socket ){
        throw new Error('You must provide a socket instance');
      }

      this.socket = options.socket;

      if( !this.collection ){
        throw new Error('You must provide a collection');
      }

      this.collection.view = this;

      this.collection.on('add', function( m ){
        var model = this.collection.getByCid( m.cid );
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
      var last_page = false;

      $window.on('scroll', _.debounce(function(){
        if( !last_page &&
            $window.scrollTop() + $window.height() >= self.$el.height() - 300 ){

          self.collection.current_page += 1;

          $.getJSON( self.collection.url(), function(results){
            if( !results.length ){
              self.collection.current_page--;
              last_page = true;
              return;
            }
            self.collection.add(results);
          });
        }
      },100));
    }

  });


  return Grid;

});
