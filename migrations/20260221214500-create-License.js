'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('License', {
            doctorId: {
                type: Sequelize.UUID,
                primaryKey: true,
                references: {
                    model: 'DoctorConfidential',
                    key: 'userId',
                },
            },
            issuedId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'Issuer',
                    key: 'id',
                },
                onDelete: 'CASCADE'
            },
            series: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            registerNumber: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            registerDate: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            expiryDate: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            verificationStatus: {
                type: Sequelize.ENUM('pending', 'verified', 'rejected'),
                defaultValue: 'pending',
            },
            verifiedAt: {
                type: Sequelize.DATE,
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
                fields: ['issuerId'],
            },
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('License');
    }
};
