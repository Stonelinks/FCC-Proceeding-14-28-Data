// small maintenance script to move documents folder from flat files to nested by date

var _ = require('lodash');
var async = require('async');

var db = require('./db');

var fs = require('fs-extra');
var moment = require('moment');

// make a backup of everything before trying to do anything
console.log('running a backup');
console.log(require('exec-sync')('grunt backup'));
console.log('done');

var newDocs = db.documentsFolder + '.new';
if (fs.existsSync(newDocs)) {
  fs.removeSync(newDocs);
}
fs.mkdirs(newDocs);

var count = 0;
var total = db.keys().length;
var notification = _.throttle(function() {
  console.log('progress ' + count + '/' + total + ' (' + (100.0 * count / total) + '%)');
}, 400);

var moveFile = function(id, callback) {

  var entry = db.get(id);
  var oldpath = db.documentsFolder + '/' + entry.documentID + '.pdf';

  if (fs.existsSync(oldpath)) {
    var basepath = newDocs + '/' + moment(entry.disseminated).format('MMMM-Do-YYYY');
    fs.ensureDir(basepath, function() {
      notification();
      var newpath = basepath + '/' + entry.documentID + '.pdf';
      fs.copy(oldpath, newpath, function() {
        entry.documentPath = db.documentsFolder + '/' + moment(entry.disseminated).format('MMMM-Do-YYYY') + '/' + entry.documentID + '.pdf';
        db.set(id, entry);
        callback(null);
      });
    });
  }
  else {
    callback(null);
  }
};

var fixDocumentPath = function(id, callback) {
  setTimeout(function() {
    var entry = db.get(id);
    var documentPath = db.documentsFolder + '/' + moment(entry.disseminated).format('MMMM-Do-YYYY') + '/' + entry.documentID + '.pdf';
    if (fs.existsSync(documentPath)) {
      count++;
      notification();
      callback(null);
    }
    else {
      fs.move(entry.documentPath, documentPath, function() {

        entry.documentPath = documentPath;
        db.set(id, entry);

        count++;
        notification();
        callback(null);
      });
    }
  }, 200);
};

async.eachLimit(db.keys(), 100, fixDocumentPath, function() {
  console.log('done');
});
