const express = require('express');
const { PostController } = require('../controllers/postController');
const { checkJWTToken, optionalAuth } = require('../controllers/userController');

const router = express.Router({ mergeParams: true });
const postController = new PostController;

router.get('/', optionalAuth, postController.getComments);

router.use(checkJWTToken);

router.post('/create', postController.commentPost);
router.post('/:commentId/edit', postController.editComment);
router.post('/:commentId/reply', postController.commentPost);
router.post('/:commentId/delete', postController.deleteComment);
router.post('/:commentId/reaction/:reactionId', postController.reactionComment);

module.exports = router;