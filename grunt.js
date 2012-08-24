/*global module:false*/
module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',

    lint: {
      files: ['grunt.js', 'app/**/*.js', 'routes/**.*.js', 'models/**.*.js', '*.js']
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
    uglify: {}
  });

  // Default task.
  grunt.registerTask('default', 'lint');
  grunt.loadNpmTasks('grunt-contrib');

};
