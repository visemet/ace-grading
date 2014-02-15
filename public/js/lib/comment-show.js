
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

  var $ = require('jquery')
    , ace = require('ace/ace')
    , Range = require('ace/range').Range;

  var editor = ace.edit('editor')
    , session = editor.getSession();

  // Turn off the highlighting on the active line since it distracts
  // from the commented sections of code
  editor.setHighlightActiveLine(false);

  var align = require('lib/comment-align');

  (function() {
    var renderer = editor.renderer;

    var $comments = $('#comments')
      , lastIndex = 0;

    // TODO: Read the list of comments from the file
    //       sort on start line and start position
    var comments = [];

    comments.forEach(function(value, index) {
      var $comment = $(['<div class="panel panel-default">',
                        '  <div class="panel-body" />',
                        '</div>'].join('\n'));

      $comment.find('.panel-body').text(value.message);
      $comment.addClass('comment-box');

      var commentStart = value.start
        , commentEnd = value.end;

      var startLine = commentStart.line
        , endLine = commentEnd.line
        , startPos = commentStart.pos
        , endPos = commentEnd.pos;

      var height = startLine * renderer.lineHeight;
      $comment.data('preferred-top', height);

      // Highlight the commented section of code
      var range = new Range(startLine, startPos, endLine, endPos)
        , markerId = session.addMarker(range, 'comment-code', 'line', false)
        , marker = session.getMarkers(false)[markerId];

      // Register a handler on the editor for when the cursor position
      // changes
      var selection = session.getSelection();
      selection.on('changeCursor', function() {
        var cursorPos = function(pos) {
          return { line: pos.row, pos: pos.column };
        }(selection.getCursor());

        var withinComment = isCursorWithinComment(cursorPos, commentStart,
                                                  commentEnd);

        handleCodeHighlight(marker, withinComment);
        handleBoxHighlight($comment, withinComment);

        if (withinComment) {
          if (align.move(index, $comments.children())) {
            align.above(index, $comments.children());
            align.below(index, $comments.children());
          }

          lastIndex = index;
        }

        renderer.updateBackMarkers();
      });

      // Register a click handler on the comment box in order to move
      // the cursor to the commented section of code, which then invokes
      // that handler
      $comment.click(function() {
        editor.clearSelection();
        editor.moveCursorTo(startLine, startPos);
      });

      $comments.append($comment);
      align.move(index, $comments.children());
    });

    if (comments.length >= 0) {
      align.below(0, $comments.children());

      // Handle realigning the comments when the window size changes
      // because the comment box heights may have changed
      $(window).resize(function() {
        align.move(lastIndex, $comments.children());
        align.above(lastIndex, $comments.children());
        align.below(lastIndex, $comments.children());
      });
    }

    var lastScrollTop = session.getScrollTop();
    session.on('changeScrollTop', function(scrollTop) {
      var diff = scrollTop - lastScrollTop;

      align.setOffset(scrollTop);
      align.apply(-diff, $comments.children()); // minus for direction

      lastScrollTop = scrollTop;
    });
  })();

  /**
   * Returns true if the cursor is within the comment, and false
   * otherwise.
   *
   * cursor       = { line: Number, pos: Number }
   * commentStart = { line: Number, pos: Number }
   * commentEnd   = { line: Number, pos: Number }
   */
  function isCursorWithinComment(cursor, commentStart, commentEnd) {
    if (commentStart.line === commentEnd.line) {
      return (cursor.line === commentStart.line
              && cursor.pos >= commentStart.pos
              && cursor.pos <= commentEnd.pos);
    }

    return (cursor.line === commentStart.line && cursor.pos >= commentStart.pos
            || cursor.line > commentStart.line && cursor.line < commentEnd.line
            || cursor.line === commentEnd.line && cursor.pos <= commentEnd.pos);
  };

  /**
   * Toggles whether the marker overlay is highlighted based on whether
   * the cursor is within the commented section of code.
   */
  function handleCodeHighlight(marker, withinComment) {
    if (withinComment) {
      marker.clazz = 'comment-code comment-code-highlighted';
    } else {
      marker.clazz = 'comment-code';
    }
  }

  /**
   * Toggles whether the comment box is highlighted based on whether
   * the cursor is within the commented section of code.
   */
  function handleBoxHighlight($comment, withinComment) {
    if (withinComment) {
      $comment.addClass('comment-box-highlighted');
    } else {
      $comment.removeClass('comment-box-highlighted');
    }
  };
});
