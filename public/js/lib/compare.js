
require.config({
  baseUrl: '/js',
  paths: {
    ace: 'vendor/ace',
    jquery: '//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min'
  }
});

define(function(require, exports, module) {
  'use strict';

  /**
   * Module dependencies.
   */

  var $ = require('jquery');

  var ace = require('ace/ace')
    , theme = require('ace/theme/github')
    , Split = require('ace/split').Split;

  var container = document.getElementById('editor')
    , split = new Split(container, theme, 2);

  split.forEach(function(editor) {
    editor.setReadOnly(true);
    editor.setShowFoldWidgets(false);
  });

  // Resize the editors when the window is resized
  $(window).resize(function() {
    split.resize();
  });

  var fromMarkers = []
    , toMarkers = [];

  exports.exec = function(fromFile, toFile) {

    /**
     * Function dependencies.
     */

    var modelist = require('ace/ext/modelist')
      , Range = require('ace/range').Range;

    var params = { fromFile: fromFile, toFile: toFile };
    $.post('/api/v1/compare', params, function(data) {
      var fromEditor = split.getEditor(0)
        , toEditor = split.getEditor(1);

      var fromSession = fromEditor.getSession()
        , toSession = toEditor.getSession();

      var fromDocument = fromSession.getDocument()
        , toDocument = toSession.getDocument();

      // Clear any highlights
      fromMarkers.forEach(function(marker) {
        fromSession.removeMarker(marker);
      });

      toMarkers.forEach(function(marker) {
        toSession.removeMarker(marker);
      });

      fromMarkers = [];
      toMarkers = [];

      // Clear out the documents
      fromSession.setValue('');
      toSession.setValue('');

      // Insert the file contents
      fromDocument.insertLines(0, data.fromFile.contents);
      toDocument.insertLines(0, data.toFile.contents);

      // Highlight the deleted lines
      data.changes.deletions.forEach(function(value) {
        var line = value.line - 1
          , range = new Range(line, 0, line, Infinity);

        var m = fromSession.addMarker(range, 'deletion', 'fullLine', false);
        fromMarkers.push(m);
      });

      // Highlight the added lines
      data.changes.additions.forEach(function(value) {
        var line = value.line - 1
          , range = new Range(line, 0, line, Infinity);

        var m = toSession.addMarker(range, 'addition', 'fullLine', false);
        toMarkers.push(m);
      });

      // Set syntax highlighting mode from file extension
      fromSession.setMode(modelist.getModeForPath(fromFile).mode);
      toSession.setMode(modelist.getModeForPath(toFile).mode);

      // Seek back to the beginning of the file
      split.forEach(function(editor) {
        editor.navigateFileStart();
      });

      // Resize the editor DOM to fit the whole contents of both files
      //   refer to http://stackoverflow.com/questions/11584061
      (function() {
        var fromRenderer = fromEditor.renderer
          , toRenderer = toEditor.renderer;

        var fromHeight = fromSession.getLength() * fromRenderer.lineHeight
                         + fromRenderer.scrollBar.getWidth()
          , toHeight = toSession.getLength() * toRenderer.lineHeight
                       + toRenderer.scrollBar.getWidth()

        $('#editor').height(Math.max(fromHeight, toHeight));

        split.resize();
      })();
    }, 'json');
  };
});
