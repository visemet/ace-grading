
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
    , EventEmitter = require('ace/lib/event_emitter').EventEmitter
    , Range = require('ace/range').Range;

  /**
   * This object is used to represent a comment that applies to a
   * section of code.
   *
   * @class Comment
   */

  /**
   * Emitted when the text of the comment changes, via
   * {@link Comment#setText}.
   *
   * @event Comment#changeText
   *
   * @param {String} text The new text of the comment
   */

  /**
   * Creates a new `Comment` object with the given text and the
   * specified range the comment applies to.
   *
   * @param {String} text The text of the comment
   * @param {Number} startRow The starting row of the comment
   * @param {Number} startColumn The starting column of the comment
   * @param {Number} endRow The ending row of the comment
   * @param {Number} endColumn The ending column of the comment
   *
   * @constructor
   */
  var Comment = function(text, startRow, startColumn, endRow, endColumn) {
    this.text = text;
    this.range = new Range(startRow, startColumn, endRow, endColumn);
  };

  (function() {

    oop.implement(this, EventEmitter);

    /**
     * Replaces the text of the comment with the specified parameter.
     * This function also emits the `'changeText'` event.
     *
     * @param {String} text The text of the comment to use
     *
     * @memberof Comment
     * @instance
     * @method setText
     */
    this.setText = function(text) {
      this.text = text;
      this._signal('changeText', this.text);
    };

    /**
     * Returns the text of the comment.
     *
     * @returns {String} The text of the comment
     *
     * @memberof Comment
     * @instance
     * @method getText
     */
    this.getText = function() {
      return this.text;
    };

  }).call(Comment.prototype);

  exports.Comment = Comment;
});
