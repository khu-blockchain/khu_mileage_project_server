module.exports = (sequelize, DataTypes) => {
    const schema = {
        admin_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        salt: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        wallet_address: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.TINYINT(1), 
            defaultValue : 2,
            allowNull: false,
        },
        // created_at: {
        //     type: DataTypes.DATE,
        //     allowNull: false,
        // },
        // updated_at: {
        //     type: DataTypes.DATE,
        //     allowNull: false,
        // },
    };

    const modelOptions = {
        tableName: 'admin',
        indexes: [
            {
                unique: true,
                fields: ['id'],
            },
        ]
    };

    return sequelize.define('Admin', schema, modelOptions);
};
