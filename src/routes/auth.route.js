const express = require("express");
const route = express.Router();

const { registerUser, loginUser } = require("../controllers/auth.controller");
const { validateRegister } = require("../validations/user.validation");

/*
|--------------------------------------------------------------------------
| AUTH ROUTES
|--------------------------------------------------------------------------
*/

// 1. CREATE User
//  route - POST /api/auth/register
route.post("/register", validateRegister, registerUser);

// 2. Login User
//  route - POST /api/auth/login
route.post("/login", loginUser);

module.exports = route;
