var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var _ = require('lodash');
var url = require('url');
var async = require('async');

var searchBaseUrl = 'http://apps.fcc.gov/ecfs/comment_search/paginate?pageSize=100&proceeding=14-28';
var searchPageNumber = 0;

var documentBaseURL = 'http://apps.fcc.gov/ecfs/document/view?id=7521104360';
var id = 7521011110;

var pass = function() {};

var download = function(uri, filename, callback) {
  callback = callback || pass;
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
          console.log('downloading ' + uri + ' to ' + filename);
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

async.eachLimit(_.range(id, id + 10000), 6, downloadDocument, function(err, results) {
  console.log('done');
});
