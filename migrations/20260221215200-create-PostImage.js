'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('PostImage', {
            id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.UUIDV4 },
            postId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'Post', key: 'id' },
                onDelete: 'CASCADE'
            },
            url: { type: Sequelize.STRING },
            order: { type: Sequelize.INTEGER },
            createdAt: { type: Sequelize.DATE, allowNull: false },
            updatedAt: { type: Sequelize.DATE, allowNull: false }
        });
        await queryInterface.addIndex('PostImage', ['postId']);
    },
    
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('PostImage');
    }
};
