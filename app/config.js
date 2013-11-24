require.config({
  paths: {
    vendor: "../assets/js/vendor",
    plugins: "../assets/js/plugins",

    components: 'bower_components',
    backbone: "bower_components/backbone-amd/backbone",
    jquery: "bower_components/jquery/jquery",
    underscore: "bower_components/lodash/dist/lodash",

    // plugins
    tpl: "../assets/js/plugins/tpl",

    // dev only
    text: "../assets/js/plugins/text",
    json: "../assets/js/plugins/json"
  },

  shim: {

    "lib/engine.io": {
      exports: "eio"
    },

    "plugins/jquery.deparam": [],

    "plugins/jquery.isotope": {
      deps: [
        "plugins/jquery.imagesloaded"
      ]
    }

  }
});

