
require.config({
  baseUrl: '/js',
  paths: {
    jquery: '//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min',
  }
});

/**
 * A module to enable the user to edit a comment.
 * @module comment-vm/edit
 */
define(function(require, exports, module) {
  'use strict';

  /**
   * Module dependencies.
   */

  var $ = require('jquery');

  var align = require('lib/comment-vm/align');

  /**
   * Initializes the environment by adding a link to edit each comment.
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
   * Adds a link to edit the comment, thereby allowing the user to
   * change its contents.
   *
   * @memberof module:comment-vm/edit
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
      , $commentBody = $comment.children('.comment-box-body')
      , $commentFooter = $comment.children('.comment-box-footer');

    var $edit = $('<button type="button" class="btn" />')
      , $save = $('<button type="button" class="btn" />');

    $edit.addClass('btn-primary btn-xs');
    $edit.text('Edit');

    $save.addClass('btn-success btn-xs');
    $save.text('Save');

    $edit.css({ marginLeft: 4, marginRight: 4 });
    $save.css({ marginLeft: 4, marginRight: 4 });

    // Prevent the focus from returning to the editor
    $commentBody.click(function(e) {
      if ($save.is(':visible')) {
        comment.select();
        e.stopPropagation();
      }
    });

    $commentBody.keyup((function() {
      var offset = this.lastScrollTop
        , $comments = $dom.children('.comment-box')
        , newIndex = comment.getIndex();

      // Only grows downward
      align.below(newIndex, $comments, offset);
    }).bind(this));

    $edit.click(function() {
      $commentBody.attr('contenteditable', true);
      $edit.hide();
      $save.show();
    });

    $save.click(function() {
      // Refer to http://stackoverflow.com/questions/5959415
      comment.setText($commentBody.html().replace(/<br\s*[\/]?>/gi, '\n'));

      $commentBody.attr('contenteditable', false);
      $save.hide();
      $edit.show();
    });

    $save.hide();

    $commentFooter.append($edit);
    $commentFooter.append($save);
  };
});
