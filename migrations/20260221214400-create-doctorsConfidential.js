'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('DoctorConfidential', {
            userId: {
                type: Sequelize.UUID,
                primaryKey: true,
                references: {
                    model: 'UserProfile',
                    key: 'id',
                },
                onDelete: "CASCADE",
            },
            specializationId: {
                type: Sequelize.INTEGER,
                references: {
                    model: 'Specialization',
                    key: 'id',
                }
            },
            experience: {
                type: Sequelize.INTEGER,
            },
            workEmail: {
                type: Sequelize.STRING,
            },
            workPhone: {
                type: Sequelize.STRING,
            },
            officeAddress: {
                type: Sequelize.STRING,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            }
        }, {
            indexes: {
                unique: true,
                fields: ['specializationId']
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('DoctorConfidential');
    }
};
