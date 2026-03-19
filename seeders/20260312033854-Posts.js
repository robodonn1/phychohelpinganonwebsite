'use strict';

const crypto = require('crypto');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const users = await queryInterface.sequelize.query(
            `SELECT id FROM "UserProfile" WHERE email = 'TestUser@gmail.com' LIMIT 1;`,
            { type: Sequelize.QueryTypes.SELECT }
        );

        if (users.length === 0) {
            throw new Error('Admin user not found. Run UserProfiles seed first.');
        }

        const userId = users[0].id;

        await queryInterface.bulkInsert('Post', [{
            id: crypto.randomUUID(),
            userId,
            guestId: null,
            categoryId: 4,
            title: "Меня бьет папа!",
            text: "Что делать если заставляют убираться на кухне каждый день, под предлогом того что зачем мы вообще тебя рожали.",
            createdAt: new Date(),
            updatedAt: new Date(),
        }], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('Post', null, {});
    }
};
