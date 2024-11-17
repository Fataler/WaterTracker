const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const WaterIntake = sequelize.define('WaterIntake', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 0
        }
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    time: {
        type: DataTypes.TIME,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    timestamps: true,
    tableName: 'WaterIntakes',
    hooks: {
        beforeSave: (instance) => {
            // Убедимся, что amount является числом
            if (typeof instance.amount === 'string') {
                instance.amount = parseInt(instance.amount, 10);
            }

            // Форматируем дату, если она передана как строка
            if (typeof instance.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(instance.date)) {
                instance.date = instance.date;
            } else if (instance.date instanceof Date) {
                instance.date = instance.date.toISOString().split('T')[0];
            }

            // Форматируем время, если оно передано как строка
            if (typeof instance.time === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(instance.time)) {
                instance.time = instance.time;
            } else if (instance.time instanceof Date) {
                instance.time = instance.time.toTimeString().split(' ')[0];
            }
        }
    }
});

// Определяем отношения
WaterIntake.belongsTo(User);
User.hasMany(WaterIntake);

module.exports = WaterIntake;
