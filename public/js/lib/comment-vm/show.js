
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

    this.markers = [];

    this.$onAddComment = this.onAddComment.bind(this);
    this.$onRemoveComment = this.onRemoveComment.bind(this);

    this.$onChangeScrollTop = this.onChangeScrollTop.bind(this);
    this.$onChangeCursor = this.onChangeCursor.bind(this);

    this.$onWindowResize = this.onWindowResize.bind(this);

    this.comments.on('addComment', this.$onAddComment);
    this.comments.on('removeComment', this.$onRemoveComment);

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
      var editor = this.editor
        , comments = this.comments.list;

      var session = editor.getSession()
        , selection = session.getSelection();

      this.$dom = $(dom);
      this.lastScrollTop = session.getScrollTop();

      $(comments).each(this.$onAddComment);

      $(window).resize(this.$onWindowResize);

      session.on('changeScrollTop', this.$onChangeScrollTop);
      selection.on('changeCursor', this.$onChangeCursor);
    };

    /**
     * Inserts a new comment box into the previously specified DOM when
     * a comment is added to the list of comments. Also adds a marker
     * for the section of code the comment applies to.
     *
     * @param {Number} index The index of the added comment
     *
     * @memberof module:comment-vm/show#Environment
     * @instance
     * @method onAddComment
     */
    this.onAddComment = function(index) {
      var $dom = this.$dom;

      // Only need to add comments if display() was called
      if (!$dom) {
        return;
      }

      var editor = this.editor
        , comments = this.comments.list;

      var renderer = editor.renderer
        , session = editor.getSession()
        , selection = session.getSelection();

      var comment = comments[index]
        , range = comment.range;

      var $comment = $(['<div class="panel panel-default">',
                        '  <div class="panel-body" />',
                        '  <div class="panel-footer" />',
                        '</div>'].join('\n'))
        , $commentBody = $comment.children('.panel-body')
        , $commentFooter = $comment.children('.panel-footer');

      $comment.addClass('comment-box');
      $commentFooter.addClass('comment-box-footer');

      var height = range.start.row * renderer.lineHeight;
      $comment.data('preferred-top', height);

      $commentBody.text(comment.getText());
      comment.on('changeText', function(text) {
        $commentBody.text(text);
      });

      // Highlight the commented section of code
      var markerId = session.addMarker(range, 'comment-code', 'line', false)
        , marker = session.getMarkers(false)[markerId];

      this.markers.splice(index, 0, marker);

      comment.on('changeSelected', (function(selected) {
        handleCodeHighlight(marker, selected);
        handleBoxHighlight($comment, selected);

        if (selected) {
          var newIndex = comment.getIndex()
            , $comments = $dom.children('.comment-box')
            , offset = this.lastScrollTop;

          if (align.move(newIndex, $comments, offset)) {
            align.above(newIndex, $comments, offset);
            align.below(newIndex, $comments, offset);
          }
        }
      }).bind(this));

      // Register a click handler on the comment box in order to move
      // the cursor to the commented section of code, which then invokes
      // that handler
      $comment.click(function() {
        editor.clearSelection();
        editor.moveCursorTo(range.start.row, range.start.column);
        editor.focus();
      });

      (function(offset) {
        var $comments = $dom.children('.comment-box');

        if (index === 0) {
          $dom.prepend($comment);
        } else {
          $comments.eq(index - 1).after($comment);
        }

        $comments = $dom.children('.comment-box');

        align.move(index, $comments, offset);
        align.above(index, $comments, offset);
        align.below(index, $comments, offset);
      })(this.lastScrollTop);
    };

    /**
     * Deletes the comment box from the previously specified DOM when a
     * comment is removed from the list of comments. Also removes the
     * marker from the section of code the comment applied to.
     *
     * @param {Number} index The index of the removed comment
     *
     * @memberof module:comment-vm/show#Environment
     * @instance
     * @method onRemoveComment
     */
    this.onRemoveComment = function(index) {
      var $dom = this.$dom;

      // Only need to remove comments if display() was called
      if (!$dom) {
        return;
      }

      var editor = this.editor
        , session = editor.getSession();

      // Remove the comment box
      $dom.children('.comment-box').eq(index).remove();

      // Remove the marker
      var marker = this.markers.splice(index, 1)[0];
      session.removeMarker(marker.id);
    };

    /**
     * Handler for when the cursor within the editor changes in order to
     * select and deselect comments appropriately.
     *
     * @memberof module:comment-vm/show#Environment
     * @instance
     * @method onChangeCursor
     */
    this.onChangeCursor = function() {
      var editor = this.editor
        , comments = this.comments.list;

      var renderer = editor.renderer
        , session = editor.getSession()
        , selection = session.getSelection();

      $(comments).each(function(index, comment) {
        var range = comment.range;

        // Checks if the cursor is within the commented section of code
        if (range.comparePoint(selection.getCursor()) === 0) {
          comment.select();
        } else {
          comment.deselect();
        }
      });

      renderer.updateBackMarkers();
    };

    /**
     * Handler for when the editor scrolls in order to maintain
     * the relative alignment of comment boxes and lines of code.
     *
     * @param {Number} scrollTop The total amount the editor has been
     *    scrolled
     *
     * @memberof module:comment-vm/show#Environment
     * @instance
     * @method onChangeScrollTop
     */
    this.onChangeScrollTop = function(scrollTop) {
      var $dom = this.$dom;

      // Only need to align comments if display() was called
      if (!$dom) {
        return;
      }

      var diff = scrollTop - this.lastScrollTop;
      align.apply(-diff, $dom.children('.comment-box')); // minus for direction

      this.lastScrollTop = scrollTop;
    };

    /**
     * Handler for when the window resizes in order to maintain
     * alignment of the selected comment box, as well as padding
     * between all of the comment boxes.
     *
     * @memberof module:comment-vm/show#Environment
     * @instance
     * @method onWindowResize
     */
    this.onWindowResize = function() {
      var $dom = this.$dom;

      // Only need to realign comments if display() was called
      if (!$dom) {
        return;
      }

      var comments = this.comments.list
        , lastScrollTop = this.lastScrollTop;

      // Realign all of the comments when the window size changes
      // because the comment box heights may have changed
      $(comments).each(function(index, comment) {
        if (comment.isSelected() || index === 0) {
          align.move(index, $dom.children('.comment-box'), lastScrollTop);
          align.above(index, $dom.children('.comment-box'), lastScrollTop);
          align.below(index, $dom.children('.comment-box'), lastScrollTop);
        }
      });
    };

  }).call(Environment.prototype);

  /**
   * Toggles whether the marker overlay is highlighted based on whether
   * the cursor is within the commented section of code.
   *
   * @memberof module:comment-vm/show
   * @function
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
   *
   * @memberof module:comment-vm/show
   * @function
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
