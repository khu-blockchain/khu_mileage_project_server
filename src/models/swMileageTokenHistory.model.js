module.exports = (sequelize, DataTypes) => {
    const schema = {
        sw_mileage_token_history_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        sw_mileage_token_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: { // "1: create, 2: 완료, 0: 실패",
            type: DataTypes.TINYINT(1),
            allowNull: false,
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        transaction_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        admin_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        admin_address: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        student_address: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        student_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        transaction_hash: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        comment: {
            type: DataTypes.STRING,
            allowNull: true,
        }
    };

    const modelOptions = {
        tableName: 'sw_mileage_token_history',
        indexes: []
    };

    return sequelize.define('SwMileageTokenHistory', schema, modelOptions);
};
