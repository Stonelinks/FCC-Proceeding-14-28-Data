var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var _ = require('lodash');
var url = require('url');
var async = require('async');

var searchBaseUrl = 'http://apps.fcc.gov/ecfs/comment_search/paginate?pageSize=100&proceeding=14-28';
var searchPageNumber = 0;

var documentBaseURL = 'http://apps.fcc.gov/ecfs/document/view?id=7521104360';
var id = 7521013222;

var download = function(uri, filename, callback) {
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
          console.log('downloading ' + filename);
          request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
        }
      }
    });
  }
};

var downloadDocument = function(id, callback) {
  var documentURL = url.resolve(documentBaseURL, url.format({
    query: {
      id: id
    }
  }));
  download(documentURL, 'documents/' + id + '.pdf', callback);
};

var downloadDocuments = function(start, end, callback) {
  start = start || id;
  end = end || start + 10000;
  callback = callback || function(err, results) {
    console.log('done downloading documents ' + start + '-' + end);
  };
  async.eachLimit(_.range(start, end), 4, downloadDocument, callback);
};

downloadDocuments();
