const express = require("express");
const route = express.Router();

const { registerUser, loginUser, forgotPassword, verifyOtp, resetPassword, changePassword } = require("../controllers/auth");
const { validateRegister } = require("../validations/user");
const upload = require("../middleware/upload");

/*
|--------------------------------------------------------------------------
| AUTH ROUTES
|--------------------------------------------------------------------------
*/

// 1. CREATE User
//  route - POST /api/auth/register
route.post("/register", upload.single("profile_image"), validateRegister, registerUser);

// 2. Login User
//  route - POST /api/auth/login
route.post("/login", loginUser);

// 3. Forgot Password (Send OTP)
//  route - POST /api/auth/forgot-password/send-otp
route.post("/forgot-password/send-otp", upload.none(), forgotPassword);

// 4. Verify OTP
//  route - POST /api/auth/forgot-password/verify-otp
route.post("/forgot-password/verify-otp", upload.none(), verifyOtp);

// 5. Reset Password
//  route - POST /api/auth/forgot-password/reset-password
route.post("/forgot-password/reset-password", upload.none(), resetPassword);

// 6. Change Password (Requires Auth)
//  route - POST /api/auth/change-password
const authMiddleware = require("../middleware/auth");
route.post("/change-password", authMiddleware, upload.none(), changePassword);

module.exports = route;
