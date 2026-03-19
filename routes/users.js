const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');

const { UserController, checkJWTToken, checkAdminAccount, optionalAuth } = require('../controllers/userController');
const { PostController } = require('../controllers/postController');
const router = express.Router({ mergeParams: true });
const userController = new UserController();

const storageAvatars = multer.diskStorage({
    destination: async function (req, file, cb) {
        const avatarDir = path.join(__dirname, '..', 'serverFiles', 'users', req.user.id);

        await fs.mkdir(avatarDir, { recursive: true });
        cb(null, avatarDir);
    },
    filename: function (req, file, cb) {
        cb(null, `ava${path.extname(file.originalname)}`);
    }
});
const uploadAvatar = multer({ storage: storageAvatars, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/curUser', optionalAuth, userController.getCurUser);
router.get('/profile/:id', optionalAuth, userController.getUserProfile);
router.get('/profile/:id/posts', optionalAuth, userController.getUserPosts);
router.get('/profile/:id/favorite', optionalAuth, userController.getFavoritePosts);
router.get('/doctors', optionalAuth, userController.getDoctors);
router.get('/issuers', optionalAuth, userController.getIssuers);
router.post('/login', optionalAuth, userController.login);
router.post('/createAccount', optionalAuth, userController.createAccount);

router.use(checkJWTToken);

router.get('/getDoctor', userController.getDoctorByUser);
router.post('/doctor-info', uploadAvatar.none(), userController.upsertDoctorInfo);
router.post('/addConfidential', uploadAvatar.single('avatar'), userController.addingConfidentialToAccount);
router.post('/logout', userController.logout);
router.post('/editConfidential', uploadAvatar.single('avatar'), userController.editingConfidentialToAccount);
router.post('/changePassword', userController.changePassword);
router.post('/deleteAccount', userController.deleteUser);

router.use(checkAdminAccount);

router.get('/admin/getUsers', userController.getUsers);
router.post('/admin/createUser', userController.createUser);
router.post('/admin/editUser', userController.editUser);

module.exports = router;