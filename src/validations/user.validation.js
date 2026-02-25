const { StatusCodes } = require("http-status-codes");
const { MSG } = require("../utils/message");
const { errorResponse } = require("../utils/responseFormat");

const validateUserFields = (req, res, next) => {
    const { name, email, phone_no, password } = req.body;

    // 1. Validate Name
    if (name) {
        if (name.length < 2 || name.length > 16) {
            return errorResponse({
                res,
                statusCode: StatusCodes.BAD_REQUEST,
                message: "Validation Error",
                error: "Name must be between 2 and 16 characters long",
            });
        }
    }

    // 2. Validate Email
    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return errorResponse({
                res,
                statusCode: StatusCodes.BAD_REQUEST,
                message: "Validation Error",
                error: "Invalid email format",
            });
        }
    }

    // 3. Validate Phone Number
    if (phone_no) {
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(phone_no)) {
            return errorResponse({
                res,
                statusCode: StatusCodes.BAD_REQUEST,
                message: "Validation Error",
                error: "Phone number must be exactly 10 digits",
            });
        }
    }

    // 4. Validate Password
    if (password) {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return errorResponse({
                res,
                statusCode: StatusCodes.BAD_REQUEST,
                message: "Validation Error",
                error: "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character",
            });
        }
    }

    next();
};

const validateRegister = (req, res, next) => {
    const { name, email, phone_no, password, user_name, gender, about, profile_image } = req.body;

    if (!name || !email || !phone_no || !password || !user_name || !gender || !about || !profile_image) {
        return errorResponse({
            res,
            statusCode: StatusCodes.BAD_REQUEST,
            message: MSG.REQUEST.MISSING_FIELDS,
        });
    }

    validateUserFields(req, res, next);
};

const validateUpdate = (req, res, next) => {
    validateUserFields(req, res, next);
};

module.exports = {
    validateRegister,
    validateUpdate,
};
