const sharp = require("sharp");
const { Post, Comment, PostLike, Reaction, CommentReaction, PostCategory, Tag, PostFavorite, PostImage } = require("../models/posts");
const { UserProfile, Guest } = require("../models/users");
const path = require("node:path");
const fs = require("node:fs").promises;
const crypto = require('crypto');
const { JSONCookies, JSONCookie } = require("cookie-parser");
const sequelize = require("../models");

class PostController {
    async createPost(req, res) {
        const { title, text, categoryId } = req.body;

        let tagIds = req.body.tagIds;
        if (typeof tagIds === 'string') {
            try {
                tagIds = JSON.parse(tagIds);
            } catch (e) {
                tagIds = [];
            }
        }
        console.log(tagIds);

        try {
            const postInfo = {};
            if (!title) return res.status(400).json({
                error: "Нужно обязательно заполнить заголовок",
                success: false,
            });

            if (/<[^>]*>/.test(title)) return res.status(400).json({
                error: "Не используйте специальные символы при введении заголовка",
                success: false,
            });
            if (/<[^>]*>/.test(text)) return res.status(400).json({
                error: "Не используйте специальные символы при введении текста поста",
                success: false,
            });
            postInfo.title = title;
            postInfo.text = text;

            const existCategory = await PostCategory.findByPk(categoryId);
            if (!existCategory) return res.status(404).json({
                error: "Такой категории не существует",
                success: false,
            });
            postInfo.categoryId = existCategory.id;

            if (req.user) postInfo.userId = req.user.id;
            else postInfo.guestId = req.guest.id;

            postInfo.id = crypto.randomUUID();

            const newPost = await Post.create(postInfo);

            if (tagIds && Array.isArray(tagIds) && tagIds.length) {
                const existTags = await Tag.findAll({ where: { id: tagIds } });
                const existTagIds = existTags.map(t => t.id);
                await newPost.setTags(existTagIds);
            }

            const files = req.files || [];
            const imageRecords = [];
            const uploadedPaths = [];
            try {
                for (let i = 0; i < files.length; i++) {
                    const buffer = files[i].buffer;

                    const proccessedFile = await sharp(buffer).png({ quality: 80 }).toBuffer();

                    const fileName = `${Date.now()}-${i}.png`;
                    const relativePath = path.join('serverFiles', 'posts', newPost.id, fileName);
                    const filePath = path.join(__dirname, '..', relativePath);
                    await fs.mkdir(path.dirname(filePath), { recursive: true });
                    await fs.writeFile(filePath, proccessedFile);
                    imageRecords.push({ id: crypto.randomUUID(), postId: newPost.id, url: relativePath, order: i });
                    uploadedPaths.push(filePath);
                }
                await PostImage.bulkCreate(imageRecords);
            } catch (e) {
                for (const path of uploadedPaths) await fs.unlink(path).catch(err => { });
                if (uploadedPaths.length) await fs.rm(path.dirname(uploadedPaths[0]));
                return res.status(500).json({
                    error: "Ошибка при записи файлов",
                    success: false,
                });
            }

            return res.status(201).json({
                success: true,
                post: newPost,
            });
        } catch (e) {
            return res.status(500).json({
                error: e.message,
                success: false,
            });
        }
    }

    async editPost(req, res) {
        const postId = req.params.postId;
        const { title, text, categoryId } = req.body;

        let tagIds = req.body.tagIds;
        if (typeof tagIds === 'string') {
            try {
                tagIds = JSON.parse(tagIds);
            } catch (e) {
                tagIds = [];
            }
        }

        try {
            const postInfo = {};
            const curPost = await Post.findByPk(postId);

            if (curPost.guestId && req.user.role != 'admin') return res.status(403).json({
                error: "Посты созданные гостями изменять нельзя",
                success: false,
            });
            if (curPost.userId != req.user.id && req.user.role != 'admin') return res.status(403).json({
                error: "Вы не можете редактировать данный пост",
                success: false,
            });

            if (!title) return res.status(400).json({
                error: "Нужно обязательно заполнить заголовок",
                success: false,
            });
            if (/<[^>]*>/.test(title)) return res.status(400).json({
                error: "Не используйте специальные символы при введении заголовка",
                success: false,
            });
            if (/<[^>]*>/.test(text)) return res.status(400).json({
                error: "Не используйте специальные символы при введении текста поста",
                success: false,
            });
            postInfo.title = title;
            postInfo.text = text;

            const existCategory = await PostCategory.findByPk(categoryId);
            if (!existCategory) return res.status(404).json({
                error: "Такой категории не существует",
                success: false,
            });
            postInfo.categoryId = existCategory.id;

            await curPost.update(postInfo);

            if (tagIds !== undefined) {
                if (Array.isArray(tagIds) && tagIds.length) {
                    const existingTags = await Tag.findAll({ where: { id: tagIds } });
                    const existingTagIds = existingTags.map(t => t.id);
                    await curPost.setTags(existingTagIds);
                } else {
                    await curPost.setTags([]);
                }
            }

            const files = req.files || [];
            if (files.length > 0) {
                const imageRecords = [];
                const uploadedPaths = [];
                try {
                    for (let i = 0; i < files.length; i++) {
                        const buffer = files[i].buffer;
                        const proccessedFile = await sharp(buffer).png({ quality: 80 }).toBuffer();
                        const fileName = `${Date.now()}-${i}.png`;
                        const relativePath = path.join('serverFiles', 'posts', curPost.id, fileName);
                        const filePath = path.join(__dirname, '..', relativePath);
                        await fs.mkdir(path.dirname(filePath), { recursive: true });
                        await fs.writeFile(filePath, proccessedFile);
                        imageRecords.push({ id: crypto.randomUUID(), postId: curPost.id, url: relativePath, order: i });
                        uploadedPaths.push(filePath);
                    }

                    const oldImages = await PostImage.findAll({ where: { postId: curPost.id } });
                    for (const img of oldImages) {
                        await fs.unlink(path.join(__dirname, '..', img.url)).catch(() => { });
                    }
                    await PostImage.destroy({ where: { postId: curPost.id } });

                    if (imageRecords.length)
                        await PostImage.bulkCreate(imageRecords);

                } catch (e) {
                    for (const path of uploadedPaths) await fs.unlink(path).catch(err => { });
                    return res.status(500).json({
                        error: "Ошибка загрузки изображений",
                        success: false
                    });
                }
            }

            return res.status(201).json({
                success: true,
                post: curPost,
            });
        } catch (e) {
            return res.status(500).json({
                error: e.message,
                success: false,
            });
        }
    }

    async deletePost(req, res) {
        const postId = req.params.postId;

        try {
            const curPost = await Post.findByPk(postId);
            if (curPost.guestId && req.user.role != 'admin') return res.status(403).json({
                error: "Посты созданные гостями нельзя удалить",
                success: false,
            });
            if (curPost.userId && curPost.userId != req.user.id && req.user.role != 'admin') return res.status(403).json({
                error: "Вы не можете удалить этот пост",
                success: false,
            });

            const images = await PostImage.findAll({ where: { postId: curPost.id } });
            for (const img of images) {
                await fs.unlink(path.join(__dirname, '..', img.url)).catch(() => { });
            }
            await PostImage.destroy({ where: { postId: curPost.id } });
            await curPost.destroy();
            await fs.rm(path.join(__dirname, '..', 'serverFiles', 'posts', curPost.id), { recursive: true, force: true });

            return res.status(200).json({
                success: true,
            });
        } catch (e) {
            return res.status(500).json({
                error: e.message,
                success: false,
            });
        }
    }

    async commentPost(req, res) {
        const postId = req.params.postId;
        const { text, commentType } = req.body;

        try {
            const commentInfo = {};

            if (!req.user) return res.status(401).json({
                error: "Авторизуйтесь для того чтобы написать коммент",
                success: false,
            });
            const commentedPost = await Post.findByPk(postId);
            if (!commentedPost) return res.status(404).json({
                error: "Такого поста не существует",
                success: false,
            });

            commentInfo.userId = req.user.id;
            commentInfo.postId = postId;

            if (req.params.commentId) {
                const parentComment = await Comment.findByPk(req.params.commentId);
                if (!parentComment) return res.status(404).json({
                    error: "Комментария на который вы хотите ответить не существует",
                    success: false,
                });
                commentInfo.parentCommentId = parentComment.id;
            };

            if (/<[^>]*>/.test(text)) return res.status(400).json({
                error: "Не используйте специальные символы при введении текста поста",
                success: false,
            });
            commentInfo.text = text;

            if (commentType == 'doctor' && req.user.role != 'doctor') return res.status(403).json({
                error: "Вы не можете писать посты от лица доктора не являясь доктором",
                success: false,
            });
            commentInfo.commentType = commentType;
            commentInfo.id = crypto.randomUUID();

            const comment = await Comment.create(commentInfo);

            return res.status(200).json({
                success: true,
                comment: comment,
            });
        } catch (e) {
            return res.status(500).json({
                error: e.message,
                success: false,
            });
        }
    }

    async editComment(req, res) {
        const commentId = req.params.commentId;
        const newText = req.body.text;

        try {
            const curComment = await Comment.findByPk(commentId);
            if (!curComment) return res.status(404).json({
                error: "Такого комментария не существует",
                success: false,
            });
            if (curComment.userId && curComment.userId != req.user.id && req.user.role != 'admin') return res.status(403).json({
                error: "Вы не можете редактиовать этот комментарий",
                success: false,
            });

            if (/<[^>]*>/.test(newText)) return res.status(400).json({
                error: "Не используйте специальные символы при введении текста поста",
                success: false,
            });

            await curComment.update({ text: newText });

            return res.status(200).json({
                success: true,
                comment: curComment,
            });
        } catch (e) {
            return res.status(500).json({
                error: e.message,
                success: false,
            });
        }
    }

    async deleteComment(req, res) {
        const commentId = req.params.commentId;

        try {
            const curComment = await Comment.findByPk(commentId);
            if (!curComment) return res.status(404).json({
                error: "Такого комментария не существует",
                success: false,
            });
            if (curComment.userId != req.user.id && req.user.role != 'admin') return res.status(403).json({
                error: "Вы не можете удалить этот пост",
                success: false,
            });

            await curComment.destroy();

            return res.status(200).json({
                success: true,
            });
        } catch (e) {
            return res.status(500).json({
                error: e.message,
                success: false,
            });
        }
    }

    async getPosts(req, res) {
        try {
            // 1. Основные посты (без лайков и избранного)
            const posts = await Post.findAll({
                order: [['createdAt', 'DESC']],
                limit: 20,
                offset: req.query.offset || 0,
                include: [
                    { model: PostImage, as: 'images' },
                    { model: PostCategory, as: 'category', attributes: ['name', 'linkName', 'type'] },
                    { model: UserProfile, as: 'authorUser', attributes: ['id', 'nickname', 'avatarUrl'] },
                    { model: Guest, as: 'authorGuest', attributes: ['id'] },
                    { model: Tag, as: 'tags', through: { attributes: [] } }
                ]
            });

            const postIds = posts.map(p => p.id);

            // 2. Количество лайков для каждого поста
            const likeCounts = await PostLike.findAll({
                where: { postId: postIds },
                attributes: ['postId', [sequelize.fn('COUNT', sequelize.col('userId')), 'count']],
                group: ['postId']
            });
            const likeCountMap = Object.fromEntries(likeCounts.map(l => [l.postId, l.dataValues.count]));

            // 3. Лайки текущего пользователя
            let likedByUser = {};
            if (req.user) {
                const userLikes = await PostLike.findAll({
                    where: { postId: postIds, userId: req.user.id }
                });
                likedByUser = Object.fromEntries(userLikes.map(l => [l.postId, true]));
            }

            // 4. Количество избранного
            const favCounts = await PostFavorite.findAll({
                where: { postId: postIds },
                attributes: ['postId', [sequelize.fn('COUNT', sequelize.col('userId')), 'count']],
                group: ['postId']
            });
            const favCountMap = Object.fromEntries(favCounts.map(f => [f.postId, f.dataValues.count]));

            // 5. Избранное текущего пользователя
            let favoritedByUser = {};
            if (req.user) {
                const userFavs = await PostFavorite.findAll({
                    where: { postId: postIds, userId: req.user.id }
                });
                favoritedByUser = Object.fromEntries(userFavs.map(f => [f.postId, true]));
            }

            // 6. Собираем результат
            const result = posts.map(post => {
                const postJson = post.toJSON();
                postJson.likeCount = likeCountMap[post.id] || 0;
                postJson.isLikedByMe = !!likedByUser[post.id];
                postJson.favoriteCount = favCountMap[post.id] || 0;
                postJson.isFavoritedByMe = !!favoritedByUser[post.id];
                postJson.isAuthor = req.user?.id === post.userId;
                return postJson;
            });

            return res.status(200).json({ success: true, posts: result });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }

    async getPost(req, res) {
        const postId = req.params.postId;
        const { commentLimit = 20, commentOffset = 0 } = req.query;

        try {
            // 1. Основная информация о посте
            const post = await Post.findByPk(postId, {
                include: [
                    { model: PostImage, as: 'images' },
                    { model: PostCategory, as: 'category', attributes: ['name', 'linkName', 'type'] },
                    { model: UserProfile, as: 'authorUser', attributes: ['id', 'nickname', 'avatarUrl'] },
                    { model: Guest, as: 'authorGuest', attributes: ['id'] },
                    { model: Tag, as: 'tags', through: { attributes: [] } }
                ]
            });

            if (!post) {
                return res.status(404).json({ error: "Пост не найден", success: false });
            }

            // 2. Счётчики лайков и избранного
            const likeCount = await PostLike.count({ where: { postId } });
            const favoriteCount = await PostFavorite.count({ where: { postId } });

            // 3. Проверка, лайкнул ли текущий пользователь и добавил ли в избранное
            let isLikedByMe = false;
            let isFavoritedByMe = false;
            if (req.user) {
                const userLike = await PostLike.findOne({ where: { postId, userId: req.user.id } });
                const userFav = await PostFavorite.findOne({ where: { postId, userId: req.user.id } });
                isLikedByMe = !!userLike;
                isFavoritedByMe = !!userFav;
            }

            // 4. Комментарии с пагинацией и авторами (только пользователи)
            const comments = await Comment.findAndCountAll({
                where: { postId },
                limit: parseInt(commentLimit),
                offset: parseInt(commentOffset),
                order: [['createdAt', 'ASC']],
                include: [
                    { model: UserProfile, as: 'userInfo', attributes: ['id', 'nickname', 'avatarUrl'] }
                    // Если появятся комментарии от гостей, нужно будет добавить ассоциацию
                ]
            });

            // 5. Собираем результат
            const postJson = post.toJSON();
            const result = {
                ...postJson,
                likeCount,
                isLikedByMe,
                favoriteCount,
                isFavoritedByMe,
                isAuthor: req.user?.id === post.userId,
                comments: comments.rows,
                commentsTotal: comments.count,
                commentsLimit: parseInt(commentLimit),
                commentsOffset: parseInt(commentOffset)
            };

            return res.status(200).json({ success: true, post: result });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }


    async getComments(req, res) {
        const postId = req.params.postId;

        try {
            console.log(`\n\n${postId}\n\n`)
            const curPost = await Post.findByPk(postId);
            if (!curPost) return res.status(404).json({
                error: "Такого поста не существует",
                success: false,
            });

            const comments = await Comment.findAll({ where: { postId: curPost.id }, attributes: { exclude: ['postId'] } });

            return res.status(200).json({
                success: true,
                comments,
            });
        } catch (e) {
            return res.status(500).json({
                error: e.message,
                success: false,
            });
        }
    }

    async likePost(req, res) {
        const postId = req.params.postId;

        try {
            const curPost = await Post.findByPk(postId);
            if (!curPost) return res.status(404).json({
                error: "Поста, который вы хотели лайкнуть, не существует",
                success: false,
            });

            const existLike = await PostLike.findOne({
                where: {
                    userId: req.user.id,
                    postId: curPost.id,
                }
            });

            if (existLike) { await existLike.destroy() }
            else {
                const like = await PostLike.create({
                    userId: req.user.id,
                    postId: curPost.id,
                });
            }

            return res.status(200).json({
                success: true,
            });
        } catch (e) {
            return res.status(500).json({
                error: e.message,
                success: false,
            });
        }
    }

    async reactionComment(req, res) {
        const commentId = req.params.commentId;

        try {
            const curComment = await Comment.findByPk(commentId);
            if (!curComment) return res.status(404).json({
                error: "Комментарий на который вы хотели поставить реакцию не существует",
                success: false,
            });

            const curReaction = await Reaction.findByPk(req.params.reactionId);
            if (!curReaction) return res.status(404).json({
                error: "Реакции которую вы хотели поставить на коммент не существует",
                success: false,
            });

            const existReaction = await CommentReaction.findOne({
                where: {
                    userId: req.user.id,
                    commentId: curComment.id,
                    reactionId: curReaction.id,
                }
            });

            if (existReaction) { await existReaction.destroy(); }
            else {
                const commentReaction = await CommentReaction.create({
                    userId: req.user.id,
                    commentId: curComment.id,
                    reactionId: curReaction.id,
                });
            }

            return res.status(200).json({
                success: true,
            });
        } catch (e) {
            return res.status(500).json({
                error: e.message,
                success: false,
            });
        }
    }

    async favoritePost(req, res) {
        const postId = req.params.postId;

        try {
            const curPost = await Post.findByPk(postId);
            if (!curPost) return res.status(404).json({
                error: "Поста, который вы хотели лайкнуть, не существует",
                success: false,
            });

            const existFavorite = await PostFavorite.findOne({
                where: {
                    userId: req.user.id,
                    postId: curPost.id,
                }
            });
            if (existFavorite) { await existFavorite.destroy() }
            else {
                const favorite = await PostFavorite.create({
                    userId: req.user.id,
                    postId: curPost.id,
                });
            }

            return res.status(200).json({
                success: true,
            });
        } catch (e) {
            return res.status(500).json({
                error: e.message,
                success: false,
            });
        }
    }

    async getTags(req, res) {
        try {
            const tags = await Tag.findAll();

            if (!tags && !tags.length) return res.status(404).json({
                error: "Тегов нет",
                success: false,
            });

            return res.status(200).json({
                tags: tags,
                success: true,
            });
        } catch (e) {
            return res.status(500).json({
                error: e.message,
                success: false,
            });
        }
    }

    async getCategories(req, res) {
        try {
            const categories = await PostCategory.findAll();

            if (!categories && !categories.length) return res.status(404).json({
                error: "Категорий нет",
                success: false,
            });

            return res.status(200).json({
                categories,
                success: true,
            });
        } catch (e) {
            return res.stauts(500).json({
                error: e.message,
                success: false,
            });
        }
    }

    // Получение всех постов (для админа, с пагинацией, без ограничений)
    async getAllPostsAdmin(req, res) {
        const { limit = 50, offset = 0 } = req.query;
        try {
            const posts = await Post.findAll({
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset),
                include: [
                    { model: PostImage, as: 'images' },
                    { model: PostCategory, as: 'category', attributes: ['name', 'linkName', 'type'] },
                    { model: UserProfile, as: 'authorUser', attributes: ['id', 'nickname', 'avatarUrl'] },
                    { model: Guest, as: 'authorGuest', attributes: ['id'] },
                    { model: Tag, as: 'tags', through: { attributes: [] } }
                ]
            });

            const postIds = posts.map(p => p.id);
            // аналогично getPosts – получаем лайки и избранное
            const likeCounts = await PostLike.findAll({ where: { postId: postIds }, attributes: ['postId', [sequelize.fn('COUNT', sequelize.col('userId')), 'count']], group: ['postId'] });
            const likeCountMap = Object.fromEntries(likeCounts.map(l => [l.postId, l.dataValues.count]));

            const favCounts = await PostFavorite.findAll({ where: { postId: postIds }, attributes: ['postId', [sequelize.fn('COUNT', sequelize.col('userId')), 'count']], group: ['postId'] });
            const favCountMap = Object.fromEntries(favCounts.map(f => [f.postId, f.dataValues.count]));

            let likedByUser = {}, favoritedByUser = {};
            if (req.user) {
                const [userLikes, userFavs] = await Promise.all([
                    PostLike.findAll({ where: { postId: postIds, userId: req.user.id } }),
                    PostFavorite.findAll({ where: { postId: postIds, userId: req.user.id } })
                ]);
                likedByUser = Object.fromEntries(userLikes.map(l => [l.postId, true]));
                favoritedByUser = Object.fromEntries(userFavs.map(f => [f.postId, true]));
            }

            const result = posts.map(post => {
                const postJson = post.toJSON();
                postJson.likeCount = likeCountMap[post.id] || 0;
                postJson.isLikedByMe = !!likedByUser[post.id];
                postJson.favoriteCount = favCountMap[post.id] || 0;
                postJson.isFavoritedByMe = !!favoritedByUser[post.id];
                postJson.isAuthor = true; // для админа всегда true
                return postJson;
            });

            const total = await Post.count();
            return res.status(200).json({ success: true, posts: result, total });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }

    // Удаление поста админом (без проверок)
    async deletePostAdmin(req, res) {
        const { postId } = req.params;
        try {
            const curPost = await Post.findByPk(postId);
            if (!curPost) return res.status(404).json({ error: 'Пост не найден', success: false });

            const images = await PostImage.findAll({ where: { postId: curPost.id } });
            for (const img of images) {
                await fs.unlink(path.join(__dirname, '..', img.url)).catch(() => { });
            }
            await PostImage.destroy({ where: { postId: curPost.id } });
            await curPost.destroy();
            await fs.rm(path.join(__dirname, '..', 'serverFiles', 'posts', curPost.id), { recursive: true, force: true });

            return res.status(200).json({ success: true });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }
}

module.exports = { PostController };