require('dotenv').config({ path: './settings.env' });
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs').promises;
const { UserProfile, UsersConfidential, DoctorsConfidential, License, Guest, Issuer, Specialization } = require("../models/users");
const { Post, PostLike, PostFavorite, PostImage, PostCategory, Tag } = require('../models/posts');
const sequelize = require('../models');

const ROOT_DIR = path.join(__dirname, '..');
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '15m';
const createJWTToken = (payload) => {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return token;
}
const checkJWTToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({
        error: "Вы не авторизованы",
        success: false,
    });
    if (req.guest) res.cookie('guestToken', '', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 0
    });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;

        return next();
    } catch (e) {
        return res.status(403).json({
            error: "Не действительный токен",
            success: false,
        });
    }
}

const checkAdminAccount = (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Не авторизован", success: false });
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Доступ запрещён", success: false });
    return next();
}

const checkGuestToken = async (req, res, next) => {
    if (req.user) return next();

    const guestToken = req.cookies.guestToken;
    let guest;

    if (guestToken) guest = await Guest.findOne({ where: { sessionToken: guestToken } });

    if (!guest) {
        try {
            guest = await Guest.create({
                id: crypto.randomUUID(),
                sessionToken: crypto.randomBytes(32).toString('hex'),
                lastActivity: new Date(),
            });
        } catch (error) {
            console.error('❌ Ошибка при создании гостя:');
            console.error('Сообщение:', error.message);
            console.error('Исходная ошибка БД:', error.parent); // здесь будет конкретика от SQLite
            console.error('SQL:', error.sql);
            throw error; // или обработайте иначе
        }

        res.cookie('guestToken', guest.sessionToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000,
            path: '/',
        });
    } else {
        guest.lastActivity = new Date();
        await guest.save();
    }

    req.guest = guest;
    return next();
}

async function optionalAuth(req, res, next) {
    const token = req.cookies.token;
    const guestToken = req.cookies.guestToken;
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded
            if (guestToken) {
                res.cookie('guestToken', '', {
                    maxAge: 0,
                    path: '/',
                    sameSite: 'lax',
                    secure: false,
                    httpOnly: true,
                });
                return next();
            }
        } catch (e) {
            res.cookie('token', '', {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                path: '/',
                maxAge: 0
            });
        }
    }
    if (guestToken) {
        const guest = await Guest.findOne({ where: { sessionToken: guestToken } });
        if (guest) {
            guest.lastActivity = new Date();
            await guest.save();
            req.guest = guest;
            return next();
        }
        res.cookie('guestToken', '', {
            httpOnly: true,
            secure: false,
            path: '/',
            sameSite: 'lax',
            maxAge: 0,
        })
    }
    try {
        const guest = await Guest.create({
            id: crypto.randomUUID(),
            sessionToken: crypto.randomBytes(32).toString('hex'),
            lastActivity: new Date(),
        });
        res.cookie('guestToken', guest.sessionToken, {
            httpOnly: true,
            secure: false,
            path: '/',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        return next();
    } catch (e) {
        console.log('Ошибка при создании гостя: ', e);
        return next(e);
    }
}

class UserController {
    async createUser(req, res) {
        const { email, nickname, role, password } = req.body;

        try {
            if (!email) return res.status(400).json({
                error: "Введите email",
                success: false,
            });
            if (!nickname) return res.status(400).json({
                error: "Введите никнейм",
                success: false,
            });
            if (!role) return res.status(400).json({
                error: "Выберите роль",
                success: false,
            });
            if (!password) return res.status(400).json({
                error: "Введите password",
                success: false,
            });

            const passwordHash = await bcrypt.hash(password, 10);

            const newUser = await UserProfile.create({
                id: crypto.randomUUID(),
                email,
                nickname,
                role,
                passwordHash: passwordHash,
            });

            return res.status(201).json({
                success: true,
                createdUser: {
                    id: newUser.id,
                    email: newUser.email,
                    nickname: newUser.nickname,
                    role: newUser.role
                }
            });
        } catch (e) {
            return res.status(500).json({
                error: e.message,
                success: false,
            });
        }
    }

    async createAccount(req, res) {
        const { email, nickname, password } = req.body;

        try {
            if (!email) return res.status(400).json({
                error: "Введите email",
                success: false,
            });
            if (!nickname) return res.status(400).json({
                error: "Введите никнейм",
                success: false,
            });
            if (!password) return res.status(400).json({
                error: "Введите password",
                success: false,
            });

            const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/u;
            if (!emailRegex.test(email)) return res.status(400).json({
                error: "Введите email согласно инструкции",
                success: false,
            });
            const nicknameRegex = /^[a-zA-Z0-9_-]{6,16}$/u;
            if (!nicknameRegex.test(nickname)) return res.status(400).json({
                error: "Введите никнейм согласно инструкции",
                success: false,
            });
            const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,16}$/u;
            if (!passwordRegex.test(password)) return res.status(400).json({
                error: "Введите пароль согласно инструкции",
                success: false,
            });

            const passwordHash = await bcrypt.hash(password, 10);
            const newUser = await UserProfile.create({
                id: crypto.randomUUID(),
                email,
                nickname,
                passwordHash: passwordHash,
            });

            if (req.guest) res.cookie('guestToken', '', {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                path: '/',
                maxAge: 0
            });

            const token = createJWTToken({ id: newUser.id, email: newUser.email, nickname: newUser.nickname, role: newUser.role });
            res.cookie('token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                maxAge: 15 * 60 * 1000,
                path: '/',
            });

            return res.status(201).json({
                success: true,
                createdUser: {
                    id: newUser.id,
                    email: newUser.email,
                    nickname: newUser.nickname,
                    role: newUser.role
                }
            });
        } catch (e) {
            return res.status(500).json({
                error: e.message,
                success: false,
            })
        }
    }

    async addingConfidentialToAccount(req, res) {
        const { firstName, lastName, hasMiddleName, middleName, birthdate, profileDescription, showConfidential, showPosts } = req.body;
        const avatar = req.file;

        try {
            // ... валидация как у вас ...

            const curUser = await UserProfile.findByPk(req.user.id);
            if (!curUser) return res.status(404).json({ error: "Пользователя не существует", success: false });

            const existConfidential = await UsersConfidential.findByPk(req.user.id);
            if (existConfidential) return res.status(409).json({ error: "Публичные данные для этого пользователя уже существуют", success: false });

            const fullName = [lastName, firstName, middleName].filter(Boolean).join(' ');
            const newConfidential = await UsersConfidential.create({
                userId: req.user.id,
                fullName: fullName,
                birthdate: birthdate,
                profileDescription: profileDescription,
            });

            // Обновляем настройки видимости в профиле пользователя
            const updateData = {};
            if (showConfidential !== undefined) {
                updateData.showConfidential = showConfidential === 'true' || showConfidential === true;
            }
            if (showPosts !== undefined) {
                updateData.showPosts = showPosts === 'true' || showPosts === true;
            }

            if (avatar) {
                const oldAvatarPath = curUser.avatarUrl;
                const allowedTypes = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.heic', '.tiff', '.bmp'];
                const fileType = path.extname(avatar.originalname).toLowerCase();
                if (!allowedTypes.includes(fileType)) {
                    return res.status(400).json({ error: "Недопустимый тип файла", success: false });
                }

                // Получаем относительный путь от корня проекта
                const absolutePath = avatar.path;
                let relativePath = absolutePath.replace(ROOT_DIR, ''); // убираем корень
                // Приводим разделители к прямым слешам и убираем начальный слеш
                relativePath = relativePath.replace(/\\/g, '/');
                if (relativePath.startsWith('/')) {
                    relativePath = relativePath.substring(1);
                }
                // Теперь relativePath выглядит как "serverFiles/users/.../ava.png"

                updateData.avatarUrl = relativePath;

                // Удаляем старый аватар, если он есть и отличается от нового
                if (oldAvatarPath && oldAvatarPath !== relativePath) {
                    const oldAbsolutePath = path.join(ROOT_DIR, oldAvatarPath);
                    await fs.unlink(oldAbsolutePath).catch(err => {
                        console.error('\nОшибка удаления старого аватара для пользователя ' + curUser.id, '\nошибка:' + err + '\n');
                    });
                }
            }

            if (Object.keys(updateData).length > 0) {
                await curUser.update(updateData);
            }

            return res.status(201).json({
                success: true,
                confidential: {
                    userId: newConfidential.userId,
                    fullName: newConfidential.fullName,
                    birthdate: newConfidential.birthdate,
                    profileDescription: newConfidential.profileDescription,
                    showConfidential: curUser.showConfidential,
                    showPosts: curUser.showPosts,
                },
            });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }

    async login(req, res) {
        const { email, password } = req.body;

        try {
            if (!email) return res.status(400).json({
                error: "Введите свой почту",
                success: false,
            });
            if (!password) return res.status(400).json({
                error: "Введите свой пароль",
                success: false,
            });
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/u;

            if (!emailRegex.test(email)) return res.status(400).json({
                error: "Введите свой почту корректно",
                success: false,
            });

            const userByEmail = await UserProfile.findOne({ where: { email: email } });

            if (!userByEmail) return res.status(404).json({
                error: "Пользователя с такой почтой не существует",
                success: false,
            });

            const isCompare = await bcrypt.compare(password, userByEmail.passwordHash);
            if (!isCompare) return res.status(400).json({
                error: "Неправильно введен пароль",
                success: false,
            });

            if (req.guest) res.cookie('guestToken', '', {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                path: '/',
                maxAge: 0
            });

            const token = createJWTToken({ id: userByEmail.id, email: userByEmail.email, nickname: userByEmail.nickname, role: userByEmail.role, });

            res.cookie('token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                maxAge: 15 * 60 * 1000,
                path: '/',
            });

            return res.status(200).json({
                success: true,
                curUser: {
                    id: userByEmail.id,
                    email: userByEmail.email,
                    nickname: userByEmail.nickname,
                    role: userByEmail.role,
                },
                token,
            });

        } catch (e) {
            return res.status(500).json({
                error: e.message,
                success: false,
            });
        }
    }

    async logout(req, res) {
        try {
            res.cookie('token', '', {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                path: '/',
                maxAge: 0
            });
            return res.json({
                success: true,
            });
        } catch (e) {
            return res.status(500).json({
                success: false,
                error: e.message,
            });
        }
    }

    async editingConfidentialToAccount(req, res) {
        const { firstName, lastName, hasMiddleName, middleName, birthdate, profileDescription, showConfidential, showPosts } = req.body;
        const avatar = req.file;

        try {
            // ... валидация как у вас ...

            const curUser = await UserProfile.findByPk(req.user.id);
            if (!curUser) return res.status(404).json({ error: "Пользователя не существует", success: false });

            const editConfidential = await UsersConfidential.findByPk(req.user.id);
            if (!editConfidential) return res.status(404).json({ error: "Не найдены публичные данные этого пользователя", success: false });

            const fullName = [lastName, firstName, middleName].filter(Boolean).join(' ');
            await editConfidential.update({
                fullName: fullName,
                birthdate: birthdate,
                profileDescription: profileDescription,
            });

            // Обновляем настройки видимости в профиле пользователя
            const updateData = {};
            if (showConfidential !== undefined) {
                updateData.showConfidential = showConfidential === 'true' || showConfidential === true;
            }
            if (showPosts !== undefined) {
                updateData.showPosts = showPosts === 'true' || showPosts === true;
            }

            if (avatar) {
                const oldAvatarPath = curUser.avatarUrl;
                const allowedTypes = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.heic', '.tiff', '.bmp'];
                const fileType = path.extname(avatar.originalname).toLowerCase();
                if (!allowedTypes.includes(fileType)) {
                    return res.status(400).json({ error: "Недопустимый тип файла", success: false });
                }

                // Получаем относительный путь
                const absolutePath = avatar.path;
                let relativePath = absolutePath.replace(ROOT_DIR, '');
                relativePath = relativePath.replace(/\\/g, '/');
                if (relativePath.startsWith('/')) {
                    relativePath = relativePath.substring(1);
                }
                updateData.avatarUrl = relativePath;

                if (oldAvatarPath && oldAvatarPath !== relativePath) {
                    const oldAbsolutePath = path.join(ROOT_DIR, oldAvatarPath);
                    await fs.unlink(oldAbsolutePath).catch(err => {
                        console.error('\nОшибка удаления старого аватара для пользователя ' + curUser.id, '\nошибка:' + err + '\n');
                    });
                }
            }

            if (Object.keys(updateData).length > 0) {
                await curUser.update(updateData);
            }

            return res.status(201).json({
                success: true,
                confidential: {
                    userId: editConfidential.userId,
                    fullName: editConfidential.fullName,
                    birthdate: editConfidential.birthdate,
                    profileDescription: editConfidential.profileDescription,
                    showConfidential: curUser.showConfidential,
                    showPosts: curUser.showPosts,
                },
            });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }

    async editUser(req, res) {
        const userId = req.body.id;

        try {
            const { email, nickname, role, password } = req.body;

            const editUser = await UserProfile.findByPk(userId);

            if (!editUser) return res.status(404).json({
                error: "Такой пользовательн не сущетсвует",
                success: false,
            });

            const updateData = {};

            if (email) updateData.email = email;
            if (nickname) updateData.nickname = nickname;
            if (role) updateData.role = role;
            if (password) updateData.passwordHash = await bcrypt.hash(password, 10);

            await editUser.update(updateData);

            return res.status(200).json({
                success: true,
                editedUser: {
                    email: editUser.email,
                    nickname: editUser.nickname,
                    role: editUser.role,
                }
            });
        } catch (e) {
            return res.status(500).json({
                error: e.message,
                success: false,
            });
        }
    }

    async getUsers(req, res) {
        try {
            const users = await UserProfile.findAll({
                attributes: { exclude: ['passwordHash'] },
            });

            if (!users && users.length != 0) return res.status(404).json({
                error: "Пользователей нет",
                success: false,
            });

            return res.status(200).json({
                success: true,
                users: users,
            });
        } catch (e) {
            return res.status(500).json({
                error: e.message,
                success: false,
            });
        }
    }

    async getDoctors(req, res) {
        try {
            const doctors = await UserProfile.findAll({
                where: { role: 'doctor' },
                attributes: { exclude: ['passwordHash'] },
                include: [
                    {
                        model: DoctorsConfidential,
                        as: "doctorInfo",
                        include: [
                            {
                                model: License,
                                as: "license",
                                include: {
                                    model: Issuer,
                                    as: "issuer",
                                }
                            },
                            {
                                model: Specialization,
                                as: "specialization"
                            }
                        ]
                    },
                    {
                        model: UsersConfidential,
                        as: "confidential"
                    }
                ]
            });

            if (!doctors && doctors.length != 0) return res.status(404).json({
                error: "Докторов нет",
                success: false,
            });

            return res.status(200).json({
                success: true,
                doctors: doctors,
            });
        } catch (e) {
            return res.status(500).json({
                error: e.message,
                success: false,
            });
        }
    }

    async getUserProfile(req, res) {
        try {
            const userId = req.params.id;

            const curUser = await UserProfile.findByPk(userId, { attributes: { exclude: ['passwordHash'] } });

            if (!curUser) return res.status(404).json({
                error: "Пользователь не найден",
                success: false,
            });

            if (req.user && userId == req.user.id) {
                const curConfeditial = await UsersConfidential.findByPk(req.user.id);
                const curDoctor = await DoctorsConfidential.findByPk(req.user.id);
                const curSpecialization = await Specialization.findByPk(curDoctor?.specializationId);
                const curLicense = await License.findByPk(req.user.id, {
                    include: {
                        model: Issuer,
                        as: 'issuer',
                    }
                });

                return res.status(200).json({
                    profile: {
                        user: curUser,
                        confidential: curConfeditial,
                        doctor: curDoctor,
                        specialization: curSpecialization,
                        license: curLicense,
                    },
                    success: true,
                });
            } else {
                let profile = { user: curUser };
                if (curUser.showConfidential) {
                    const userConfidential = await UsersConfidential.findByPk(userId);
                    if (userConfidential) profile.confidential = userConfidential;
                }
                if (curUser.role == 'doctor') {
                    const doctor = await DoctorsConfidential.findByPk(userId);
                    const curSpecialization = await Specialization.findByPk(doctor.specializationId);
                    const license = await License.findByPk(userId, {
                        include: {
                            model: Issuer,
                            as: 'issuer',
                        }
                    });
                    if (doctor) profile.doctor = doctor;
                    if (license) profile.license = license;
                    if (license) profile.specialization = curSpecialization;
                }

                return res.status(200).json({
                    profile,
                    success: true,
                });
            }
        } catch (e) {
            return res.status(500).json({
                error: e.message,
                success: false,
            });
        }
    }

    async changePassword(req, res) {
        try {
            const { oldPassword, newPassword } = req.body;
            const curUser = await UserProfile.findByPk(req.user.id);

            if (!curUser) return res.status(404).json({
                error: "Не существует такого пользователя",
                success: false,
            });

            const isCompare = await bcrypt.compare(oldPassword, curUser.passwordHash);
            if (!isCompare) return res.status(403).json({
                error: "Неправильный пароль",
                success: false,
            });

            const passwordHash = await bcrypt.hash(newPassword, 10);
            await curUser.update({
                passwordHash: passwordHash,
            });

            return res.status(200).json({
                success: true,
            });
        } catch (e) {
            return res.status(500).json({
                success: false,
                error: e.message,
            });
        }
    }

    async deleteUser(req, res) {
        try {
            const password = req.body.password;
            const curUser = await UserProfile.findByPk(req.user.id);

            const isCompare = await bcrypt.compare(password, curUser.passwordHash);
            if (!isCompare) return res.status(403).json({
                error: "Неправильный пароль",
                success: false,
            });

            const curConfeditial = await UsersConfidential.findByPk(req.user.id);
            const curDoctor = await DoctorsConfidential.findByPk(req.user.id);
            const curLicense = await License.findByPk(req.user.id);

            if (curConfeditial) await curConfeditial.destroy();
            if (curDoctor) await curDoctor.destroy();
            if (curLicense) await curLicense.destroy();
            await curUser.destroy();

            res.cookie('token', '', {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                path: '/',
                maxAge: 0
            });

            res.status(200).json({
                success: true,
            });
        } catch (e) {
            return res.status(500).json({
                error: e.message,
                success: false,
            });
        }
    }

    async getCurUser(req, res) {
        try {
            const isGuest = !!req.guest;
            const isDoctor = req.user?.role == "doctor";
            const isAdmin = req.user?.role == "admin";
            const user = req.user;

            const curUser = await UserProfile.findByPk(user?.id, { attributes: { exclude: ['passwordHash'] } });

            return res.status(200).json({
                isGuest,
                isDoctor,
                isAdmin,
                user: curUser,
                success: true,
            });
        } catch (e) {
            return res.status(500).json({
                error: e.message,
                success: false,
            });
        }
    }

    async getFavoritePosts(req, res) {
        try {
            const { userId } = req.params;
            const { limit = 20, offset = 0 } = req.query;

            // 1. Получаем записи избранного для данного пользователя с пагинацией, сортируем по дате добавления (сначала новые)
            const favorites = await PostFavorite.findAll({
                where: { userId },
                order: [['createdAt', 'DESC']],
            });

            const postIds = favorites.map(f => f.postId);
            if (postIds.length === 0) {
                return res.status(200).json({ success: true, posts: [] });
            }

            // 2. Получаем основные данные постов по этим ID
            const posts = await Post.findAll({
                where: { id: postIds },
                include: [
                    { model: PostImage, as: 'images' },
                    { model: PostCategory, as: 'category', attributes: ['name', 'linkName', 'type'] },
                    { model: UserProfile, as: 'authorUser', attributes: ['id', 'nickname', 'avatarUrl'] },
                    { model: Guest, as: 'authorGuest', attributes: ['id'] },
                    { model: Tag, as: 'tags', through: { attributes: [] } }
                ]
            });

            // Сортируем посты в том же порядке, в котором они были в избранном (по дате добавления)
            const postMap = new Map(posts.map(p => [p.id, p]));
            const sortedPosts = postIds.map(id => postMap.get(id)).filter(p => p);

            // 3. Подсчёт лайков и избранного для всех этих постов
            const likeCounts = await PostLike.findAll({
                where: { postId: postIds },
                attributes: ['postId', [sequelize.fn('COUNT', sequelize.col('userId')), 'count']],
                group: ['postId']
            });
            const likeCountMap = Object.fromEntries(likeCounts.map(l => [l.postId, l.dataValues.count]));

            const favCounts = await PostFavorite.findAll({
                where: { postId: postIds },
                attributes: ['postId', [sequelize.fn('COUNT', sequelize.col('userId')), 'count']],
                group: ['postId']
            });
            const favCountMap = Object.fromEntries(favCounts.map(f => [f.postId, f.dataValues.count]));

            // 4. Флаги для текущего пользователя (если он авторизован)
            let likedByUser = {};
            let favoritedByUser = {};
            if (req.user) {
                const [userLikes, userFavs] = await Promise.all([
                    PostLike.findAll({ where: { postId: postIds, userId: req.user.id } }),
                    PostFavorite.findAll({ where: { postId: postIds, userId: req.user.id } })
                ]);
                likedByUser = Object.fromEntries(userLikes.map(l => [l.postId, true]));
                favoritedByUser = Object.fromEntries(userFavs.map(f => [f.postId, true]));
            }

            // 5. Формируем результат
            const result = sortedPosts.map(post => {
                const postJson = post.toJSON();
                postJson.likeCount = likeCountMap[post.id] || 0;
                postJson.isLikedByMe = !!likedByUser[post.id];
                postJson.favoriteCount = favCountMap[post.id] || 0;
                postJson.isFavoritedByMe = !!favoritedByUser[post.id];
                postJson.isAuthor = req.user?.id === post.userId;
                return postJson;
            });

            return res.status(200).json({
                success: true,
                posts: result,
                total: await PostFavorite.count({ where: { userId } }) // общее количество для пагинации на клиенте
            });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }

    async getUserPosts(req, res) {
        try {
            // 1. Основные посты (без лайков и избранного)
            const posts = await Post.findAll({
                where: { userId: req.params.id },
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

    async upsertDoctorInfo(req, res) {
        const {
            specializationId,
            workEmail,
            experience,
            workPhone,
            officeAddress,
            issuedId,
            series,
            registerNumber,
            registerDate,
            expiryDate
        } = req.body;

        // Валидация обязательных полей
        if (!specializationId) {
            return res.status(400).json({ error: "specializationId обязателен", success: false });
        }
        if (!workEmail) {
            return res.status(400).json({ error: "workEmail обязателен", success: false });
        }
        if (!issuedId) {
            return res.status(400).json({ error: "issuedId обязателен", success: false });
        }
        if (!series) {
            return res.status(400).json({ error: "series обязателен", success: false });
        }
        if (!registerNumber) {
            return res.status(400).json({ error: "registerNumber обязателен", success: false });
        }
        if (!registerDate) {
            return res.status(400).json({ error: "registerDate обязателен", success: false });
        }
        if (!expiryDate) {
            return res.status(400).json({ error: "expiryDate обязателен", success: false });
        }

        try {
            // Проверяем существование специализации
            const spec = await Specialization.findByPk(specializationId);
            if (!spec) {
                return res.status(400).json({ error: "Указанная специализация не существует", success: false });
            }

            // Проверяем существование Issuer
            const issuer = await Issuer.findByPk(issuedId);
            if (!issuer) {
                return res.status(400).json({ error: "Указанный issuer не существует", success: false });
            }

            const userId = req.user.id;

            // Выполняем операции в транзакции
            const result = await sequelize.transaction(async (t) => {
                // Создаём или обновляем DoctorsConfidential
                const [doctorInfo, created] = await DoctorsConfidential.upsert({
                    userId,
                    specializationId,
                    workEmail,
                    experience: experience || null,
                    workPhone: workPhone || null,
                    officeAddress: officeAddress || null
                }, { transaction: t, returning: true });

                // Создаём или обновляем License
                const [license, licenseCreated] = await License.upsert({
                    doctorId: userId,
                    issuedId,
                    series,
                    registerNumber,
                    registerDate,
                    expiryDate,
                    // verificationStatus остаётся по умолчанию 'pending'
                    // verifiedAt не трогаем
                }, { transaction: t, returning: true });

                return { doctorInfo, license, created, licenseCreated };
            });

            return res.status(200).json({
                success: true,
                message: "Данные доктора успешно сохранены",
                data: {
                    doctorInfo: result.doctorInfo,
                    license: result.license
                }
            });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }

    async getIssuers(req, res) {
        try {
            const issuers = await Issuer.findAll();

            if (!issuers && !issuers.length) return res.status(404).json({
                error: 'нету издателей',
                success: false,
            });

            return res.status(200).json({
                issuers,
                success: true,
            });
        } catch (e) {
            return res.status(500).json({
                error: e.message,
                success: false,
            });
        }
    }

    async getDoctorByUser(req, res) {
        try {
            const doctor = await DoctorsConfidential.findOne({
                where: { userId: req.user.id },
                include: {
                    model: License,
                    as: "license",
                }
            });

            return res.status(200).json({
                success: true,
                doctorConfidential: doctor,
            });
        } catch (e) {
            return res.status(500).json({
                error: e.message,
                success: false,
            });
        }
    }

    // Получение всех постов пользователя (для админа, без лимита 20)
    async getUserPostsAdmin(req, res) {
        const { userId } = req.params;
        try {
            const posts = await Post.findAll({
                where: { userId },
                order: [['createdAt', 'DESC']],
                include: [
                    { model: PostImage, as: 'images' },
                    { model: PostCategory, as: 'category', attributes: ['name', 'linkName', 'type'] },
                    { model: UserProfile, as: 'authorUser', attributes: ['id', 'nickname', 'avatarUrl'] },
                    { model: Guest, as: 'authorGuest', attributes: ['id'] },
                    { model: Tag, as: 'tags', through: { attributes: [] } }
                ]
            });

            const postIds = posts.map(p => p.id);
            // Получаем лайки и избранное аналогично getPosts
            const likeCounts = await PostLike.findAll({
                where: { postId: postIds },
                attributes: ['postId', [sequelize.fn('COUNT', sequelize.col('userId')), 'count']],
                group: ['postId']
            });
            const likeCountMap = Object.fromEntries(likeCounts.map(l => [l.postId, l.dataValues.count]));

            const favCounts = await PostFavorite.findAll({
                where: { postId: postIds },
                attributes: ['postId', [sequelize.fn('COUNT', sequelize.col('userId')), 'count']],
                group: ['postId']
            });
            const favCountMap = Object.fromEntries(favCounts.map(f => [f.postId, f.dataValues.count]));

            // Флаги для текущего админа (не нужны, но можно оставить)
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
                postJson.isAuthor = true; // для админа всегда true? или проверять?
                return postJson;
            });

            return res.status(200).json({ success: true, posts: result });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }

    // Получение избранных постов пользователя (для админа)
    async getUserFavoritesAdmin(req, res) {
        const { userId } = req.params;
        try {
            const favorites = await PostFavorite.findAll({
                where: { userId },
                order: [['createdAt', 'DESC']]
            });
            const postIds = favorites.map(f => f.postId);
            if (postIds.length === 0) return res.status(200).json({ success: true, posts: [] });

            const posts = await Post.findAll({
                where: { id: postIds },
                include: [
                    { model: PostImage, as: 'images' },
                    { model: PostCategory, as: 'category', attributes: ['name', 'linkName', 'type'] },
                    { model: UserProfile, as: 'authorUser', attributes: ['id', 'nickname', 'avatarUrl'] },
                    { model: Guest, as: 'authorGuest', attributes: ['id'] },
                    { model: Tag, as: 'tags', through: { attributes: [] } }
                ]
            });

            // Сортируем в порядке добавления в избранное
            const postMap = new Map(posts.map(p => [p.id, p]));
            const sortedPosts = postIds.map(id => postMap.get(id)).filter(p => p);

            // Подсчёт лайков и избранного (аналогично)
            const likeCounts = await PostLike.findAll({
                where: { postId: postIds },
                attributes: ['postId', [sequelize.fn('COUNT', sequelize.col('userId')), 'count']],
                group: ['postId']
            });
            const likeCountMap = Object.fromEntries(likeCounts.map(l => [l.postId, l.dataValues.count]));

            const favCounts = await PostFavorite.findAll({
                where: { postId: postIds },
                attributes: ['postId', [sequelize.fn('COUNT', sequelize.col('userId')), 'count']],
                group: ['postId']
            });
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

            const result = sortedPosts.map(post => {
                const postJson = post.toJSON();
                postJson.likeCount = likeCountMap[post.id] || 0;
                postJson.isLikedByMe = !!likedByUser[post.id];
                postJson.favoriteCount = favCountMap[post.id] || 0;
                postJson.isFavoritedByMe = !!favoritedByUser[post.id];
                postJson.isAuthor = true;
                return postJson;
            });

            return res.status(200).json({ success: true, posts: result });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }

    // Удаление confidential у пользователя
    async deleteUserConfidential(req, res) {
        const { userId } = req.params;
        try {
            const confidential = await UsersConfidential.findByPk(userId);
            if (!confidential) return res.status(404).json({ error: 'Confidential не найдены', success: false });
            await confidential.destroy();
            return res.status(200).json({ success: true });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }

    // Удаление doctor info (и связанной лицензии)
    async deleteUserDoctorInfo(req, res) {
        const { userId } = req.params;
        try {
            const doctor = await DoctorsConfidential.findByPk(userId);
            if (!doctor) return res.status(404).json({ error: 'Докторская информация не найдена', success: false });
            // Удаляем лицензию, если есть
            await License.destroy({ where: { doctorId: userId } });
            await doctor.destroy();
            return res.status(200).json({ success: true });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }

    // Удаление лицензии (без удаления doctor info)
    async deleteUserLicense(req, res) {
        const { userId } = req.params;
        try {
            const license = await License.findByPk(userId);
            if (!license) return res.status(404).json({ error: 'Лицензия не найдена', success: false });
            await license.destroy();
            return res.status(200).json({ success: true });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }

    // Получение полного профиля пользователя (для детальной страницы)
    async getUserFullProfile(req, res) {
        const { userId } = req.params;
        try {
            const user = await UserProfile.findByPk(userId, {
                attributes: { exclude: ['passwordHash'] },
                include: [
                    { model: UsersConfidential, as: 'confidential' },
                    {
                        model: DoctorsConfidential,
                        as: 'doctorInfo',
                        include: [
                            { model: Specialization, as: 'specialization' },
                            { model: License, as: 'license', include: [{ model: Issuer, as: 'issuer' }] }
                        ]
                    }
                ]
            });
            if (!user) return res.status(404).json({ error: 'Пользователь не найден', success: false });
            return res.status(200).json({ success: true, user });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }

    // Получение всех лицензий с фильтром по статусу
    async getAllLicenses(req, res) {
        const { status } = req.query; // может быть 'pending', 'verified', 'rejected'
        try {
            const where = status ? { verificationStatus: status } : {};
            const licenses = await License.findAll({
                where,
                include: [
                    { model: DoctorsConfidential, as: 'doctorInfo', include: [{ model: UserProfile, as: 'userInfo', attributes: ['id', 'nickname', 'email'] }] },
                    { model: Issuer, as: 'issuer' }
                ],
                order: [['createdAt', 'DESC']]
            });
            return res.status(200).json({ success: true, licenses });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }

    // Обновление статуса лицензии (принять/отклонить)
    async updateLicenseStatus(req, res) {
        const { licenseId } = req.params;
        const { status } = req.body; // 'verified' или 'rejected'
        try {
            if (!['verified', 'rejected'].includes(status)) {
                return res.status(400).json({ error: 'Некорректный статус', success: false });
            }
            const license = await License.findByPk(licenseId);
            if (!license) return res.status(404).json({ error: 'Лицензия не найдена', success: false });
            await license.update({
                verificationStatus: status,
                verifiedAt: status === 'verified' ? new Date() : null
            });
            return res.status(200).json({ success: true, license });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }

    async editUserByAdmin(req, res) {
        const { userId } = req.params;
        const { email, nickname, role, password } = req.body;
        try {
            const user = await UserProfile.findByPk(userId);
            if (!user) return res.status(404).json({ error: 'Пользователь не найден', success: false });

            const updateData = {};
            if (email) updateData.email = email;
            if (nickname) updateData.nickname = nickname;
            if (role) updateData.role = role;
            if (password) updateData.passwordHash = await bcrypt.hash(password, 10);

            await user.update(updateData);
            return res.status(200).json({ success: true, user });
        } catch (e) {
            return res.status(500).json({ error: e.message, success: false });
        }
    }

    // Добавьте этот метод в класс UserController

    async deleteUserByAdmin(req, res) {
        const userId = req.params.userId;

        try {
            // Проверяем, не пытается ли админ удалить самого себя
            if (userId === req.user.id) {
                return res.status(403).json({
                    error: 'Администратор не может удалить сам себя',
                    success: false
                });
            }

            // Ищем пользователя
            const user = await UserProfile.findByPk(userId);
            if (!user) {
                return res.status(404).json({
                    error: 'Пользователь не найден',
                    success: false
                });
            }

            // Удаляем в транзакции все связанные данные
            await sequelize.transaction(async (t) => {
                // Удаляем конфиденциальные данные, если есть
                await UsersConfidential.destroy({ where: { userId }, transaction: t });

                // Проверяем, есть ли у пользователя докторская информация
                const doctor = await DoctorsConfidential.findByPk(userId, { transaction: t });
                if (doctor) {
                    // Удаляем лицензию, если есть
                    await License.destroy({ where: { doctorId: userId }, transaction: t });
                    // Удаляем докторскую информацию
                    await doctor.destroy({ transaction: t });
                }

                // Удаляем самого пользователя
                await user.destroy({ transaction: t });
            });

            return res.status(200).json({ success: true });
        } catch (e) {
            console.error('Ошибка при удалении пользователя админом:', e);
            return res.status(500).json({
                error: e.message || 'Внутренняя ошибка сервера',
                success: false
            });
        }
    }
}

module.exports = { UserController, checkJWTToken, checkAdminAccount, checkGuestToken, optionalAuth };