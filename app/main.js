require(['config'], function(){
  'use strict';
  require(['jquery', 'backbone', 'gifly'], function($, Backbone, Gifly) {
    $(function(){
      window.gifly = new Gifly();
      Backbone.history.start({ pushState: true });
    });
  });
});

