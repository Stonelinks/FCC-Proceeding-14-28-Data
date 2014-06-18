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
      },
      
      filings: {
        options: {
          mode: 'gzip',
          archive: 'filings.json.gz'
        },
        expand: true,
        src: ['filings.json'],
        dest: '.'
      }
    }
  });

  grunt.registerTask('documents', function() {
    var done = this.async();
    scraper.downloadDocuments(grunt.option('start'), grunt.option('end'), done);
  });

  grunt.registerTask('filings', function() {
    var done = this.async();
    scraper.processFilingPages(grunt.option('start'), grunt.option('end'), done);
  });
};
