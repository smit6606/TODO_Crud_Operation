const { StatusCodes } = require("http-status-codes");
const UserService = require("../services/auth");
const { MSG } = require("../utils/message");
const { errorResponse, successResponse } = require("../utils/responseFormat");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cloudinary = require("../config/cloudinary");
const { uploadCloudinaryBuffer } = require("../utils/cloudinaryHelper");
const { sendEmail } = require("../utils/email");
const { sendSMS } = require("../utils/sms");
const crypto = require("crypto");

const userService = new UserService();

/**
 * This function registers a new user in the system.
 * It checks if the email, username, or phone number already exists before creating the account.
 * It also handles uploading a profile picture if one is provided.
 */
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

/**
 * This function logs in an existing user.
 * It verifies that the user provided an identifier (email, username, or phone) and a valid password.
 * If successful, it securely returns a token (digital key) so the user can access their account.
 */
module.exports.loginUser = async (req, res) => {
  try {
    const { email, user_name, phone_no, password } = req.body;

    if (!password) {
      return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: MSG.REQUEST.MISSING_PASSWORD,
      });
    }

    if (!email && !user_name && !phone_no) {
      return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: MSG.REQUEST.MISSING_LOGIN_IDENTIFIER,
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

    // Lockout Check
    if (user.attempt >= 3 && user.attempt_expire && new Date() < new Date(user.attempt_expire)) {
      const remainingTime = Math.ceil((new Date(user.attempt_expire).getTime() - new Date().getTime()) / 60000);
      return errorResponse({
        res,
        statusCode: StatusCodes.FORBIDDEN,
        message: `Account is temporarily locked due to too many failed attempts. Please try again in ${remainingTime} minutes.`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      // Increment attempt counter on failure
      const newAttemptCount = (user.attempt || 0) + 1;
      let attemptExpire = user.attempt_expire;

      let msg = MSG.AUTH.LOGIN_FAILED;

      if (newAttemptCount >= 3) {
        attemptExpire = new Date(Date.now() + 60 * 60 * 1000); // Lock for 60 minutes
        msg = "Account is now locked due to 3 failed attempts. Please try again in 1 hour.";
      } else {
        msg = `Invalid credentials. You have ${3 - newAttemptCount} attempts remaining before account gets locked.`;
      }

      await user.update({
        attempt: newAttemptCount,
        attempt_expire: attemptExpire
      });

      return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: msg,
      });
    }

    // Reset attempts on successful login
    if (user.attempt > 0) {
      await user.update({
        attempt: 0,
        attempt_expire: null
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

/**
 * Handles the forgot password request.
 * Expects `identifier` (user_name, email, or phone_no).
 * Expects `sendMethod` ('email' or 'phone') to send the 6-digit OTP. If not provided, it defaults to email (or phone if email is missing).
 */
module.exports.forgotPassword = async (req, res) => {
  try {
    const { identifier, email, user_name, phone_no, sendMethod } = req.body || {};

    // Support legacy individual fields or the new unified `identifier` field
    const lookupId = identifier || email || user_name || phone_no;

    if (!lookupId) {
       return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "An identifier (username, email, or phone number) is required.",
      });
    }

    // Check if a user matches the identifier
    const user = await userService.findByLoginField(lookupId);
    if (!user) {
       return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "Invalid credentials provided. User not found.",
      });
    }

    // 3-Attempt Resend Lockout
    if (user.resend_otp_attempt >= 3 && user.resend_otp_attempt_expire && new Date() < new Date(user.resend_otp_attempt_expire)) {
      const remainingTime = Math.ceil((new Date(user.resend_otp_attempt_expire).getTime() - new Date().getTime()) / 60000);
      return errorResponse({
        res,
        statusCode: StatusCodes.FORBIDDEN,
        message: `You have requested too many OTPs. Please try again in ${remainingTime} minutes.`,
      });
    }

    // Reset attempt count if lockout expired
    if (user.resend_otp_attempt >= 3 && user.resend_otp_attempt_expire && new Date() >= new Date(user.resend_otp_attempt_expire)) {
      user.resend_otp_attempt = 0;
    }

    // 60-second OTP cooldown check
    if (user.last_otp_sent_at && new Date() < new Date(new Date(user.last_otp_sent_at).getTime() + 60 * 1000)) {
       const remainingTime = Math.ceil((new Date(user.last_otp_sent_at).getTime() + 60 * 1000 - new Date().getTime()) / 1000);
       return errorResponse({
         res,
         statusCode: StatusCodes.TOO_MANY_REQUESTS,
         message: `Please wait ${remainingTime} seconds before requesting a new OTP.`,
       });
    }

    // Determine send method (fallback to email if not provided)
    let method = sendMethod;
    if (!method) {
        method = user.email ? 'email' : 'phone';
    }

    if (method !== "email" && method !== "phone") {
      return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "Invalid sendMethod. Must be 'email' or 'phone'.",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    const newResendAttempt = (user.resend_otp_attempt || 0) + 1;
    const resendExpire = newResendAttempt >= 3 ? new Date(Date.now() + 60 * 60 * 1000) : null;

    // Save OTP to user record
    await userService.updateUser(user, {
      reset_password_otp: otp,
      reset_password_otp_expiry: otpExpiry,
      resend_otp_attempt: newResendAttempt,
      resend_otp_attempt_expire: resendExpire,
      last_otp_sent_at: new Date(),
      verify_attempt: 0, // Fresh OTP means fresh verify attempts
      verify_attempt_expire: null
    });

    // Send OTP
    if (method === "email") {
      await sendEmail({
        to: user.email,
        subject: "Your Password Reset OTP",
        text: `Your OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
      });
    } else if (method === "phone") {
      await sendSMS({
        to: user.phone_no,
        body: `Your TaskHub OTP for password reset is: ${otp}. It is valid for 10 minutes.`,
      });
    }

    return successResponse({
      res,
      statusCode: StatusCodes.OK,
      message: `OTP sent successfully via ${method}.`,
    });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    return errorResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: MSG.SERVER.INTERNAL_ERROR,
      error: error.message,
    });
  }
};

/**
 * Verifies the OTP sent to the user.
 * Expects identifier and otp.
 * If valid, returns a short-lived reset token to be used in resetPassword.
 */
module.exports.verifyOtp = async (req, res) => {
  try {
    const { identifier, email, user_name, phone_no, otp } = req.body || {};
    
    // Support legacy or unified lookup
    const lookupId = identifier || email || user_name || phone_no;

    if (!lookupId || !otp) {
       return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "identifier (username, email, or phone) and otp are required.",
      });
    }

    const user = await userService.findByLoginField(lookupId);
    
    if (!user) {
       return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "User not found.",
      });
    }

    if (user.verify_attempt >= 3 && user.verify_attempt_expire && new Date() < new Date(user.verify_attempt_expire)) {
      const remainingTime = Math.ceil((new Date(user.verify_attempt_expire).getTime() - new Date().getTime()) / 60000);
      return errorResponse({
        res,
        statusCode: StatusCodes.FORBIDDEN,
        message: `Too many failed verifications. Please request a new OTP in ${remainingTime} minutes.`,
      });
    }

    if (!user.reset_password_otp || user.reset_password_otp !== otp) {
       const newVerifyAttempt = (user.verify_attempt || 0) + 1;
       let verifyExpire = user.verify_attempt_expire;
       let msg = "Invalid OTP.";

       if (newVerifyAttempt >= 3) {
           verifyExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour lockout
           msg = "Account action locked due to 3 failed OTP attempts. Please wait 1 hour and request a new OTP.";
           await userService.updateUser(user, {
               verify_attempt: newVerifyAttempt,
               verify_attempt_expire: verifyExpire,
               reset_password_otp: null, // Wipe the false OTP
               reset_password_otp_expiry: null
           });
       } else {
           msg = `Invalid OTP. You have ${3 - newVerifyAttempt} attempts remaining.`;
           await userService.updateUser(user, {
               verify_attempt: newVerifyAttempt
           });
       }

       return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: msg,
      });
    }

    if (new Date() > new Date(user.reset_password_otp_expiry)) {
       return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "OTP has expired.",
      });
    }

    // Reset verify attempts on success
    await userService.updateUser(user, {
        verify_attempt: 0,
        verify_attempt_expire: null
    });

    // OTP is valid. Generate a temporary token for the actual reset step.
    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "15m", // 15 mins to reset password
    });

    return successResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "OTP verified successfully.",
      data: { resetToken },
    });

  } catch (error) {
    console.error("Verify OTP Error:", error);
    return errorResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: MSG.SERVER.INTERNAL_ERROR,
      error: error.message,
    });
  }
};

/**
 * Resets the password after OTP verification.
 * Expects the resetToken (from verifyOtp) and newPassword.
 */
module.exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body || {};

    if (!resetToken || !newPassword || !confirmPassword) {
      return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "resetToken, newPassword, and confirmPassword are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "New password and confirm password do not match.",
      });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (err) {
      return errorResponse({
        res,
        statusCode: StatusCodes.UNAUTHORIZED,
        message: "Invalid or expired reset token.",
      });
    }

    const user = await userService.findById(decoded.id);
    if (!user) {
       return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "User not found.",
      });
    }

    // Update the password and clear OTP fields
    // Password will be hashed by the Sequelize hook
    await user.update({
      password: newPassword, // Note: the User model's beforeUpdate hook should hash this
      reset_password_otp: null,
      reset_password_otp_expiry: null,
    });

    return successResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Password has been reset successfully. You can now login.",
    });

  } catch (error) {
    console.error("Reset Password Error:", error);
    return errorResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: MSG.SERVER.INTERNAL_ERROR,
      error: error.message,
    });
  }
};

/**
 * Allows a logged-in user to change their password.
 * Must be authenticated (uses req.user from auth middleware).
 */
module.exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body || {};
    const userId = req.user.id;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "oldPassword, newPassword, and confirmPassword are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "New password and confirm password do not match.",
      });
    }

    // Need to fetch user with password to compare
    const user = await userService.findById(userId);
    if (!user) {
      return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "User not found.",
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: "Incorrect old password.",
      });
    }

    // Update to new password. Will be hashed by Sequelize hook.
    await user.update({
       password: newPassword
    });

    return successResponse({
      res,
      statusCode: StatusCodes.OK,
      message: "Password changed successfully.",
    });

  } catch (error) {
    console.error("Change Password Error:", error);
    return errorResponse({
      res,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: MSG.SERVER.INTERNAL_ERROR,
      error: error.message,
    });
  }
};

