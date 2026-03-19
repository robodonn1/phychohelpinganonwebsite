const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
    storage: "database.sqlite",
    dialect: 'sqlite',
    logging: console.log
});

module.exports = sequelize;