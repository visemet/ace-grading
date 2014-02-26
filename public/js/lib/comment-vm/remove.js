
require.config({
  baseUrl: '/js',
  paths: {
    jquery: '//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min'
  }
});

/**
 * A module to enable the user to remove a comment.
 * @module comment-vm/remove
 */
define(function(require, exports, module) {
  'use strict';

  /**
   * Module dependencies.
   */

  var $ = require('jquery');

  /**
   * Initializes the environment by adding a link to delete each
   * comment.
   *
   * @param {Environment} env The environment to manipulate
   */
  exports.init = function(env) {
    var $onAddComment = onAddComment.bind(env);

    var comments = env.comments;

    $(comments.list).each($onAddComment);
    comments.on('addComment', $onAddComment);
  };

  /**
   * Adds a link to delete the comment, thereby removing it from the
   * list of comments.
   *
   * @memberof module:comment-vm/remove
   * @function
   */
  function onAddComment(index) {
    var $dom = this.$dom;

    // Only need to add comments if display() was called
    if (!$dom) {
      return;
    }

    var comments = this.comments
      , comment = comments.list[index];

    var $comments = $dom.children('.comment-box')
      , $comment = $comments.eq(index)
      , $commentFooter = $comment.children('.comment-box-footer');

    var $remove = $('<button type="button" class="btn" />');

    $remove.addClass('btn-danger btn-xs');
    $remove.text('Delete');

    $remove.css({ marginLeft: 4, marginRight: 4 });

    $remove.click(function() {
      comments.removeComment(comment);
    });

    $commentFooter.append($remove);
  };
});
