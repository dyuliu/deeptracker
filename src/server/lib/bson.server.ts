import * as BSON from 'bson';
let serializer = require('bson/lib/bson/parser/serializer');

BSON.prototype.serialize = function serialize(object, options) {
  options = options || {};
  // Unpack the options
  let checkKeys = typeof options.checkKeys === 'boolean'
    ? options.checkKeys : false;
  let serializeFunctions = typeof options.serializeFunctions === 'boolean'
    ? options.serializeFunctions : false;
  let ignoreUndefined = typeof options.ignoreUndefined === 'boolean'
    ? options.ignoreUndefined : true;

  let calcBytes = this.calculateObjectSize(object);
  let buffer = new Buffer(calcBytes);
  let serializationIndex = serializer(buffer, object, checkKeys, 0, 0, serializeFunctions, ignoreUndefined, []);
  return buffer;
};


let bson = new BSON();

export {bson};
