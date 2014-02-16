
require.config({
  baseUrl: '/js',
  paths: {
    ace: 'vendor/ace',
    jquery: '//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min'
  }
});

/**
 * A module to display a list of comments.
 * @module comment-vm/show
 */
define(function(require, exports, module) {
  'use strict';

  /**
   * Module dependencies.
   */

  var $ = require('jquery');

  var align = require('lib/comment-vm/align')
    , Comment = require('lib/comment/comment').Comment
    , List = require('lib/comment/list').List;

  /**
   * This object is used to store the editor and the list of comments.
   * It also handles displaying them.
   *
   * @class module:comment-vm/show#Environment
   * @memberof module:comment-vm/show
   */

  /**
   * Creates a new `Environment` object with the specified editor and
   * list of comments.
   *
   * @param editor The editor
   * @param {List} comments The list of comments
   *
   * @constructor
   */
  var Environment = function(editor, comments) {
    this.editor = editor;
    this.comments = comments;

    // Turn off the highlighting on the active line since it distracts
    // from the commented sections of code
    editor.setHighlightActiveLine(false);
  };

  (function() {

    /**
     * Displays the list of comments.
     *
     * @param {Object} dom The DOM where the list of comments are
     *    displayed
     *
     * @memberof module:comment-vm/show#Environment
     * @instance
     * @method display
     */
    this.display = function(dom) {
      var $dom = $(dom);

      var editor = this.editor
        , comments = this.comments.list;

      var renderer = this.editor.renderer;

      var session = this.editor.getSession()
        , lastScrollTop = session.getScrollTop();

      comments.forEach(function(comment) {
        var range = comment.range;

        var $comment = $(['<div class="panel panel-default">',
                          '  <div class="panel-body" />',
                          '</div>'].join('\n'));

        $comment.addClass('comment-box');

        var height = range.start.row * renderer.lineHeight;
        $comment.data('preferred-top', height);
        $comment.find('.panel-body').text(comment.getText());

        comment.on('changeText', function(text) {
          $comment.find('.panel-body').text(text);
        });

        comment.on('changeSelected', function(selected) {
          handleCodeHighlight(marker, selected);
          handleBoxHighlight($comment, selected);

          if (selected) {
            var index = comment.getIndex();
            if (align.move(index, $dom.children(), lastScrollTop)) {
              align.above(index, $dom.children(), lastScrollTop);
              align.below(index, $dom.children(), lastScrollTop);
            }
          }
        });

        // Highlight the commented section of code
        var markerId = session.addMarker(range, 'comment-code', 'line', false)
          , marker = session.getMarkers(false)[markerId];

        // Register a handler on the editor for when the cursor position
        // changes
        var selection = session.getSelection();
        selection.on('changeCursor', function() {
          var cursorPos = function(pos) {
            return { line: pos.row, pos: pos.column };
          }(selection.getCursor());

          if (range.contains(cursorPos.line, cursorPos.pos)) {
            comment.select();
          } else {
            comment.deselect();
          }

          renderer.updateBackMarkers();
        });

        // Register a click handler on the comment box in order to move
        // the cursor to the commented section of code, which then invokes
        // that handler
        $comment.click(function() {
          editor.clearSelection();
          editor.moveCursorTo(range.start.row, range.start.column);
          editor.focus();
        });

        $dom.append($comment);
        align.move(comment.getIndex(), $dom.children(), lastScrollTop);
      });

      if (comments.length >= 0) {
        align.below(0, $dom.children(), lastScrollTop);

        // Handle realigning the comments when the window size changes
        // because the comment box heights may have changed
        $(window).resize(function() {
          comments.forEach(function(comment, index) {
            if (comment.isSelected()) {
              align.move(index, $dom.children(), lastScrollTop);
              align.above(index, $dom.children(), lastScrollTop);
              align.below(index, $dom.children(), lastScrollTop);
            }
          });
        });
      }

      session.on('changeScrollTop', function(scrollTop) {
        var diff = scrollTop - lastScrollTop;

        align.apply(-diff, $dom.children()); // minus for direction

        lastScrollTop = scrollTop;
      });
    };

  }).call(Environment.prototype);

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
      $comment.css('left', 0);
    } else {
      $comment.removeClass('comment-box-highlighted');
      $comment.css('left', 10);
    }
  };

  exports.Environment = Environment;
});
