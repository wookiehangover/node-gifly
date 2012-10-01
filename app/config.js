require.config({
  deps: ["main"],

  paths: {
    vendor: "../assets/js/vendor",
    plugins: "../assets/js/plugins",

    backbone: "components/backbone/backbone",
    underscore: "../assets/js/vendor/lodash",

    // plugins
    tpl: "../assets/js/plugins/tpl",

    // dev only
    text: "../assets/js/plugins/text",
    json: "../assets/js/plugins/json"

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

    "plugins/jquery.isotope": {
      deps: [
        "plugins/jquery.imagesloaded"
      ]
    }

  }
});

