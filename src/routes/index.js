const express = require("express");
const authMiddleware = require("../middleware/auth.js");
const route = express.Router();

route.use("/auth", require("./auth.js"));

route.use(authMiddleware);

route.use("/user", require("./user.js"));
route.use("/task", require("./task.js"));

module.exports = route;
