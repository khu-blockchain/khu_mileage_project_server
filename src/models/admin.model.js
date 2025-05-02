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
