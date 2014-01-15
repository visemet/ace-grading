
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
