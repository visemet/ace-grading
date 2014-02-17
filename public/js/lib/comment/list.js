
require.config({
  baseUrl: '/js',
  paths: {
    ace: 'vendor/ace'
  }
});

define(function(require, exports, module) {
  'use strict';

  /**
   * Module dependencies.
   */

  var oop = require('ace/lib/oop')
    , EventEmitter = require('ace/lib/event_emitter').EventEmitter;

  /**
   * This object is used to represent a list of comments.
   *
   * @class List
   */

  /**
   * Emitted when a comment is added to the list, via
   * {@link List#addComment}.
   *
   * @event List#addComment
   *
   * @param {Number} index The index at which the comment was added
   */

  /**
   * Emitted when a comment is removed from the list, via
   * {@link List#removeComment}.
   *
   * @event List#removeComment
   *
   * @param {Number} index The index at which the comment was removed
   */

  /**
   * Creates a new `List` object.
   *
   * @constructor
   */
  var List = function() {
    this.list = [];
  };

  (function() {

    oop.implement(this, EventEmitter);

    /**
     * Binary searches for the smallest index at which `comment` could
     * be inserted into `list` and still maintain the ordering.
     *
     * Note that this function was adapted from `_.sortedIndex` in order
     * to support a comparator function.
     *
     * @param {Comment[]} list The list of comments
     * @param {Comment} comment The comment
     *
     * @returns The smallest index such that the comment could be
     *    inserted at and still maintain the list ordering
     *
     * @memberof List
     * @method sortedIndex
     */
    function sortedIndex(list, comment) {
      var low = 0
        , high = list.length;

      while (low < high) {
        var mid = (low + high) >>> 1
          , midComment = list[mid];

        if (comment.range.compareRange(midComment.range) < 0) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }

      return low;
    };

    /**
     * Adds `comment` to the list while maintaining its order.
     *
     * @param {Comment} comment The comment to add
     *
     * @memberof List
     * @instance
     * @method addComment
     */
    this.addComment = function(comment) {
      var index = sortedIndex(this.list, comment);

      this.list.splice(index, 0, comment);
      comment.index = index;

      for (var i = index + 1; i < this.list.length; i++) {
        var c = this.list[i];
        c.index += 1;
      }

      this._signal('addComment', index);
    };

    /**
     * Removes `comment` from the list while maintaining its order.
     *
     * @param {Comment} comment The comment to remove
     *
     * @memberof List
     * @instance
     * @method removeComment
     */
    this.removeComment = function(comment) {
      var index = sortedIndex(this.list, comment);

      while (comment !== this.list[index]) {
        index++;
      }

      this.list.splice(index, 1);
      comment.index = null;

      for (var i = index; i < this.list.length; i++) {
        var c = this.list[i];
        c.index -= 1;
      }

      this._signal('removeComment', index);
    };

  }).call(List.prototype);

  exports.List = List;
});
