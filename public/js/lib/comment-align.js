
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

  var PADDING = 12 // leave some space between comments
    , offset = 0;

  /**
   * Sets the vertical offset of the comments, which occurs due to
   * scrolling the editor.
   */
  exports.setOffset = function(newOffset) {
    offset = newOffset;
  };

  /**
   * Shifts each comment by the specified amount, either up or down
   * depending on whether the given is negative or positive,
   * respectively.
   *
   * Note that the delta is already relative to the offset.
   */
  exports.apply = function(delta, $comments) {
    $comments.each(function(index, value) {
      var $comment = $(value)
        , currentTop = parseInt($comment.css('top'), 10)
        , shiftedTop = currentTop + delta;

      $comment.css('top', shiftedTop);

      if (shiftedTop < 0) {
        $comment.hide();
      } else {
        $comment.show();
      }
    });
  };

  /**
   * Moves the specified to comment to its preferred position.
   */
  exports.move = function(index, $comments) {
    var $comment = $comments.eq(index);

    var preferredTop = $comment.data('preferred-top') - offset
      , currentTop = parseInt($comment.css('top'), 10);

    $comment.css('top', preferredTop);

    if (preferredTop < 0) {
      $comment.hide();
    } else {
      $comment.show();
    }

    return (!$.isNumeric(currentTop) || preferredTop !== currentTop);
  };

  /**
   * Adjusts the position of all the comments above the specified
   * comment by moving them as far down as possible, or as much they
   * prefer.
   */
  exports.above = function(index, $comments) {
    var $comment = $comments.eq(index)
      , i;

    var extent = parseInt($comment.css('top'), 10);
    for (i = index - 1; i >= 0; i--) {
      var $c = $comments.eq(i);
      var preferredTop = $c.data('preferred-top') - offset;

      // Move comment down as far as possible, or much as preferred
      extent = Math.min(preferredTop, extent - $c.height() - PADDING);
      $c.css('top', extent);

      if (extent < 0) {
        $c.hide();
      } else {
        $c.show();
      }
    }
  };

  /**
   * Adjusts the position of all the comments below the specified
   * comment by moving them as far up as possible, or as much they
   * prefer.
   */
  exports.below = function(index, $comments) {
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
