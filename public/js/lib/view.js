
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
    }, 'json');
  };

  // Resize the editor when the window is resized
  $(window).resize(function() {
    // Note that we cannot use $(document).height() to compute the
    // height of the document because this will return the height
    // of the window if the page content is smaller than the viewport
    var windowHeight = $(window).height()
      , documentHeight = document.body.clientHeight
      , diff = windowHeight - documentHeight;

    $('#editor').height($('#editor').height() + diff);
    $('#comments').height($('#comments').height() + diff);

    editor.resize();
  });

  // Fill the remaining space of the document with the editor
  $(window).resize();
});
