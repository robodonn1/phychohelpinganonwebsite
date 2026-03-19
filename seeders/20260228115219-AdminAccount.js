'use strict';

const crypto = require('crypto');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('UserProfile', [
            {
                id: crypto.randomUUID(),
                email: 'Admin@gmail.com',
                nickname: "Administrator",
                role: "admin",
                passwordHash: "$2b$10$HVFAMKBQtnwjKYoxQiX.He.1.rRuk8lGaIeWIdelBddK.5dwI3.8m",//AdminPassword1!
                showConfidential: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: crypto.randomUUID(),
                email: 'TestDoctor@gmail.com',
                nickname: 'PsychoDoctor',
                role: "doctor",
                passwordHash: "$2b$10$2T9ykHyzuniHQHykMfXRde3oU1FZOodfwZBQlkS/I/jto6KTpL136",//DoctorPassword1!
                showConfidential: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: crypto.randomUUID(),
                email: 'TestUser@gmail.com',
                nickname: 'PcychoUser',
                role: 'user',
                passwordHash: "$2b$10$Jmszfs0Lk8/0qiwuZV/cEeu.TOqzqtB6UwureLZvsqbMuqjwL3W3m",//UserPassword1!
                showConfidential: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        ]);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('UserProfile', null, {});
    }
};
