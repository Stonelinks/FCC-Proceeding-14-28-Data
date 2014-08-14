'use strict';

module.exports = function(grunt) {

  require('time-grunt')(grunt);
  require('load-grunt-tasks')(grunt);
  var scraper = require('./scraper');
  var db = require('./db');

  grunt.initConfig({

    time: require('moment')().format('MMMM-Do-YYYY-h-mm-ss-a'),

    pkg: grunt.file.readJSON('package.json'),

    compress: {
      documents: {
        options: {
          mode: 'tgz',
          archive: '<%= pkg.name %>-latest.tar.gz',
          pretty: true
        },
        files: [
          {
            src: [db.documentsFolderPdf + '/**/*'],
            dest: '.'
          },
          {
            src: [db.documentsFolderText + '/**/*'],
            dest: '.'
          },
          {
            src: [db.filename],
            dest: '.'
          }
        ]
      }
    },

    rsync: {
      DropboxDeploy: {
        options: {
          src: ['<%= pkg.name %>-latest.tar.gz'],
          dest: '/home/ld/Dropbox/Public/'
        }
      },

      backup: {
        options: {
          src: ['<%= pkg.name %>-latest.tar.gz'],
          dest: '<%= pkg.name %>-<%= time %>.tar.gz'
        }
      }
    }
  });

  grunt.registerTask('filings', function() {
    var done = this.async();
    scraper.processFilingPages(grunt.option('start'), grunt.option('end'), done);
  });

  grunt.registerTask('deploy', ['compress', 'rsync']);
  grunt.registerTask('backup', ['deploy']);
};
