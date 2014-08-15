// small maintenance script to move documents folder from flat files to nested by date

var _ = require('lodash');
var async = require('async');

var db = require('./db');

var fs = require('fs-extra');
var moment = require('moment');

// make a backup of everything before trying to do anything
// console.log('running a backup');
// console.log(require('exec-sync')('grunt backup'));
// console.log('done');

var count = 0;
var total = db.keys().length;
var notification = _.throttle(function() {
  console.log('progress ' + count + '/' + total + ' (' + (100.0 * count / total).toFixed(2) + '%)');
}, 400);

var fixDocumentPath = function(id, callback) {
  setTimeout(function() {
    var entry = db.get(id);
    var documentPathPdf = db.documentsFolderPdf + '/' + moment(entry.disseminated).format('MMMM-Do-YYYY') + '/' + entry.documentID + '.pdf';
    var documentPathText = db.documentsFolderText + '/' + moment(entry.disseminated).format('MMMM-Do-YYYY') + '/' + entry.documentID + '.txt';

    delete entry.documentPath;
    entry.documentPathPdf = documentPathPdf;
    entry.documentPathText = documentPathText;
    db.set(id, entry);

    count++;
    notification();
    callback(null);
  }, 200);
};

async.eachLimit(db.keys(), 1000, fixDocumentPath, function() {
  console.log('done');
  setTimeout(function() {
    db.forceSave();
  }, 1000);
});
