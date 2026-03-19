'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('Issuer', [
            {
                name: 'ИП Мойсеенко Юлия Владимировна',
                ogrn: '315774600100138',
                inn: "772970117845",
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                name: 'ООО /"Экологическая экспертиза/"',
                ogrn: '1177746441443',
                inn: "9701073973",
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('Issuer', null, {});
    }
};
