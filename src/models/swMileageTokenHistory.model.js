module.exports = (sequelize, DataTypes) => {
  const schema = {
      sw_mileage_token_history_id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
      },
      token_contract_address: {
          type: DataTypes.STRING,
          allowNull: false,
      },
      token_name: {
          type: DataTypes.STRING,
          allowNull: true,
      },
      student_id: {
          type: DataTypes.STRING,
          allowNull: false,
      },
      student_address: {
          type: DataTypes.STRING,
          allowNull: false,
      },
      admin_address: {
          type: DataTypes.STRING,
          allowNull: true,
      },
      amount: {
          type: DataTypes.INTEGER,
          allowNull: false,
      },
      type: {
          type: DataTypes.STRING,
          allowNull: false,
      },
      note: {
          type: DataTypes.STRING,
          allowNull: true,
      },
  };

  const modelOptions = {
      tableName: 'sw_mileage_token_history',
      indexes: []
  };

  return sequelize.define('SwMileageTokenHistory', schema, modelOptions);
};
