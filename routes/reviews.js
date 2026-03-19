const express = require('express');
const reviewController = require('../controllers/reviewController');
const { checkJWTToken, optionalAuth, checkAdminAccount } = require('../controllers/userController');

const router = express.Router({ mergeParams: true });

router.get('/', optionalAuth, reviewController.getReviews);

router.use(checkJWTToken);

router.post('/create', reviewController.createReview);
router.post('/delete', reviewController.deleteReview);

router.use(checkAdminAccount);

router.get('/all', reviewController.getAllReviews);

module.exports = router;