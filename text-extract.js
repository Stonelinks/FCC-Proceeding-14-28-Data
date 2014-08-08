var db = require('./db');

var fs = require('fs-extra');
var _ = require('lodash');
var moment = require('moment');
var path = require('path');
var async = require('async');

var extract = require('pdf-text-extract');
var pdf_extract = require('pdf-extract');

var pdf_extract_options = {
  type: 'ocr', // (required), perform ocr to get the text within the scanned image
  ocr_flags: [
    '-psm 1',       // automatically detect page orientation
    'alphanumeric'  // only output ascii characters
  ]
};

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

      var _err = function(err) {
        if (err) {
          console.dir(err);
          _done();
        }
      };
      _err(err);

      var _write = function(text) {
        fs.ensureDir(path.dirname(documentPathText), function() {
          fs.writeFile(documentPathText, text, _done);
        });
      };

      if (pages.length) {
        _write(pages.join('\n\n'));
      }
      else {
        console.log('trying ocr on ' + documentPath);
        var processor = pdf_extract(documentPath, pdf_extract_options, _err);
        processor.on('complete', function(data) {
          if (data.text_pages.length) {
            _write(data.text_pages.join('\n\n'));
          }
          else {
            _done();
          }
        });
      }
    });
  }, 200);
};

async.eachLimit(db.keys(), 7, extractTextFromDocument, function() {
  console.log('done');
});
