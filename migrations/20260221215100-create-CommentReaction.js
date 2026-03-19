'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('CommentReaction', {
            userId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'UserProfile', key: 'id' },
                onDelete: 'CASCADE'
            },
            commentId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'Comment', key: 'id' },
                onDelete: 'CASCADE'
            },
            reactionId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'Reaction', key: 'id' },
                onDelete: 'CASCADE'
            }
        }, {
            uniqueKeys: { commentreaction_unique: { fields: ['commentId', 'userId', 'reactionId'] } }
        });
        await queryInterface.addIndex('CommentReaction', ['commentId']);
        await queryInterface.addIndex('CommentReaction', ['userId']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('CommentReaction');
    }
};
