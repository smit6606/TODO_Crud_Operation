require("dotenv").config({
    path: process.env.NODE_ENV === "test" ? ".env.test" : ".env",
});
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

if (process.env.NODE_ENV === "production") {
    console.log("Running in Production Mode");
}

app.use(morgan("dev")); // Live HTTP logging

app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", require("./routes/index.js"));

module.exports = app;
