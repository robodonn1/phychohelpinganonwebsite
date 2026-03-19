'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('PostCategory', [{
            name: 'Эмоциональные состояния и настроение',
            linkName: 'emotional',
            type: "help",
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Страхи и тревожные расстройства',
            linkName: 'anxiety',
            type: "help",
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Отношения с людьми',
            linkName: 'socialization',
            type: "help",
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Детско-родительские отношения и воспитание',
            linkName: 'relationship',
            type: "help",
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Личностные особенности и самопознание',
            linkName: 'personality',
            type: "help",
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Травма, насилие и кризисные ситуации',
            linkName: 'crisis',
            type: "help",
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Зависимости и нехимические аддикции',
            linkName: 'addiction',
            type: "help",
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Проблемы с питанием и телом',
            linkName: 'nutrition',
            type: "help",
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Серьезные психические расстройства',
            linkName: 'disorders',
            type: "help",
            createdAt: new Date(),
            updatedAt: new Date(),
        }, {
            name: 'Работа и самореализация',
            linkName: 'self-realization',
            type: "help",
            createdAt: new Date(),
            updatedAt: new Date(),
        },], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('PostCategory', null, {});
    }
};
