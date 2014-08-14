// a simple json file based database

'use strict';

var _ = require('lodash');

var jf = require('jsonfile');

jf.spaces = 0;

var filename = module.exports.filename = 'filings.json';

var db = module.exports.db = jf.readFileSync(filename);

var read = module.exports.read = function() {
  return jf.readFileSync(filename);
};

var _save = module.exports._save = _.throttle(function() {
  console.log('saving db');
  jf.writeFileSync(filename, db);
}, 10000);

var _forceSave = module.exports.forceSave = function() {
  console.log('force saving db');
  jf.writeFileSync(filename, db);
};

var has = module.exports.has = function(id) {
  return db.hasOwnProperty(id);
};

var get = module.exports.get = function(id) {
  return db[id];
};

var set = module.exports.set = function(id, values) {
  db[id] = values;
  _save();
};

var keys = module.exports.keys = function() {
  return Object.keys(db);
};

var documentsBase = module.exports.documentsBase = 'documents';
var documentsFolderPdf = module.exports.documentsFolderPdf = documentsBase + '-pdf';
var documentsFolderText = module.exports.documentsFolderText = documentsBase + '-txt';
