/**
 * Created by Codi Marker on 1/6/16.
 */

var didYouMean = require('didyoumean');

exports.setThreshold = function(newThreshold) {
    didYouMean.threshold = newThreshold;
};

function getUniqueValuesByKey(array, key) {
    var temp = {};
    for (var x=0;x<array.length;x++) {
        temp[array[x][key]] = 1;
    }

    var ret = [];
    for (var curKey in temp) {
        ret.push(curKey);
    }
    return ret;
}
exports.getUniqueValuesByKey = getUniqueValuesByKey;

var loadedFiles = {};
exports.loadedFiles = loadedFiles;

function matchKey(testValue, key, filename) {
    if (typeof(filename) == "object") {
        var values = getUniqueValuesByKey(filename, key);
        var ret = didYouMean(testValue, values);
        return ret;
    }

    try {
        var obj = JSON.parse(filename);
        var values = getUniqueValuesByKey(obj, key);
        var ret = didYouMean(testValue, values);
        return ret;
    }
    catch (err) {
        //not valid json, continue
    }

    fileContent = loadedFiles[filename];
    if (!fileContent || !fileContent.file) {
        fileContent = {};
        fileContent.file = JSON.parse(require('fs').readFileSync(filename, 'utf8'));
        loadedFiles[filename] = fileContent;
    }
    if (!fileContent || !fileContent.file)
        return "";
    if (!fileContent.values || !fileContent.values[key]) {
        if (!fileContent.values)
            fileContent.values = {};
        fileContent.values[key] = getUniqueValuesByKey(fileContent.file, key);
    }
    var values = fileContent.values[key];
    var ret = didYouMean(testValue, values);
    return ret;
}
exports.matchKey = matchKey;