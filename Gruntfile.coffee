config =
  clean: ["dist"]

  less:
    compile:
      options:
        paths: ['assets/less']
      files:
        'assets/css/gifly.css': 'assets/less/gifly.less'
        'assets/css/embed.css': 'assets/less/embed.less'

  cssmin:
    compress:
      files:
        'assets/css/gifly.css': ['assets/css/gifly.css']
        'assets/css/embed.css': ['assets/css/embed.css']
      options:
        keepSpecialComments: 0

  requirejs:
    options:
      generateSourceMaps: true
      findNestedDependencies: true
      preserveLicenseComments: false
      wrap: true
      almond: true
      optimize: 'uglify2'
      mainConfigFile: 'app/config.js'
    compile:
      options:
        include: ["main"]
        insertRequire: ["main"]
        out: 'dist/release/require.js'

  uglify:
    all:
      files:
        'assets/js/vendor/engine.io.min.js': [
          'assets/js/vendor/engine.io.js'
        ]
        'assets/js/embed-scripts.min.js': [
          'assets/js/embed-scripts.js'
        ]

  qunit:
    files: ["test/**/index.html"]

  jshint:
    files: [
      'app/*.js'
      'server.js'
      'routes/**/*.js'
      'lib/**/*.js'
      'models/**/*.js'
    ]
    options:
      curly: true
      eqeqeq: true
      strict: false
      immed: false
      forin: true
      latedef: false
      newcap: true
      noarg: true
      sub: true
      undef: true
      boss: true
      eqnull: true
      browser: true
      node: true
      expr: true
      globals:
        Modernizr: true
        define: true
        $: true
        jQuery: true
        require: true


module.exports = (grunt) ->

  grunt.initConfig( config )

  grunt.loadNpmTasks('grunt-requirejs')
  grunt.loadNpmTasks('grunt-contrib-less')
  grunt.loadNpmTasks('grunt-contrib-cssmin')
  grunt.loadNpmTasks('grunt-contrib-jshint')
  grunt.loadNpmTasks('grunt-contrib-uglify')
  grunt.loadNpmTasks('grunt-contrib-clean')

  grunt.registerTask('default', [
    'jshint'
    'clean'
    'requirejs'
    'less'
    'cssmin'
    'uglify'
  ])
