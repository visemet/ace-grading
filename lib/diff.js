
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
 *   Similarly, elements of the `deletions` list are of the form
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
 *   changes = list of additions and deletions, see diff.exec()
 *   next = function(err) callback
 *
 * Return value(s)
 *   err = Error object, self-explanatory
 *   newFromFile = list of strings file contents
 *   newToFile = list of strings file contents
 *   newChanges = { additions: [ ... ], deletions: [ ... ] }
 *
 *   Elements of the `additions` list are of the form
 *     { line: int }
 *   indicating the line `line` was inserted into `toFile`.
 *   Similarly, elements of the `deletions` list are of the form
 *     { line: int }
 *   indicating the line `line` was inserted into `fromFile`.
 */
diff.align = function(fromFile, toFile, changes, next) {
  var newFromFile = []
    , newToFile = [];

  var newAdditions = []
    , newDeletions = []
    , newChanges = { additions: newAdditions, deletions: newDeletions };

  var fromLastIndex = 0
    , toLastIndex = 0;

  var additions = changes.additions
    , deletions = changes.deletions;

  var iAddition = 0
    , iDeletion = 0;

  function advanceFromFile(addition, deletion) {
    var extent = Math.min(deletion.line, addition.rel);

    // Insert up until this line in the from-file
    while (fromLastIndex < extent - 1) {
      newFromFile.push(fromFile[fromLastIndex++]);
    }
  };

  function advanceToFile(addition, deletion) {
    var extent = Math.min(addition.line, deletion.rel);

    // Insert up until this line in the to-file
    while (toLastIndex < extent - 1) {
      newToFile.push(toFile[toLastIndex++]);
    }
  };

  // Handle deletions by
  // - inserting the corresponding line into the from-file
  // - inserting an empty string into the to-file
  function handleDeletion(blank) {
    newFromFile.push(fromFile[fromLastIndex++]);
    newDeletions.push({ line: newFromFile.length });

    if (blank) {
      newToFile.push('');
    }
  };

  // Handle additions by
  // - inserting the corresponding line into the to-file
  // - inserting an empty string into the from-file
  function handleAddition(blank) {
    newToFile.push(toFile[toLastIndex++]);
    newAdditions.push({ line: newToFile.length });

    if (blank) {
      newFromFile.push('');
    }
  };

  while (iDeletion < deletions.length && iAddition < additions.length) {
    var deletion = deletions[iDeletion]
      , addition = additions[iAddition];

    advanceFromFile(addition, deletion);
    advanceToFile(addition, deletion);

    // Check if...
    // ...there are any deletions that can be performed
    if (deletion.line < addition.rel) {
      while (fromLastIndex < deletion.line) {
        handleDeletion(true);
      }

      iDeletion++;
    }

    // ...there are any additions that can be performed
    else if (addition.line < deletion.rel) {
      while (toLastIndex < addition.line) {
        handleAddition(true);
      }

      iAddition++;
    }

    // ...there are any changes that can be performed
    else {
      handleDeletion(false);
      handleAddition(false);

      iDeletion++;
      iAddition++;
    }
  }

  // Perform any outstanding deletions
  while (iDeletion < deletions.length) {
    var deletion = deletions[iDeletion];

    advanceFromFile({ rel: Infinity }, deletion);

    handleDeletion(toLastIndex === deletion.rel);
    iDeletion++;
  }

  // Perform any outstanding additions
  while (iAddition < additions.length) {
    var addition = additions[iAddition];

    advanceToFile(addition, { rel: Infinity });

    handleAddition(fromLastIndex === addition.rel);
    iAddition++;
  }

  // Insert any remaining, unchanged lines into the from-file
  while (fromLastIndex < fromFile.length) {
    newFromFile.push(fromFile[fromLastIndex++]);
  }

  // Insert any remaining, unchanged lines into the to-file
  while (toLastIndex < toFile.length) {
    newToFile.push(toFile[toLastIndex++]);
  }

  // Ensure that the to-file and from-file contents contain an equal
  // number of lines
  while (newFromFile.length < newToFile.length) {
    newFromFile.push('');
  }

  while (newToFile.length < newFromFile.length) {
    newToFile.push('');
  }

  return next(null, newFromFile, newToFile, newChanges);
};
