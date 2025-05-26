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
    email: {
      type: DataTypes.STRING,
    },
    role: {
      type: DataTypes.TINYINT(1),
      defaultValue: 2,
      allowNull: false,
    },
    is_activate: {
      //회원가입 이후 폴링 서버를 통해 회원가입 체인 등록 성공 여부 조회.
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 2,
    },
    transaction_hash: { // raw transaction && tx 전송 후 tx hash
        type: DataTypes.TEXT,
        allowNull: true,
    },
  };

  const modelOptions = {
    tableName: "admin",
    indexes: [
      {
        unique: true,
        fields: ["admin_id"],
      },
    ],
  };

  return sequelize.define("Admin", schema, modelOptions);
};
