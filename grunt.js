/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',

    clean: ["dist"],

    lint: {
      files: ['grunt.js', 'app/**/*.js', 'routes/**.*.js', 'models/**.*.js', '*.js']
    },

    concat: {
      "dist/debug/require.js": [
        "assets/js/vendor/almond.js",
        "dist/debug/require.js"
      ]
    },

    qunit: {
      files: ['test/**/*.html']
    },

    less: {
      compile: {
        options: {
          paths: ['assets/less']
        },
        files: {
          'assets/css/gifly.css': 'assets/less/gifly.less'
        }
      }
    },

    requirejs: {
      compile: {
        options: {
          mainConfigFile: "app/config.js",
          out: "dist/debug/require.js",
          name: "config",
          wrap: false
        }
      }
    },

    watch: {
      files: '<config:lint.files>',
      tasks: 'lint qunit'
    },

    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: false,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        browser: true,
        node: true,
        jQuery: true,
        expr: true
      },
      globals: {
        Modernizr: true,
        define: true,
        $: true
      }
    },

    min: {
      "dist/release/require.js": [
        "dist/debug/require.js"
      ]
    }
  });

  // Default task.
  grunt.registerTask('default', 'lint clean requirejs concat min less');
  grunt.loadNpmTasks('grunt-contrib');

};
