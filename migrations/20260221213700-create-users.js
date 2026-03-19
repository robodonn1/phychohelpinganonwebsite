'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('UserProfile', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true,
                allowNull: false,
            },
            email: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true,
            },
            nickname: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            role: {
                type: Sequelize.ENUM('user', 'doctor', 'admin'),
                defaultValue: 'user',
            },
            passwordHash: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            showConfidential: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            showPosts: {
                type: Sequelize.BOOLEAN,
                defaultValue: false,
            },
            avatarUrl: {
                type: Sequelize.STRING,
                defaultValue: 'serverFiles/users/guest/ava.png',
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
        await queryInterface.dropTable('UserProfile');
    }
};
