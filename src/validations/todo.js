const { StatusCodes } = require("http-status-codes");
const { MSG } = require("../utils/message");
const { errorResponse } = require("../utils/responseFormat");

const validateCreateTodo = (req, res, next) => {
    const { title, description } = req.body || {};

    if (!title) {
        return errorResponse({
            res,
            statusCode: StatusCodes.BAD_REQUEST,
            message: MSG.REQUEST.MISSING_TITLE,
        });
    }
    if (!description) {
        return errorResponse({
            res,
            statusCode: StatusCodes.BAD_REQUEST,
            message: MSG.REQUEST.MISSING_DESCRIPTION,
        });
    }

    next();
};

const validateUpdateTodo = (req, res, next) => {
    const { status, priority } = req.body || {};

    if (status && !["pending", "in-progress", "completed"].includes(status)) {
        return errorResponse({
            res,
            statusCode: StatusCodes.BAD_REQUEST,
            message: MSG.TODO_ERROR.INVALID_STATUS,
            error: "Status must be pending, in-progress, or completed",
        });
    }

    if (priority && !["low", "medium", "high"].includes(priority)) {
        return errorResponse({
            res,
            statusCode: StatusCodes.BAD_REQUEST,
            message: MSG.TODO_ERROR.INVALID_PRIORITY,
            error: "Priority must be low, medium, or high",
        });
    }

    next();
};

module.exports = {
    validateCreateTodo,
    validateUpdateTodo,
};
