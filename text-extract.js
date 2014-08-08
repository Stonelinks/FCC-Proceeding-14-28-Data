var db = require('./db');

var fs = require('fs-extra');
var _ = require('lodash');
var moment = require('moment');
var path = require('path');
var async = require('async');

var extract = require('pdf-text-extract');

var textFolder = db.documentsFolder + '-txt';
if (fs.existsSync(textFolder)) {
  fs.removeSync(textFolder);
}
fs.mkdirs(textFolder);

var count = 0;
var total = db.keys().length;
var notification = _.throttle(function() {
  console.log('progress ' + count + '/' + total + ' (' + (100.0 * count / total).toFixed(2) + '%)');
}, 400);

var extractTextFromDocument = function(id, callback) {
  setTimeout(function() {
    var entry = db.get(id);
    var documentPath = entry.documentPath;
    var documentPathText = textFolder + '/' + moment(entry.disseminated).format('MMMM-Do-YYYY') + '/' + entry.documentID + '.txt';

    entry.documentPathText = documentPathText;
    db.set(id, entry);

    var _done = function() {
      count++;
      notification();
      callback(null);
    };

    console.log('extracting text from ' + documentPath);
    extract(documentPath, function(err, pages) {
      if (err) {
        console.dir(err);
        _done();
      }

      fs.ensureDir(path.dirname(documentPathText), function() {
        fs.writeFile(documentPathText, pages.join('\n\n'), _done);
      });
    });
  }, 200);
};

async.eachLimit(db.keys(), 12, extractTextFromDocument, function() {
  console.log('done');
});
