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

    const userResponse = user.toJSON();
    delete userResponse.password;

    return successResponse({
      res,
      statusCode: StatusCodes.OK,
      message: MSG.AUTH.LOGIN_SUCCESS,
      data: { token, user: userResponse },
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
        message: MSG.OTP.IDENTIFIER_REQUIRED,
      });
    }

    // Check if a user matches the identifier
    const user = await userService.findByLoginField(lookupId);
    if (!user) {
       return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: MSG.OTP.USER_NOT_FOUND,
      });
    }

    // Reset Daily Lock if 24h passed
    if (user.otp_daily_lock_reset && new Date() >= new Date(user.otp_daily_lock_reset)) {
      user.otp_daily_lock_count = 0;
      user.otp_daily_lock_reset = null;
    }

    // Check General OTP Block (15m or 24h block)
    if (user.otp_blocked_until && new Date() < new Date(user.otp_blocked_until)) {
      const remainingTimeMin = Math.ceil((new Date(user.otp_blocked_until).getTime() - new Date().getTime()) / 60000);
      const is24h = remainingTimeMin > 60;
      return errorResponse({
        res,
        statusCode: StatusCodes.FORBIDDEN,
        message: is24h
           ? MSG.OTP.LOCKED_24H(Math.ceil(remainingTimeMin / 60))
           : MSG.OTP.LOCKED(remainingTimeMin),
      });
    }

    if (user.otp_blocked_until && new Date() >= new Date(user.otp_blocked_until)) {
       user.otp_request_count = 0;
       user.otp_failed_attempts = 0;
       user.otp_blocked_until = null;
    }

    if (user.last_otp_sent_at && new Date() < new Date(new Date(user.last_otp_sent_at).getTime() + 30 * 1000)) {
       const remainingTime = Math.ceil((new Date(user.last_otp_sent_at).getTime() + 30 * 1000 - new Date().getTime()) / 1000);
       return errorResponse({
         res,
         statusCode: StatusCodes.TOO_MANY_REQUESTS,
         message: MSG.OTP.COOLDOWN(remainingTime),
       });
    }

    // Daily Lock & 15m Block Rule (Max 3 Requests)
    if (user.otp_request_count >= 3) {
      const newDailyLock = (user.otp_daily_lock_count || 0) + 1;
      let blockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min block
      let dailyReset = user.otp_daily_lock_reset || new Date(Date.now() + 24 * 60 * 60 * 1000);
      let msg = MSG.OTP.LOCKED(15);

      // Elevate to 24h block if it's the 3rd daily lock
      if (newDailyLock >= 3) {
        blockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hour block
        dailyReset = null; // Reset the rolling window for a fresh 24h lock
        msg = MSG.OTP.LOCKED_24H(24);
      }

      await userService.updateUser(user, {
        otp_blocked_until: blockedUntil,
        otp_daily_lock_count: newDailyLock,
        otp_daily_lock_reset: dailyReset,
        reset_password_otp: null,
        reset_password_otp_expiry: null
      });

      return errorResponse({
        res,
        statusCode: StatusCodes.FORBIDDEN,
        message: msg
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
        message: MSG.OTP.INVALID_METHOD,
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await userService.updateUser(user, {
      reset_password_otp: otp,
      reset_password_otp_expiry: otpExpiry,
      otp_request_count: (user.otp_request_count || 0) + 1,
      otp_failed_attempts: 0,
      last_otp_sent_at: new Date(),
      otp_blocked_until: user.otp_blocked_until,
      otp_daily_lock_count: user.otp_daily_lock_count,
      otp_daily_lock_reset: user.otp_daily_lock_reset
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
      message: MSG.OTP.SENT_SUCCESS(method),
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
        message: MSG.OTP.CREDENTIALS_REQUIRED,
      });
    }

    const user = await userService.findByLoginField(lookupId);
    
    if (!user) {
       return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: MSG.OTP.USER_NOT_FOUND,
      });
    }

    // Check General OTP Block
    if (user.otp_blocked_until && new Date() < new Date(user.otp_blocked_until)) {
      const remainingTimeMs = new Date(user.otp_blocked_until).getTime() - new Date().getTime();
      const remainingTimeMin = Math.ceil(remainingTimeMs / 60000);
      
      let msg;
      if (remainingTimeMs <= 60000) {
          msg = MSG.OTP.LOCKED_SECS(Math.ceil(remainingTimeMs / 1000));
      } else if (remainingTimeMin > 60) {
          msg = MSG.OTP.LOCKED_24H(Math.ceil(remainingTimeMin / 60));
      } else {
          msg = MSG.OTP.LOCKED(remainingTimeMin);
      }

      return errorResponse({
        res,
        statusCode: StatusCodes.FORBIDDEN,
        message: msg,
      });
    }

    // Handle Wrong/Expired OTP
    if (!user.reset_password_otp || user.reset_password_otp !== otp || new Date() > new Date(user.reset_password_otp_expiry)) {
       const newFailed = (user.otp_failed_attempts || 0) + 1;
       
       if (newFailed >= 3) {
           // 3 Tier Progressive Block on Verification Fails
           const newDailyLock = (user.otp_daily_lock_count || 0) + 1;
           let blockedUntil;
           let msg;
           let dailyReset = user.otp_daily_lock_reset || new Date(Date.now() + 24 * 60 * 60 * 1000);

           if (newDailyLock === 1) {
               blockedUntil = new Date(Date.now() + 60 * 1000); // 60s block
               msg = MSG.OTP.LOCKED_SECS(60);
           } else if (newDailyLock === 2) {
               blockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15m block
               msg = MSG.OTP.LOCKED(15);
           } else {
               blockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h block
               dailyReset = null; // Refresh 24h limit
               msg = MSG.OTP.LOCKED_24H(24);
           }

           await userService.updateUser(user, {
               otp_failed_attempts: 0,
               reset_password_otp: null,
               reset_password_otp_expiry: null,
               otp_blocked_until: blockedUntil,
               otp_daily_lock_count: newDailyLock,
               otp_daily_lock_reset: dailyReset
           });
           
           return errorResponse({
             res,
             statusCode: StatusCodes.FORBIDDEN,
             message: msg
           });
       }

       await userService.updateUser(user, { otp_failed_attempts: newFailed });
       const msgFunc = (!user.reset_password_otp_expiry || new Date() > new Date(user.reset_password_otp_expiry)) ? MSG.OTP.EXPIRED : MSG.OTP.INVALID;
       
       return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: msgFunc(3 - newFailed),
      });
    }

    // Success - Clear OTP states entirely
    await userService.updateUser(user, {
        otp_failed_attempts: 0,
        otp_request_count: 0,
        otp_blocked_until: null,
        otp_daily_lock_count: 0,
        otp_daily_lock_reset: null,
        reset_password_otp: null,
        reset_password_otp_expiry: null
    });

    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    return successResponse({
      res,
      statusCode: StatusCodes.OK,
      message: MSG.OTP.VERIFIED,
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
        message: MSG.PASSWORD.RESET_TOKEN_REQUIRED,
      });
    }

    if (newPassword !== confirmPassword) {
      return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: MSG.PASSWORD.MISMATCH,
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
        message: MSG.PASSWORD.INVALID_TOKEN,
      });
    }

    const user = await userService.findById(decoded.id);
    if (!user) {
       return errorResponse({
        res,
        statusCode: StatusCodes.BAD_REQUEST,
        message: MSG.USER_ERROR.NOT_FOUND,
      });
    }

    // Password hashing is handled by the Sequelize beforeUpdate hook.
    await user.update({
      password: newPassword,
      reset_password_otp: null,
      reset_password_otp_expiry: null,
    });

    return successResponse({
      res,
      statusCode: StatusCodes.OK,
      message: MSG.PASSWORD.RESET_SUCCESS,
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


