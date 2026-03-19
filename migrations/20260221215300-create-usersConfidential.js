'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('UserConfidential', {
            userId: {
                type: Sequelize.UUID,
                primaryKey: true,
                references: {
                    model: 'UserProfile',
                    key: 'id',
                },
            },
            fullName: {
                type: Sequelize.STRING,
            },
            birthdate: {
                type: Sequelize.DATEONLY,
            },
            profileDescription: {
                type: Sequelize.TEXT,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('UserConfidential');
    }
};
