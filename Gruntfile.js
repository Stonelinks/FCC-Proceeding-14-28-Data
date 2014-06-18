'use strict';

module.exports = function(grunt) {

  require('time-grunt')(grunt);
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    compress: {
      documents: {
        options: {
          mode: 'tgz',
          archive: 'documents.tar.gz'
        },
        expand: true,
        cwd: 'documents/',
        src: ['**/*'],
        dest: '.'
      }
    }
  });

  grunt.registerTask('default', [
    'compress'
  ]);
};
