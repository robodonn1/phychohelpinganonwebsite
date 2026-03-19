const express = require('express');
const fs = require('fs').promises;
const multer = require('multer');
const path = require('path');
const { PostController } = require('../controllers/postController');
const { checkJWTToken, optionalAuth } = require('../controllers/userController');
const ReactionController = require('../controllers/reactionController');

const router = express.Router({ mergeParams: true });
const postController = new PostController; 
const reactionController = new ReactionController; 

const storagePostImages = multer.memoryStorage();

const upload = multer({ storage: storagePostImages, limits: { fileSize: 10 * 1024 * 1024 } });

router.use('/:postId/comments', require('./comments'));

router.get('/posts', optionalAuth, postController.getPosts);
router.post('/create', upload.array('photos', 5), optionalAuth, postController.createPost);
router.get('/tags', optionalAuth, postController.getTags);
router.get('/categories', optionalAuth, postController.getCategories);
router.get('/reactions', optionalAuth, reactionController.getAllReactions);
router.get('/:postId', optionalAuth, postController.getPost);

router.use(checkJWTToken);

router.post('/:postId/edit', upload.array('photos', 5), postController.editPost);
router.post('/:postId/delete', postController.deletePost);
router.post('/:postId/like', postController.likePost);
router.post('/:postId/favorite', postController.favoritePost);

module.exports = router;