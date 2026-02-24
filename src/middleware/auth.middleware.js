const { StatusCodes } = require("http-status-codes");
const { errorResponse } = require("../utils/responseFormat");
const { MSG } = require("../utils/message");
const jwt = require("jsonwebtoken");
const UserService = require("../services/user.service");

const userService = new UserService();

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json(errorResponse(StatusCodes.UNAUTHORIZED, true, MSG.TOKEN_MISSING));
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await userService.fetchSingleUser(decoded.id);

    req.user = user;

    next();
  } catch (error) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json(errorResponse(StatusCodes.UNAUTHORIZED, true, MSG.TOKEN_INVALID));
  }
};

module.exports = authMiddleware;
