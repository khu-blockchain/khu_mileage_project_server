module.exports = (sequelize, DataTypes) => {
    const schema = {
        student_id: {
            type: DataTypes.STRING,
            primaryKey: true,
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
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        phone_number: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        department: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        // kaikas wallet address
        wallet_address: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // 은행 계좌 번호
        bank_account_number: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // 은행 코드
        bank_code: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // 개인정보 동의 여부
        personal_information_consent_status: {
            type: DataTypes.TINYINT(1),
            allowNull: false,
            defaultValue: 0,
        },
        personal_information_consent_date: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW,
        },
        is_confirmed: { //회원가입 이후 폴링 서버를 통해 회원가입 체인 등록 성공 여부 조회.
            type: DataTypes.TINYINT(1),
            allowNull: false,
            defaultValue: 0,
        },
        student_hash: { // raw transaction && tx 전송 후 tx hash
            type: DataTypes.STRING,
            allowNull: false,
        },
    };

    const modelOptions = {
        tableName: 'student',
        indexes: []
    };

    return sequelize.define('Student', schema, modelOptions);
};
