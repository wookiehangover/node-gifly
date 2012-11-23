define([
  'underscore',
  'backbone',
  'tpl!templates/cell.ejs',
  'plugins/jquery.isotope',
  'plugins/jquery.imagesloaded'
], function( _, Backbone, cellTmpl){

  var Cell = Backbone.View.extend({

    tagName: 'article',

    className: 'span2',

    initialize: function(){
      if( !this.model ){
        throw new Error('You must provide a model');
      }

      this.model.on('change:cover_url', _.once(this.addToGrid), this);

      if(this.model.collection.indexOf(this.model) < 10){
        if( this.model.get('url') ){
          this.backgroundRender();
        } else {
          this.model.on('change:url', _.once(this.backgroundRender), this);
        }
      }

    },

    updateProgress: function( p ){
      this.$('.progress').css('width', p);
    },

    backgroundRender: function(){
      var url = this.model.get('url');
      var self = this;
      var timer;

      if( url === undefined ){
        throw new Error('The model needs a url attribute to do this');
      }

      this.$('img').imagesLoaded(function(){
        self.full_img = new Image();
        self.full_img.src = url;
        self.updateProgress('25%');

        var dfd = self.loaded = $(self.full_img).imagesLoaded();

        dfd.done(function(){
          timer && clearTimeout( timer );
          self.updateProgress('100%');
          delete self.full_img;
        });

        dfd.progress && dfd.progress(function(err){
          var p = 50;
          self.updateProgress(p+'%');

          var tick = function(){
            if( p === 99 ){ return; }
            self.updateProgress( ( p+=1 ) + '%' );
            timer = setTimeout(tick, 30);
          }();
        });

      });
    },

    render: function(){
      this.$el.html( cellTmpl( this.model.toJSON() ) );
    },

    addToGrid: function(){
      var self = this;
      this.render();
      this.$el.imagesLoaded(function(){
        $('#gif-grid').isotope('insert', self.$el);
      });
    },

    events: {
      'click [data-action="play"]': 'play',
      'click [data-action="pause"]': 'pause',
      'click [data-action="fullscreen"]': 'fullScreen',
      'click [data-action="delete"]': 'destroy',
      'dblclick img': 'fullScreen'
    },

    fullScreen: function(e){
      if( !this.is_playing ){
        this.play();
      }

      var request = Modernizr.prefixed('RequestFullScreen', this.$('img')[0]);
      request && request();
      return false;
    },

    aniMagic: function(e){
      return this.is_playing ? this.pause() : this.play();
    },

    play: function(e){
      var img = this.$('img');
      var url = this.model.get('url');

      if( url === undefined ){
        return false;
      }

      img.attr('src', url);
      this.is_playing = true;

      $(e.currentTarget).attr({
        'data-action': 'pause',
        'class': 'icon-pause'
      });

      return false;
    },

    pause: function(e){
      var img = this.$('img');
      var url = this.model.get('cover_url');

      if( url === undefined ){
        return false;
      }

      img.attr('src', url);
      this.is_playing = false;

      $(e.currentTarget).attr({
        'data-action': 'play',
        'class': 'icon-play'
      });

      return false;
    },

    destroy: function(e){
      var self = this;
      this.model.destroy().done(function(){
        $('#gif-grid').isotope('remove', self.$el, function(){
          self.remove();
        });
      });
      return false;
    }

  });

  return Cell;
});

