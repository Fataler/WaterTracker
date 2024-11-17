const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            len: [3, 30],
            notEmpty: true
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
            notEmpty: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [2, 50],
            notEmpty: true
        }
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [2, 50],
            notEmpty: true
        }
    },
    middleName: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            len: {
                args: [2, 50],
                msg: "Middle name must be between 2 and 50 characters long"
            }
        }
    },
    gender: {
        type: DataTypes.ENUM('male', 'female'),
        allowNull: false
    },
    dailyWaterGoal: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2000,
        validate: {
            min: 0
        }
    },
    role: {
        type: DataTypes.ENUM('user', 'admin'),
        allowNull: false,
        defaultValue: 'user'
    }
});

module.exports = User;
