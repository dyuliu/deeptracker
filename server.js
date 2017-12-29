"use strict";
var server = require('./build/config/app');

server.default.bootstrap();


// let BSON = require('bson');
// let bson = new BSON();


// let a = {a: 1, b: [1,2,3]};

// let bytes = bson.calculateObjectSize(a);
// console.log(bytes);
// let buffer = new Buffer(bytes - 1);
// bson.serializeWithBufferAndIndex(a, buffer);
// console.log(buffer.byteLength);
// let doc = bson.deserialize(buffer);
// console.log(doc);
