'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('Specialization', [{
            name: 'Клинический психолог',
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Нейропсихолог',
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Патопсихолог',
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Психосоматолог',
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Психиатр',
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Психотерапевт',
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Детский психолог',
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Подростковый психолог',
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Перинатальный психолог',
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Семейный психолог',
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Геронтопсихолог',
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Кризисный психолог',
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Организационный психолог',
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Спортивный психолог',
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Эргономист',
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Социальный психолог',
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Юридический психолог',
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Медиатор',
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Педагог-психолог',
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Психолог-дефектолог',
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Тифлопсихолог',
            createdAt: new Date(),
            updatedAt: new Date(),
        },], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('Specialization', null, {});
    }
};
