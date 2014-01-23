
/**
 * Module dependencies.
 */

var fs = require('fs')
  , readline = require('readline');

module.exports = exports = file = {};

file.readlines = function(file, next) {
  var contents = [];

  var rstream = fs.createReadStream(file)
    , rl = readline.createInterface({ input: rstream
                                    , output: null
                                    , terminal: false
                                    });

  rl.on('line', function(line) {
    contents.push(line);
  });

  rl.on('close', function() {
    return next(null, contents);
  });
};
