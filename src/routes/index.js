const express = require("express");
const authMiddleware = require("../middleware/auth.js");
const route = express.Router();

const { getAllUsers } = require("../controllers/user");

route.use("/auth", require("./auth.js"));

// Make Get All Users API public (before authMiddleware)
route.get("/user", getAllUsers);

route.use(authMiddleware);

route.use("/user", require("./user.js"));
route.use("/task", require("./task.js"));

module.exports = route;
