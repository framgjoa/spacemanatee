module.exports = function(grunt){

  // Test
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-nodemon');

  // Build
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');

  // Utility
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-notify');


  grunt.initConfig({

    // Test
    jshint: {
      options: {loopfunc: true},
      files: ['client/app/*.js', 'server/**/*.js']
    },

    mochaTest: {
      test: {
        src: ['test/**/*.js']
      }
    },

    nodemon: {
      dev: {
        script: 'server.js'
      }
    },

    // Build
    clean: ['client/dist/', 'test/client/app/'],

    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: ['client/app/**/*.js'],
        dest: 'client/dist/built.js'
      }
    },

    uglify: {
      target: {
        files: {
          'client/dist/built.min.js': ['client/dist/built.js']
        }
      }
    },

    // Watch for testing and building
    watch: {
      jshint: {
        files: ['public/client/**/*.js', 'server/**/*'],
        tasks: ['jshint', 'mochaTest']
      }
    }
  });

  grunt.registerTask('test', ['jshint', 'mochaTest']);

  grunt.registerTask('build', [
    'clean',
    'concat',
    'uglify'
  ]);

  grunt.registerTask('serve', [
    'clean',
    'concat',
    'uglify',
    'jshint',
    'nodemon'
  ]);



};
