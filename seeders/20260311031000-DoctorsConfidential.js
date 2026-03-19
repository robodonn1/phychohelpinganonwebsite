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

        const specializations = await queryInterface.sequelize.query(
            `SELECT id FROM "Specialization" WHERE name = 'Педагог-психолог' LIMIT 1;`,
            { type: Sequelize.QueryTypes.SELECT }
        );

        if (specializations.length === 0) {
            throw new Error('Admin user not found. Run UserProfiles seed first.');
        }

        const specializationId = specializations[0].id;

        await queryInterface.bulkInsert('DoctorConfidential', [{
            userId: doctorId,
            specializationId: specializationId,
            experience: 5,
            workEmail: "catokeit@mail.ru",
            workPhone: "+79586703129",
            officeAddress: "Россия, Оренбургская обл., г. Оренбург, ул. Чкалова, д. 11",
            createdAt: new Date(),
            updatedAt: new Date()
        }], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('DoctorConfidential', null, {});
    }
};
