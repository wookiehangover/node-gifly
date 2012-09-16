require.config({

  deps: [
    'test/grid'
  ],

  baseUrl: '../../app',

  paths: {
    vendor: "../assets/js/vendor",
    plugins: "../assets/js/plugins",

    backbone: "components/backbone/backbone",
    underscore: "../assets/js/vendor/lodash",

    // plugins
    tpl: "../assets/js/plugins/tpl",

    fixtures: "../test/qunit/fixtures",

    // dev only
    text: "../assets/js/plugins/text",
    json: "../assets/js/plugins/json",

    test: "../test/qunit/test"

  },

  shim: {

    backbone: {
      exports: "Backbone",
      deps: ["underscore"]
    },

    "vendor/engine.io": {
      exports: "eio"
    },

    "plugins/jquery.deparam": [],
    "plugins/jquery.isotope": []

  }
});


