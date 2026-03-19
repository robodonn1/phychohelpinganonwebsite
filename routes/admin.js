const express = require('express');
const router = express.Router();

// Middleware для проверки админа
const { checkAdminAccount, optionalAuth } = require('../controllers/userController');

// Контроллеры
const { UserController } = require('../controllers/userController');
const { PostController } = require('../controllers/postController');
const TagController = require('../controllers/tagController');
const CategoryController = require('../controllers/categoryController');
const IssuerController = require('../controllers/issuerController');
const ReactionController = require('../controllers/reactionController');

// Инициализация контроллеров
const userController = new UserController();
const postController = new PostController();
const tagController = new TagController();
const categoryController = new CategoryController();
const issuerController = new IssuerController();
const reactionController = new ReactionController();

// Все маршруты требуют прав администратора
router.use(optionalAuth);
router.use(checkAdminAccount);

// ========== Управление пользователями ==========
router.get('/users', userController.getUsers); // уже есть в userController
router.post('/users', userController.createUser); // уже есть
router.put('/users/:userId', userController.editUserByAdmin); // уже есть (но editUser принимает id в body, нужно доработать?)
// Лучше создать отдельный метод для редактирования пользователя админом по params
// Пока оставим как есть, но на клиенте нужно отправлять id в body. Можно создать новый метод editUserByAdmin.

// Удаление пользователя
router.delete('/users/:userId', userController.deleteUserByAdmin); // создадим

// Получение полной информации о пользователе (для детальной страницы)
router.get('/users/:userId/profile', userController.getUserFullProfile); // создадим

// Удаление confidential у пользователя
router.delete('/users/:userId/confidential', userController.deleteUserConfidential); // создадим

// Удаление doctor info (и лицензии)
router.delete('/users/:userId/doctor', userController.deleteUserDoctorInfo); // создадим

// Удаление лицензии (без удаления doctor info)
router.delete('/users/:userId/license', userController.deleteUserLicense); // создадим

// Получение постов пользователя (для админа)
router.get('/users/:userId/posts', userController.getUserPostsAdmin); // создадим

// Получение избранных постов пользователя
router.get('/users/:userId/favorites', userController.getUserFavoritesAdmin); // создадим

// ========== Управление постами ==========
// Получение всех постов (для админа)
router.get('/posts', postController.getAllPostsAdmin); // создадим

// Удаление поста (админское)
router.delete('/posts/:postId', postController.deletePostAdmin); // создадим

// ========== Управление тегами ==========
router.get('/tags', tagController.getAllTags);
router.post('/tags', tagController.createTag);
router.put('/tags/:id', tagController.updateTag);
router.delete('/tags/:id', tagController.deleteTag);

// ========== Управление категориями ==========
router.get('/categories', categoryController.getAllCategories);
router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// ========== Управление издателями ==========
router.get('/issuers', issuerController.getAllIssuers);
router.post('/issuers', issuerController.createIssuer);
router.put('/issuers/:id', issuerController.updateIssuer);
router.delete('/issuers/:id', issuerController.deleteIssuer);

// ========== Управление реакциями ==========
router.get('/reactions', reactionController.getAllReactions);
router.post('/reactions', reactionController.createReaction);
router.put('/reactions/:id', reactionController.updateReaction);
router.delete('/reactions/:id', reactionController.deleteReaction);

// ========== Управление лицензиями ==========
// Получение всех лицензий (с возможностью фильтрации по статусу)
router.get('/licenses', userController.getAllLicenses); // создадим

// Обновление статуса лицензии (принять/отклонить)
router.patch('/licenses/:licenseId/status', userController.updateLicenseStatus); // создадим

module.exports = router;