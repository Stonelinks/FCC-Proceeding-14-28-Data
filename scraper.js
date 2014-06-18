'use strict';

var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var _ = require('lodash');
var url = require('url');
var async = require('async');
var pass = function() {};
var jf = require('jsonfile');
jf.spaces = 0;
var dbfile = './filings.json';
var db = jf.readFileSync(dbfile);
var saveDB = _.throttle(function() {
  console.log('saving db');
  jf.writeFileSync(dbfile, db);
}, 2000);

var download = module.exports.download = function(uri, filename, callback) {
  if (fs.existsSync(filename)) {
    console.log(filename + ' exists');
    callback();
  }
  else {
    request(uri, function(error, response, html) {
      if (!error) {
        var $ = cheerio.load(html);
        if ($('body:contains("The resource you requested does not exist.")').length) {
          console.log(filename + ' does not exist');
          callback();
        }
        else {
          if (firstDocument === undefined) {
            firstDocument = filename;
          }
          console.log('downloading ' + filename);
          request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
        }
      }
    });
  }
};

var documentBaseURL = 'http://apps.fcc.gov/ecfs/document/view?id=7521104360';
var id = 7521053248;
var firstDocument;
var downloadDocument = module.exports.downloadDocument = function(id, callback) {
  var documentURL = url.resolve(documentBaseURL, url.format({
    query: {
      id: id
    }
  }));
  download(documentURL, 'documents/' + id + '.pdf', callback);
};

var downloadDocuments = module.exports.downloadDocuments = function(start, end, callback) {
  start = start || id;
  end = end || start + 1000000;
  console.log('downloading documents ' + start + '-' + end);
  callback = callback || function(err, results) {
    console.log('done downloading documents ' + start + '-' + end);
    console.log('first document was ' + firstDocument);
  };
  async.eachLimit(_.range(start, end), 10, downloadDocument, callback);
};

var filingDetailBaseURL = 'http://apps.fcc.gov/ecfs/comment/view';
var processFiling = module.exports.processFiling = function(id, callback) {
  if (db.hasOwnProperty(id)) {
    console.log(id + ' exists in db');
    downloadDocument(db[id].documentID, callback);
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
          callback();
        }
        else {
          db[id] = {
            name: $('#applicant').text().trim(),
            documentID: $('[id="documents.link"] > a').attr('href').split('id=').pop(),
            type: $('[id="type.typeDescription"]').text().trim().toLowerCase(),
            exParte: $('#exParte').text().trim(),
            received: $('#dateRcpt').text().trim(),
            disseminated: $('#dateDisseminated').text().trim(),
            address: $('#address').text().trim()
          };
          console.log('adding ' + id + ' to db');
          saveDB();
          downloadDocument(db[id].documentID, callback);
        }
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

      async.eachLimit(ids, 3, processFiling, function(err, results) {
        console.log('done page ' + index);
        callback();
      });
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
  async.eachLimit(_.range(start, end), 1, processFilingPage, callback);
};
