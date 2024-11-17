const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

// Путь к старой и новой базе данных
const DATA_DIR = path.join(__dirname, '../data');
const OLD_DB_PATH = path.join(DATA_DIR, 'database.sqlite');
const BACKUP_DB_PATH = path.join(DATA_DIR, 'database_backup.sqlite');
const NEW_DB_PATH = path.join(DATA_DIR, 'database_new.sqlite');

// Создаем директорию data, если она не существует
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
    console.log('Created data directory:', DATA_DIR);
}

// Проверяем существование базы данных
if (!fs.existsSync(OLD_DB_PATH)) {
    console.error('Error: Original database file not found:', OLD_DB_PATH);
    console.error('Please run the server first to create the database.');
    process.exit(1);
}

// Создаем резервную копию базы данных
fs.copyFileSync(OLD_DB_PATH, BACKUP_DB_PATH);
console.log('Backup created:', BACKUP_DB_PATH);

// Подключаемся к старой базе данных
const oldDb = new Sequelize({
    dialect: 'sqlite',
    storage: BACKUP_DB_PATH,
    logging: false
});

// Подключаемся к новой базе данных
const newDb = new Sequelize({
    dialect: 'sqlite',
    storage: NEW_DB_PATH,
    logging: false
});

// Определяем модели для старой базы данных
const OldUser = oldDb.define('User', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: Sequelize.STRING,
    password: Sequelize.STRING,
    role: Sequelize.STRING,
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    middleName: Sequelize.STRING,
    gender: Sequelize.STRING,
    dailyWaterGoal: Sequelize.INTEGER,
    createdAt: Sequelize.DATE,
    updatedAt: Sequelize.DATE
}, { 
    timestamps: true,
    tableName: 'Users'
});

const OldWater = oldDb.define('WaterIntake', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    UserId: Sequelize.INTEGER,
    amount: Sequelize.INTEGER,
    date: Sequelize.DATEONLY,
    time: Sequelize.TIME,
    createdAt: Sequelize.DATE,
    updatedAt: Sequelize.DATE
}, { 
    timestamps: true,
    tableName: 'WaterIntakes'
});

// Определяем модели для новой базы данных
const NewUser = newDb.define('User', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    },
    firstName: {
        type: Sequelize.STRING,
        allowNull: false
    },
    lastName: {
        type: Sequelize.STRING,
        allowNull: false
    },
    middleName: {
        type: Sequelize.STRING,
        allowNull: true
    },
    gender: {
        type: Sequelize.ENUM('male', 'female'),
        allowNull: false
    },
    dailyWaterGoal: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 2000
    },
    role: {
        type: Sequelize.ENUM('user', 'admin'),
        allowNull: false,
        defaultValue: 'user'
    }
}, { 
    timestamps: true,
    tableName: 'Users'
});

const NewWater = newDb.define('WaterIntake', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    UserId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    amount: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    date: {
        type: Sequelize.DATEONLY,
        allowNull: false
    },
    time: {
        type: Sequelize.TIME,
        allowNull: false
    }
}, { 
    timestamps: true,
    tableName: 'WaterIntakes'
});

async function migrateData() {
    try {
        // Синхронизируем новую базу данных
        await newDb.sync({ force: true });
        console.log('New database structure created');

        // Получаем всех пользователей из старой базы
        const oldUsers = await OldUser.findAll();
        console.log(`Found ${oldUsers.length} users in old database`);

        // Мигрируем пользователей
        for (const oldUser of oldUsers) {
            const userData = {
                id: oldUser.id,
                username: oldUser.username,
                email: `${oldUser.username}@example.com`, // Временный email
                password: oldUser.password,
                firstName: oldUser.firstName,
                lastName: oldUser.lastName,
                middleName: oldUser.middleName,
                gender: oldUser.gender,
                dailyWaterGoal: oldUser.dailyWaterGoal,
                role: oldUser.role || 'user',
                createdAt: oldUser.createdAt,
                updatedAt: oldUser.updatedAt
            };
            await NewUser.create(userData);
        }
        console.log('Users migrated successfully');

        // Получаем все записи о воде из старой базы
        const oldWaterRecords = await OldWater.findAll();
        console.log(`Found ${oldWaterRecords.length} water records in old database`);

        // Мигрируем записи о воде
        for (const oldRecord of oldWaterRecords) {
            const waterData = {
                id: oldRecord.id,
                UserId: oldRecord.UserId,
                amount: oldRecord.amount,
                date: oldRecord.date,
                time: oldRecord.time,
                createdAt: oldRecord.createdAt,
                updatedAt: oldRecord.updatedAt
            };
            await NewWater.create(waterData);
        }
        console.log('Water records migrated successfully');

        // Заменяем старую базу данных новой
        if (fs.existsSync(OLD_DB_PATH)) {
            try {
                fs.unlinkSync(OLD_DB_PATH);
            } catch (err) {
                if (err.code === 'EBUSY') {
                    console.error('Database is locked. Please stop the server before running migration.');
                    process.exit(1);
                }
                throw err;
            }
        }
        fs.renameSync(NEW_DB_PATH, OLD_DB_PATH);
        console.log('Database migration completed successfully');

    } catch (error) {
        console.error('Migration error:', error);
        // В случае ошибки восстанавливаем из резервной копии
        if (fs.existsSync(OLD_DB_PATH)) {
            try {
                fs.unlinkSync(OLD_DB_PATH);
            } catch (err) {
                if (err.code !== 'ENOENT') throw err;
            }
        }
        fs.copyFileSync(BACKUP_DB_PATH, OLD_DB_PATH);
        console.log('Restored from backup due to error');
        throw error;
    }
}

// Запускаем миграцию
migrateData()
    .then(() => {
        console.log('Migration completed successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
