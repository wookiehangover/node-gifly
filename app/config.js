require.config({
  deps: ["main"],

  paths: {
    vendor: "../assets/js/vendor",
    plugins: "../assets/js/plugins",

    backbone: "components/backbone-amd/backbone",
    jquery: "components/jquery/jquery",
    underscore: "../assets/js/vendor/lodash",

    // plugins
    tpl: "../assets/js/plugins/tpl",

    // dev only
    text: "../assets/js/plugins/text",
    json: "../assets/js/plugins/json"

  },

  shim: {

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

