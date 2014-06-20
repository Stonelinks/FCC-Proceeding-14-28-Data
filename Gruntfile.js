'use strict';

module.exports = function(grunt) {

  require('time-grunt')(grunt);
  require('load-grunt-tasks')(grunt);
  var scraper = require('./scraper');

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    compress: {
      documents: {
        options: {
          mode: 'tgz',
          archive: '<%= pkg.name %>.tar.gz',
          pretty: true
        },
        files: [
          {
            src: ['documents/**/*'],
            dest: '.'
          },
          {
            src: ['filings.json'],
            dest: '.'
          }
        ]
      }
    },

    rsync: {
      DropboxDeploy: {
        options: {
          src: ['<%= pkg.name %>.tar.gz'],
          dest: '/home/ld/Dropbox/Public/'
        }
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

  grunt.registerTask('deploy', ['compress', 'rsync']);
};
