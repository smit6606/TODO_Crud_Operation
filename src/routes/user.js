const express = require("express");
const route = express.Router();

const {
  getProfile,
  updateProfile,
  deleteProfile,
  getAllUsers,
  getUserById,
} = require("../controllers/user");

const { validateUpdate } = require("../validations/user");
const upload = require("../middleware/upload");

/*
|--------------------------------------------------------------------------
| USER ROUTES
|--------------------------------------------------------------------------
*/

// Get User Profile
// route - GET /api/user/profile
route.get("/profile", getProfile);

// Update User Profile
// route - PUT /api/user/profile/:id (or /api/user/profile)
route.put("/profile", upload.single("profile_image"), validateUpdate, updateProfile);
route.put("/profile/:id", upload.single("profile_image"), validateUpdate, updateProfile);

// Delete User Account
// route - DELETE /api/user/profile/:id (or /api/user/profile)
route.delete("/profile", deleteProfile);
route.delete("/profile/:id", deleteProfile);

// Get All Users
// route - GET /api/user
route.get("/", getAllUsers);

// Get Single User By ID
// route - GET /api/user/:id
route.get("/:id", getUserById);

module.exports = route;
