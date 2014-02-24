
require.config({
  baseUrl: '/js',
  paths: {
    jquery: '//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min'
  }
});

define(function(require, exports, module) {
  'use strict';

  /**
   * Module dependencies.
   */

  var $ = require('jquery');

  /**
   * A module to manage the alignment of a list of comments.
   * @module comment-vm/align
   */

  /**
   * The amount of padding to leave between comments.
   *
   * @constant {Number}
   * @private
   */
  var PADDING = 12;

  /**
   * Shifts each comment of the list by the specified amount `delta`,
   * either up or down, depending on whether the value is negative or
   * positive, respectively.
   *
   * @param {Number} delta The number of pixels to shift all comments by
   * @param {Array} $comments
   */
  exports.apply = function(delta, $comments) {
    $comments.each(function(index, value) {
      var $comment = $(value)
        , currentTop = parseInt($comment.css('top'), 10)
        , shiftedTop = currentTop + delta;

      $comment.css('top', shiftedTop);
    });
  };

  /**
   * Moves the comment specified by `index` to its preferred (vertical)
   * position.
   *
   * @param {Number} index The index of the comment to move
   * @param {Array} $comments
   * @param {Number} [offset=0] The (vertical) relative offset
   *
   * @returns {boolean} `true` if the comment was moved, and `false`
   *    otherwise
   */
  exports.move = function(index, $comments, offset0) {
    var offset = offset0 || 0;

    var $comment = $comments.eq(index);

    var preferredTop = $comment.data('preferred-top') - offset
      , currentTop = parseInt($comment.css('top'), 10);

    $comment.css('top', preferredTop);

    return (!$.isNumeric(currentTop) || preferredTop !== currentTop);
  };

  /**
   * Adjusts the position of all the comments above the comment
   * specified by `index` by moving them as far down as possible, or as
   * much they prefer.
   *
   * @param {Number} index The index for which all preceeding comments
   *    should be moved
   * @param {Array} $comments
   * @param {Number} [offset=0] The (vertical) relative offset
   */
  exports.above = function(index, $comments, offset0) {
    var offset = offset0 || 0;

    var $comment = $comments.eq(index)
      , i;

    var extent = parseInt($comment.css('top'), 10);
    for (i = index - 1; i >= 0; i--) {
      var $c = $comments.eq(i);
      var preferredTop = $c.data('preferred-top') - offset;

      // Move comment down as far as possible, or much as preferred
      extent = Math.min(preferredTop, extent - $c.height() - PADDING);
      $c.css('top', extent);
    }
  };

  /**
   * Adjusts the position of all the comments below the comment
   * specified by `index` by moving them as far up as possible, or as
   * much they prefer.
   *
   * @param {Number} index The index for which all following comments
   *    should be moved
   * @param {Array} $comments
   * @param {Number} [offset=0] The (vertical) relative offset
   */
  exports.below = function(index, $comments, offset0) {
    var offset = offset0 || 0;

    var $comment = $comments.eq(index), $prev = $comment
      , i, length = $comments.length;

    var extent = parseInt($comment.css('top'), 10);
    for (i = index + 1; i < length; i++) {
      var $c = $comments.eq(i);
      var preferredTop = $c.data('preferred-top') - offset;

      // Move comment up as far as possible, or much as preferred
      extent = Math.max(preferredTop, extent + $prev.height() + PADDING);
      $c.css('top', extent);
      $c.show();

      $prev = $c;
    }
  };
});
