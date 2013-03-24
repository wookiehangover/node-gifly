define(function(require, exports, module){

  var _ = require('underscore');
  var Backbone = require('backbone');

  require('plugins/jquery.isotope');
  require('plugins/jquery.imagesloaded');

  module.exports = Backbone.View.extend({

    tagName: 'article',

    className: 'span2',

    template: require('tpl!templates/cell.ejs'),

    initialize: function(){
      if( !this.model ){
        throw new Error('You must provide a model');
      }
      this.loadAnimatedGif = _.once(this.backgroundRender, this);

      this.listenToOnce(this.model, 'change:cover_url', this.addToGrid, this);
    },

    updateProgress: function( p ){
      this.$('.progress').css('width', p);
    },

    backgroundRender: function(){
      var url = this.model.get('url');
      var self = this;
      var timer;

      if( url === undefined ){
        console.error('The model needs a url attribute to do this');
        return;
      }

      this.$('img').imagesLoaded(function(){
        self.full_img = new Image();
        self.full_img.src = url;
        self.updateProgress('25%');

        var dfd = self.loaded = $(self.full_img).imagesLoaded();

        dfd.done(function(){
          timer && clearTimeout( timer );
          self.updateProgress('100%');
          self.$('.progress').slideUp();
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
      this.$el.html( this.template( this.model.toJSON() ) );
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
      'click [data-action="delete"]': 'destroy',
      'click [data-action="fullscreen"]': 'fullScreen',
      'click [data-action="closefullscreen"]': 'closeFullScreen',
      'dblclick img': 'fullScreen',
      'mouseover': 'loadAnimatedGif'
    },

    fullScreen: function(){
      this.$el.addClass('show');

      $('#gif-grid')
        .addClass('show')
        .isotope({ filter: this.el })
        .css({ height: '100%' });

      this.loadAnimatedGif();
      this.play();

      this.$('[data-action="fullscreen"]').attr('data-action', 'closefullscreen');
      return false;
    },

    closeFullScreen: function(){
      this.$el.removeClass('show');

      $('#gif-grid')
        .removeClass('show')
        .isotope({ filter: '' });

      this.pause();

      this.$('[data-action="closefullscreen"]').attr({ 'data-action': 'fullscreen' });
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

      this.$('[data-action="play"]').attr({
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

      this.$('[data-action="pause"]').attr({
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

});

