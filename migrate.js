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

var count = 0;
var total = db.keys().length;
var notification = _.throttle(function() {
  console.log('progress ' + count + '/' + total + ' (' + (100.0 * count / total).toFixed(2) + '%)');
}, 400);

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
