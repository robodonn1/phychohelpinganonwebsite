'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('PostFavorite', {
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
            uniqueKeys: { postfavorite_unique: { fields: ['postId', 'userId'] } }
        });
        await queryInterface.addIndex('PostFavorite', ['postId']);
        await queryInterface.addIndex('PostFavorite', ['userId']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('PostFavorite');
    }
};
