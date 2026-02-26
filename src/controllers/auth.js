const { StatusCodes } = require("http-status-codes");
const UserService = require("../services/auth");
const { MSG } = require("../utils/message");
const { errorResponse, successResponse } = require("../utils/responseFormat");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");
const { uploadCloudinaryBuffer } = require("../utils/cloudinaryHelper");

const userService = new UserService();

module.exports.registerUser = async (req, res) => {
  try {
    const { email, user_name, phone_no } = req.body;

    const emailExist = await userService.findByEmail(email);
    if (emailExist) {
      return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: MSG.USER_ERROR.EMAIL_EXISTS,
      });
    }

    const usernameExist = await userService.findByUsername(user_name);
    if (usernameExist) {
      return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: MSG.USER_ERROR.USERNAME_EXISTS,
      });
    }

    const phoneExist = await userService.findByPhone(phone_no);
    if (phoneExist) {
      return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: MSG.USER_ERROR.PHONE_EXISTS,
      });
    }

    let profile_image = req.body.profile_image;

    if (req.file) {
      const uploadResult = await uploadCloudinaryBuffer(req.file.buffer);
      profile_image = uploadResult.secure_url;
    }

    const userData = { ...req.body, profile_image };
    const newUser = await userService.registerUser(userData);

    const userResponse = newUser.toJSON();
    delete userResponse.password;

    return successResponse({
      res,
      statusCode: StatusCodes.CREATED,
      message: MSG.USER.CREATED,
      data: userResponse,
    });
  } catch (error) {
    if (error.name === "SequelizeValidationError") {
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

module.exports.loginUser = async (req, res) => {
  try {
    const { email, user_name, phone_no, password } = req.body;

    if (!password || (!email && !user_name && !phone_no)) {
      return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: MSG.REQUEST.MISSING_FIELDS,
      });
    }

    const identifier = email || user_name || phone_no;

    const user = await userService.findByLoginField(identifier);

    if (!user) {
      return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: MSG.AUTH.LOGIN_FAILED,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: MSG.USER_ERROR.PASSWORD_MISMATCH,
      });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return successResponse({
      res,
      statusCode: StatusCodes.OK,
      message: MSG.AUTH.LOGIN_SUCCESS,
      data: { token },
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
