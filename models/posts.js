const { DataTypes, INTEGER } = require("sequelize");
const sequelize = require(".");
const { UserProfile, Guest } = require("./users");

const PostCategory = sequelize.define(
    'PostCategory',
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        name: { type: DataTypes.STRING },
        linkName: { type: DataTypes.STRING },
        type: { type: DataTypes.ENUM('advise', 'help') },
    }, { tableName: 'PostCategory', timestamps: true, },
);

const Tag = sequelize.define(
    'Tag',
    {
        id: { type: INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING, allowNull: false, unique: true },
        slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    }, { tableName: 'Tag', timestamps: false, },
);

const PostTag = sequelize.define(
    'PostTag',
    {
        postId: { type: DataTypes.UUID, references: { model: 'Post', key: 'id' } },
        tagId: { type: DataTypes.INTEGER, references: { model: 'Tag', key: 'id' } },
    }, { tableName: 'PostTag', timestamps: false, indexes: [{ unique: true, fields: ['postId', 'tagId'] }] },
);

const Post = sequelize.define(
    'Post',
    {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        userId: { type: DataTypes.UUID, allowNull: true, references: { model: 'UserProfile', key: 'id' } },
        guestId: { type: DataTypes.UUID, allowNull: true, references: { model: 'Guest', key: 'id' } },
        categoryId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'PostCategory', key: 'id' } },
        title: { type: DataTypes.STRING },
        text: { type: DataTypes.TEXT },
    }, { tableName: 'Post', timestamps: true, indexes: [{ unique: true, fields: ['userId', 'guestId', 'categoryId', 'createdAt'] }] }
);

const Comment = sequelize.define(
    'Comment',
    {
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
        userId: { type: DataTypes.UUID, references: { model: 'UserProfile', key: 'id' } },
        postId: { type: DataTypes.UUID, references: { model: 'Post', key: 'id' } },
        parentCommentId: { type: DataTypes.UUID, references: { model: 'Comment', key: 'id' } },
        text: { type: DataTypes.TEXT },
        commentType: { type: DataTypes.ENUM('user', 'doctor'), defaultValue: 'user' },
    }, { tableName: 'Comment', timestamps: true, }
);

const PostLike = sequelize.define(
    'PostLike',
    {
        userId: { type: DataTypes.UUID, references: { model: 'UserProfile', key: 'id' } },
        postId: { type: DataTypes.UUID, references: { model: 'Post', key: 'id' } },
    }, { tableName: 'PostLike', timestamps: true, indexes: [{ unique: true, fields: ['postId', 'userId'] }] },
);

const PostFavorite = sequelize.define(
    'PostFavorite',
    {
        postId: { type: DataTypes.UUID, references: { model: 'Post', key: 'id' } },
        userId: { type: DataTypes.UUID, references: { model: 'UserProfile', key: 'id' } },
    }, { tableName: 'PostFavorite', timestamps: true, indexes: [{ unique: true, fields: ['postId', 'userId'] }] },
);

const Reaction = sequelize.define(
    'Reaction',
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING, allowNull: false },
        slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    }, { tableName: 'Reaction', timestamps: false, },
);

const CommentReaction = sequelize.define(
    'CommentReaction',
    {
        userId: { type: DataTypes.UUID, references: { model: 'UserProfile', key: 'id' } },
        commentId: { type: DataTypes.UUID, references: { model: 'Comment', key: 'id' } },
        reactionId: { type: DataTypes.INTEGER, references: { model: 'Reaction', key: 'id' } },
    }, { tableName: 'CommentReaction', timestamps: false, indexes: [{ unique: true, fields: ['commentId', 'userId', 'reactionId'] }] },
);

const PostImage = sequelize.define(
    'PostImage',
    {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        postId: { type: DataTypes.UUID, references: { model: Post, key: 'id' } },
        url: { type: DataTypes.STRING },
        order: { type: DataTypes.INTEGER }
    }, { tableName: 'PostImage', }
);

Post.hasMany(PostImage, { as: 'images', foreignKey: 'postId' });
PostImage.belongsTo(Post, { foreignKey: 'postId' });

UserProfile.hasMany(CommentReaction, { foreignKey: 'userId', as: 'reactionsOnComments' });
Comment.hasMany(CommentReaction, { foreignKey: 'commentId', as: 'userReactions' });
Reaction.hasMany(CommentReaction, { foreignKey: 'reactionId', as: 'commentUsages' });

CommentReaction.belongsTo(UserProfile, { foreignKey: 'userId', as: 'user' });
CommentReaction.belongsTo(Comment, { foreignKey: 'commentId', as: 'comment' });
CommentReaction.belongsTo(Reaction, { foreignKey: 'reactionId', as: 'reaction' });

Post.belongsToMany(Tag, { through: PostTag, foreignKey: 'postId', otherKey: 'tagId', as: 'tags' });
Tag.belongsToMany(Post, { through: PostTag, foreignKey: 'tagId', otherKey: 'postId', as: 'posts' });

PostCategory.hasMany(Post, { foreignKey: 'categoryId', as: 'posts' });
Post.belongsTo(PostCategory, { foreignKey: 'categoryId', as: 'category' });

Post.belongsTo(UserProfile, { foreignKey: 'userId', as: 'authorUser' });
Post.belongsTo(Guest, { foreignKey: 'guestId', as: 'authorGuest' });
UserProfile.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
Guest.hasMany(Post, { foreignKey: 'guestId', as: 'posts' });

Comment.belongsTo(UserProfile, { foreignKey: 'userId', as: 'userInfo' });
UserProfile.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });

Post.hasMany(Comment, { foreignKey: 'postId', as: 'comments' });
Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

Comment.belongsTo(Comment, { as: 'parent', foreignKey: 'parentCommentId' });
Comment.hasMany(Comment, { as: 'replies', foreignKey: 'parentCommentId' });

Post.belongsToMany(UserProfile, { through: PostLike, foreignKey: 'postId', otherKey: 'userId', as: 'likedBy' });
UserProfile.belongsToMany(Post, { through: PostLike, foreignKey: 'userId', otherKey: 'postId', as: 'likedPosts' });

Post.belongsToMany(UserProfile, { through: PostFavorite, foreignKey: 'postId', otherKey: 'userId', as: 'favoriteBy' });
UserProfile.belongsToMany(Post, { through: PostFavorite, foreignKey: 'userId', otherKey: 'postId', as: 'favoritePosts' });

module.exports = {
    PostCategory,
    Tag,
    Post,
    Comment,
    Reaction,
    PostLike,
    PostTag,
    CommentReaction,
    PostFavorite,
    PostImage
};