'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Comment', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                defaultValue: Sequelize.UUIDV4
            },
            userId: {
                type: Sequelize.UUID,
                references: {
                    model: 'UserProfile',
                    key: 'id'
                },
                onDelete: "SET NULL",
            },
            postId: {
                type: Sequelize.UUID,
                references: {
                    model: 'Post',
                    key: 'id'
                },
                onDelete: "CASCADE",
            },
            parentCommentId: {
                type: Sequelize.UUID,
                references: {
                    model: 'Comment',
                    key: 'id'
                },
                onDelete: "CASCADE",
            },
            text: {
                type: Sequelize.TEXT
            },
            commentType: {
                type: Sequelize.ENUM('user', 'doctor'),
                defaultValue: 'user'
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        }, {
            uniqueKeys: { comment_unique: { fields: ['postId', 'parentCommentId'] } }
        });
        await queryInterface.addIndex('Comment', ['postId']);
        await queryInterface.addIndex('Comment', ['parentCommentId']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('Comment');
    }
};
