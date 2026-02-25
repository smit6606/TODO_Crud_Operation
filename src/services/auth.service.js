const { Op } = require("sequelize");
const User = require("../models/user.model");

module.exports = class UserService {
  async registerUser(body) {
    return await User.create(body);
  }

  async findByEmail(email) {
    return await User.findOne({ where: { email } });
  }

  async findByUsername(user_name) {
    return await User.findOne({ where: { user_name } });
  }

  async findByPhone(phone_no) {
    return await User.findOne({ where: { phone_no } });
  }

  async findByLoginField(identifier) {
    return await User.findOne({
      where: {
        [Op.or]: [
          { email: identifier },
          { user_name: identifier },
          { phone_no: identifier },
        ],
      },
    });
  }

  async findById(id) {
    return await User.findByPk(id);
  }
};
