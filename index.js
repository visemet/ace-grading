
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , net = require('net')
  , path = require('path');

var async = require('async');

var app = express();

var file = require('./lib/file.js')
  , diff = require('./lib/diff.js');

app.configure(function() {
  app.set('port', process.env.PORT || 3000);
  app.set('views', path.join(__dirname, 'app', 'views'));
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.urlencoded());
  app.use(express.json());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(express.methodOverride());
  app.use(express.static(path.join(__dirname, 'public')));

  // Middleware to refresh notifications
  app.use(function(req, res, next) {
    res.locals({ title: 'ace-grading' });
    next(null, req, res);
  });

  app.use(app.router);

  // Fallback to 404 if no matching route found
  app.use(function(req, res) {
    res.status(404).render('404');
  });
});

app.configure('development', function() {
  app.use(express.errorHandler());
  app.locals.pretty = true;
});

app.configure('production', function() {
  app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).render('500');
  });

  app.locals.pretty = true;
});

app.get('/view', function(req, res) {
  res.render('view');
});

app.get('/compare', function(req, res) {
  res.render('compare');
});

app.post('/api/v1/view', function(req, res, next) {
  var filename = req.body.file;

  file.readlines(filename, function(err, contents) {
    if (err) {
      return next(err);
    }

    res.send({ file: { contents: contents } });
  });
});

app.post('/api/v1/compare', function(req, res, next) {
  var fromFilename = req.body.fromFile
    , toFilename = req.body.toFile;

  function doRead(filename) {
    return function(callback) {
      file.readlines(filename, callback);
    };
  };

  function doDiff(fromFilename, toFilename) {
    return function(callback) {
      diff.exec(fromFilename, toFilename, callback);
    };
  };

  function cbAlign(err, fromContents, toContents, changes) {
    if (err) {
      return next(err);
    }

    res.send({
      fromFile: { contents: fromContents }
    , toFile: { contents: toContents }
    , changes: changes
    });
  };

  var tasks = {
    from: doRead(fromFilename)
  , to: doRead(toFilename)
  , diff: doDiff(fromFilename, toFilename)
  };

  async.parallel(tasks, function(err, results) {
    if (err) {
      return next(err);
    }

    diff.align(results.from, results.to, results.diff, cbAlign);
  });
});

http.createServer(app).listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});
