const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../data/database.sqlite'),
    logging: process.env.NODE_ENV === 'development',
    define: {
        timestamps: true,
        underscored: false, 
        underscoredAll: false, 
        createdAt: 'createdAt',
        updatedAt: 'updatedAt'
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

module.exports = sequelize;
