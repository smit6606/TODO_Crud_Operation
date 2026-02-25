const express = require("express");
const route = express.Router();

const {
  getProfile,
  updateProfile,
  deleteProfile,
  getAllUsers,
  getUserById,
} = require("../controllers/user.controller");

const { validateUpdate } = require("../validations/user.validation");

/*
|--------------------------------------------------------------------------
| USER ROUTES
|--------------------------------------------------------------------------
*/

// Get User Profile
// route - GET /api/users/profile
route.get("/profile", getProfile);

// Update User Profile
// route - PUT /api/users/profile
route.put("/profile", validateUpdate, updateProfile);

// Delete User Account
// route - DELETE /api/users/profile
route.delete("/profile", deleteProfile);

// Get All Users
// route - GET /api/users
route.get("/", getAllUsers);

// Get Single User By ID
// route - GET /api/users/:id
route.get("/:id", getUserById);

module.exports = route;
