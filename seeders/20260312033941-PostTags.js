'use strict';

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

        const posts = await queryInterface.sequelize.query(
            `SELECT id FROM "Post" WHERE userId = '${userId}' LIMIT 1;`,
            { type: Sequelize.QueryTypes.SELECT }
        );

        if (posts.length === 0) {
            throw new Error('Admin user not found. Run UserProfiles seed first.');
        }

        const postId = posts[0].id;

        await queryInterface.bulkInsert('PostTag', [
            { postId, tagId: 9 },
            { postId, tagId: 13 },
            { postId, tagId: 17 },
            { postId, tagId: 25 },
            { postId, tagId: 52 },
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('PostTag', null, {});
    }
};
