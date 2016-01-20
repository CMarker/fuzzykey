/**
 * Created by Codi Marker on 1/6/16.
 */

var natural = require('natural');
var threshold = 0.8;
exports.setThreshold = function(newThreshold) {
    threshold = newThreshold;
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

function closest(input, array) {
    var best = 0;
    var bestIndex = 0;
    for (var x=0;x<array.length;x++) {
        var score = matchTokenSet(input, array[x]);
        if (score > best) {
            best = score;
            bestIndex = x;
        }
    }
    if (best < threshold)
        return "";
    return array[bestIndex];
}
exports.closest = closest;

function matchKeySet(testValue, key, filename) {
    if (typeof(filename) == "object") {
        var values = getUniqueValuesByKey(filename, key);
        var ret = closest(testValue, values);
        return ret;
    }

    try {
        var obj = JSON.parse(filename);
        var values = getUniqueValuesByKey(obj, key);
        var ret = closest(testValue, values);
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
    var ret = closest(testValue, values);
    return ret;
}
exports.matchKeySet = matchKeySet;

function cachedObj(filename) {
    var fileContent = loadedFiles[filename];
    if (!fileContent || !fileContent.file) {
        fileContent = {};
        fileContent.file = JSON.parse(require('fs').readFileSync(filename, 'utf8'));
        loadedFiles[filename] = fileContent;
    }
    return fileContent;
}

function matchKey(testValue, key, filename) {
    if (typeof(filename) == "object") {
        var values = getUniqueValuesByKey(filename, key);
        var ret = closest(testValue, values);
        return ret;
    }

    try {
        var obj = JSON.parse(filename);
        var values = getUniqueValuesByKey(obj, key);
        var ret = closest(testValue, values);
        return ret;
    }
    catch (err) {
        //not valid json, continue
    }

    var fileContent = cachedObj(filename);
    if (!fileContent || !fileContent.file)
        return "";
    if (!fileContent.values || !fileContent.values[key]) {
        if (!fileContent.values)
            fileContent.values = {};
        fileContent.values[key] = getUniqueValuesByKey(fileContent.file, key);
    }
    var values = fileContent.values[key];
    var ret = closest(testValue, values);
    return ret;
}
exports.matchKey = matchKey;

var MAX_INT = Math.pow(2,32) - 1; // We could probably go higher than this, but for practical reasons let's not.
function getEditDistance(a, b, max) {
    // Handle null or undefined max.
    max = max || max === 0 ? max : MAX_INT;

    var lena = a.length;
    var lenb = b.length;

    // Fast path - no A or B.
    if (lena === 0) return Math.min(max + 1, lenb);
    if (lenb === 0) return Math.min(max + 1, lena);

    // Fast path - length diff larger than max.
    if (Math.abs(lena - lenb) > max) return max + 1;

    // Slow path.
    var matrix = [],
        i, j, colMin, minJ, maxJ;

    // Set up the first row ([0, 1, 2, 3, etc]).
    for (i = 0; i <= lenb; i++) { matrix[i] = [i]; }

    // Set up the first column (same).
    for (j = 0; j <= lena; j++) { matrix[0][j] = j; }

    // Loop over the rest of the columns.
    for (i = 1; i <= lenb; i++) {
        colMin = MAX_INT;
        minJ = 1;
        if (i > max) minJ = i - max;
        maxJ = lenb + 1;
        if (maxJ > max + i) maxJ = max + i;
        // Loop over the rest of the rows.
        for (j = 1; j <= lena; j++) {
            // If j is out of bounds, just put a large value in the slot.
            if (j < minJ || j > maxJ) {
                matrix[i][j] = max + 1;
            }

            // Otherwise do the normal Levenshtein thing.
            else {
                // If the characters are the same, there's no change in edit distance.
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                }
                // Otherwise, see if we're substituting, inserting or deleting.
                else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // Substitute
                        Math.min(matrix[i][j - 1] + 1, // Insert
                            matrix[i - 1][j] + 1)); // Delete
                }
            }

            // Either way, update colMin.
            if (matrix[i][j] < colMin) colMin = matrix[i][j];
        }

        // If this column's minimum is greater than the allowed maximum, there's no point
        // in going on with life.
        if (colMin > max) return max + 1;
    }
    // If we made it this far without running into the max, then return the final matrix value.
    return matrix[lenb][lena];
}

function matchPartial(a, b) {
    var first = a, second = b;
    if (b.length < a.length) {
        first = b; second = a;
    }

    var best = MAX_INT;
    for (var x=0; x<second.length-first.length+1;x++) {
        var buf = second.slice(x, first.length+x);
        var dist = getEditDistance(first, buf, best);
        if (dist < best)
            best = dist;
    }

    var matchCount = second.length - (second.length-first.length+1) - best;
    var ret = 2.0 * matchCount / (first.length + second.length);
    return ret;
}
exports.matchPartial = matchPartial;

function matchTokenSet(a,b) {
    var first = a, second = b;
    if (b.length < a.length) {
        first = b; second = a;
    }

    first = first.replace(/,/g, ' ').replace(/[ ]+/g, ' ').replace(/[-]+/g, ' ').toLowerCase();
    second = second.replace(/,/g, ' ').replace(/[ ]+/g, ' ').replace(/[-]+/g, ' ').toLowerCase();

    var firstList = first.split(' ');
    var secondList = second.split(' ');
    var common = {};
    var firstOnly = {};
    var secondOnly = {};

    for (var x=0;x<firstList.length;x++) {
        if (secondList.indexOf(firstList[x]) != -1)
            common[firstList[x]] = true;
        else
            firstOnly[firstList[x]] = true;
    }

    for (var x=0;x<secondList.length;x++) {
        if (firstList.indexOf(secondList[x]) != -1)
            common[secondList[x]] = true;
        else
            secondOnly[secondList[x]] = true;
    }

    var t0 = Object.keys(common).join(" ");
    var t1 = t0;
    var firstExtra = Object.keys(firstOnly).join(" ");
    if (firstExtra.length)
        t1 = t1 + " " + firstExtra;
    var t2 = t0;
    var secondExtra = Object.keys(secondOnly).join(" ");
    if (secondExtra.length)
        t2 = t2 + " " + secondExtra;

    /*var z0 = getEditDistance(t0, t1);
    var z1 = getEditDistance(t0, t2);
    var z2 = getEditDistance(t1, t2);

    var best = z0;
    if (z1 < best) {
        best = z1;
    }
    if (z2 < best) {
        best = z2;
    }

    var ret = 2.0 * t0.length / (first.length + second.length);
    return ret */

    var z0 = natural.JaroWinklerDistance(t0, t1);
    var z1 = natural.JaroWinklerDistance(t0, t2);
    var z2 = natural.JaroWinklerDistance(t1, t2);

    var best = z0;
    if (z1 < best) {
        best = z1;
    }
    if (z2 < best) {
        best = z2;
    }

    return best;
}
exports.matchTokenSet = matchTokenSet;

function rowsWithKeyValue(array, key, value) {

    var localArray = array;
    if (array.length && typeof(array) == 'string') {
        var fileContent = cachedObj(array);
        localArray = fileContent.file;
    }

    var ret = [];
    for (var x=0;x<localArray.length;x++) {
        if (localArray[x][key] == value) {
            ret.push(localArray[x]);
        }
    }

    return ret;
}
exports.rowsWithKeyValue = rowsWithKeyValue;