const { StatusCodes } = require("http-status-codes");
const { MSG } = require("../utils/message");
const { errorResponse, successResponse } = require("../utils/responseFormat");
const UserService = require("../services/auth");

const userService = new UserService();

const getUserId = (req) => {
  if (req.user && req.user.id) return req.user.id;

  return 1;
};

module.exports.getProfile = async (req, res) => {
  try {
    const userId = getUserId(req);
    const user = await userService.findByIdWithoutPassword(userId);

    if (!user) {
      return errorResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        message: MSG.USER_ERROR.NOT_FOUND,
      });
    }

    return successResponse({
      res,
      statusCode: StatusCodes.OK,
      message: MSG.USER.PROFILE_FETCHED,
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
    const loggedInUserId = getUserId(req);
    const requestedUserId = req.params.id || loggedInUserId;

    const {
      name,
      email,
      phone_no,
      password,
      user_name,
      gender,
      about,
      profile_image,
      id,
      is_active,
    } = req.body;

    // Restrict `id` and `is_active` updates
    if (id !== undefined || is_active !== undefined) {
      return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: MSG.USER_ERROR.RESTRICTED_FIELDS,
      });
    }

    const user = await userService.findById(requestedUserId);

    if (!user) {
      return errorResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        message: MSG.USER_ERROR.NOT_FOUND,
      });
    }

    if (String(user.id) !== String(loggedInUserId)) {
      return errorResponse({
        res,
        statusCode: StatusCodes.FORBIDDEN,
        message: MSG.ACCESS.UNAUTHORIZED_UPDATE,
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

    const updatedUser = await userService.updateUser(user, updatedData);

    return successResponse({
      res,
      statusCode: StatusCodes.OK,
      message: MSG.USER.PROFILE_UPDATED,
      data: updatedUser,
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: MSG.USER_ERROR.VALIDATION_FAILED,
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
    const loggedInUserId = getUserId(req);
    const requestedUserId = req.params.id || loggedInUserId;

    const user = await userService.findById(requestedUserId);

    if (!user) {
      return errorResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        message: MSG.USER_ERROR.NOT_FOUND,
      });
    }

    if (String(user.id) !== String(loggedInUserId)) {
      return errorResponse({
        res,
        statusCode: StatusCodes.FORBIDDEN,
        message: MSG.ACCESS.UNAUTHORIZED_DELETE,
      });
    }

    await userService.deleteUser(user);

    return successResponse({
      res,
      statusCode: StatusCodes.OK,
      message: MSG.USER.PROFILE_DELETED,
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
    const users = await userService.findAllUsers();

    return successResponse({
      res,
      statusCode: StatusCodes.OK,
      message: MSG.USER.FETCHED_ALL,
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
    const user = await userService.findByIdWithoutPassword(userId);

    if (!user) {
      return errorResponse({
        res,
        statusCode: StatusCodes.NOT_FOUND,
        message: MSG.USER_ERROR.NOT_FOUND,
      });
    }

    return successResponse({
      res,
      statusCode: StatusCodes.OK,
      message: MSG.USER.FETCHED,
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
