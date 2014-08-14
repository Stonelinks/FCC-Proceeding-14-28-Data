var db = require('./db');

var fs = require('fs-extra');
var _ = require('lodash');
var moment = require('moment');
var path = require('path');
var async = require('async');
var inspect = require('eyes').inspector({maxLength: 20000});
var pdf_extract = require('pdf-extract');

var ocr_pdf_extract_options = {
  type: 'ocr', // (required), perform ocr to get the text within the scanned image
  ocr_flags: [
    '-psm 1',       // automatically detect page orientation
    'alphanumeric'  // only output ascii characters
  ]
};

var text_pdf_extract_options = {
  type: 'text'
};

// make a backup of everything before trying to do anything
// console.log('running a backup');
// console.log(require('exec-sync')('grunt backup'));
// console.log('done');

var textFolder = db.documentsFolderText;
// if (fs.existsSync(textFolder)) {
  // fs.removeSync(textFolder);
// }
// fs.mkdirs(textFolder);

var count = 0;
var total = db.keys().length;
var last;
var notification = _.throttle(function() {
  console.log('progress ' + count + '/' + total + ' (' + (100.0 * count / total).toFixed(2) + '%), last ' + last);
}, 400);

var extractTextFromDocument = function(id, callback) {
  last = id;
  var entry = db.get(id);
  var documentPath = entry.documentPath;
  var documentPathText = textFolder + '/' + moment(entry.disseminated).format('MMMM-Do-YYYY') + '/' + entry.documentID + '.txt';

  var _done = function() {
    count++;
    notification();
    callback(null);
  };

  var _err = function(err) {
    if (err) {
      console.dir(err);
    }
    _done();
  };

  var _write = function(text) {
    fs.ensureDir(path.dirname(documentPathText), function() {
      fs.writeFile(documentPathText, text, _done);
    });
  };

  fs.exists(documentPathText, function(exists) {
    if (exists) {
      _done();
    }
    else if (fs.existsSync(documentPath) && fs.readFileSync(documentPath, 'utf8') !== '') {
      console.log('extracting text from ' + documentPath);

      var text_processor = pdf_extract(documentPath, text_pdf_extract_options, function(err, pages) {

        // inspect(pages, 'extracted text pages');
        if (err) {
          console.dir(err);
        }
        else if (pages.length) {
          _write(pages.join('\n\n'));
        }
        else {
          console.log('trying ocr on ' + documentPath);

          var pdf_processor = pdf_extract(documentPath, ocr_pdf_extract_options, function(err, pages) {
            if (err) {
              console.dir(err);
            }
            else if (pages.length) {
              _write(pages.join('\n\n'));
            }
            else {
              _done();
            }
          });
          text_processor.on('error', _err);
        }
      });
      text_processor.on('error', _err);
    }
    else {
      _done();
    }
  });
};

// db.forceSave();

var keys = db.keys().sort();
// count = 18331;
// async.eachLimit(keys.slice(keys.indexOf('6017857697')), 1, extractTextFromDocument, function() {
async.eachLimit(keys, 13, extractTextFromDocument, function() {
  // db.forceSave();
  console.log('done');
});
