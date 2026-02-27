const app = require("./app");
const { connectDB, sequelize } = require("./config/database");

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();

    require("./models/user");
    require("./models/todo");

    await sequelize.sync();

    if (process.env.NODE_ENV !== "production") {
      console.log("Sequelize is running");
    }

    app.listen(PORT, (error) => {
      if (error) {
        console.log("The Server is not started", error);
        return;
      }
      if (process.env.NODE_ENV !== "production") {
        console.log(`The Server is started on port: ${PORT}`);
      }
    });
  } catch (error) {
    console.error("Server Error:", error);
  }
}

startServer();
