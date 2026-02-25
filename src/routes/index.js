const express = require("express");
const authMiddleware = require("../middleware/auth.middleware.js");
const route = express.Router();

route.use("/auth", require("./auth.route.js"));

route.use(authMiddleware);

route.use("/user", require("./user.route.js"));

module.exports = route;
