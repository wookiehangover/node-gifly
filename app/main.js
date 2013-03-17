define(function(require, exports, module){

  var Backbone = require('backbone');
  var Gifly = require('gifly');

  $(function(){
    new Gifly();
    Backbone.history.start({ pushState: true });
  });

});
