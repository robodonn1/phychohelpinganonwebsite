'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {

        const doctors = await queryInterface.sequelize.query(
            `SELECT userId FROM "DoctorConfidential" WHERE workEmail = 'catokeit@mail.ru' LIMIT 1;`,
            { type: Sequelize.QueryTypes.SELECT }
        );

        if (doctors.length === 0) {
            throw new Error('Admin user not found. Run UserProfiles seed first.');
        }

        const doctorId = doctors[0].userId;

        const issued = await queryInterface.sequelize.query(
            `SELECT id FROM "Issuer" WHERE ogrn = '315774600100138' LIMIT 1;`,
            { type: Sequelize.QueryTypes.SELECT }
        );

        if (issued.length === 0) {
            throw new Error('Admin user not found. Run UserProfiles seed first.');
        }

        const issuedId = issued[0].id;

        await queryInterface.bulkInsert('License', [{
            doctorId,
            issuedId,
            series: "0016489",
            registerNumber: "ЛО-77-01-013270",
            registerDate: "2026-03-11",
            expiryDate: "2026-03-11",
            verificationStatus: 'verified',
            verifiedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        }], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('License', null, {});
    }
};
