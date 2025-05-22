module.exports = (sequelize, DataTypes) => {
    const schema = {
        sw_mileage_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        student_id: { // 학번
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.TINYINT(1),
            allowNull: false,
        },
        name: { // 이름
            type: DataTypes.STRING,
            allowNull: false,
        },
        department: { // 학과
            type: DataTypes.STRING,
            allowNull: false,
        },
        phone_number: { // 연락처
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: { // 이메일
            type: DataTypes.STRING,
            allowNull: false,
        },
        wallet_address: { // 지갑주소
            type: DataTypes.STRING,
            allowNull: false,
        },
        content: { // 활동 내용
            type: DataTypes.TEXT,
            allowNull: false,
        },
        academic_field: { // 학술 분야
            type: DataTypes.STRING,
            allowNull: false,
        },
        extracurricular_activity: { // 비교과활동 구분
            type: DataTypes.STRING,
            allowNull: false,
        },
        extracurricular_activity_classification: { // 비교과활동 구분 선택
            type: DataTypes.STRING,
            allowNull: true,
        },
        comment: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        transaction_hash: { // raw transaction && tx 전송 후 tx hash
            type: DataTypes.TEXT,
            allowNull: false,
        },
        docs_index: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        is_activate: { //폴링 서버를 통해 확정 체인 등록 여부 조회.
            type: DataTypes.TINYINT(1),
            allowNull: false,
            defaultValue: 2,
        }
    };

    const modelOptions = {
        tableName: 'sw_mileage',
        indexes: []
    };

    return sequelize.define('SwMileage', schema, modelOptions);
};
