module.exports = (sequelize, DataTypes) => {
    const schema = {
        jwt_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        token: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        token_type: {
            type: DataTypes.TINYINT(1),
            allowNull: false,
        },
        expiration_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        status: {
            type: DataTypes.TINYINT(1),
            allowNull: false,
        },
    };

    const modelOptions = {
        tableName: 'jwt',
        indexes: []
    };

    return sequelize.define('Jwt', schema, modelOptions);
};
