
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
    , ace = require('ace/ace');

  var editor = ace.edit('editor')
    , $comments = $('#comments');

  var List = require('lib/comment/list').List
    , Comment = require('lib/comment/comment').Comment;

  var Environment = require('lib/comment-vm/show').Environment;

  var edit = require('lib/comment-vm/edit')
    , remove = require('lib/comment-vm/remove');

  // TODO: Retrieve the list of comments
  var comments = new List()
    , env = new Environment(editor, comments);

  env.display($comments);

  edit.init(env);
  remove.init(env);
});
