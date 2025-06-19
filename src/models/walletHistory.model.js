module.exports = (sequelize, DataTypes) => {
  const schema = {
    wallet_history_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    student_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    student_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    target_address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_confirmed: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 0,
    },
  };

  const modelOptions = {
    tableName: "wallet_history",
    indexes: [],
  };

  return sequelize.define("WalletHistory", schema, modelOptions);
};
