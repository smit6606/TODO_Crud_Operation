const express = require("express");
const route = express.Router();

const { registerUser, loginUser } = require("../controllers/auth");
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

module.exports = route;
