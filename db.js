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
}, 2000);

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

var documentsFolder = module.exports.documentsFolder = 'documents';
