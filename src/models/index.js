const Sequelize = require('sequelize');
const config = require('../config/config');

let sequelize;

sequelize = new Sequelize(config.sequelize.database, config.sequelize.username, config.sequelize.password, {
    host: config.sequelize.host,
    port: config.sequelize.port,
    dialect: config.sequelize.dialect,
    timezone: '+09:00',
    pool: {
        max: 20,
        min: 0,
    },
    logging: false,
    define: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        deletedAt: 'deleted_at',
    }
});

const Admin = require('./admin.model')(sequelize, Sequelize);
const Jwt = require('./jwt.model')(sequelize, Sequelize);
const Student = require('./student.model')(sequelize, Sequelize);
const SwMileage = require('./swMileage.model')(sequelize, Sequelize);
const SwMileageFile = require('./swMileageFile.model')(sequelize, Sequelize);
const SwMileageToken = require('./swMileageToken.model')(sequelize, Sequelize);
const SwMileageTokenHistory = require('./swMileageTokenHistory.model')(sequelize, Sequelize);
const WalletHistory = require('./walletHistory.model')(sequelize, Sequelize);

SwMileage.hasMany(SwMileageFile, {
    as: 'sw_mileage_files',
    foreignKey: 'sw_mileage_id',
    sourceKey: 'sw_mileage_id',
});
SwMileageFile.belongsTo(SwMileage, {
    as: 'sw_mileage',
    foreignKey: 'sw_mileage_id',
    targetKey: 'sw_mileage_id',
});

// SwMileageToken.hasMany(SwMileageTokenHistory, {
//     as: 'sw_mileage_token_histories',
//     foreignKey: 'sw_mileage_token_id',
//     sourceKey: 'sw_mileage_token_id',
// });
// SwMileageTokenHistory.belongsTo(SwMileageToken, {
//     as: 'sw_mileage_token',
//     foreignKey: 'sw_mileage_token_id',
//     targetKey: 'sw_mileage_token_id',
// });

// SwMileage.hasOne(SwMileageTokenHistory, {
//     as: 'token_history',
//     foreignKey: 'sw_mileage_id',
//     sourceKey: 'sw_mileage_id',
// });

// SwMileageTokenHistory.belongsTo(SwMileage, {
//     as: 'sw_mileage',
//     foreignKey: 'sw_mileage_id',
//     targetKey: 'sw_mileage_id',
// });

module.exports = {
    sequelize,
    Admin,
    Jwt,
    Student,
    SwMileage,
    SwMileageFile,
    SwMileageToken,
    SwMileageTokenHistory,
    WalletHistory,
}
