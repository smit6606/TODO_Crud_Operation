const express = require("express");
const route = express.Router();

const {
  getProfile,
  updateProfile,
  deleteProfile,
  getUserById,
  getUsersWithCompletedTodos,
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


// Get Users With Completed Todos Only
// route - GET /api/user/completed-all
route.get("/completed-all", getUsersWithCompletedTodos);

// Get Single User By ID
// route - GET /api/user/:id
route.get("/:id", getUserById);

module.exports = route;
