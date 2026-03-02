const { DataTypes, Model } = require("sequelize");
const bcrypt = require("bcrypt");
const { sequelize } = require("../config/database");

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      unique: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    user_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone_no: {
      type: DataTypes.CHAR(10),
      allowNull: false,
      unique: true,
    },
    gender: {
      type: DataTypes.ENUM("male", "female", "other"),
      allowNull: false,
    },
    about: {
      type: DataTypes.TEXT,
    },
    profile_image: {
      type: DataTypes.STRING,
    },
    is_Active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    reset_password_otp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    reset_password_otp_expiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    attempt: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    attempt_expire: {
      type: DataTypes.DATE,
      defaultValue: null,
      allowNull: true,
    },
    verify_attempt: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    verify_attempt_expire: {
      type: DataTypes.DATE,
      defaultValue: null,
      allowNull: true,
    },
    resend_otp_attempt: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    resend_otp_attempt_expire: {
      type: DataTypes.DATE,
      defaultValue: null,
      allowNull: true,
    },
    last_otp_sent_at: {
      type: DataTypes.DATE,
      defaultValue: null,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "User",
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        user.password = await bcrypt.hash(user.password, 10);
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
    },
  },
);

module.exports = User;
