
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
    , theme = require('ace/theme/github');

  var editor = ace.edit('editor');

  editor.setTheme(theme);
  editor.setReadOnly(true);
  editor.setShowFoldWidgets(false);

  // Resize the editor when the window is resized
  $(window).resize(function() {
    editor.resize();
  });

  exports.exec = function(file) {

    /**
     * Function dependencies.
     */

    var modelist = require('ace/ext/modelist');

    var params = { file: file };
    $.post('/api/v1/view', params, function(data) {
      var session = editor.getSession()
        , doc = session.getDocument();

      // Clear out the documents
      session.setValue('');

      // Insert the file contents
      doc.insertLines(0, data.file.contents);

      // Set syntax highlighting mode from file extension
      session.setMode(modelist.getModeForPath(file).mode);

      // Seek back to the beginning of the file
      editor.navigateFileStart();

      // Resize the editor DOM to fit the whole contents of the file
      //   refer to http://stackoverflow.com/questions/1158406
      (function() {
        var renderer = editor.renderer
          , height = session.getLength() * renderer.lineHeight
                     + renderer.scrollBar.getWidth();

        $('#editor').height(height);

        editor.resize();
      })();
    }, 'json');
  };
});
