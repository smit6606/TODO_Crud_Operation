const { StatusCodes } = require("http-status-codes");
const { errorResponse } = require("../utils/responseFormat");
const { MSG } = require("../utils/message");
const jwt = require("jsonwebtoken");
const UserService = require("../services/auth.service");

const userService = new UserService();

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse({
        res,
        statusCode: StatusCodes.UNAUTHORIZED,
        message: MSG.ACCESS.TOKEN_MISSING,
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userService.findById(decoded.id);

    if (!user) {
      return errorResponse({
        res,
        statusCode: StatusCodes.UNAUTHORIZED,
        message: MSG.USER_ERROR.NOT_FOUND,
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return errorResponse({
      res,
      statusCode: StatusCodes.UNAUTHORIZED,
      message: MSG.ACCESS.TOKEN_INVALID,
    });
  }
};

module.exports = authMiddleware;
