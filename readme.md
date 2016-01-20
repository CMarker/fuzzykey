
fuzzykey
-------------------

Wrapper for easily matching a key value for an object in an array.

Can accept an array of objects as an array, json string or json file. Loaded json files are cached for faster processing.


To Use
----------


Add fuzzykey as a dependency in packages.json:
"fuzzykey": "https://github.com/CMarker/fuzzykey.git",



var match = require('fuzzykey');
match.setThreshold(0.8); //default of 0.8

//using a json file
var ret = match.matchKey('Nor', 'street', 'example.json');
console.log('Nor matched to '  + ret);

//using an array of objects
var data = [{"name":"Bob","street":"Maple"},{"name":"Jill","street":"Main"},{"name":"Roger","street":"Apple"},{"name":"Craig","street":"West"},{"name":"Julie","street":"North"}];
ret = match.matchKey('Nor', 'street', data);
console.log('Nor matched to '  + ret);

//using a json formatted string
var jsonString = '[{"name":"Bob","street":"Maple"},{"name":"Jill","street":"Main"},{"name":"Roger","street":"Apple"},{"name":"Craig","street":"West"},{"name":"Julie","street":"North"}]';
ret = match.matchKey('Nor', 'street', jsonString);
console.log('Nor matched to '  + ret);