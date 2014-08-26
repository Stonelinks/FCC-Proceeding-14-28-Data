'use strict';

var fs = require('fs-extra');
var request = require('request');
var cheerio = require('cheerio');
var _ = require('lodash');
var url = require('url');
var async = require('async');
var path = require('path');
var moment = require('moment');

var pass = function() {};

var db = require('./db');
var text_extract = require('./text-extract');

var download = module.exports.download = function(uri, entry, callback) {
  var filename = entry.documentPathPdf;
  var _done = function() {
    text_extract.extractTextFromDocument(entry, function() {
      callback(null);
    });
  };

  if (fs.existsSync(filename)) {
    console.log(filename + ' exists');
    _done();
  }
  else {
    request(uri, function(error, response, html) {
      if (!error) {
        if (html.trim().indexOf('<!DOCTYPE') == 0) {
          console.log(filename + ' does not exist');
          callback(null);
        }
        else {
          console.log('saving ' + filename);
          fs.ensureDir(path.dirname(filename), function() {
            request(uri).pipe(fs.createWriteStream(filename)).on('close', function() {
              _done();
            });
          });
        }
      }
      else {
        console.log('error with ' + filename);
        callback(null);
      }
    });
  }
};

var documentBaseURL = 'http://apps.fcc.gov/ecfs/document/view';
var downloadDocumentForEntry = module.exports.downloadDocumentForEntry = function(entry, callback) {
  var documentURL = url.resolve(documentBaseURL, url.format({
    query: {
      id: entry.documentID
    }
  }));
  download(documentURL, entry, function() {
    callback(null);
  });
};

var filingDetailBaseURL = 'http://apps.fcc.gov/ecfs/comment/view';
var processFiling = module.exports.processFiling = function(id, callback) {
  if (db.has(id)) {
    console.log(id + ' exists in db');
    downloadDocumentForEntry(db.get(id), function() {
      callback(null);
    });
  }
  else {
    var filingURL = url.resolve(filingDetailBaseURL, url.format({
      query: {
        id: id
      }
    }));
    request(filingURL, function(error, response, html) {
      if (!error) {
        var $ = cheerio.load(html);
        if ($('body:contains("The resource you requested does not exist.")').length) {
          console.log(id + ' does not exist');
          callback(null);
        }
        else {
          console.log('adding ' + id + ' to db');
          try {
            var disseminated = $('#dateDisseminated').text().trim();
            var documentID = $('[id="documents.link"] > a').attr('href').split('id=').pop();
            db.set(id, {
              name: $('#applicant').text().trim(),
              documentID: documentID,
              type: $('[id="type.typeDescription"]').text().trim().toLowerCase(),
              exParte: $('#exParte').text().trim(),
              received: $('#dateRcpt').text().trim(),
              disseminated: disseminated,
              address: $('#address').text().trim(),
              documentPathPdf: db.documentsFolderPdf + '/' + moment(disseminated).format('MMMM-Do-YYYY') + '/' + documentID + '.pdf',
              documentPathText: db.documentsFolderText + '/' + moment(disseminated).format('MMMM-Do-YYYY') + '/' + documentID + '.txt'
            });
            if ($('[id="type.typeDescription"]').text().trim().toLowerCase() == 'comment') {
              downloadDocumentForEntry(db.get(id), callback);
            }
            else {
              callback(null);
            }
          }
          catch (e) {
            console.log(e.message);
            callback(null);
          }
        }
      }
      else {
        console.log('error with filing ' + id);
        callback(null);
      }
    });
  }
};

var filingBaseURL = 'http://apps.fcc.gov/ecfs/comment_search/execute';
var processFilingPage = module.exports.processFilingPage = function(index, callback) {
  callback = callback || pass;
  console.log('processing filings for page ' + index);
  var pageURL = url.resolve(filingBaseURL, url.format({
    query: {
      pageNumber: index,
      proceeding: '14-28',
      pageSize: 100
    }
  }));
  request(pageURL, function(error, response, html) {
    if (!error) {
      var $ = cheerio.load(html);

      var ids = [];
      $('.dataTable tr img[alt="Detailed Information"]').each(function() {
        ids.push(this.parent.attribs.href.split('id=').pop());
      });

      async.eachLimit(ids, 4, processFiling, function(err, results) {
        console.log('done page ' + index);
        callback(null);
      });
    }
    else {
      console.log('error with filing page ' + index);
      callback(null);
    }
  });
};

var processFilingPages = module.exports.processFilingPages = function(start, end, callback) {
  start = start || 0;
  end = end || 100;
  console.log('downloading filing pages ' + start + '-' + end);
  callback = callback || function(err, results) {
    console.log('done downloading filing pages ' + start + '-' + end);
  };
  async.eachLimit(_.range(start, end), 4, processFilingPage, function() {
    callback(null);
  });
};
