require("dotenv").config();
const express = require("express");
const app = express();

const { connectDB, sequelize } = require("./config/database");
const PORT = process.env.PORT;

async function startServer() {
  try {
    await connectDB();

    await sequelize.sync();

    console.log("Sequelize is running");

    app.listen(PORT, (error) => {
      if (error) {
        console.log("The Server is not started", error);
        return;
      }
      console.log(`The Server is started on port: ${PORT}`);
    });
  } catch (error) {
    console.error("Server Error:", error);
  }
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", require("./routes/index.js"));

startServer();
