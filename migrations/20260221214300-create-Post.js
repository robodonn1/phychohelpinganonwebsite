'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('Post', {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                defaultValue: Sequelize.UUIDV4
            },
            userId: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'UserProfile',
                    key: 'id'
                },
                onDelete: "SET NULL",
            },
            guestId: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'Guest',
                    key: 'id'
                },
                onDelete: "SET NULL",
            },
            categoryId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: { model: 'PostCategory', key: 'id' },
                onDelete: "RESTRICT",
            },
            title: {
                type: Sequelize.STRING
            },
            text: {
                type: Sequelize.TEXT
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
        }, { uniqueKeys: { comment_unique: { fields: ['userId', 'guestId', 'categoryId', 'createdAt'] } } });
        await queryInterface.addIndex('Post', ['userId']);
        await queryInterface.addIndex('Post', ['guestId']);
        await queryInterface.addIndex('Post', ['categoryId']);
        await queryInterface.addIndex('Post', ['createdAt']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('Post');
    }
};
