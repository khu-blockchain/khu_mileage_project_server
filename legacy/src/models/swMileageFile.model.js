module.exports = (sequelize, DataTypes) => {
    const schema = {
        sw_mileage_file_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        sw_mileage_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        url: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    };

    const modelOptions = {
        tableName: 'sw_mileage_file',
        indexes: []
    };

    return sequelize.define('SwMileageFile', schema, modelOptions);
};
