'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('PostCategory', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            name: {
                type: Sequelize.STRING,
            },
            linkName: {
                type: Sequelize.STRING,
            },
            type: {
                type: Sequelize.ENUM('advise', 'help'),
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
        await queryInterface.dropTable('PostCategory');
    }
};
