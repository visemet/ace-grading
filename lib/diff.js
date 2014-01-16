
/**
 * Module dependencies.
 */

var readline = require('readline')
  , spawn = require('child_process').spawn;

module.exports = exports = diff = {};

/**
 * Returns the necessary additions and deletions to apply in order to
 * transform `fromFile` into `toFile`.
 *
 * Parameter(s)
 *   fromFile = string filename
 *   toFile = string filename
 *   next = function(err, changes) callback
 *
 * Return value(s)
 *   err = Error object, self-explanatory
 *   changes = { additions: [ ... ], deletions: [ ... ] }
 *
 *   Elements of the `additions` list are of the form
 *     { line: int, rel: int }
 *   indicating to transform `fromFile` into `toFile`, add line `line`
 *   of `toFile` before line `rel` of `fromFile`.
 *   Smilarly, elemenets of the `deletions` list are of the form
 *     { line: int, rel: int }
 *   indicating to transform `fromFile` into `toFile`, remove line
 *   `line` of `fromFile` before line `rel` of `toFile`.
 */
diff.exec = function(fromFile, toFile, next) {
  var res = { additions: [], deletions: [] };

  // Diff two files and output using the unified format
  var command = spawn('diff', [ '-u', fromFile, toFile ]);

  var regexHunk = /^@@ [-](\d+)[^ ]* [+](\d+)[^ ]* @@$/
    , fromLineNo = 0
    , toLineNo = 0
    , numChanges = 0;

  var rl = readline.createInterface({ input: command.stdout
                                    , output: null
                                    , terminal: false
                                    });

  rl.on('line', function(line) {
    var match = regexHunk.exec(line);
    if (match) {
      fromLineNo = +match[1]
      toLineNo = +match[2];
      numChanges = 0;
    } else if (fromLineNo || toLineNo) {
      switch (line[0]) {
        case '+':
          res.additions.push({ line: toLineNo, rel: fromLineNo - numChanges });
          toLineNo++;
          break;
        case '-':
          res.deletions.push({ line: fromLineNo, rel: toLineNo });
          fromLineNo++;
          numChanges++;
          break;
        case ' ':
          fromLineNo++;
          toLineNo++;
          numChanges = 0;
          break;
      }
    }
  });

  rl.on('close', function() {
    return next(null, res);
  });
};

/**
 * Aligns the contents of the from-file and the to-file based on the
 * changes specified.
 *
 * Parameter(s)
 *   fromFile = list of strings file contents
 *   toFile = list of strings file contents
 *   done = function(err) callback
 *
 * Return value(s)
 *   err = Error object, self-explanatory
 *   newFromFile = list of strings file contents
 *   newToFile = list of strings file contents
 */
diff.align = function(fromFile, toFile, changes, done) {
  var newFromFile = []
    , newToFile = [];

  var fromLastIndex = 0
    , toLastIndex = 0;

  var additions = changes.additions
    , deletions = changes.deletions;

  var iAddition = 0
    , iDeletion = 0;

  while (iDeletion < deletions.length && iAddition < additions.length) {
    // Check if...
    // ...there are any deletions that can be performed
    if (deletions[iDeletion].line < additions[iAddition].rel) {
      // Handle deletions by
      // - inserting the corresponding line into the from-file
      // - inserting an empty string into the to-file
      while (fromLastIndex < deletions[iDeletion].line) {
        newFromFile.push(fromFile[fromLastIndex]);
        fromLastIndex++;

        newToFile.push('');
      }


      iDeletion++;
    }

    // ...there are any additions that can be performed
    else if (additions[iAddition].line < deletions[iDeletion].rel) {
      // Handle additions by
      // - inserting the corresponding line into the to-file
      // - inserting an empty string into the from-file
      while (toLastIndex < additions[iAddition].line) {
        newToFile.push(toFile[toLastIndex]);
        toLastIndex++;

        newFromFile.push('');
      }

      iAddition++;
    }

    // Otherwise, have reached constant hunk of both files
    else {
      // Insert up until this line in the from-file
      while (fromLastIndex < deletions[iDeletion].line) {
        newFromFile.push(fromFile[fromLastIndex]);
        fromLastIndex++;
      }

      iDeletion++;

      // Insert up until this line in the to-file
      while (toLastIndex < additions[iAddition].line) {
        newToFile.push(toFile[toLastIndex]);
        toLastIndex++;
      }

      iAddition++;
    }
  }

  // Perform any outstanding deletions
  while (iDeletion < deletions.length) {
    // Handle deletions by
    // - inserting the corresponding line of the from-file
    // - inserting an empty string into the to-file, only if have not
    //   moved past relative line in the to-file
    while (fromLastIndex < deletions[iDeletion].line) {
      newFromFile.push(fromFile[fromLastIndex]);
      fromLastIndex++;

      if (toLastIndex === deletions[iDeletion].rel) {
        newToFile.push('');
      }
    }

    iDeletion++;
  }

  // Perform any outstanding additions
  while (iAddition < additions.length) {
    // Handle additions by
    // - inserting the corresponding line into the to-file
    // - inserting an empty string into the from-file, only if have not
    //   moved past relative line in the from-file
    while (toLastIndex < additions[iAddition].line) {
      newToFile.push(toFile[toLastIndex]);
      toLastIndex++;

      if (fromLastIndex === additions[iAddition].rel) {
        newFromFile.push('');
      }
    }

    iAddition++;
  }

  // Insert any remaining, unchanged lines into the from-file
  while (fromLastIndex < fromFile.length) {
    newFromFile.push(fromFile[fromLastIndex]);
    fromLastIndex++;
  }

  // Insert any remaining, unchanged lines into the to-file
  while (toLastIndex < toFile.length) {
    newToFile.push(toFile[toLastIndex]);
    toLastIndex++;
  }

  return done(null, newFromFile, newToFile);
};
