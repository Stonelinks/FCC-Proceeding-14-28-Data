'use strict';

module.exports = function(grunt) {

  require('time-grunt')(grunt);
  require('load-grunt-tasks')(grunt);
  var scraper = require('./scraper');

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

  grunt.registerTask('documents', function() {
    var done = this.async();
    scraper.downloadDocuments(grunt.option('start'), grunt.option('end'), done);
  });
};
