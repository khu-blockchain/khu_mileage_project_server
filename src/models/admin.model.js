module.exports = (sequelize, DataTypes) => {
    const schema = {
        admin_id: {
            type: DataTypes.STRING,
            primaryKey: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        // TODO: delete salt
        salt: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        // kaikas wallet address
        wallet_address: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        department : {
            type: DataTypes.STRING,
        },
        email: {
            type: DataTypes.STRING,
        },
        phone_number: {
            type: DataTypes.STRING,
        },
        role: {
            type: DataTypes.TINYINT(1), 
            defaultValue : 2,
            allowNull: false,
        },
        // TODO : department 고려, salt 처리, role root user 필요성 존재 x
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
                fields: ['admin_id'],
            },
        ]
    };

    return sequelize.define('Admin', schema, modelOptions);
};
