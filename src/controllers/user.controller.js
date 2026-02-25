const { StatusCodes } = require("http-status-codes");
const { MSG } = require("../utils/message");
const { errorResponse, successResponse } = require("../utils/responseFormat");
const User = require("../models/user.model");

const getUserId = (req) => {
  if (req.user && req.user.id) return req.user.id;

  return 1;
};

module.exports.getProfile = async (req, res) => {
  try {
    const userId = getUserId(req);
    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return errorResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        message: "User not found",
      });
    }

    return successResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Profile retrieved successfully",
      data: user,
    });
  } catch (error) {
    return errorResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: MSG.SERVER.INTERNAL_ERROR,
      error: error.message,
    });
  }
};

module.exports.updateProfile = async (req, res) => {
  try {
    const userId = getUserId(req);
    const {
      name,
      email,
      phone_no,
      password,
      user_name,
      gender,
      about,
      profile_image,
    } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return errorResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        message: "User not found",
      });
    }

    const updatedData = {};
    if (name) updatedData.name = name;
    if (email) updatedData.email = email;
    if (phone_no) updatedData.phone_no = phone_no;
    if (password) updatedData.password = password;
    if (user_name) updatedData.user_name = user_name;
    if (gender) updatedData.gender = gender;
    if (about) updatedData.about = about;
    if (profile_image) updatedData.profile_image = profile_image;

    await user.update(updatedData);

    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    return successResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "Validation Error",
        error: error.errors[0].message,
      });
    }
    return errorResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: MSG.SERVER.INTERNAL_ERROR,
      error: error.message,
    });
  }
};

module.exports.deleteProfile = async (req, res) => {
  try {
    const userId = getUserId(req);
    const user = await User.findByPk(userId);

    if (!user) {
      return errorResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        message: "User not found",
      });
    }

    await user.destroy();

    return successResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Profile deleted successfully",
    });
  } catch (error) {
    return errorResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: MSG.SERVER.INTERNAL_ERROR,
      error: error.message,
    });
  }
};

module.exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
    });

    return successResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Users retrieved successfully",
      data: users,
    });
  } catch (error) {
    return errorResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: MSG.SERVER.INTERNAL_ERROR,
      error: error.message,
    });
  }
};

module.exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return errorResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        message: "User not found",
      });
    }

    return successResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "User retrieved successfully",
      data: user,
    });
  } catch (error) {
    return errorResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: MSG.SERVER.INTERNAL_ERROR,
      error: error.message,
    });
  }
};
