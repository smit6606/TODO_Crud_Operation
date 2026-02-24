const User = require("../models/user.model");

module.exports = class UserService {
  async registerUser(body) {
    return await User.create(body);
  }

  async fetchAllUsers() {
    return await User.find({ isActive: true }).select("-password");
  }

  async fetchSingleUser(userId) {
    return await User.findOne({ _id: userId, isActive: true }).select(
      "-password",
    );
  }

  async updateUser(userId, body) {
    return await User.findOneAndUpdate({ _id: userId, isActive: true }, body, {
      new: true,
      runValidators: true,
    }).select("-password");
  }

  async deleteUser(userId) {
    return await User.findOneAndUpdate(
      { _id: userId },
      { isActive: false },
      { new: true },
    );
  }
};
