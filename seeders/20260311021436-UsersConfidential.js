'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {

        const doctors = await queryInterface.sequelize.query(
            `SELECT id FROM "UserProfile" WHERE email = 'TestDoctor@gmail.com' LIMIT 1;`,
            { type: Sequelize.QueryTypes.SELECT }
        );

        if (doctors.length === 0) {
            throw new Error('Admin user not found. Run UserProfiles seed first.');
        }

        const doctorId = doctors[0].id;

        const users = await queryInterface.sequelize.query(
            `SELECT id FROM "UserProfile" WHERE email = 'TestUser@gmail.com' LIMIT 1;`,
            { type: Sequelize.QueryTypes.SELECT }
        );

        if (users.length === 0) {
            throw new Error('Admin user not found. Run UserProfiles seed first.');
        }

        const userId = users[0].id;

        await queryInterface.bulkInsert('UserConfidential', [{
            userId: doctorId,
            fullName: "Супер Крутой Доктор",
            birthdate: '1995-10-10',
            profileDescription: "А эм здраствуйте, я эт самое, могу вас вылечить, так что можете писать да, вот так.",
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            userId,
            fullName: "Пользователь Пользователь Пользователь",
            birthdate: "2007-12-01",
            profileDescription: "Я пользователь",
            createdAt: new Date(),
            updatedAt: new Date(),
        }]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('UserConfidential', null, {});
    },
}
