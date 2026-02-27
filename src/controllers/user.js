const { StatusCodes } = require("http-status-codes");
const { MSG } = require("../utils/message");
const { errorResponse, successResponse } = require("../utils/responseFormat");
const UserService = require("../services/auth");
const TodoService = require("../services/todo");
const cloudinary = require("../config/cloudinary");
const { deleteCloudinaryImage, uploadCloudinaryBuffer } = require("../utils/cloudinaryHelper");

const userService = new UserService();
const todoService = new TodoService();

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

    const allowedFields = ["name", "email", "phone_no", "password", "user_name", "gender", "about"];
    const updatedData = {};
    allowedFields.forEach((field) => {
      if (req.body[field]) updatedData[field] = req.body[field];
    });

    if (req.file) {
      if (user.profile_image) {
        await deleteCloudinaryImage(user.profile_image);
      }

      const uploadResult = await uploadCloudinaryBuffer(req.file.buffer);
      updatedData.profile_image = uploadResult.secure_url;
    } else if (profile_image) {
      updatedData.profile_image = profile_image;
    }

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

    const incompleteCount = await todoService.countIncompleteTodos(user.id);
    if (incompleteCount > 0) {
      return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: MSG.USER_ERROR.INCOMPLETE_TASKS,
      });
    }

    if (user.profile_image) {
      await deleteCloudinaryImage(user.profile_image);
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

module.exports.getUsersWithCompletedTodos = async (req, res) => {
  try {
    // Logic: A user has completed all tasks if they have >0 tasks AND their incomplete task count is 0
    const users = await userService.findAllUsers();

    // We filter sequentially here since we already have robust service logic 
    // counting incomplete todos safely handling the 'isDeleted: false' properties cleanly.

    const completedUsers = [];

    for (let user of users) {
      // Find all valid tasks they own 
      const totalTodos = await todoService.findTodosByUser(user.id);

      // If they actually have tasks
      if (totalTodos.length > 0) {
        // Find if they have incomplete ones
        const incompleteCount = await todoService.countIncompleteTodos(user.id);

        // If incomplete is exactly 0, they belong in our requested filtered array
        if (incompleteCount === 0) {
          completedUsers.push(user);
        }
      }
    }

    return successResponse({
      res,
      statusCode: StatusCodes.OK,
      message: MSG.USER.FETCHED_ALL, // Could specify a unique message but this resolves to generic array fetches safely
      data: completedUsers,
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
