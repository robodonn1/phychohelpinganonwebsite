'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('PostTag', {
            postId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Post',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE'
            },
            tagId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Tag',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE'
            },
        }, {
            uniqueKeys: { posttag_unique: { fields: ['postId', 'tagId'] } }
        });
        await queryInterface.addIndex('PostTag', ['postId']);
        await queryInterface.addIndex('PostTag', ['tagId']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('PostTag');
    }
};
