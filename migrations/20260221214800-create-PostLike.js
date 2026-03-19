'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('PostLike', {
            userId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'UserProfile', key: 'id' },
                onDelete: 'CASCADE'
            },
            postId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'Post', key: 'id' },
                onDelete: 'CASCADE'
            },
            createdAt: { type: Sequelize.DATE, allowNull: false },
            updatedAt: { type: Sequelize.DATE, allowNull: false }
        }, {
            uniqueKeys: { postlike_unique: { fields: ['postId', 'userId'] } }
        });
        await queryInterface.addIndex('PostLike', ['postId']);
        await queryInterface.addIndex('PostLike', ['userId']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('PostLike');
    }
};
