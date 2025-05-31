module.exports = (sequelize, DataTypes) => {
    const schema = {
        sw_mileage_token_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        sw_mileage_token_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        contract_address: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        sw_mileage_token_symbol: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        sw_mileage_token_decimals: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        sw_mileage_token_image_url: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        contract_owner_address: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        last_block: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        transaction_hash: { // raw transaction && tx 전송 후 tx hash
            type: DataTypes.TEXT,
            allowNull: true,
        },
        is_activate: { // 트랜잭션 확정 여부
            type: DataTypes.TINYINT(1),
            allowNull: false,
            defaultValue: 0, 
        },
        // is_paused: {
        //     type: DataTypes.TINYINT(1),
        //     allowNull: true, 
        // },
        // is_activated: { // 2024년도에 사용한 토큰있는 상황에서 2025년에 새로운 2025년 토큰을 등록하고 2025년의 토큰을 사용가능하게 하고 2024년의 토큰은 비활성화 하게 하는 코드
        //     type: DataTypes.TINYINT(1),
        //     allowNull: true, 
        // }
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
        tableName: 'sw_mileage_token',
        indexes: []
    };

    return sequelize.define('SwMileageToken', schema, modelOptions);
};
